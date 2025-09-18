Act as a Security Analyst. Produce `07_Security_Overview.md` summarizing security mechanisms and considerations with medium depth.

Scope:
- Authentication & Authorization models, Secrets management, Data protection, Input validation, Dependency security, Network/CORS, Audit logging.

Evidence:
- App code, configs, CI pipelines, Docker/K8s, IaC (Terraform/CloudFormation), security tools (Snyk, Dependabot), reverse proxies.

Cross-document data contracts:
- Consumes:
  - EndpointList from `06_API_Endpoints.md` to reason about authZ and rate limiting.
  - DependencyList and EnvVarTable from `08_Dependencies_and_Environment.md`.
  - DiagramModel/ExternalDependencies from `01_Architecture_and_Interactions.md`.
- Exports:
  - SecurityFindings: list of controls, assumptions, gaps, and mitigations.

Return format (Markdown):
### Authentication & Authorization
- Mechanisms, providers, token lifetimes, roles/permissions (evidence)

### Secrets Management
- Storage, rotation, injection (e.g., env vars, vaults) (evidence)

### Data Protection
- Encryption at rest/in transit, PII handling (evidence)

### Input Validation & Hardening
- Validation libs, sanitization, rate limiting, security headers, CORS

### Dependency & Supply Chain Security
- Lockfiles, scanners, update policies

### Audit & Monitoring
- Audit logs, anomaly detection, alerting

### Security Architecture
```mermaid
graph TB
    subgraph "Client Security"
        HTTPS[HTTPS/TLS]
        CSP[Content Security Policy]
        VALIDATION[Input Validation]
    end
    
    subgraph "API Security"
        AUTH[Authentication]
        AUTHZ[Authorization]
        RATE_LIMIT[Rate Limiting]
        CORS[CORS Policy]
        API_KEY[API Keys]
    end
    
    subgraph "Data Security"
        ENCRYPTION[Data Encryption]
        HASHING[Password Hashing]
        SECRETS[Secrets Management]
        AUDIT[Audit Logging]
    end
    
    subgraph "Infrastructure Security"
        FIREWALL[Network Firewall]
        WAF[Web Application Firewall]
        MONITORING[Security Monitoring]
        BACKUP[Secure Backups]
    end
    
    subgraph "External Security"
        DEPENDENCY[Dependency Scanning]
        VULNERABILITY[Vulnerability Management]
        COMPLIANCE[Compliance Checks]
    end
    
    HTTPS --> AUTH
    CSP --> VALIDATION
    VALIDATION --> AUTH
    AUTH --> AUTHZ
    AUTHZ --> RATE_LIMIT
    RATE_LIMIT --> CORS
    CORS --> API_KEY
    
    API_KEY --> ENCRYPTION
    ENCRYPTION --> HASHING
    HASHING --> SECRETS
    SECRETS --> AUDIT
    
    AUDIT --> FIREWALL
    FIREWALL --> WAF
    WAF --> MONITORING
    MONITORING --> BACKUP
    
    BACKUP --> DEPENDENCY
    DEPENDENCY --> VULNERABILITY
    VULNERABILITY --> COMPLIANCE
    
    style HTTPS fill:#e8f5e8
    style AUTH fill:#fff3e0
    style ENCRYPTION fill:#f3e5f5
    style FIREWALL fill:#ffebee
    style DEPENDENCY fill:#e3f2fd
```

### Authentication Flow
```mermaid
sequenceDiagram
    participant User
    participant Client
    participant API
    participant AuthService
    participant Database
    participant TokenStore
    
    User->>Client: Login Credentials
    Client->>API: POST /auth/login
    API->>AuthService: Validate Credentials
    AuthService->>Database: Check User
    Database-->>AuthService: User Data
    AuthService->>AuthService: Verify Password
    AuthService->>TokenStore: Generate Token
    TokenStore-->>AuthService: JWT Token
    AuthService-->>API: Auth Success
    API-->>Client: Return Token
    Client-->>User: Login Success
    
    Note over Client,TokenStore: Subsequent Requests
    User->>Client: API Request
    Client->>API: Request with Token
    API->>AuthService: Validate Token
    AuthService->>TokenStore: Verify Token
    TokenStore-->>AuthService: Token Valid
    AuthService-->>API: Authorized
    API-->>Client: API Response
    Client-->>User: Data Response
```

### Risks & Mitigations
- Known risks from code/config and current mitigations

Constraints:
- Be precise; if uncertain, state Unknown. No speculation.
- Use Mermaid diagrams where it becomes useful/necessary.

Edge cases and guidance:
- If secrets are present in code, flag explicitly and recommend relocation to a secret manager.
- If CORS is permissive (`*`), note implications and intended environments.
- If TLS termination is external (e.g., at ingress/proxy), clarify where encryption in transit is enforced.
- If third-party SDKs handle auth (Firebase/Cognito/NextAuth), link boundary and session storage behaviors.

