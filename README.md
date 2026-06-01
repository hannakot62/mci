# mci

Полный стек приложения с Fastify + Prisma + SQLite на backend и React + Vite + Vitest на frontend. Написано на **TypeScript**.

## Структура

```
mci/
├── back/          - Fastify API с Prisma (TypeScript)
└── front/         - React приложение с Vite (TypeScript)
```

## Backend (Fastify + Prisma + TypeScript)

### Установка

```bash
cd back
npm install
npx prisma migrate dev --name init
npm run dev
```

Сервер запустится на `http://localhost:3000`

### API

- `GET /health` - Проверка здоровья
- `GET /posts` - Все посты
- `POST /posts` - Создать пост
- `PUT /posts/:id` - Обновить пост
- `DELETE /posts/:id` - Удалить пост

## Frontend (React + Vite + TypeScript)

### Установка

```bash
cd front
npm install
npm run dev
```

Приложение будет доступно на `http://localhost:5173`

### Команды

- `npm run dev` - Запуск dev-сервера
- `npm run build` - Сборка приложения
- `npm run preview` - Просмотр собранного приложения
- `npm test` - Запуск тестов с Vitest

## Features

✅ Полный CRUD для постов
✅ Автоматическая синхронизация между бэком и фронтом
✅ Красивый UI
✅ Примеры тестов с Vitest
✅ SQLite база данных
✅ Type-safe с Prisma и TypeScript
✅ Все на TypeScript
