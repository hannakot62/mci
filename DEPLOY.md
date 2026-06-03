# Деплой MCI (GitHub Pages + API)

Фронтенд — **GitHub Pages**, бэкенд — **отдельный хостинг** (ниже — Render). Без API на Pages откроется только статика, запросы `/api` не сработают.

## Что уже настроено в репозитории

- `front`: `VITE_BASE_PATH` и `VITE_API_URL` для сборки
- `.github/workflows/deploy-pages.yml` — сборка и публикация `front/dist`
- `render.yaml` — шаблон бэкенда на [Render](https://render.com)
- CORS на бэкенде через `CORS_ORIGINS`

---

## Шаг 1. Запушить код на GitHub

```bash
git add .
git commit -m "Add GitHub Pages and API deploy config"
git push -u origin main
```

---

## Шаг 2. Включить GitHub Pages

1. Репозиторий → **Settings** → **Pages**
2. **Build and deployment** → **Source**: **GitHub Actions**
3. Дождаться успешного workflow **Deploy frontend to GitHub Pages** (вкладка **Actions**)

Сайт будет по адресу:

- обычный репозиторий: `https://<USER>.github.io/<REPO>/`
- репозиторий `<USER>.github.io`: `https://<USER>.github.io/`

---

## Шаг 3. Задеплоить API (Render)

1. [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**
2. Подключить этот GitHub-репозиторий, применить `render.yaml`
3. В сервисе **mci-api** → **Environment** задать:

   | Переменная     | Пример |
   |----------------|--------|
   | `CORS_ORIGINS` | `https://<USER>.github.io` |

   Origin **без** пути (`/mci/` не добавляйте) — браузер шлёт только схему + хост.

4. Дождаться деплоя, скопировать URL сервиса, например `https://mci-api-xxxx.onrender.com`

Проверка: в браузере или `curl https://<API>/health` → `{"success":true,...}`

**Free tier Render:** сервис «засыпает», первый запрос может идти 30–60 с.

### Другой хостинг

Подойдёт любой Node.js-хостинг с диском для SQLite:

```bash
cd back
npm ci
npx prisma migrate deploy
npm run db:seed   # первый запуск
npm run build
npm start
```

Обязательно: `NODE_ENV=production`, `DATABASE_URL`, `CORS_ORIGINS`.

---

## Шаг 4. Связать фронт с API

1. GitHub → **Settings** → **Secrets and variables** → **Actions** → **Variables**  
   **или** **Environments** → **github-pages** → **Environment secrets** (как у вас на скриншоте).

   | Name | Value |
   |------|--------|
   | `VITE_API_URL` | `https://mci-api-xxxx.onrender.com` |

   Без `/` в конце. Secret окружения `github-pages` подхватывается workflow при сборке.

2. **Actions** → workflow **Deploy frontend to GitHub Pages** → **Run workflow** (или push в `main`)

После пересборки приложение на Pages ходит на ваш API.

---

## Локальная проверка «как на Pages»

```bash
# терминал 1
cd back && npm run dev

# терминал 2
cd front
set VITE_BASE_PATH=/mci/
set VITE_API_URL=http://localhost:3000
npm run build
npx vite preview --base /mci/
```

На Windows PowerShell: `$env:VITE_BASE_PATH='/mci/'` и т.д.

---

## Частые проблемы

| Симптом | Решение |
|--------|---------|
| Белый экран, 404 на `/assets/...` | Не задан `VITE_BASE_PATH` при сборке; пересоберите через Actions |
| CORS error в консоли | Добавьте `https://<USER>.github.io` в `CORS_ORIGINS` на API |
| API не отвечает | Проверьте `VITE_API_URL` в Variables и перезапустите workflow |
| Долгая загрузка | Render free tier — холодный старт |
