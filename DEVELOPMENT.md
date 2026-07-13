# Разработка и запуск

## Локальный запуск

Требования: Node.js 22.12+ и pnpm 10.34.5.

```bash
npx pnpm@10.34.5 install
npx pnpm@10.34.5 dev --host 127.0.0.1
```

Основная страница: `http://127.0.0.1:4321/pl/nowe-mieszkanie/`.

Локальная разработка использует официальный Node-adapter. Это позволяет проверять интерфейс без Cloudflare runtime. POST `/api/lead` вернёт `503 service_not_configured`, пока не подключены D1 и R2 bindings.

## Проверки

```bash
npx pnpm@10.34.5 format:check
npx pnpm@10.34.5 check
npx pnpm@10.34.5 build
```

## Cloudflare

Production использует Cloudflare Workers. Перед первым deploy:

1. создать D1 database;
2. создать private R2 bucket;
3. заменить placeholder `database_id` в `wrangler.jsonc`;
4. установить Turnstile site key и `TURNSTILE_SECRET_KEY`;
5. при необходимости установить Resend key и notification email;
6. применить `migrations/0001_init.sql`;
7. указать `PUBLIC_SITE_URL` с реальным HTTPS-доменом;
8. установить `ENVIRONMENT=production` и удалить dev bypass.

```bash
npx pnpm@10.34.5 build:cloudflare
npx pnpm@10.34.5 deploy
```

На текущей Windows-машине локальный бинарник `workerd` требует отсутствующий системный Visual C++ runtime. Node-preview проверен; Cloudflare-сборку следует повторить в CI/Linux или после установки соответствующего Microsoft Visual C++ Redistributable.

## Контент

Все тексты трёх сегментов и языков находятся в `src/content/segments.json`. Схема проверяется в `src/content.config.ts`. Изменение цены должно применяться ко всем языковым версиям.

Перед рекламой обязательно заменить или добавить:

- утверждённое название бренда;
- имя, фотографию и факты о дизайнере;
- реальные разрешённые кейсы;
- юридические реквизиты и проверенные privacy/terms;
- окончательную цену;
- production domain и контакты.

Схематическая планировка на странице помечена как «пример метода» и не выдаётся за клиентский кейс.
