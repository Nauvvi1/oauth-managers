
# OAuth Manager Demo (Node.js + Express + Redis + PostgreSQL)


## Стек
- Node.js 18+, Express
- PostgreSQL (таблицы `users`, `identities`)
- Redis (сессии, `state`)
- Docker Compose - для локального старта одним командой

## 🚀 Быстрый старт (Docker)
1. Скопируйте `.env.example` в `.env` и заполните переменные (клиентские ID/секреты, URL‑ы).
2. Запустите:
   ```bash
   docker compose up --build
   ```
3. Выполните миграции:
   ```bash
   docker compose exec app npm run db:migrate
   ```
4. Откройте: http://localhost:3000

## Callback‑URL
Укажите **точно** такие URL у провайдеров:
- Google, GitHub, Discord, VK: `${APP_BASE_URL}/auth/<provider>/callback`
- Telegram: фронтенд использует Login‑виджет и отправляет данные на `${APP_BASE_URL}/auth/telegram/callback`

## 🗄️ Миграции БД
```bash
npm run db:migrate
```
Создаёт таблицы `users` и `identities`.

## Тест входа
1. Откройте `/`.
2. Нажмите любую кнопку "Войти через ...".
3. После успеха фронтенд запросит `/me` и покажет ваш профиль.


## Полезные ссылки
- Google: https://console.cloud.google.com/
- GitHub: https://github.com/settings/developers
- Discord: https://discord.com/developers/applications
- VK: https://dev.vk.com/
- Telegram Login Widget: https://core.telegram.org/widgets/login
