# План миграции tablemind.ru с Vercel на GitHub Pages + Yandex Cloud

> **Зачем:** Vercel в РФ работает только через VPN. Переезжаем на GitHub Pages
> + Yandex Cloud Functions — этот стек проверен на ZalAssist, работает в РФ
> без VPN. Стек: фронт на gh-pages, API на Yandex CF (notify-функция),
> DNS через Cloudflare в режиме DNS-only (без проксирования).
>
> **Состояние кода:** ВСЁ ГОТОВО, изменения сделаны но НЕ запушены.
> Чтобы пушнуть — после прохождения админских шагов сделать `git push`.

---

## ЧЕКЛИСТ — В КАКОМ ПОРЯДКЕ ДЕЛАТЬ

Идти строго по порядку — каждый шаг даёт что-то нужное следующему.

### 1. Yandex Cloud Function — `tablemind-notify` ⏱ ~15 мин

Эта функция принимает заявки с лид-формы и шлёт их в Telegram.

1. Открыть https://console.yandex.cloud → войти, создать биллинговый аккаунт (если ещё нет — дают грант ~4000₽ новым)
2. Раздел **Cloud Functions** → создать функцию:
   - Имя: `tablemind-notify`
   - Регион: `ru-central1`
3. Создать **версию функции**:
   - Среда: **Node.js 18**
   - Точка входа: `index.handler`
   - Метод загрузки: ZIP-архив
   - Заархивировать `yandex-fn/notify/index.js` в zip:
     ```bash
     cd yandex-fn/notify
     zip notify.zip index.js
     ```
   - Загрузить `notify.zip`
   - Таймаут: **10 секунд**
   - Память: **128 МБ**
   - **Переменные окружения:**
     - `TELEGRAM_BOT_TOKEN` = токен от @BotFather (тот же что использовали на Vercel)
     - `TELEGRAM_CHAT_ID` = chat_id владельца
4. После создания: **Сделать функцию публичной**
   - Вкладка «Доступ» → «Открытые вызовы» → включить
5. **Скопировать URL функции** (вид: `https://functions.yandexcloud.net/d4eXXXXXXXXXX`)

📋 **Запиши URL — понадобится в шаге 5.**

---

### 2. Тест функции через curl ⏱ ~2 мин

Проверь что функция работает до того как привязывать к фронту:

```bash
curl -X POST https://functions.yandexcloud.net/<id> \
  -H "Content-Type: application/json" \
  -d '{"restaurantName":"Тест","contact":"@test"}'
```

Должно прийти в твой Telegram сообщение «🆕 НОВАЯ ЗАЯВКА…». Если не пришло —
проверь env-переменные функции и что она «публичная».

---

### 3. GitHub Pages — включить деплой ⏱ ~3 мин

1. Открыть https://github.com/kokolsk1y/tablemind-site/settings/pages
2. **Source:** GitHub Actions
3. Custom domain пока **не указывать** — поставим в шаге 7

---

### 4. GitHub Secrets — положить URL функции ⏱ ~2 мин

1. https://github.com/kokolsk1y/tablemind-site/settings/secrets/actions
2. **New repository secret:**
   - Name: `PUBLIC_API_URL`
   - Value: URL Yandex функции notify (из шага 1)
3. Save

---

### 5. Cloudflare — добавить домен ⏱ ~10 мин

DNS управление переезжает с reg.ru на Cloudflare. Это нужно для DNS-only режима
(серое облачко, не оранжевое).

1. https://dash.cloudflare.com → **Add a site**
2. Ввести: `tablemind.ru`
3. План: **Free**
4. Cloudflare выдаст список существующих DNS-записей (импортирует с reg.ru)
5. **Удалить все A/CNAME записи**, которые ведут на Vercel
6. **Создать новые записи** для GitHub Pages:

   | Type  | Name | Content              | Proxy           |
   |-------|------|----------------------|-----------------|
   | A     | @    | 185.199.108.153      | 🟫 DNS only     |
   | A     | @    | 185.199.109.153      | 🟫 DNS only     |
   | A     | @    | 185.199.110.153      | 🟫 DNS only     |
   | A     | @    | 185.199.111.153      | 🟫 DNS only     |
   | CNAME | www  | kokolsk1y.github.io. | 🟫 DNS only     |

   ⚠️ **ВАЖНО: серое облачко (DNS only) у каждой записи**, не оранжевое.
   Cloudflare-proxy блочится ТСПУ → сайт не откроется в РФ.

7. Cloudflare даст 2 NS-сервера (например `arturo.ns.cloudflare.com` и
   `kia.ns.cloudflare.com`). **Скопировать оба**.

---

### 6. reg.ru — сменить NS-серверы ⏱ ~5 мин (применение до 24ч)

1. https://www.reg.ru/user/account → твой домен `tablemind.ru`
2. Раздел **«DNS-серверы и управление зоной»**
3. Выбрать **«Указать DNS-серверы вручную»**
4. Вписать NS-серверы Cloudflare из шага 5
5. Сохранить

⏰ Распространение NS обычно идёт **15–60 минут**, иногда до 24 часов.
Можно проверить через https://dnschecker.org — должны показывать
cloudflare-NS-серверы.

---

### 7. GitHub Pages → Custom domain ⏱ ~3 мин

После того как Cloudflare DNS заработал (можно проверить через `nslookup tablemind.ru`):

