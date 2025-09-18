Act as a DevOps Engineer. Generate `08_Dependencies_and_Environment.md` listing external requirements and environment with medium detail.

Evidence sources:
- Manifests (`package.json`, `requirements.txt`, `pom.xml`), Dockerfiles, docker-compose, Makefiles, `.env*`, CI configs, scripts.

Cross-document data contracts:
- Consumes: GlobalSummary from `00_Project_Overview.md`.
- Exports:
  - DependencyList: runtimes, CLIs, services with versions and evidence.
  - EnvVarTable: normalized environment variable table for reuse downstream.

Return format (Markdown):
### Software Dependencies
- Runtime (language versions), CLIs, databases, queues, caches, browsers, etc. (with evidence)

### Environment Variables
| Name | Required | Default | Description | Source |
|---|---:|---|---|---|
| EXAMPLE_VAR | Yes | - | What it does | .env.example |

### External Services
- Third-party APIs, credentials, endpoints (non-secret details only)

### Ports & Networking
- Local ports, service URLs, CORS origins

### Dependencies Architecture
```mermaid
graph TB
    subgraph "Application Runtime"
        NODE[Node.js Runtime]
        PYTHON[Python Runtime]
        JAVA[Java Runtime]
        DOTNET[.NET Runtime]
    end
    
    subgraph "Core Dependencies"
        FRAMEWORK[Web Framework]
        ORM[Database ORM]
        AUTH[Authentication Lib]
        VALIDATION[Validation Lib]
        LOGGING[Logging Framework]
    end
    
    subgraph "Database & Storage"
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis)]
        MONGODB[(MongoDB)]
        S3[(Object Storage)]
    end
    
    subgraph "External Services"
        EMAIL_SERVICE[Email Service]
        SMS_SERVICE[SMS Service]
        PAYMENT_GATEWAY[Payment Gateway]
        ANALYTICS[Analytics Service]
        CDN[Content Delivery Network]
    end
    
    subgraph "Development Tools"
        TEST_FRAMEWORK[Testing Framework]
        LINTER[Code Linter]
        BUILD_TOOL[Build Tool]
        DEPLOYMENT[Deployment Tool]
    end
    
    NODE --> FRAMEWORK
    PYTHON --> FRAMEWORK
    JAVA --> FRAMEWORK
    DOTNET --> FRAMEWORK
    
    FRAMEWORK --> ORM
    FRAMEWORK --> AUTH
    FRAMEWORK --> VALIDATION
    FRAMEWORK --> LOGGING
    
    ORM --> POSTGRES
    ORM --> MONGODB
    AUTH --> REDIS
    LOGGING --> REDIS
    
    FRAMEWORK --> EMAIL_SERVICE
    FRAMEWORK --> SMS_SERVICE
    FRAMEWORK --> PAYMENT_GATEWAY
    FRAMEWORK --> ANALYTICS
    FRAMEWORK --> CDN
    
    TEST_FRAMEWORK --> FRAMEWORK
    LINTER --> FRAMEWORK
    BUILD_TOOL --> FRAMEWORK
    DEPLOYMENT --> FRAMEWORK
```

### Environment Configuration Flow
```mermaid
graph TD
    START([Application Start]) --> LOAD_ENV{Load Environment}
    LOAD_ENV -->|Success| VALIDATE[Validate Config]
    LOAD_ENV -->|Fail| ERROR[Configuration Error]
    
    VALIDATE -->|Valid| INIT_DB[Initialize Database]
    VALIDATE -->|Invalid| CONFIG_ERROR[Invalid Configuration]
    
    INIT_DB -->|Success| INIT_CACHE[Initialize Cache]
    INIT_DB -->|Fail| DB_ERROR[Database Error]
    
    INIT_CACHE -->|Success| INIT_SERVICES[Initialize Services]
    INIT_CACHE -->|Fail| CACHE_ERROR[Cache Error]
    
    INIT_SERVICES -->|Success| START_SERVER[Start Server]
    INIT_SERVICES -->|Fail| SERVICE_ERROR[Service Error]
    
    START_SERVER --> RUNNING([Application Running])
    
    ERROR --> LOG_ERROR[Log Error & Exit]
    CONFIG_ERROR --> LOG_ERROR
    DB_ERROR --> LOG_ERROR
    CACHE_ERROR --> LOG_ERROR
    SERVICE_ERROR --> LOG_ERROR
    
    style START fill:#e1f5fe
    style RUNNING fill:#c8e6c9
    style ERROR fill:#ffcdd2
    style CONFIG_ERROR fill:#ffcdd2
    style DB_ERROR fill:#ffcdd2
    style CACHE_ERROR fill:#ffcdd2
    style SERVICE_ERROR fill:#ffcdd2
    style LOG_ERROR fill:#ffcdd2
```

Constraints:
- Do not include secrets. Mark Unknown where applicable.
- Use Mermaid diagrams where it becomes useful/necessary.

Edge cases and guidance:
- If `.env.example` is missing but variables are referenced in code/compose, infer and mark Derived.
- If version pins are absent, state minimum observed versions from lockfiles/engines.
- If optional services exist (feature-flagged), mark as Optional and note conditions.

