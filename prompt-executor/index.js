#!/usr/bin/env node
/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import matter from 'gray-matter';
import inquirer from 'inquirer';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

function parseArgs(argv) {
  const args = { dir: './prompts', model: process.env.OPENAI_MODEL || 'gpt-5' };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dir' && argv[i + 1]) args.dir = argv[++i];
    else if (arg.startsWith('--dir=')) args.dir = arg.split('=')[1];
    else if (arg === '--model' && argv[i + 1]) args.model = argv[++i];
    else if (arg.startsWith('--model=')) args.model = arg.split('=')[1];
  }
  return args;
}

function ensureDirectoryExists(targetPath) {
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
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

async function askApproval(step, defaultChoice = 'Yes') {
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

  console.log(chalk.cyan.bold('\nPlan de Ejecución de Prompts'));
  console.log(chalk.white(`Carpeta seleccionada: ${promptsDir}`));
  console.log(chalk.white(`Total de prompts: ${promptFiles.length}`));
  promptFiles.forEach((pf, i) => {
    console.log(chalk.gray(`${i + 1}. ${pf.name}`));
  });

  const { approvePlan } = await inquirer.prompt([
    { type: 'confirm', name: 'approvePlan', message: '¿Proceder con esta secuencia?', default: true },
  ]);
  if (!approvePlan) {
    console.log(chalk.yellow('Sequence cancelled by user.'));
    process.exit(0);
  }

  let accumulatedContext = '';
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
    console.log(chalk.gray('\n--- Prompt Content (processed) ---\n'));
    console.log(workingContent);
    console.log(chalk.gray('\n---------------------------------\n'));

    let loop = true;
    let finalOutput = '';
    while (loop) {
      const decision = await askApproval('Execute this prompt?');
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
        workingContent = await editInEditor(workingContent);
        continue;
      }
      if (decision === 'Re-run' || decision === 'Yes') {
        // Call OpenAI
        try {
          const completion = await client.chat.completions.create({
            model: args.model,
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: workingContent },
            ],
          });
          finalOutput = completion.choices?.[0]?.message?.content || '';
          console.log(chalk.green('\n--- Result ---\n'));
          console.log(finalOutput);
          console.log(chalk.green('\n--------------\n'));

          // Ask for satisfaction
          const { satisfied } = await inquirer.prompt([
            { type: 'confirm', name: 'satisfied', message: '¿Estás satisfecho con este resultado? ¿Guardar y continuar?', default: true },
          ]);
          if (!satisfied) {
            // Allow rerun or modify
            const next = await askApproval('Choose next action:', 'Re-run');
            if (next === 'Modify') {
              workingContent = await editInEditor(workingContent);
              continue;
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
          const presented = `# Resultado del Prompt: ${pf.name}\n\n## Identidad Aplicada:\n${identityPreamble ? identityPreamble : 'N/A'}\n\n## Prompt Ejecutado:\n${workingContent}\n\n## Resultado:\n${finalOutput}\n`;
          fs.writeFileSync(outPath, presented, 'utf8');
          sessionResults.push({ name: pf.name, path: outPath });

          // Update accumulated context (append brief header + result)
          accumulatedContext += `\n\n## ${pf.name}\n\n${finalOutput}\n`;
          fs.writeFileSync(path.join(contextDir, 'accumulated-context.md'), accumulatedContext, 'utf8');

          loop = false;
        } catch (err) {
          console.error(chalk.red('OpenAI request failed:'), err.message);
          const retry = await askApproval('OpenAI failed. Retry?', 'Re-run');
          if (retry === 'Re-run') continue;
          if (retry === 'Modify') {
            workingContent = await editInEditor(workingContent);
            continue;
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
      const presented = `# Resultado del Prompt: ${pf.name}\n\n## Prompt Ejecutado (resumen):\n${workingContent.slice(0, 500)}\n\n## Resultado:\n${finalOutput || '[No result]'}\n`;
      fs.writeFileSync(outPath, presented, 'utf8');
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
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


