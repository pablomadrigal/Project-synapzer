Act as a Developer Onboarding Writer. Create `10_Developer_Onboarding_Guide.md` with actionable steps to run locally, at medium detail.

Return format (Markdown):
### Prerequisites
- Languages, runtimes, CLIs, services with versions and install links (evidence)

### Setup
1. Clone and configure environment variables
2. Install dependencies
3. Start dependent services (DB/queues)
4. Initialize database/seed data

### Run the Application
```bash
# Commands to launch dev server(s)
```

### Smoke Test
- Steps to confirm the app is working (URLs, sample requests)

### Troubleshooting
- Common issues and fixes inferred from scripts/README/CI

### Development Environment Setup Flow
```mermaid
graph TD
    START([New Developer]) --> CLONE[Clone Repository]
    CLONE --> CHECK_PREREQ[Check Prerequisites]
    CHECK_PREREQ -->|Missing| INSTALL_PREREQ[Install Prerequisites]
    CHECK_PREREQ -->|Complete| CONFIG_ENV[Configure Environment]
    INSTALL_PREREQ --> CONFIG_ENV
    
    CONFIG_ENV --> COPY_ENV[Copy .env.example]
    COPY_ENV --> SET_VARS[Set Environment Variables]
    SET_VARS --> INSTALL_DEPS[Install Dependencies]
    
    INSTALL_DEPS -->|Success| START_DB[Start Database]
    INSTALL_DEPS -->|Fail| DEP_ERROR[Dependency Error]
    
    START_DB -->|Success| RUN_MIGRATIONS[Run Database Migrations]
    START_DB -->|Fail| DB_ERROR[Database Error]
    
    RUN_MIGRATIONS -->|Success| SEED_DATA[Seed Test Data]
    RUN_MIGRATIONS -->|Fail| MIGRATION_ERROR[Migration Error]
    
    SEED_DATA -->|Success| START_SERVER[Start Development Server]
    SEED_DATA -->|Fail| SEED_ERROR[Seed Error]
    
    START_SERVER -->|Success| RUN_TESTS[Run Tests]
    START_SERVER -->|Fail| SERVER_ERROR[Server Error]
    
    RUN_TESTS -->|Pass| SMOKE_TEST[Run Smoke Tests]
    RUN_TESTS -->|Fail| TEST_ERROR[Test Error]
    
    SMOKE_TEST -->|Pass| SUCCESS([Ready to Develop!])
    SMOKE_TEST -->|Fail| SMOKE_ERROR[Smoke Test Failed]
    
    DEP_ERROR --> TROUBLESHOOT[Troubleshoot]
    DB_ERROR --> TROUBLESHOOT
    MIGRATION_ERROR --> TROUBLESHOOT
    SEED_ERROR --> TROUBLESHOOT
    SERVER_ERROR --> TROUBLESHOOT
    TEST_ERROR --> TROUBLESHOOT
    SMOKE_ERROR --> TROUBLESHOOT
    
    TROUBLESHOOT --> DOCUMENTATION[Check Documentation]
    DOCUMENTATION --> SUPPORT[Contact Support]
    
    style START fill:#e1f5fe
    style SUCCESS fill:#c8e6c9
    style DEP_ERROR fill:#ffcdd2
    style DB_ERROR fill:#ffcdd2
    style MIGRATION_ERROR fill:#ffcdd2
    style SEED_ERROR fill:#ffcdd2
    style SERVER_ERROR fill:#ffcdd2
    style TEST_ERROR fill:#ffcdd2
    style SMOKE_ERROR fill:#ffcdd2
    style TROUBLESHOOT fill:#fff3e0
```

### Project Structure Overview
```mermaid
graph TB
    subgraph "Developer Workflow"
        IDE[IDE Setup]
        GIT[Git Configuration]
        LINTING[Linting Setup]
        FORMATTING[Code Formatting]
    end
    
    subgraph "Local Development"
        DEV_SERVER[Dev Server]
        HOT_RELOAD[Hot Reload]
        DEBUG[Debug Mode]
        PROXY[API Proxy]
    end
    
    subgraph "Testing Environment"
        UNIT_TEST[Unit Tests]
        INTEGRATION_TEST[Integration Tests]
        E2E_TEST[E2E Tests]
        TEST_DB[(Test Database)]
    end
    
    subgraph "Build & Deploy"
        BUILD[Build Process]
        LINT_CHECK[Lint Check]
        TYPE_CHECK[Type Check]
        DEPLOY[Local Deploy]
    end
    
    IDE --> GIT
    GIT --> LINTING
    LINTING --> FORMATTING
    
    FORMATTING --> DEV_SERVER
    DEV_SERVER --> HOT_RELOAD
    HOT_RELOAD --> DEBUG
    DEBUG --> PROXY
    
    PROXY --> UNIT_TEST
    UNIT_TEST --> INTEGRATION_TEST
    INTEGRATION_TEST --> E2E_TEST
    E2E_TEST --> TEST_DB
    
    TEST_DB --> BUILD
    BUILD --> LINT_CHECK
    LINT_CHECK --> TYPE_CHECK
    TYPE_CHECK --> DEPLOY
```

Constraints:
- Prefer simple step-by-step commands. Mark Unknown where needed.
- Use Mermaid diagrams where it becomes useful/necessary.

Cross-document data contracts:
- Consumes:
  - EnvVarTable and DependencyList from `08_Dependencies_and_Environment.md`.
  - EndpointList from `06_API_Endpoints.md` for smoke tests.
  - TestCommands from `09_Testing_Strategy.md` for validating setup.
- Exports:
  - OnboardingSteps: canonical setup and run steps for reuse in deployment docs.

Edge cases and guidance:
- If multiple apps/services exist, provide per-service setup sections and a top-level orchestrated path (docker-compose or scripts).
- If seed data is optional or destructive, call that out and provide safe defaults.
- If hot reload/auto-restart is available, document the dev experience expectations.

