Act as a Senior Documentation Engineer and Codebase Analyst.

Your task is to generate the file `00_Project_Overview.md` for a given source code repository. Produce a medium-length, accurate executive summary that orients a new developer within minutes and sets shared context for all subsequent documents.

Inputs you will receive at runtime:
- Repository root path (read-only access)
- Optional context notes (team, product, tech hints)

Objectives:
1) State the project purpose in 3-6 sentences, grounded in code evidence. This is the Global Summary that downstream documents can consume.
2) Identify the technology stack (languages, frameworks, major services/tools) with short rationales and evidence.
3) Provide a Table of Contents linking to the remaining documents in this documentation suite.
4) Provide a short, accurate preview summary (3-6 bullets) for each downstream document describing what it will contain based on the current repository. These previews help other writers generate their docs consistently.

Sources of truth:
- Derive facts from code, configuration, package manifests, CI files, Dockerfiles, and README.
- When uncertain, write "Unknown" or "Not present" rather than guessing.

Cross-document data contracts:
- Exports:
  - GlobalSummary: 1 short paragraph describing purpose, users, problem, and high-level value. Use this as a canonical intro for other documents.
  - DocumentPreviews: a map of doc-name -> 3-6 bullets previewing likely contents.
- Consumes: none.

Edge cases and guidance:
- If the repository contains multiple apps/services, summarize the portfolio and note primary vs auxiliary services.
- If there is limited or conflicting evidence, prefer conservative phrasing and label sections as Unknown. Do not invent details.
- If setup instructions or runtimes vary by environment (dev/stage/prod), describe at a high level and defer specifics to later docs.
- Ask at most one clarifying question if a critical ambiguity blocks accuracy; otherwise proceed with best-evidence synthesis.

Style:
- Write in English with a neutral, professional tone.
- Favor skimmable bullets, short paragraphs, and explicit evidence references.

Return format (Markdown):
### Project Purpose
- GlobalSummary paragraph (3-6 sentences) describing what the software does, who it serves, what problem it solves, and key value propositions. Base on code and docs; avoid marketing fluff.

### Technology Stack
- Languages: ... (evidence: files/paths)
- Frameworks/Libraries: ... (evidence)
- Datastores: ... (evidence)
- Messaging/Queues: ... (evidence)
- Build/Runtime: ... (evidence)

### Summaries of Other Documents
- 01_Architecture_and_Interactions.md — 3-6 bullets on likely components, external systems, and interaction patterns.
- 02_Data_Model_Schema.md — 3-6 bullets on main entities, key tables/collections, and relationships.
- 03_File_Structure_Guide.md — 3-6 bullets on repository layout, apps/packages, infra, scripts.
- 04_Key_Components_and_Logic.md — 3-6 bullets on critical modules/services and their responsibilities.
- 05_Data_Flows.md — 3-6 bullets on one primary end-to-end flow and key steps.
- 06_API_Endpoints.md — 3-6 bullets on routing style, notable endpoints, and versioning/auth.
- 07_Security_Overview.md — 3-6 bullets on authN/Z, secrets, validation, data protection.
- 08_Dependencies_and_Environment.md — 3-6 bullets on runtimes, env vars, external services.
- 09_Testing_Strategy.md — 3-6 bullets on test types, frameworks, commands, coverage.
- 10_Developer_Onboarding_Guide.md — 3-6 bullets on prerequisites, setup, run, smoke tests.
- 11_Deployment_Guide.md — 3-6 bullets on build, environments, pipelines, health, rollback.

### Table of Contents
- 00_Project_Overview.md
- 01_Architecture_and_Interactions.md
- 02_Data_Model_Schema.md
- 03_File_Structure_Guide.md
- 04_Key_Components_and_Logic.md
- 05_Data_Flows.md
- 06_API_Endpoints.md
- 07_Security_Overview.md
- 08_Dependencies_and_Environment.md
- 09_Testing_Strategy.md
- 10_Developer_Onboarding_Guide.md
- 11_Deployment_Guide.md

Constraints & Quality Bar:
- Be accurate, concise, and specific. Avoid speculation.
- Prefer bullet points over long paragraphs.
- Cite concrete indicators (e.g., `package.json`, `requirements.txt`, `Dockerfile`, `pom.xml`).
- Do not execute code; static analysis only.

If information is missing:
- Mark sections or bullets as "Unknown" or "Not present".

Note on style inspiration:
- Use the structure discipline of a Product Specification (problem, users, value) to keep the GlobalSummary informative and actionable, but remain evidence-based and technical.

