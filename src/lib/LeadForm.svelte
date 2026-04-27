<script>
	// URL Yandex Cloud Function (notify). Подставляется при build из GitHub Secret PUBLIC_API_URL.
	// Vite автоматически проксирует все env-переменные с префиксом PUBLIC_ в бандл.
	// Локально для разработки положить в .env.local: PUBLIC_API_URL=https://...
	// Fallback на старый Vercel-URL — на случай если secret ещё не настроен.
	const API_URL = import.meta.env.PUBLIC_API_URL || "https://table-mind-seven.vercel.app/api/notify";

	/** @type {"idle" | "sending" | "ok" | "error"} */
	let status = $state("idle");
	let errorText = $state("");

	let restaurantName = $state("");
	let contact = $state("");
	let email = $state("");
	let menuInfo = $state("");

	const canSubmit = $derived(
		status !== "sending" &&
			restaurantName.trim().length > 0 &&
			contact.trim().length > 0
	);

	async function submit() {
		if (!canSubmit) return;
		status = "sending";
		errorText = "";

		try {
			const res = await fetch(API_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					restaurantName: restaurantName.trim(),
					contact: contact.trim(),
					email: email.trim() || undefined,
					menuInfo: menuInfo.trim() || undefined,
					source: "tablemind-site"
				})
			});
			if (!res.ok) {
				const j = await res.json().catch(() => ({}));
				throw new Error(j.error || `HTTP ${res.status}`);
			}
			status = "ok";
			restaurantName = "";
			contact = "";
			email = "";
			menuInfo = "";
		} catch (e) {
			status = "error";
			errorText = e?.message || "Не получилось отправить — попробуйте ещё раз или напишите в Telegram";
		}
	}

	function handleSubmit(e) {
		e.preventDefault();
		submit();
	}
</script>

<div class="border border-base-content bg-base-100">
	<!-- Top bar -->
	<div class="flex items-center justify-between px-5 py-3 border-b border-base-content/25 masthead">
		<span>Заявка на пилот</span>
		<span class="text-accent">бесплатно · 14 дней</span>
	</div>

	{#if status === "ok"}
		<!-- Success state -->
		<div class="px-6 py-12 text-center">
			<div class="font-display italic text-4xl md:text-5xl font-medium text-base-content leading-[1.05]">
				Заявка<br />
				<span class="text-primary">отправлена.</span>
			</div>
			<p class="font-display italic text-base md:text-lg text-base-content/70 mt-5 max-w-md mx-auto leading-relaxed">
				Я получил ваш запрос в Telegram. Вернусь с персональным демо за&nbsp;1–2 дня.
			</p>
			<button
				class="mt-8 border-[1.5px] border-base-content text-base-content font-body font-medium text-sm py-3 px-6 hover:bg-base-content hover:text-base-100 transition-colors"
				onclick={() => (status = "idle")}
			>
				Отправить ещё одну
			</button>
		</div>
	{:else}
		<!-- Form -->
		<form class="p-6 md:p-8 grid gap-5 md:gap-6" onsubmit={handleSubmit}>
			<!-- Restaurant name -->
			<label class="block">
				<span class="font-mono text-[11px] text-accent tracking-[0.18em] uppercase">
					01 · Название заведения
				</span>
				<input
					type="text"
					bind:value={restaurantName}
					required
					maxlength="200"
					placeholder="Балтийская кухня"
					class="mt-2 w-full bg-transparent border-b border-base-content/40 py-2.5 text-lg font-body text-base-content placeholder:text-base-content/40 placeholder:font-display placeholder:italic focus:outline-none focus:border-base-content"
				/>
			</label>

			<!-- Contact -->
			<label class="block">
				<span class="font-mono text-[11px] text-accent tracking-[0.18em] uppercase">
					02 · Telegram или телефон
				</span>
				<input
					type="text"
					bind:value={contact}
					required
					maxlength="200"
					placeholder="@nikneim или +7 …"
					class="mt-2 w-full bg-transparent border-b border-base-content/40 py-2.5 text-lg font-body text-base-content placeholder:text-base-content/40 placeholder:font-display placeholder:italic focus:outline-none focus:border-base-content"
				/>
			</label>

			<!-- Email (optional) -->
			<label class="block">
				<span class="font-mono text-[11px] text-base-content/50 tracking-[0.18em] uppercase">
					03 · Email <span class="opacity-60 normal-case font-display italic ml-1">по желанию</span>
				</span>
				<input
					type="email"
					bind:value={email}
					maxlength="200"
					placeholder="hello@example.com"
					class="mt-2 w-full bg-transparent border-b border-base-content/30 py-2.5 text-lg font-body text-base-content placeholder:text-base-content/40 placeholder:font-display placeholder:italic focus:outline-none focus:border-base-content"
				/>
			</label>

			<!-- Menu info (optional) -->
			<label class="block">
				<span class="font-mono text-[11px] text-base-content/50 tracking-[0.18em] uppercase">
					04 · Про ваше меню <span class="opacity-60 normal-case font-display italic ml-1">по желанию</span>
				</span>
				<textarea
					bind:value={menuInfo}
					maxlength="2000"
					rows="3"
					placeholder="Ссылка на меню, фото карты, или просто пара слов — что важно про вашу кухню"
					class="mt-2 w-full bg-transparent border-b border-base-content/30 py-2.5 text-base font-body text-base-content placeholder:text-base-content/40 placeholder:font-display placeholder:italic focus:outline-none focus:border-base-content resize-none"
				></textarea>
			</label>

			<!-- Error -->
			{#if status === "error"}
				<div class="border-l-2 border-error pl-4 py-2 font-display italic text-base text-error">
					{errorText}
				</div>
			{/if}

			<!-- Submit -->
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
				<p class="font-display italic text-sm text-base-content/65 leading-snug max-w-sm">
					Заявка уйдёт мне в Telegram. Отвечу за&nbsp;1–2&nbsp;дня лично.
				</p>
				<button
					type="submit"
					disabled={!canSubmit}
					class="btn-glow bg-primary text-primary-content font-body font-semibold text-base py-4 px-7 hover:bg-base-content transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
				>
					{status === "sending" ? "Отправляю…" : "Записаться на пилот"}
				</button>
			</div>
		</form>
	{/if}
</div>
