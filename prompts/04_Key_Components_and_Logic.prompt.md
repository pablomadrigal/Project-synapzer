Act as a Principal Engineer. Generate `04_Key_Components_and_Logic.md` summarizing 2-3 most critical modules and their business logic with medium depth.

Selection Criteria:
- Files/services referenced often, core entrypoints, controllers, domain services, critical jobs.
- Consume ComponentList and PathAnnotations to prioritize real critical paths.

Cross-document data contracts:
- Consumes:
  - ComponentList from `01_Architecture_and_Interactions.md` (if available)
  - PathAnnotations from `03_File_Structure_Guide.md`
- Exports:
  - KeyComponents: list of components with responsibilities, key functions/classes, and side effects.

For each component:
- Purpose (2-3 sentences)
- Key functions/classes and their responsibilities
- Important inputs/outputs and side effects
- Evidence: file paths and brief code cues

### Component Architecture Diagram
```mermaid
graph TB
    subgraph "Presentation Layer"
        UI[User Interface]
        API[API Controllers]
        MIDDLEWARE[Middleware Stack]
    end
    
    subgraph "Business Logic Layer"
        SERVICE_A[Service A]
        SERVICE_B[Service B]
        SERVICE_C[Service C]
        VALIDATOR[Data Validators]
        TRANSFORMER[Data Transformers]
    end
    
    subgraph "Data Access Layer"
        REPO_A[Repository A]
        REPO_B[Repository B]
        REPO_C[Repository C]
        CACHE_MANAGER[Cache Manager]
    end
    
    subgraph "Infrastructure Layer"
        DB[(Database)]
        CACHE[(Cache)]
        QUEUE[[Message Queue]]
        LOGGER[Logger]
        METRICS[Metrics Collector]
    end
    
    UI --> API
    API --> MIDDLEWARE
    MIDDLEWARE --> SERVICE_A
    MIDDLEWARE --> SERVICE_B
    MIDDLEWARE --> SERVICE_C
    
    SERVICE_A --> VALIDATOR
    SERVICE_B --> VALIDATOR
    SERVICE_C --> VALIDATOR
    
    SERVICE_A --> TRANSFORMER
    SERVICE_B --> TRANSFORMER
    SERVICE_C --> TRANSFORMER
    
    SERVICE_A --> REPO_A
    SERVICE_B --> REPO_B
    SERVICE_C --> REPO_C
    
    REPO_A --> DB
    REPO_B --> DB
    REPO_C --> DB
    
    REPO_A --> CACHE_MANAGER
    REPO_B --> CACHE_MANAGER
    REPO_C --> CACHE_MANAGER
    
    CACHE_MANAGER --> CACHE
    SERVICE_A --> QUEUE
    SERVICE_B --> QUEUE
    SERVICE_C --> QUEUE
    
    SERVICE_A --> LOGGER
    SERVICE_B --> LOGGER
    SERVICE_C --> LOGGER
    SERVICE_A --> METRICS
    SERVICE_B --> METRICS
    SERVICE_C --> METRICS
```

### Component Interaction Sequence
```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant Middleware
    participant Service
    participant Validator
    participant Repository
    participant Database
    participant Cache
    participant Queue
    participant Logger
    
    Client->>Controller: HTTP Request
    Controller->>Middleware: Process Request
    Middleware->>Service: Business Logic
    Service->>Validator: Validate Input
    Validator-->>Service: Validation Result
    Service->>Repository: Data Operation
    Repository->>Cache: Check Cache
    alt Cache Hit
        Cache-->>Repository: Return Cached Data
    else Cache Miss
        Repository->>Database: Query Database
        Database-->>Repository: Return Data
        Repository->>Cache: Store in Cache
    end
    Repository-->>Service: Return Data
    Service->>Queue: Publish Event
    Service->>Logger: Log Operation
    Service-->>Controller: Return Result
    Controller-->>Client: HTTP Response
```

Edge cases and guidance:
- If responsibilities overlap across modules, call out cohesion/coupling explicitly.
- If a component is a façade around external SDKs, document the abstraction boundary and error handling.
- Prefer code entrypoints (CLI, HTTP handlers, schedulers) to drive the narrative.

Constraints:
- Be selective; depth over breadth.
- No speculative behavior; cite code hints.
- Use Mermaid diagrams where it becomes useful/necessary.

