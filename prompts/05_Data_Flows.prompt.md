Act as a System Analyst. Produce `05_Data_Flows.md` describing one primary end-to-end data journey with medium detail.

Candidate flows:
- User registration/login, order processing, ingestion pipeline, scheduled job lifecycle.
- Consume KeyComponents and (if available) early summaries from API Endpoints and Data Model to ground steps.

Cross-document data contracts:
- Consumes:
  - KeyComponents from `04_Key_Components_and_Logic.md`.
  - Entities/Relationships from `02_Data_Model_Schema.md` (if available).
  - Endpoint list from `06_API_Endpoints.md` (if available; otherwise derive from controllers/routes).
- Exports:
  - PrimaryFlow: name, trigger, ordered steps with actors, inputs, outputs, side effects.

Return format (Markdown):
### Flow Name
### Trigger
### Steps (numbered)
- Step n: Actor, operation, inputs, outputs, side effects, evidence paths

### Data Flow Diagram
```mermaid
graph TD
    START([User Action]) --> VALIDATE{Validate Input}
    VALIDATE -->|Valid| PROCESS[Process Request]
    VALIDATE -->|Invalid| ERROR[Return Error]
    
    PROCESS --> DB_CHECK{Check Database}
    DB_CHECK -->|Found| UPDATE[Update Record]
    DB_CHECK -->|Not Found| CREATE[Create Record]
    
    UPDATE --> CACHE_UPDATE[Update Cache]
    CREATE --> CACHE_UPDATE
    CACHE_UPDATE --> QUEUE[Queue Event]
    
    QUEUE --> NOTIFY[Send Notification]
    NOTIFY --> LOG[Log Activity]
    LOG --> SUCCESS([Success Response])
    
    ERROR --> LOG_ERROR[Log Error]
    LOG_ERROR --> FAILURE([Error Response])
    
    style START fill:#e1f5fe
    style SUCCESS fill:#c8e6c9
    style FAILURE fill:#ffcdd2
    style VALIDATE fill:#fff3e0
    style DB_CHECK fill:#fff3e0
```

### End-to-End Sequence Flow
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Service
    participant Database
    participant Cache
    participant Queue
    participant Notification
    participant Logger
    
    User->>Frontend: User Action
    Frontend->>API: HTTP Request
    API->>Service: Process Request
    Service->>Database: Query/Update
    Database-->>Service: Data Response
    Service->>Cache: Update Cache
    Service->>Queue: Publish Event
    Service->>Logger: Log Activity
    Service-->>API: Service Response
    API-->>Frontend: HTTP Response
    Frontend-->>User: UI Update
    
    par Async Operations
        Queue->>Notification: Process Event
        Notification-->>User: Send Notification
    end
```

### Notes & Edge Cases
- Timeouts, retries, failure handling, idempotency (if present in code)

Edge cases and guidance:
- If multiple plausible primary flows exist, choose the one with the broadest coverage of components and data.
- If error handling is implicit (try/catch without branches), document typical failure modes inferred from logs or messages.
- If asynchronous steps exist (queues, schedulers), separate synchronous vs asynchronous paths.
- Use Mermaid diagrams where it becomes useful/necessary.

