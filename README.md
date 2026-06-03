# mci

Full-stack application with Fastify + Prisma + SQLite on the backend and React + Vite + Vitest on the frontend. Written in **TypeScript**.

## Structure

```
mci/
├── back/          - Fastify API with Prisma (TypeScript)
└── front/         - React app with Vite (TypeScript)
```

## Backend (Fastify + Prisma + TypeScript)

### Setup

```bash
cd back
npm install
npx prisma migrate dev --name init
npm run dev
```

The server will start at `http://localhost:3000`

### API

- `GET /health` - Health check

## Frontend (React + Vite + TypeScript)

### Setup

```bash
cd front
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### Commands

- `npm run dev` - Start dev server
- `npm run build` - Build the app
- `npm run preview` - Preview the production build
- `npm test` - Run tests with Vitest

## Deploy (GitHub Pages)

Пошаговая инструкция: **[DEPLOY.md](./DEPLOY.md)**.

Кратко: включить Pages (source: GitHub Actions), задеплоить `back` (например через `render.yaml`), в Variables репозитория задать `VITE_API_URL`.

## Features

✅ TypeScript end-to-end (Fastify + Prisma + React)
✅ SQLite database
✅ Type-safe with Prisma and TypeScript
