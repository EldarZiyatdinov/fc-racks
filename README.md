# fc-racks

Демо-проект: создание стеллажей и их распределение. Только фронтенд, данные хранятся в `localStorage`.

Стек: React + TypeScript + Vite, Tailwind CSS v4 + shadcn/ui, Zustand (`persist`).

## Запуск

```bash
npm install
npm run dev       # dev-сервер: http://localhost:5173/fc-racks/
npm run build     # сборка в dist/
npm run preview   # просмотр собранной версии
```

Добавить компонент shadcn: `npx shadcn@latest add <name>`.

## Публикация на GitHub Pages

1. Создать репозиторий `fc-racks` на GitHub и запушить ветку `main`.
2. Settings → Pages → Source: **GitHub Actions**.
3. Каждый push в `main` собирает и публикует сайт (`.github/workflows/deploy.yml`):
   `https://<user>.github.io/fc-racks/`

Если репозиторий называется иначе — поменяйте `base` в `vite.config.ts`.
