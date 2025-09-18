Act as a Test Engineer. Produce `09_Testing_Strategy.md` outlining how tests are organized and executed with medium depth.

Evidence:
- Test directories, config files (jest.config, pytest.ini, junit.xml), CI jobs, coverage reports, mocks.

Cross-document data contracts:
- Consumes:
  - EndpointList from `06_API_Endpoints.md` for e2e/contract mappings.
  - DependencyList from `08_Dependencies_and_Environment.md` for local test services.
- Exports:
  - TestCommands: canonical commands to run tests locally and in CI.

Return format (Markdown):
### Test Types & Scope
- Unit, integration, e2e, contract, performance (which exist and where)

### Frameworks & Tools
- Libraries, runners, assertion/mocking tools (evidence)

### Running Tests
```bash
# Commands discovered (prefer package scripts / make targets)
```

### Coverage & Quality Gates
- Coverage tools/thresholds, linters/type checks enforced in CI

### Notable Fixtures & Test Data
- Seeds, factories, sandboxing approaches

### Testing Architecture
```mermaid
graph TB
    subgraph "Test Types"
        UNIT[Unit Tests]
        INTEGRATION[Integration Tests]
        E2E[End-to-End Tests]
        CONTRACT[Contract Tests]
        PERFORMANCE[Performance Tests]
    end
    
    subgraph "Test Frameworks"
        JEST[Jest]
        CYPRESS[Cypress]
        PLAYWRIGHT[Playwright]
        SUI_TEST[Supertest]
        MOCK[Mocking Libraries]
    end
    
    subgraph "Test Infrastructure"
        TEST_DB[(Test Database)]
        TEST_CACHE[(Test Cache)]
        MOCK_SERVICES[Mock Services]
        TEST_CONTAINERS[Test Containers]
    end
    
    subgraph "CI/CD Integration"
        GITHUB_ACTIONS[GitHub Actions]
        JENKINS[Jenkins]
        COVERAGE[Coverage Reports]
        QUALITY_GATES[Quality Gates]
    end
    
    UNIT --> JEST
    INTEGRATION --> SUI_TEST
    E2E --> CYPRESS
    E2E --> PLAYWRIGHT
    CONTRACT --> MOCK
    PERFORMANCE --> JEST
    
    JEST --> TEST_DB
    SUI_TEST --> TEST_DB
    CYPRESS --> TEST_CONTAINERS
    PLAYWRIGHT --> TEST_CONTAINERS
    MOCK --> MOCK_SERVICES
    
    JEST --> TEST_CACHE
    SUI_TEST --> TEST_CACHE
    
    TEST_DB --> GITHUB_ACTIONS
    TEST_CACHE --> GITHUB_ACTIONS
    TEST_CONTAINERS --> GITHUB_ACTIONS
    MOCK_SERVICES --> GITHUB_ACTIONS
    
    GITHUB_ACTIONS --> COVERAGE
    COVERAGE --> QUALITY_GATES
```

### Testing Workflow
```mermaid
graph TD
    START([Code Commit]) --> TRIGGER[CI Triggered]
    TRIGGER --> LINT[Lint Code]
    LINT -->|Pass| UNIT_TESTS[Run Unit Tests]
    LINT -->|Fail| LINT_ERROR[Lint Error]
    
    UNIT_TESTS -->|Pass| INTEGRATION_TESTS[Run Integration Tests]
    UNIT_TESTS -->|Fail| UNIT_ERROR[Unit Test Failure]
    
    INTEGRATION_TESTS -->|Pass| BUILD[Build Application]
    INTEGRATION_TESTS -->|Fail| INTEGRATION_ERROR[Integration Test Failure]
    
    BUILD -->|Success| E2E_TESTS[Run E2E Tests]
    BUILD -->|Fail| BUILD_ERROR[Build Failure]
    
    E2E_TESTS -->|Pass| COVERAGE_CHECK[Check Coverage]
    E2E_TESTS -->|Fail| E2E_ERROR[E2E Test Failure]
    
    COVERAGE_CHECK -->|Pass| DEPLOY[Deploy to Staging]
    COVERAGE_CHECK -->|Fail| COVERAGE_ERROR[Coverage Too Low]
    
    DEPLOY -->|Success| SUCCESS([All Tests Pass])
    DEPLOY -->|Fail| DEPLOY_ERROR[Deployment Failure]
    
    LINT_ERROR --> FAILURE([Test Failure])
    UNIT_ERROR --> FAILURE
    INTEGRATION_ERROR --> FAILURE
    BUILD_ERROR --> FAILURE
    E2E_ERROR --> FAILURE
    COVERAGE_ERROR --> FAILURE
    DEPLOY_ERROR --> FAILURE
    
    style START fill:#e1f5fe
    style SUCCESS fill:#c8e6c9
    style FAILURE fill:#ffcdd2
    style LINT_ERROR fill:#ffcdd2
    style UNIT_ERROR fill:#ffcdd2
    style INTEGRATION_ERROR fill:#ffcdd2
    style BUILD_ERROR fill:#ffcdd2
    style E2E_ERROR fill:#ffcdd2
    style COVERAGE_ERROR fill:#ffcdd2
    style DEPLOY_ERROR fill:#ffcdd2
```

Constraints:
- Cite evidence; mark Unknown if absent.
- Use Mermaid diagrams where it becomes useful/necessary.

Edge cases and guidance:
- If tests are colocated with code, document glob patterns and coverage collection.
- If CI uses a different command than local, list both and explain differences (e.g., flags, reporters).
- If fixtures require services (DB/Redis), show how tests provision or mock them.

