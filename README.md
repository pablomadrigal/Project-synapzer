## Prompt Executor

Sequentially execute prompts from `prompts/`, with user approval, context preservation, and outputs saved to `output/session-<timestamp>/`.

### Prerequisites
- Node.js >= 18
- OpenAI API key in environment: `export OPENAI_API_KEY=...`

### Install
```bash
yarn
```

### Run
```bash
# Execute prompts in ./prompts
yarn prompt-exec

# Or specify a custom directory
yarn prompt-exec:dir --dir ./prompts

# Choose a different model
OPENAI_MODEL=gpt-4o yarn prompt-exec
```

### What it does
- Lists `.md` files in the prompts directory (alphabetical)
- For each prompt:
  - Extracts optional frontmatter identity and variables
  - Lets you review/modify the prompt
  - Runs it via OpenAI after approval
  - Asks for satisfaction/feedback and allows re-run/modify
  - Saves results and accumulates context for subsequent prompts

### Outputs
- `output/session-<timestamp>/results/*.result.md`
- `output/session-<timestamp>/context/accumulated-context.md`
- `output/session-<timestamp>/summary/session-summary.md`


