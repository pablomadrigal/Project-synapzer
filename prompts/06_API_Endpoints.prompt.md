Act as an API Documentation Analyst. Generate `06_API_Endpoints.md` cataloging all discovered HTTP/gRPC endpoints with medium detail.

Goal:
- List routes with method, purpose, request/response shape, auth, and notable errors, with evidence-backed notes.

Method:
- Parse route definitions (e.g., Express/FastAPI/Spring annotations), OpenAPI/Swagger files, API gateway configs, controllers, and tests.
- Derive input/output schemas from validators/DTOs/serializers when available.
- Consume GlobalSummary from `00_Project_Overview.md` to align endpoint descriptions with domain language.

Cross-document data contracts:
- Consumes:
  - GlobalSummary from `00_Project_Overview.md`.
  - Entities from `02_Data_Model_Schema.md` (if available) to note key IDs and resource relationships.
  - ComponentList from `01_Architecture_and_Interactions.md` to map endpoints to components.
- Exports:
  - EndpointList: path, method, purpose, request schema, response schema, auth, errors, handler path.

Return format (Markdown):
### Summary
- Framework(s) and discovery sources

### Endpoints
| Path | Method | Purpose | Request (schema) | Response (schema) | Auth | Errors |
|---|---|---|---|---|---|---|
| /example | GET | Short description | Query: ... Body: ... | 200: ... | e.g., JWT | 400, 401, 404 |

### API Architecture Overview
```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        MOBILE[Mobile App]
        CLI[CLI Client]
        THIRD_PARTY[Third Party Client]
    end
    
    subgraph "API Gateway"
        LOAD_BALANCER[Load Balancer]
        RATE_LIMITER[Rate Limiter]
        AUTH_MIDDLEWARE[Auth Middleware]
        CORS[CORS Handler]
    end
    
    subgraph "API Endpoints"
        AUTH_API[Auth Endpoints]
        USER_API[User Endpoints]
        BUSINESS_API[Business Endpoints]
        ADMIN_API[Admin Endpoints]
        PUBLIC_API[Public Endpoints]
    end
    
    subgraph "Backend Services"
        AUTH_SERVICE[Auth Service]
        USER_SERVICE[User Service]
        BUSINESS_SERVICE[Business Service]
        NOTIFICATION_SERVICE[Notification Service]
    end
    
    subgraph "Data Layer"
        DATABASE[(Database)]
        CACHE[(Cache)]
        QUEUE[[Message Queue]]
    end
    
    WEB --> LOAD_BALANCER
    MOBILE --> LOAD_BALANCER
    CLI --> LOAD_BALANCER
    THIRD_PARTY --> LOAD_BALANCER
    
    LOAD_BALANCER --> RATE_LIMITER
    RATE_LIMITER --> CORS
    CORS --> AUTH_MIDDLEWARE
    
    AUTH_MIDDLEWARE --> AUTH_API
    AUTH_MIDDLEWARE --> USER_API
    AUTH_MIDDLEWARE --> BUSINESS_API
    AUTH_MIDDLEWARE --> ADMIN_API
    AUTH_MIDDLEWARE --> PUBLIC_API
    
    AUTH_API --> AUTH_SERVICE
    USER_API --> USER_SERVICE
    BUSINESS_API --> BUSINESS_SERVICE
    ADMIN_API --> BUSINESS_SERVICE
    PUBLIC_API --> USER_SERVICE
    
    AUTH_SERVICE --> DATABASE
    USER_SERVICE --> DATABASE
    BUSINESS_SERVICE --> DATABASE
    NOTIFICATION_SERVICE --> QUEUE
    
    AUTH_SERVICE --> CACHE
    USER_SERVICE --> CACHE
    BUSINESS_SERVICE --> CACHE
    
    QUEUE --> NOTIFICATION_SERVICE
```

### API Request Flow
```mermaid
sequenceDiagram
    participant Client
    participant LoadBalancer
    participant RateLimiter
    participant AuthMiddleware
    participant Controller
    participant Service
    participant Database
    participant Cache
    
    Client->>LoadBalancer: HTTP Request
    LoadBalancer->>RateLimiter: Forward Request
    RateLimiter->>AuthMiddleware: Validate Rate Limits
    AuthMiddleware->>Controller: Authenticate & Authorize
    Controller->>Service: Process Business Logic
    Service->>Cache: Check Cache
    alt Cache Miss
        Service->>Database: Query Data
        Database-->>Service: Return Data
        Service->>Cache: Store in Cache
    else Cache Hit
        Cache-->>Service: Return Cached Data
    end
    Service-->>Controller: Return Result
    Controller-->>AuthMiddleware: Response
    AuthMiddleware-->>RateLimiter: Response
    RateLimiter-->>LoadBalancer: Response
    LoadBalancer-->>Client: HTTP Response
```

### Notes
- Pagination, rate limits, idempotency, versioning (if present)

Edge cases and guidance:
- If multiple routers/frameworks coexist (e.g., REST + gRPC), create separate subsections.
- If request/response schemas are implicit, infer from validators/DTOs and label as Derived.
- If auth is enforced by middleware, document at middleware and endpoint levels.
- If versioning is path-based vs header-based, state the strategy and default.

Constraints:
- Prefer evidence-backed details. Mark Unknown when not derivable.
- Use Mermaid diagrams where it becomes useful/necessary.