1. Settings → Pages → **Custom domain**: `tablemind.ru`
2. Сохранить
3. GitHub проверит DNS, выпустит SSL-сертификат (Let's Encrypt) — займёт ~5-10 минут
4. После успеха появится галочка «✓ DNS check successful»
5. Включить **Enforce HTTPS**

В репозитории уже есть `static/CNAME` с `tablemind.ru` — это то же самое, но через файл (если поле в Settings очистится — CNAME-файл его восстановит).

---

### 8. Запушить новый деплой-pipeline ⏱ ~2 мин

```bash
cd c:/Users/ikoko/Projects/tablemind-site
git push origin main
```

GitHub Actions запустит workflow `deploy.yml`:
- `npm ci`
- `npm run build` с подставленным `PUBLIC_API_URL` из secrets
- Upload to GitHub Pages

Прогресс смотреть тут: https://github.com/kokolsk1y/tablemind-site/actions

После успеха `tablemind.ru` отдаёт новый сайт. Открыть в incognito — должен работать БЕЗ VPN.

---

### 9. Vercel — отключить ⏱ ~3 мин (опционально)

Vercel-проект `table-mind-seven.vercel.app` больше не нужен (если не оставлять как fallback).

1. https://vercel.com/dashboard → найти проект → Settings → General → **Delete project**

Или просто отключить автодеплой:
- Settings → Git → Disconnect repository

В коде остался fallback на Vercel-URL (`https://table-mind-seven.vercel.app/api/notify`)
на случай если PUBLIC_API_URL secret не настроен. Если Vercel удалить —
fallback не сработает, нужно чтобы PUBLIC_API_URL обязательно был в secrets.

---

## ЧТО ИЗМЕНЕНО В КОДЕ (чтобы потом не искать)

### `svelte.config.js`
Убрана старая логика adapter-vercel/adapter-static переключения. Теперь
только adapter-static, без `paths.base` (custom domain раздаёт с корня).

### `static/CNAME`
Новый файл с `tablemind.ru`. GitHub Pages читает его и привязывает домен.

### `static/.nojekyll`
Уже был. Нужен GitHub Pages чтобы не пытался обработать сайт через Jekyll.

### `.github/workflows/deploy.yml`
Новый GitHub Actions workflow. Build → upload artifact → deploy to Pages.
Подтягивает `PUBLIC_API_URL` из secrets.

### `src/lib/LeadForm.svelte`
URL `https://table-mind-seven.vercel.app/api/notify` заменён на
`import.meta.env.PUBLIC_API_URL` с fallback на Vercel-URL.
Vite подставит реальный URL при build.

### `yandex-fn/notify/index.js`
**Новая папка.** Handler для Yandex Cloud Function в формате `(event, context)`.
Принимает лид-форму, валидирует, отправляет в Telegram. CORS preflight, in-memory rate limit (5/мин).

### `yandex-fn/notify/README.md`
Инструкция деплоя функции.

---

## ЕСЛИ ЧТО-ТО ПОШЛО НЕ ТАК

### Сайт открывается на github.io но не на tablemind.ru
- Подождать 15-60 минут пока NS-серверы обновятся
- `nslookup tablemind.ru` должен показать NS-серверы Cloudflare
- В GitHub Settings → Pages должна быть галочка «DNS check successful»

### Лид-форма выдаёт ошибку
- Проверить что функция Yandex CF публичная (вкладка «Доступ»)
- Проверить что `PUBLIC_API_URL` в GitHub Secrets настроен
- Открыть DevTools → Network → найти запрос к функции, проверить ответ
- В Yandex Console → функция → «Логи» — увидишь ошибки от функции

### Сайт всё ещё не открывается без VPN
- Проверить что в Cloudflare DNS все записи **серое облачко** (DNS only)
- Если оранжевое — поменять на серое, иначе Cloudflare-proxy блочится ТСПУ

### Хочу откатиться к Vercel
- В GitHub repo: `git revert <commit-hash>` → `git push`
- В Cloudflare: вернуть DNS-записи на Vercel
- В reg.ru: вернуть NS на исходные

---

## ПОСЛЕДУЮЩИЕ ШАГИ (необязательно сейчас)

### Мониторинг лидов
В Yandex Cloud Functions → твоя функция → «Мониторинг» — графики вызовов и
ошибок. Бесплатный free tier: 1М вызовов/мес — нам хватит навсегда.

### Cloudflare Analytics
Cloudflare даёт бесплатно простую аналитику трафика — кто откуда, какие
страны, скорость. Полезно для понимания CR с разных источников.

### Telegram-бот @tablemind_orders_bot
Сейчас он живёт на старом Vercel-проекте `table-mind-seven.vercel.app`. Если
Vercel удаляешь — бот сломается. Чтобы перенести бота на Yandex —
смотри план в репо `table-mind` (PWA), там отдельный workflow.

---

## ПРОДУМЫВАНИЯ ПО АРХИТЕКТУРЕ

**Почему DNS-only а не Cloudflare proxy:** Cloudflare-proxy режется ТСПУ в
РФ. DNS-only — это просто разрешение имени, без проксирования трафика, его
ТСПУ не трогает.

**Почему GitHub Pages а не Yandex Object Storage:** Yandex S3 тоже работает,
но GitHub Pages дает auto-deploy через Actions из коробки + бесплатно. На
Yandex S3 пришлось бы настраивать pipeline вручную.

**Почему Yandex CF а не сразу Telegram API из браузера:** TG-токен в браузере
видят все. Через серверную функцию — токен в env, безопасно. Плюс
rate-limiting и валидация на сервере.
