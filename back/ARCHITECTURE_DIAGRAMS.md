# Backend Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         HTTP CLIENT (Frontend/Mobile)               │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTP Request
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FASTIFY SERVER (app.ts)                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Route Handlers (modules/*/routes/)              │  │
│  │  Example endpoints: GET /health, POST /api/setup             │  │
│  └────────────────────┬─────────────────────────────────────────┘  │
│                       │                                              │
│                       ▼                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │          Validators (modules/*/validators/)                 │  │
│  │  (module-specific validators)                               │  │
│  └────────────────────┬─────────────────────────────────────────┘  │
│                       │                                              │
│       ┌───────────────┴───────────────┐                            │
│       ▼                               ▼                            │
│  ┌──────────────────┐         ┌──────────────────┐                │
│  │  ValidationError │         │  Valid DTO Data  │                │
│  └────────┬─────────┘         └────────┬─────────┘                │
│           │                            │                           │
│           └─────────────┬──────────────┘                           │
│                         ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         Services (modules/*/services/)                       │  │
│  │  (module-specific service methods)                           │  │
│  └────────────────────┬─────────────────────────────────────────┘  │
│                       │                                              │
│       ┌───────────────┴──────────────────┐                         │
│       ▼                                  ▼                         │
│  ┌──────────────┐              ┌──────────────┐                   │
│  │ AppError     │              │ Valid Data   │                   │
│  │ NotFoundErr  │              │              │                   │
│  │ ValidationErr│              │              │                   │
│  └──────┬───────┘              └──────┬───────┘                   │
│         │                             │                            │
│         └─────────────┬───────────────┘                            │
│                       ▼                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │          Prisma Client (config/database.ts)                 │  │
│  │  prisma.* queries                                            │  │
│  └────────────────────┬─────────────────────────────────────────┘  │
└───────────────────────┼────────────────────────────────────────────┘
                        │ SQL
                        ▼
          ┌──────────────────────────────┐
          │   SQLite Database            │
          │  (prisma/dev.db)             │
          │  ┌────────────────────────┐  │
          │  │ application tables     │  │
          │  └────────────────────────┘  │
          └──────────────────────────────┘
```

## Error Handling Flow

```
┌──────────────────────────────────────┐
│    Error Thrown (any layer)          │
│  - ValidationError                   │
│  - NotFoundError                     │
│  - ConflictError                     │
│  - AppError                          │
│  - Generic Error                     │
└──────────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Error Handler        │
    │ Middleware           │
    │ (middleware/         │
    │  errorHandler.ts)    │
    └──────────┬───────────┘
               │
         ┌─────┴─────┐
         ▼           ▼
    ┌────────┐  ┌──────────┐
    │AppError│  │Other Err │
    │        │  │          │
    │ 400-500│  │   500    │
    │StatusCd│  │          │
    └────┬───┘  └────┬─────┘
         │           │
         └─────┬─────┘
               ▼
    ┌──────────────────────────┐
    │ JSON Response            │
    │ {                        │
    │   "success": false,      │
    │   "error": "message",    │
    │   "errorCode": "CODE"    │
    │ }                        │
    └──────────────────────────┘
               │
               ▼
         ┌──────────────┐
         │ HTTP Client  │
         └──────────────┘
```

## Request Processing Sequence

```
1. Client sends HTTP Request
   └─> POST /api/setup
       Body: { ... }

2. Fastify Route Handler receives request
   └─> fastify.post('/api/setup', async (request) => {...})

3. Validator processes input
   └─> (module validator)
   └─> Returns: DTO or throws ValidationError

4. Service executes business logic
   └─> service call
   └─> Queries database via Prisma
   └─> Returns: result or throws AppError

5. Route Handler formats response
   └─> Returns: { success: true, data: ... }
   └─> HTTP Status: 200/201 (as appropriate)

6. If any error occurs:
   └─> Error Handler middleware catches it
   └─> Returns: { success: false, error: "...", errorCode: "..." }
   └─> HTTP Status: 400/404/500 (appropriate code)

7. Client receives response
   └─> Success or Error JSON
```

## Module Structure

```
modules/<feature>/
├── dto/
├── validators/
├── services/
├── routes/
└── index.ts
```

## Data Transformation Pipeline

```
Raw HTTP Request Body
        │
        ▼ (Validator)
   ┌─────────────┐
   │ DTO Object  │
   │ Type-safe   │
   └──────┬──────┘
          │
          ▼ (Service)
   ┌─────────────────────┐
   │ Business Logic      │
   │ Database Operations │
   └──────┬──────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Prisma Result        │
   │ (domain object)      │
   └──────┬───────────────┘
          │
          ▼ (Route Handler)
   ┌──────────────────────────┐
   │ JSON Response            │
   │ {                        │
   │   "success": true,       │
  │   "data": { ... }        │
   │ }                        │
   └──────────────────────────┘
          │
          ▼
     HTTP Client
```

## Dependency Flow (What depends on what)

```
Routes
  ├─> depends on: Validators, Services, FastifyInstance
  │
Validators
  ├─> depends on: DTO interfaces, Error classes
  │
Services
  ├─> depends on: Prisma Client, DTO interfaces, Error classes
  │
Prisma Client
  ├─> depends on: Database configuration
  │
Error Classes
  ├─> depends on: nothing (pure domain errors)
  │
DTOs
  ├─> depends on: nothing (pure interfaces)
  │
Config
  ├─> depends on: Environment variables
  │
App Factory
  ├─> depends on: Fastify, all Modules, Error Handler
  │
Server Entry Point
  ├─> depends on: App Factory, Config
```

## Scalability: Adding New Modules

```
Current Structure:
├── modules/
│   └── <feature>/      (Feature module)

Add new modules following same pattern:
├── modules/
│   ├── users/          (Users module) ← NEW
│   │   ├── dto/
│   │   ├── services/
│   │   ├── validators/
│   │   └── routes/
│   ├── comments/       (Comments module) ← NEW
│   │   ├── dto/
│   │   ├── services/
│   │   ├── validators/
│   │   └── routes/
│   └── (more modules...)

Each module is:
✓ Independent
✓ Self-contained
✓ Can be added without touching other modules
✓ Follows same patterns
✓ Type-safe
```

## Testing Strategy

```
Unit Tests:
  └─ Validator functions (pure, no dependencies)
  └─ Service methods (mock Prisma)
  └─ Error classes

Integration Tests:
  └─ Routes with real/test database
  └─ Full request/response cycle
  └─ Error scenarios

Example:
  test('validator should throw on invalid input', () => {
    expect(() => {
      validatePayload({ value: '' });
    }).toThrow(ValidationError);
  });

  test('service should execute business logic', async () => {
    const service = new ExampleService();
    await service.doWork();
  });
```

## Security Layers

```
1. Input Validation
   └─ All input goes through validators
   └─ Type checking, sanitization

2. Business Logic Validation
   └─ Services check business rules
   └─ Throw domain-specific errors

3. Error Handling
   └─ Errors don't leak internal details
   └─ Consistent, safe error messages

4. Database Safety
   └─ Prisma prevents SQL injection
   └─ Type-safe queries

5. HTTP Security
   └─ Proper status codes
   └─ No sensitive data in error responses
```

---

This modular, layered architecture supports growth from simple CRUD applications to complex enterprise systems!
