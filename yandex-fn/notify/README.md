# Yandex Cloud Function — `notify`

Функция-приёмник лид-формы с tablemind.ru. Получает данные формы → пересылает в Telegram-чат владельца.

## Деплой через Yandex Cloud Console

1. Открыть [Cloud Functions](https://console.yandex.cloud/cloud-functions)
2. Создать функцию: имя `tablemind-notify`, регион `ru-central1`
3. Создать версию:
   - Среда выполнения: **Node.js 18**
   - Точка входа: `index.handler`
   - Загрузить файл: `index.js` (этот файл, без `package.json` — функции хватает нативного `fetch` в Node 18+)
   - Таймаут: 10 секунд
   - Память: 128 МБ
   - Переменные окружения:
     ```
     TELEGRAM_BOT_TOKEN = <токен от @BotFather>
     TELEGRAM_CHAT_ID = <chat_id куда падают заявки>
     ```
4. После создания: **Сделать функцию публичной** (вкладка «Доступ» → «Открытые вызовы»)
5. Скопировать **URL функции** (вид: `https://functions.yandexcloud.net/d4xxxxx...`)
6. Положить URL в **GitHub Secrets** репозитория `tablemind-site`:
   - Settings → Secrets and variables → Actions → New repository secret
   - Name: `PUBLIC_API_URL`
   - Value: URL функции

## Как обновить код

После правки `index.js` — заархивировать в `notify.zip`:

```bash
cd yandex-fn/notify
zip notify.zip index.js
```

Загрузить в Yandex через UI как новую версию функции.

## Проверка работы

Локально:
```bash
curl -X POST https://functions.yandexcloud.net/<id> \
  -H "Content-Type: application/json" \
  -d '{"restaurantName": "Тест", "contact": "@test"}'
```

Должно прийти сообщение в Telegram-чат.

## Rate limit

In-memory лимит **5 запросов в минуту с одного IP**. Это «мягкий» лимит:
Yandex поднимает несколько параллельных инстансов функции, и атакующий может
попадать на разные. Для лид-формы достаточно. Если будет реальный спам —
мигрировать на Yandex Managed Redis или YDB.
