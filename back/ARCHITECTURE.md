# Backend Architecture Documentation

## 📁 Directory Structure

```
src/
├── config/                          # Application configuration
│   ├── environment.ts               # Environment variables & config object
│   └── database.ts                  # Prisma singleton instance
│
├── core/                            # Core application layer
│   ├── errors/
│   │   └── AppError.ts             # Custom error classes (AppError, ValidationError, NotFoundError, etc.)
│   ├── types/
│   │   └── index.ts                # Global TypeScript interfaces (ApiResponse, PaginationParams)
│   └── utils/                       # (Future) Utility functions
│
├── middleware/                      # Fastify middleware
│   ├── errorHandler.ts             # Centralized error handling middleware
│   └── requestLogger.ts            # Request logging middleware
│
├── modules/                         # Feature modules (each module is self-contained)
│   └── (users, comments, etc...)    # Other modules follow same pattern
│
├── app.ts                           # Fastify app factory
└── server.ts                        # Entry point & lifecycle management
```

## 🏗️ Architecture Layers

### 1. **Routes Layer** (`modules/*/routes/`)
- Defines API endpoints
- Validates request data using validators
- Calls service methods
- Returns formatted responses

```typescript
fastify.post('/api/setup', async (request, reply) => {
  // Validation
  // Service call
  return { success: true };
});
```

### 2. **Validators Layer** (`modules/*/validators/`)
- Validates incoming request data
- Throws `ValidationError` on invalid input
- Transforms raw data to DTOs

```typescript
export const validatePayload = (data: unknown) => {
  // Type checking, business rules, sanitization
  throw new ValidationError('Invalid input');
};
```

### 3. **Service Layer** (`modules/*/services/`)
- Contains business logic
- Interacts with database via Prisma
- Throws domain-specific errors
- No dependency on HTTP/Express

```typescript
export class ExampleService {}
```

### 4. **DTO Layer** (`modules/*/dto/`)
- Defines request/response shapes
- Type-safe interfaces
- Input validation schemas

```typescript
export interface ExampleDto {
  value: string;
}
```

### 5. **Error Handling Layer** (`core/errors/`)
- Custom error classes with HTTP status codes
- Centralized error handler middleware
- Consistent error responses

```typescript
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}
```

## 🔄 Request Flow

```
Client Request
    ↓
[Fastify Route Handler]
    ↓
[Validator] → throws ValidationError if invalid
    ↓
[Service] → throws AppError if business logic fails
    ↓
[Database] → Prisma queries
    ↓
[Service] → returns data
    ↓
[Route Handler] → formats response
    ↓
[Error Handler Middleware] → catches all errors, formats response
    ↓
Client Response
```

## ✅ Key Benefits

### 1. **Modularity**
- Each module is independent and self-contained
- Add new features without touching existing code
- Clear separation of concerns

### 2. **Maintainability**
- Business logic isolated in services
- Easy to find where to make changes
- Consistent patterns across modules

### 3. **Testability**
- Services can be tested without HTTP layer
- Validators are pure functions
- Clear dependency boundaries

### 4. **Scalability**
- New modules follow same structure
- Easy to add shared utilities in `core/`
- Prepared for dependency injection

### 5. **Type Safety**
- Full TypeScript coverage
- DTOs enforce request shapes
- No implicit any types

## 🚀 Adding a New Module

### Example: Creating a Users module

1. **Create structure:**
```bash
mkdir -p src/modules/users/{dto,services,validators,routes}
```

2. **Create DTOs** (`src/modules/users/dto/CreateUserDto.ts`):
```typescript
export interface CreateUserDto {
  email: string;
  name: string;
}
```

3. **Create Service** (`src/modules/users/services/UserService.ts`):
```typescript
export class UserService {
  private prisma = getPrismaClient();

  async createUser(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
```

4. **Create Validators** (`src/modules/users/validators/userValidators.ts`):
```typescript
export const validateCreateUser = (data: unknown): CreateUserDto => {
  // Validation logic
};
```

5. **Create Routes** (`src/modules/users/routes/userRoutes.ts`):
```typescript
export const registerUserRoutes = (fastify: FastifyInstance): void => {
  fastify.post('/users', async (request) => {
    const data = validateCreateUser(request.body);
    const user = await userService.createUser(data);
    return { success: true, data: user };
  });
};
```

6. **Export from module** (`src/modules/users/index.ts`):
```typescript
export { registerUserRoutes } from './routes/userRoutes';
export { UserService } from './services/UserService';
export type { CreateUserDto } from './dto/CreateUserDto';
```

7. **Register in app** (`src/app.ts`):
```typescript
import { registerUserRoutes } from './modules/users';

registerUserRoutes(fastify);
```

## 🛠️ Configuration

Environment variables are loaded from `.env`:
```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
DATABASE_URL=file:./dev.db
LOG_LEVEL=info
```

Access via `config` object:
```typescript
import { config } from './config/environment';

console.log(config.port);  // 3000
console.log(config.node_env);  // development
```

## 📊 Error Handling

All errors inherit from `AppError`:

```typescript
// In service
throw new NotFoundError('Entity not found');
```

Available error classes:
- `AppError` - Base error (500)
- `ValidationError` (400)
- `NotFoundError` (404)
- `ConflictError` (409)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)

## 🧪 Testing

Each layer can be tested independently:

```typescript
// Test routes (with Fastify test utilities)
const response = await fastify.inject({
  method: 'GET',
  url: '/health',
});
```

## 📝 Naming Conventions

- **Services**: `UserService.ts` (PascalCase, verb-less)
- **Validators**: `userValidators.ts` (camelCase, plural)
- **Routes**: `userRoutes.ts` (camelCase, plural)
- **DTOs**: `CreateUserDto.ts`, `UpdateUserDto.ts` (PascalCase, verb-noun)
- **Modules**: lowercase plural (`users`, `comments`)
- **Functions**: camelCase (`validatePayload`, `registerUserRoutes`)
- **Interfaces**: PascalCase, verb-noun (`CreateUserDto`, `UpdateUserDto`)

## 🔐 Security

- Input validation on every endpoint
- Error messages don't leak internal details
- Proper HTTP status codes
- Database queries via Prisma (SQL injection safe)

## 📈 Future Enhancements

- Dependency Injection container (e.g., `inversify`)
- Pagination helpers in services
- Request/response logging
- Authentication middleware
- Rate limiting
- Request validation with `zod` or `joi`
- Database transaction support
- Caching layer
- API documentation with Swagger

---

**This architecture is production-ready and designed to scale with your application!**
