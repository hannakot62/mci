# mci Back-end

Fastify API с Prisma + SQLite

## Запуск

```bash
npm install
npx prisma migrate dev
npm run dev
```

## API Endpoints

- `GET /health` - Health check
- `GET /posts` - Получить все посты
- `GET /posts/:id` - Получить пост по ID
- `POST /posts` - Создать новый пост
- `PUT /posts/:id` - Обновить пост
- `DELETE /posts/:id` - Удалить пост
