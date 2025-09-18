#!/usr/bin/env node
/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import inquirer from 'inquirer';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { execSync } from 'child_process';

dotenv.config();

function showHelp() {
  console.log(`
Usage: node index.js [options]

Options:
  --dir <path>              Directory containing prompt files (default: ./prompts)
  --model <model>            OpenAI model to use (default: gpt-5)
  --repo <path|url>           Repository path or GitHub URL to analyze
  --no-interaction            Run without human interaction (auto-approve all steps)
  --no-interrupt              Alias for --no-interaction
  --help, -h                  Show this help message

Examples:
  node index.js --dir ./my-prompts --repo ./my-project
  node index.js --no-interaction --repo https://github.com/user/repo
  node index.js --model gpt-4 --no-interrupt
`);
}

function parseArgs(argv) {
  const args = { dir: './prompts', model: process.env.OPENAI_MODEL || 'gpt-5', repo: undefined, noInteraction: false };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
    else if (arg === '--dir' && argv[i + 1]) args.dir = argv[++i];
    else if (arg.startsWith('--dir=')) args.dir = arg.split('=')[1];
    else if (arg === '--model' && argv[i + 1]) args.model = argv[++i];
    else if (arg.startsWith('--model=')) args.model = arg.split('=')[1];
    else if (arg === '--repo' && argv[i + 1]) args.repo = argv[++i];
    else if (arg.startsWith('--repo=')) args.repo = arg.split('=')[1];
    else if (arg === '--no-interaction' || arg === '--no-interrupt') args.noInteraction = true;
  }
  return args;
}

function ensureDirectoryExists(targetPath) {
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
}

function sanitizeRepoName(input) {
  try {
    const url = new URL(input);
    const parts = url.pathname.replace(/\.git$/, '').split('/').filter(Boolean);
    return parts.slice(-2).join('-');
  } catch (_) {
    return input.replace(/[^a-zA-Z0-9-_.]/g, '-');
  }
}

function buildRepoTree(root, maxDepth = 2, maxEntries = 400) {
  const ignore = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'out', 'coverage', '.turbo', '.cache']);
  const lines = [];
  let count = 0;
  function walk(dir, depth) {
    if (depth > maxDepth || count >= maxEntries) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (count >= maxEntries) break;
      if (ignore.has(e.name)) continue;
      const p = path.join(dir, e.name);
      const rel = path.relative(root, p) || '.';
      lines.push(`${'  '.repeat(depth)}- ${rel}${e.isDirectory() ? '/' : ''}`);
      count += 1;
      if (e.isDirectory()) walk(p, depth + 1);
    }
  }
  walk(root, 0);
  return lines.join('\n');
}

async function obtainRepository(args) {
  if (args.repo && fs.existsSync(args.repo) && fs.statSync(args.repo).isDirectory()) {
    return { repoRoot: path.resolve(args.repo), source: 'local' };
  }
  if (args.repo && /^https?:\/\//.test(args.repo)) {
    const reposDir = path.join(process.cwd(), 'repos');
    ensureDirectoryExists(reposDir);
    const name = sanitizeRepoName(args.repo);
    const target = path.join(reposDir, `${name}-${Date.now()}`);
    try {
      console.log(chalk.gray(`Cloning ${args.repo} -> ${target}`));
      execSync(`git clone --depth 1 ${args.repo} ${target}`, { stdio: 'inherit' });
      return { repoRoot: target, source: 'cloned' };
    } catch (e) {
      console.error(chalk.red('Git clone failed:'), e.message);
    }
  }

  const { mode } = await inquirer.prompt([
    { type: 'list', name: 'mode', message: 'Select repository source:', choices: [
      { name: 'Local path', value: 'local' },
      { name: 'GitHub URL (will shallow clone)', value: 'url' },
    ] }]);
  if (mode === 'local') {
    const { localPath } = await inquirer.prompt([
      { type: 'input', name: 'localPath', message: 'Enter local repository path:' },
    ]);
    if (!localPath || !fs.existsSync(localPath) || !fs.statSync(localPath).isDirectory()) {
      console.error(chalk.red('Invalid local path.'));
      process.exit(1);
    }
    return { repoRoot: path.resolve(localPath), source: 'local' };
  }
  const { url } = await inquirer.prompt([
    { type: 'input', name: 'url', message: 'Enter GitHub HTTPS URL (public or accessible):' },
  ]);
  const reposDir = path.join(process.cwd(), 'repos');
  ensureDirectoryExists(reposDir);
  const name = sanitizeRepoName(url);
  const target = path.join(reposDir, `${name}-${Date.now()}`);
  try {
    console.log(chalk.gray(`Cloning ${url} -> ${target}`));
    execSync(`git clone --depth 1 ${url} ${target}`, { stdio: 'inherit' });
    return { repoRoot: target, source: 'cloned' };
  } catch (e) {
    console.error(chalk.red('Git clone failed:'), e.message);
    process.exit(1);
  }
}

