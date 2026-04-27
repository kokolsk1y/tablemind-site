// Yandex Cloud Function — лид-форма tablemind.ru → Telegram
//
// Деплой:
//   1. Yandex Cloud Console → Cloud Functions → Создать функцию
//   2. Среда: Node.js 18 (точка входа: index.handler)
//   3. Загрузить файл index.js (этот) — package.json не нужен, используются нативные fetch + stdlib
//   4. Сервисный аккаунт: можно без аккаунта (функция публичная)
//   5. Сделать функцию ПУБЛИЧНОЙ (без аутентификации) — иначе фронт не достучится
//   6. Environment Variables:
//        TELEGRAM_BOT_TOKEN = <token из @BotFather>
//        TELEGRAM_CHAT_ID = <ваш chat_id куда падают заявки>
//   7. Скопировать URL функции (https://functions.yandexcloud.net/<id>) и положить в
//      GitHub repo Secrets как PUBLIC_API_URL — фронт его подтянет при build.

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma"
};

function jsonResponse(statusCode, payload) {
	return {
		statusCode,
		headers: { ...CORS, "Content-Type": "application/json" },
		body: JSON.stringify(payload)
	};
}

function escapeHtml(s) {
	return String(s ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

// In-memory rate limit (по IP). Yandex запускает несколько инстансов параллельно,
// поэтому это «мягкий» лимит — атакующий может попасть на разные инстансы и обойти
// его. Но для лид-формы 5/мин достаточно. Если начнётся реальная атака — мигрируем
// на Yandex Managed Redis или YDB.
const ipBuckets = new Map(); // ip → { count, resetAt }
const RATE_LIMIT = 5; // запросов
const RATE_WINDOW_MS = 60_000; // в минуту

function checkRateLimit(ip) {
	const now = Date.now();
	const bucket = ipBuckets.get(ip);
	if (!bucket || bucket.resetAt < now) {
		ipBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
		return { ok: true };
	}
	if (bucket.count >= RATE_LIMIT) {
		return { ok: false, retryAfterMs: bucket.resetAt - now };
	}
	bucket.count++;
	return { ok: true };
}

// Очистка старых ключей раз в 5 минут чтобы не утекала память
setInterval(() => {
	const now = Date.now();
	for (const [ip, bucket] of ipBuckets.entries()) {
		if (bucket.resetAt < now) ipBuckets.delete(ip);
	}
}, 5 * 60 * 1000).unref?.();

function validateLeadInput(body) {
	if (!body.restaurantName || typeof body.restaurantName !== "string") {
		return "restaurantName обязателен";
	}
	if (body.restaurantName.length > 200) return "restaurantName слишком длинный";
	if (!body.contact || typeof body.contact !== "string") return "contact обязателен";
	if (body.contact.length > 200) return "contact слишком длинный";
	if (body.email && typeof body.email !== "string") return "email должен быть строкой";
	if (body.email && body.email.length > 200) return "email слишком длинный";
	if (body.menuInfo && typeof body.menuInfo !== "string") return "menuInfo должен быть строкой";
	if (body.menuInfo && body.menuInfo.length > 2000) return "menuInfo слишком длинный";
	return null;
}

module.exports.handler = async function (event, context) {
	// CORS preflight
	if (event.httpMethod === "OPTIONS") {
		return { statusCode: 204, headers: CORS, body: "" };
	}

	if (event.httpMethod !== "POST") {
		return jsonResponse(405, { error: "Method not allowed" });
	}

	const botToken = process.env.TELEGRAM_BOT_TOKEN;
	const chatId = process.env.TELEGRAM_CHAT_ID;
	if (!botToken || !chatId) {
		return jsonResponse(500, { error: "Telegram not configured (env vars missing)" });
	}

	// Парсинг body
	let body;
	try {
		body = typeof event.body === "string" ? JSON.parse(event.body) : event.body || {};
	} catch {
		return jsonResponse(400, { error: "Invalid JSON" });
	}

	// Валидация
	const validErr = validateLeadInput(body);
	if (validErr) {
		return jsonResponse(400, { error: validErr });
	}

	// Rate limit по IP
	const ip =
		event.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
		event.requestContext?.identity?.sourceIp ||
		"unknown";
	const rl = checkRateLimit(ip);
	if (!rl.ok) {
		return {
			statusCode: 429,
			headers: { ...CORS, "Content-Type": "application/json", "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
			body: JSON.stringify({ error: "Слишком много запросов. Попробуйте через минуту." })
		};
	}

	// Сборка сообщения для Telegram
	const { restaurantName, contact, email, menuInfo, source } = body;
	const lines = [
		"🆕 <b>НОВАЯ ЗАЯВКА НА ПИЛОТ</b>",
		"",
		`<b>Ресторан:</b> ${escapeHtml(restaurantName)}`,
		`<b>Контакт:</b> ${escapeHtml(contact)}`
	];
	if (email) lines.push(`<b>Email:</b> ${escapeHtml(email)}`);
	if (menuInfo) lines.push("", `<b>Про меню:</b>`, escapeHtml(menuInfo));
	lines.push("", `<i>Источник: ${escapeHtml(source || "tablemind.ru")}</i>`);
	const text = lines.join("\n");

	// Отправка в Telegram
	try {
		const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				chat_id: chatId,
				text,
				parse_mode: "HTML",
				disable_web_page_preview: true
			})
		});

		if (!tgRes.ok) {
			const errText = await tgRes.text().catch(() => "");
			return jsonResponse(500, { error: "Telegram API error", detail: errText });
		}

		return jsonResponse(200, { ok: true });
	} catch (err) {
		return jsonResponse(500, { error: err.message || "Network error" });
	}
};
