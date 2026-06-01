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
│  │  GET /posts, POST /posts, PUT /posts/:id, DELETE /posts/:id  │  │
│  └────────────────────┬─────────────────────────────────────────┘  │
│                       │                                              │
│                       ▼                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │          Validators (modules/*/validators/)                 │  │
│  │  validateCreatePost(), validateUpdatePost()                 │  │
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
│  │  PostService.createPost(), getPostById(), updatePost(), etc. │  │
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
│  │  prisma.post.create(), findMany(), update(), delete()       │  │
│  └────────────────────┬─────────────────────────────────────────┘  │
└───────────────────────┼────────────────────────────────────────────┘
                        │ SQL
                        ▼
          ┌──────────────────────────────┐
          │   SQLite Database            │
          │  (prisma/dev.db)             │
          │  ┌────────────────────────┐  │
          │  │ POST table             │  │
          │  │ - id                   │  │
          │  │ - title                │  │
          │  │ - content              │  │
          │  │ - createdAt            │  │
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
   └─> POST /posts
       Body: { "title": "My Post", "content": "Content" }

2. Fastify Route Handler receives request
   └─> fastify.post('/posts', async (request) => {...})

3. Validator processes input
   └─> validateCreatePost(request.body)
   └─> Returns: CreatePostDto or throws ValidationError

4. Service executes business logic
   └─> postService.createPost(data)
   └─> Queries database via Prisma
   └─> Returns: Post object or throws AppError

5. Route Handler formats response
   └─> Returns: { success: true, data: post }
   └─> HTTP Status: 201 Created

6. If any error occurs:
   └─> Error Handler middleware catches it
   └─> Returns: { success: false, error: "...", errorCode: "..." }
   └─> HTTP Status: 400/404/500 (appropriate code)

7. Client receives response
   └─> Success or Error JSON
```

## Module Structure

```
modules/posts/
├── dto/
│   ├── CreatePostDto.ts      Interface for POST /posts request
│   └── UpdatePostDto.ts      Interface for PUT /posts/:id request
│
├── validators/
│   └── postValidators.ts     Functions to validate & transform input
│                             validateCreatePost(), validateUpdatePost()
│
├── services/
│   └── PostService.ts        Business logic
│                             getAllPosts(), getPostById(),
│                             createPost(), updatePost(), deletePost()
│
├── routes/
│   └── postRoutes.ts         HTTP endpoint definitions
│                             Calls validators → services → returns response
│
└── index.ts                  Module exports
                              export { registerPostRoutes, PostService }
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
   │ (Post object)        │
   └──────┬───────────────┘
          │
          ▼ (Route Handler)
   ┌──────────────────────────┐
   │ JSON Response            │
   │ {                        │
   │   "success": true,       │
   │   "data": { Post }       │
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
│   └── posts/          (Posts module)
│       ├── dto/
│       ├── services/
│       ├── validators/
│       └── routes/

Add new modules following same pattern:
├── modules/
│   ├── posts/          (Posts module)
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
  test('validateCreatePost should throw on empty title', () => {
    expect(() => {
      validateCreatePost({ title: '' });
    }).toThrow(ValidationError);
  });

  test('PostService.createPost should create post', async () => {
    const service = new PostService();
    const post = await service.createPost({ title: 'Test' });
    expect(post.title).toBe('Test');
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
