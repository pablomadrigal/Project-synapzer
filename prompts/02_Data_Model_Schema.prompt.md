Act as a Data Model Analyst. Generate `02_Data_Model_Schema.md` describing core entities and relationships in medium detail.

Scope:
- Parse ORM models, schema migrations, SQL files, protobufs/Avro (if any), and validation schemas.
- Consume ComponentList/ExternalDependencies from Architecture to map data stores to services.

Cross-document data contracts:
- Consumes:
  - ComponentList and ExternalDependencies from `01_Architecture_and_Interactions.md` (if available).
- Exports:
  - Entities: list with names, fields, types, constraints, sample evidence.
  - Relationships: list with cardinalities, join keys, ownership.

Return format (Markdown):
### Schema Summary
- For each entity/table: name, key fields, important columns with types and constraints (evidence).

### Relationships
- Describe one-to-one/one-to-many/many-to-many relations with direction and cardinality.

### Entity Relationship Diagram
```mermaid
erDiagram
    USER {
        uuid id PK
        string email UK
        string phone UK
        string name
        string password_hash
        enum status
        timestamp created_at
        timestamp updated_at
    }
    
    ROLE {
        uuid id PK
        string name UK
        string description
        jsonb permissions
        timestamp created_at
    }
    
    USER_ROLE {
        uuid user_id FK
        uuid role_id FK
        timestamp assigned_at
    }
    
    ENTITY_1 {
        uuid id PK
        string name
        text description
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    ENTITY_2 {
        uuid id PK
        string title
        decimal amount
        uuid entity1_id FK
        enum status
        jsonb metadata
        timestamp created_at
    }
    
    AUDIT_LOG {
        uuid id PK
        uuid user_id FK
        string action
        string resource_type
        uuid resource_id
        jsonb old_values
        jsonb new_values
        timestamp created_at
    }
    
    USER ||--o{ USER_ROLE : "has roles"
    ROLE ||--o{ USER_ROLE : "assigned to users"
    USER ||--o{ ENTITY_1 : "creates"
    USER ||--o{ ENTITY_2 : "owns"
    USER ||--o{ AUDIT_LOG : "performs actions"
    ENTITY_1 ||--o{ ENTITY_2 : "contains"
```

### Data Flow Architecture
```mermaid
graph LR
    subgraph "Application Layer"
        API[API Controllers]
        SERVICE[Business Services]
        REPO[Repository Layer]
    end
    
    subgraph "Data Layer"
        ORM[ORM/Query Builder]
        DB[(Primary Database)]
        CACHE[(Cache Layer)]
        MIGRATION[Schema Migrations]
    end
    
    subgraph "Data Processing"
        VALIDATOR[Data Validation]
        TRANSFORM[Data Transformation]
        AUDIT[Audit Trail]
    end
    
    API --> SERVICE
    SERVICE --> REPO
    SERVICE --> VALIDATOR
    REPO --> ORM
    ORM --> DB
    ORM --> CACHE
    VALIDATOR --> TRANSFORM
    TRANSFORM --> AUDIT
    AUDIT --> DB
    MIGRATION --> DB
```

Edge cases and guidance:
- If the project uses multiple data stores (SQL + NoSQL), separate sections and note cross-store links at the conceptual level.
- If fields are inferred only from validators/DTOs, clearly label as Derived from validation.
- If migrations exist without models (or vice versa), prefer migrations as source of truth.
- Mark Unknown when not derivable.
- Use Mermaid diagrams where it becomes useful/necessary.