function findPromptFiles(dirPath) {
  const files = fs.readdirSync(dirPath)
    .filter((f) => f.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return files.map((f) => ({ name: f, fullPath: path.join(dirPath, f) }));
}

function extractVariables(promptContent) {
  const squareVars = Array.from(promptContent.matchAll(/\[(INSERT_[A-Z0-9_]+|INPUT_REQUIRED|INPUT_HERE)\]/g)).map((m) => m[0]);
  const braceVars = Array.from(promptContent.matchAll(/\{([a-zA-Z0-9_]+)\}/g)).map((m) => m[1]);
  const unique = Array.from(new Set([...squareVars, ...braceVars]));
  return unique;
}

async function promptForVariables(vars) {
  if (!vars || vars.length === 0) return {};
  const questions = vars.map((v) => ({
    type: 'input',
    name: v,
    message: `Value for variable ${v}:`,
  }));
  const answers = await inquirer.prompt(questions);
  return answers;
}

function applyVariables(content, answers) {
  let out = content;
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith('[')) {
      const re = new RegExp(key.replace(/[[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g');
      out = out.replace(re, value);
    } else {
      const re = new RegExp(`\\{${key}\\}`, 'g');
      out = out.replace(re, value);
    }
  });
  return out;
}

function makeIdentityPreamble(identity) {
  if (!identity || Object.keys(identity).length === 0) return '';
  const role = identity.role ? `Act as ${identity.role}.` : '';
  const persona = identity.persona ? `You are ${identity.persona}.` : '';
  const tone = identity.tone ? `Use a ${identity.tone} tone.` : '';
  const expertise = Array.isArray(identity.expertise) && identity.expertise.length > 0
    ? `You have expertise in: ${identity.expertise.join(', ')}.`
    : '';
  const context = identity.context ? `Context: ${identity.context}.` : '';
  const constraints = Array.isArray(identity.constraints) && identity.constraints.length > 0
    ? `Constraints: ${identity.constraints.join('; ')}.`
    : '';
  return [role, persona, tone, expertise, context, constraints].filter(Boolean).join(' ');
}

async function askApproval(step, defaultChoice = 'Yes', noInteraction = false) {
  if (noInteraction) {
    console.log(chalk.blue(`[Non-interactive mode] ${step} - Auto-proceeding with: ${defaultChoice}`));
    return defaultChoice;
  }
  
  const choices = [
    { name: 'Yes - Proceed', value: 'Yes' },
    { name: 'Re-run', value: 'Re-run' },
    { name: 'Modify prompt and run', value: 'Modify' },
    { name: 'Skip', value: 'Skip' },
    { name: 'Stop session', value: 'Stop' },
  ];
  const { decision } = await inquirer.prompt([
    {
      type: 'list',
      name: 'decision',
      message: step,
      default: defaultChoice,
      choices,
    },
  ]);
  return decision;
}

async function editInEditor(initial) {
  const { edited } = await inquirer.prompt([
    {
      type: 'editor',
      name: 'edited',
      message: 'Modify the prompt as needed. Save and close the editor to continue.',
      default: initial,
    },
  ]);
  return edited;
}

async function run() {
  const args = parseArgs(process.argv);
  const promptsDir = path.resolve(process.cwd(), args.dir);

  if (!process.env.OPENAI_API_KEY) {
    console.error(chalk.red('Missing OPENAI_API_KEY in environment. Set it before running.'));
    process.exit(1);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  if (!fs.existsSync(promptsDir)) {
    console.error(chalk.red(`Prompts directory not found: ${promptsDir}`));
    process.exit(1);
  }

  const promptFiles = findPromptFiles(promptsDir);
  if (promptFiles.length === 0) {
    console.error(chalk.yellow('No .md prompt files found in directory.'));
    process.exit(1);
  }

  const sessionId = new Date().toISOString().replace(/[:.]/g, '-');
  const outputBase = path.join(process.cwd(), 'output', `session-${sessionId}`);
  const resultsDir = path.join(outputBase, 'results');
  const contextDir = path.join(outputBase, 'context');
  const summaryDir = path.join(outputBase, 'summary');
  ensureDirectoryExists(resultsDir);
  ensureDirectoryExists(contextDir);
  ensureDirectoryExists(summaryDir);

  // Require repository before proceeding
  const { repoRoot, source } = await obtainRepository(args);
  const repoTree = buildRepoTree(repoRoot, 2, 400);
  const repositoryContext = `### Repository Context\n- Root: ${repoRoot}\n- Source: ${source}\n\nDirectory tree (depth 2):\n\n\`\`\`\n${repoTree}\n\`\`\`\n`;
  fs.writeFileSync(path.join(contextDir, 'repository-context.md'), repositoryContext, 'utf8');

  console.log(chalk.cyan.bold('\nPlan de Ejecución de Prompts'));
  if (args.noInteraction) {
    console.log(chalk.blue.bold('[NON-INTERACTIVE MODE ENABLED]'));
    console.log(chalk.blue('All prompts will be executed automatically without human review'));
  }
  console.log(chalk.white(`Carpeta seleccionada: ${promptsDir}`));
  console.log(chalk.white(`Total de prompts: ${promptFiles.length}`));
  console.log(chalk.white(`Repositorio: ${repoRoot}`));
  promptFiles.forEach((pf, i) => {
    console.log(chalk.gray(`${i + 1}. ${pf.name}`));
  });

  if (!args.noInteraction) {
    const { approvePlan } = await inquirer.prompt([
      { type: 'confirm', name: 'approvePlan', message: '¿Proceder con esta secuencia?', default: true },
    ]);
    if (!approvePlan) {
      console.log(chalk.yellow('Sequence cancelled by user.'));
      process.exit(0);
    }
  } else {
    console.log(chalk.blue('[Non-interactive mode] Auto-approving plan execution'));
  }

  let accumulatedContext = repositoryContext;
  const sessionResults = [];

  for (let index = 0; index < promptFiles.length; index += 1) {
    const pf = promptFiles[index];
    const raw = fs.readFileSync(pf.fullPath, 'utf8');
    const { content, data } = matter(raw);
    const identity = data && data.identity ? data.identity : {};
    let workingContent = content;

    // Insert accumulated context if {{context}} token present
    if (workingContent.includes('{{context}}')) {
      workingContent = workingContent.replaceAll('{{context}}', accumulatedContext || '');
    }

    // Variable collection
    const vars = extractVariables(workingContent);
    const answers = await promptForVariables(vars);
    workingContent = applyVariables(workingContent, answers);

    const identityPreamble = makeIdentityPreamble(identity);
    const systemMessage = identityPreamble || 'You are a helpful, precise documentation generator.';

    console.log('\n');
    console.log(chalk.magenta.bold(`Prompt: ${pf.name}`));
    if (identityPreamble) {
      console.log(chalk.gray('Identity applied:'), identityPreamble);
    }
    console.log(chalk.gray('\n---------------------------------\n'));

    let loop = true;
    let finalOutput = '';
    while (loop) {
      const decision = await askApproval('Execute this prompt?', 'Yes', args.noInteraction);
      if (decision === 'Stop') {
        console.log(chalk.yellow('Session stopped by user.'));
        loop = false;
        // Save partial session summary and exit
        break;
      }
      if (decision === 'Skip') {
        console.log(chalk.yellow('Prompt skipped.'));
        finalOutput = '[Skipped]';
        loop = false;
        break;
      }
      if (decision === 'Modify') {
        if (args.noInteraction) {
          console.log(chalk.yellow('[Non-interactive mode] Cannot modify prompts, proceeding with original'));
          // In non-interactive mode, we can't modify, so just proceed
          decision = 'Yes';
        } else {
          workingContent = await editInEditor(workingContent);
          continue;
        }
      }
      if (decision === 'Re-run' || decision === 'Yes') {
        // Call OpenAI with loading spinner
        try {
          console.log(chalk.blue('🤖 AI is thinking...'));
          
          const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
          let spinnerIndex = 0;
          
          const spinnerInterval = setInterval(() => {
            process.stdout.write(`\r${chalk.blue(spinner[spinnerIndex % spinner.length])} Processing...`);
            spinnerIndex++;
          }, 100);
          
          const completion = await client.chat.completions.create({
            model: args.model,
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: repositoryContext },
              { role: 'user', content: workingContent },
            ],
          });
          
          clearInterval(spinnerInterval);
          process.stdout.write('\r' + ' '.repeat(20) + '\r'); // Clear spinner line
          
          finalOutput = completion.choices?.[0]?.message?.content || '';
          console.log(chalk.green('\n--- Result ---\n'));
          console.log(finalOutput);
          console.log(chalk.green('\n--------------\n'));

          // Ask for satisfaction
          let satisfied = true;
          if (!args.noInteraction) {
            const satisfactionResponse = await inquirer.prompt([
              { type: 'confirm', name: 'satisfied', message: '¿Estás satisfecho con este resultado? ¿Guardar y continuar?', default: true },
            ]);
            satisfied = satisfactionResponse.satisfied;
          } else {
            console.log(chalk.blue('[Non-interactive mode] Auto-accepting result'));
          }
          
          if (!satisfied) {
            // Allow rerun or modify
            const next = await askApproval('Choose next action:', 'Re-run', args.noInteraction);
            if (next === 'Modify') {
              if (args.noInteraction) {
                console.log(chalk.yellow('[Non-interactive mode] Cannot modify prompts, proceeding with result'));
                satisfied = true; // Force satisfaction in non-interactive mode
              } else {
                workingContent = await editInEditor(workingContent);
                continue;
              }
            }
            if (next === 'Re-run') {
              continue;
            }
            if (next === 'Skip') {
              finalOutput = '[Skipped after review]';
              loop = false;
              break;
            }
            if (next === 'Stop') {
              console.log(chalk.yellow('Session stopped by user.'));
              loop = false;
              break;
            }
          }

          // Save result
          const baseName = pf.name.replace(/\.md$/i, '');
          const outPath = path.join(resultsDir, `${baseName}.result.md`);
          fs.writeFileSync(outPath, finalOutput, 'utf8');
          sessionResults.push({ name: pf.name, path: outPath });

          // Update accumulated context (append brief header + result)
          accumulatedContext += `\n\n## ${pf.name}\n\n${finalOutput}\n`;
          fs.writeFileSync(path.join(contextDir, 'accumulated-context.md'), accumulatedContext, 'utf8');

          loop = false;
        } catch (err) {
          console.error(chalk.red('OpenAI request failed:'), err.message);
          const retry = await askApproval('OpenAI failed. Retry?', 'Re-run', args.noInteraction);
          if (retry === 'Re-run') continue;
          if (retry === 'Modify') {
            if (args.noInteraction) {
              console.log(chalk.yellow('[Non-interactive mode] Cannot modify prompts, skipping due to error'));
              finalOutput = '[Skipped due to error]';
              loop = false;
            } else {
              workingContent = await editInEditor(workingContent);
              continue;
            }
          }
          if (retry === 'Skip') {
            finalOutput = '[Skipped due to error]';
            loop = false;
          } else if (retry === 'Stop') {
            console.log(chalk.yellow('Session stopped by user.'));
            loop = false;
          }
        }
      }
    }

    if (!finalOutput || finalOutput.startsWith('[Skipped')) {
      // Save minimal record
      const baseName = pf.name.replace(/\.md$/i, '');
      const outPath = path.join(resultsDir, `${baseName}.result.md`);
      fs.writeFileSync(outPath, finalOutput || '[No result]', 'utf8');
      sessionResults.push({ name: pf.name, path: outPath });
    }
  }

  // Session summary
  const summaryLines = [];
  summaryLines.push('# Sesión de Prompts Completada');
  summaryLines.push('\n## Resumen de Ejecución:');
  summaryLines.push(`- Total de prompts: ${promptFiles.length}`);
  summaryLines.push(`- Completados exitosamente: ${sessionResults.length}`);
  summaryLines.push('- Omitidos: (ver resultados individuales)');
  summaryLines.push('\n## Archivos de Salida:');
  sessionResults.forEach((r, i) => summaryLines.push(`${i + 1}. ${r.name}: ${path.relative(process.cwd(), r.path)}`));

  const summaryPath = path.join(summaryDir, 'session-summary.md');
  fs.writeFileSync(summaryPath, summaryLines.join('\n'), 'utf8');

  console.log(chalk.green('\nAll done. Outputs saved under:'), outputBase);
  if (args.noInteraction) {
    console.log(chalk.blue('\n[Non-interactive mode] Session completed automatically'));
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


