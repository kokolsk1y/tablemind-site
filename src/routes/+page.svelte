<script>
	import { reveal, parallaxBg, counter, typingSequence, horizontalScroll } from "$lib/actions.js";

	// ────────────────────────────────────────────────────────────
	// ВАЖНО: состояние пилотных мест. Обновлять руками при продаже.
	// Когда пилот занят — PILOTS_TAKEN++, состояние сразу на сайте.
	// Также меняет цифру в блоке «Первые пилоты» в hero.
	// ────────────────────────────────────────────────────────────
	const PILOTS_TOTAL = 3;
	const PILOTS_TAKEN = 0;
	const pilotsFree = PILOTS_TOTAL - PILOTS_TAKEN;
	const pilotRoman = ["I", "II", "III"];

	// Архитектура — как устроен продукт внутри
	const arch = [
		{ roman: "I", label: "Гость", desc: "QR на столе", icon: "QR" },
		{ roman: "II", label: "PWA", desc: "меню в браузере", icon: "T" },
		{ roman: "III", label: "AI-агент", desc: "Claude Haiku", icon: "AI" },
		{ roman: "IV", label: "Верификатор", desc: "сверяется с картой", icon: "✓" },
		{ roman: "V", label: "Telegram", desc: "зовёт официанта", icon: "TG" }
	];

	// Живой diálogo — раскрывается typing-анимацией
	/** @type {string[]} */
	let dialogueShown = $state(["", "", "", "", "", ""]);
	const dialogueData = [
		{ who: "guest", label: "ГОСТЬ", text: "Что-нибудь лёгкое к рислингу, без рыбы?" },
		{ who: "ai", label: "AI · TM", text: "Есть карпаччо из свёклы с козьим сыром — № 04, 520 ₽. Также крем из тыквы с тимьяновым маслом (№ 03)." },
		{ who: "guest", label: "ГОСТЬ", text: "А аллергены?" },
		{ who: "ai", label: "AI · TM", text: "В карпаччо — орехи и молочное. В крем-супе — орехи. Предупрежу кухню." },
		{ who: "guest", label: "ГОСТЬ", text: "Позови официанта" },
		{ who: "ai", label: "AI · TM", text: "→ Отправил Илье в Telegram. Он подойдёт через 1–2 минуты." }
	];
	let dialogueActiveIndex = $state(-1);

	function updateDialogue(i, text, complete) {
		dialogueShown[i] = text;
		dialogueActiveIndex = complete ? -1 : i;
	}

	const today = new Date();
	const monthsRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
	const dateStr = `${String(today.getDate()).padStart(2, "0")} · ${monthsRoman[today.getMonth()]} · ${today.getFullYear()}`;
	const issueNum = String(today.getDate() + today.getMonth() * 31).padStart(3, "0");

	const method = [
		["I", "QR на столе", "Гость открывает PWA за <2 сек. Никаких установок, никаких аккаунтов."],
		["II", "Разговор", "Голосом или текстом, на русском или своём. AI знает меню шефа наизусть."],
		["III", "Верификатор", "Прежде чем ответить — сверяется с картой. Не придумает того, чего нет."],
		["IV", "Живой официант", "Если нужно — зовёт человека в ваш Telegram со столом и контекстом."]
	];

	const tariffs = [
		{
			n: "I",
			name: "Пилот",
			price: "0",
			sub: "первые 3 ресторана · полное сопровождение руками",
			bullets: ["Моё меню, моя настройка", "До 30 столов", "Telegram-бот в подарок", "Честная себестоимость OpenRouter"]
		},
		{
			n: "II",
			name: "Кафе",
			price: "9 900",
			sub: "После пилота — техфи за работу сервиса, не за поддержку руками",
			bullets: [
				"Хостинг, AI-токены OpenRouter, домен и SSL",
				"Обновление меню 1 раз в 2 месяца",
				"Мониторинг аптайма и быстрые фиксы багов",
				"Email-поддержка, ответ до 24 ч"
			],
			featured: true
		},
		{
			n: "III",
			name: "Сеть",
			price: "—",
			sub: "поговорим",
			bullets: ["От 3 точек", "API и интеграции", "Белая метка", "SLA и отчётность"]
		}
	];
</script>

<!-- Top meta strip -->
<div class="px-6 py-3 border-b border-base-content/20 flex items-center justify-between masthead">
	<span>TableMind · AI-официант</span>
	<span class="hidden sm:inline">ВЫПУСК №{issueNum} — {dateStr}</span>
	<span>Калининград</span>
</div>

<!-- Nav -->
<div class="px-6 py-4 border-b border-base-content/20 flex items-center justify-between gap-6">
	<a href="/" class="flex items-center gap-2.5">
		<span class="inline-block w-7 h-7 border border-base-content flex items-center justify-center">
			<span class="font-display italic text-base text-base-content leading-none">T</span>
		</span>
		<span class="font-display italic text-lg font-semibold text-base-content tracking-wide">TableMind</span>
	</a>
	<nav class="hidden md:flex gap-7 font-body font-medium text-sm">
		<a href="#method" class="text-base-content hover:text-accent transition-colors">Метод</a>
		<a href="#tarif" class="text-base-content hover:text-accent transition-colors">Карта цен</a>
		<a href="#verifier" class="text-base-content hover:text-accent transition-colors">Верификатор</a>
		<a href="#contact" class="text-base-content hover:text-accent transition-colors">Связаться</a>
	</nav>
	<a href="#contact" class="bg-base-content text-base-100 px-4 py-2.5 masthead hover:bg-primary transition-colors">
		№ → Записаться на пилот
	</a>
</div>

<!-- Hero -->
<section
	class="section-rhythm relative px-6 py-12 md:py-20 md:grid md:grid-cols-[1.3fr_1fr] md:gap-16 md:items-center border-b border-base-content/20 overflow-hidden"
	style="background-image: linear-gradient(rgba(242,234,218,0.92), rgba(242,234,218,0.82)), url('/bg/hero.png'); background-size: cover; background-position: center;"
	use:parallaxBg={{ factor: 0.35 }}
>
	<div class="relative">
		<div class="eyebrow mb-5" use:reveal>№ 01 · Закуска</div>
		<h1
			class="font-display font-medium text-base-content leading-[0.95]"
			style="font-size: clamp(48px, 10vw, 108px); letter-spacing: -0.025em;"
			use:reveal={{ delay: 100 }}
		>
			<span class="italic">AI-официант,</span><br />
			который<br />
			<span class="text-primary">знает ваше меню.</span>
		</h1>
		<div class="h-px bg-base-content/25 my-8 md:my-10 w-3/4" use:reveal={{ delay: 250 }}></div>
		<p
			class="font-body text-base md:text-lg text-base-content/80 max-w-lg leading-relaxed"
			use:reveal={{ delay: 350 }}
		>
			Гость сканирует QR со стола — и получает собеседника, который рассказывает о блюдах голосом и текстом, подбирает комплексы, зовёт живого официанта в Telegram, если нужно.
		</p>
		<div class="flex flex-wrap gap-3 mt-8" use:reveal={{ delay: 500 }}>
			<a
				href="#contact"
				class="btn-glow bg-primary text-primary-content font-body font-semibold text-sm py-4 px-6 flex items-center gap-2.5 hover:bg-base-content transition-colors"
			>
				<span class="font-mono tabular text-[11px] opacity-70">№ →</span>
				<span>Записаться на пилот</span>
			</a>
			<a
				href="#method"
				class="border-[1.5px] border-base-content text-base-content font-body font-medium text-sm py-4 px-6 hover:bg-base-content/10 transition-colors link-underline"
			>
				Смотреть метод
			</a>
		</div>
	</div>

	<!-- Numbers that matter -->
	<div class="relative mt-16 md:mt-0" use:reveal={{ delay: 150 }}>
		<div class="flex items-center justify-between pb-2 border-b border-base-content/25 masthead">
			<span>Цифры, которые важны</span>
			<span>№ — ЗНАЧ</span>
		</div>
		<!-- Счётчик: средний ответ AI -->
		<div class="flex items-baseline py-4 border-b border-dotted border-base-content/30">
			<div class="font-mono tabular text-[11px] text-accent w-8">01</div>
			<div class="font-body text-[15px] text-base-content font-medium">Средний ответ AI</div>
			<div class="flex-1 border-b border-dotted border-base-content/30 mx-3 mb-1.5"></div>
			<div class="font-mono tabular text-[15px] text-base-content font-medium">
				&lt;&nbsp;<span use:counter={{ target: 1.4, duration: 1400, decimals: 1 }}>0.0</span>&nbsp;с
			</div>
		</div>
		<!-- Счётчик: точность -->
		<div class="flex items-baseline py-4 border-b border-dotted border-base-content/30">
			<div class="font-mono tabular text-[11px] text-accent w-8">02</div>
			<div class="font-body text-[15px] text-base-content font-medium">Точность верификатора</div>
			<div class="flex-1 border-b border-dotted border-base-content/30 mx-3 mb-1.5"></div>
			<div class="font-mono tabular text-[15px] text-base-content font-medium">
				<span use:counter={{ target: 97, duration: 1400 }}>0</span>&nbsp;%
			</div>
		</div>
		<!-- Счётчик: языков -->
		<div class="flex items-baseline py-4 border-b border-dotted border-base-content/30">
			<div class="font-mono tabular text-[11px] text-accent w-8">03</div>
			<div class="font-body text-[15px] text-base-content font-medium">Языков ввода</div>
			<div class="flex-1 border-b border-dotted border-base-content/30 mx-3 mb-1.5"></div>
			<div class="font-mono tabular text-[15px] text-base-content font-medium">
				<span use:counter={{ target: 12, duration: 1400 }}>0</span>
			</div>
		</div>
		<!-- Счётчик: себестоимость -->
		<div class="flex items-baseline py-4 border-b border-dotted border-base-content/30">
			<div class="font-mono tabular text-[11px] text-accent w-8">04</div>
			<div class="font-body text-[15px] text-base-content font-medium">Себестоимость диалога</div>
			<div class="flex-1 border-b border-dotted border-base-content/30 mx-3 mb-1.5"></div>
			<div class="font-mono tabular text-[15px] text-base-content font-medium">
				~&nbsp;<span use:counter={{ target: 3, duration: 1400 }}>0</span>&nbsp;₽
			</div>
		</div>
		<!-- Статические метрики -->
		<div class="flex items-baseline py-4 border-b border-dotted border-base-content/30">
			<div class="font-mono tabular text-[11px] text-accent w-8">05</div>
			<div class="font-body text-[15px] text-base-content font-medium">Клиентских кейсов</div>
			<div class="flex-1 border-b border-dotted border-base-content/30 mx-3 mb-1.5"></div>
			<div class="font-mono tabular text-[15px] text-base-content font-medium">0 · пока</div>
		</div>
		<div class="flex items-baseline py-4 border-b border-dotted border-base-content/30">
			<div class="font-mono tabular text-[11px] text-accent w-8">06</div>
			<div class="font-body text-[15px] text-base-content font-medium">Свободных пилотов</div>
			<div class="flex-1 border-b border-dotted border-base-content/30 mx-3 mb-1.5"></div>
			<div class="font-mono tabular text-[15px] text-accent font-medium">
				{pilotsFree}&nbsp;из&nbsp;{PILOTS_TOTAL}
			</div>
		</div>
		<p class="font-display italic text-sm text-base-content/70 mt-5 leading-relaxed">
			Первые три ресторана — лично, руками. Без пресейла, без агентств, без красивых слов.
		</p>
	</div>
</section>

<!-- Method -->
<section id="method" class="section-rhythm px-6 py-14 border-b border-base-content/20">
	<div class="flex items-center justify-between pb-2.5 border-b border-base-content masthead sticky-label py-3" use:reveal>
		<span>№ 02 — МЕТОД</span>
		<span>Четыре хода</span>
	</div>
	<div class="grid grid-cols-1 md:grid-cols-4 gap-0 mt-8">
		{#each method as [n, title, desc], i (n)}
			<div
				class="px-0 md:px-6 py-6 md:py-0 md:border-r border-b md:border-b-0 border-base-content/20 last:border-b-0 md:last:border-r-0 first:pl-0 last:md:pr-0"
				use:reveal={{ delay: 150 + i * 120 }}
			>
				<div class="font-mono tabular text-[11px] text-accent tracking-[0.16em]">№ {n}</div>
				<h3 class="font-display italic text-2xl md:text-[26px] font-medium text-base-content mt-2.5 mb-3.5 leading-[1.1]">{title}</h3>
				<p class="font-body text-sm text-base-content/75 leading-relaxed">{desc}</p>
			</div>
		{/each}
	</div>
</section>

<!-- Architecture — pinned horizontal scroll (Apple/Stripe style) -->
<section id="arch" class="bg-base-200 border-b border-base-content/20">
	<div class="h-scroll-wrapper" data-horizontal-wrapper>
		<div class="h-scroll-pin">
			<!-- Header (sticky внутри pin) -->
			<div class="px-6 pt-6 pb-3 flex items-center justify-between masthead border-b border-base-content/25">
				<span>№ 03 — АРХИТЕКТУРА</span>
				<span class="hidden md:inline">Скроллите вниз — поток идёт вправо</span>
				<span class="md:hidden">Как устроено внутри</span>
			</div>

			<!-- Intro copy на первом экране пина -->
			<div class="px-6 py-5 md:py-8 border-b border-base-content/25">
				<h2 class="font-display italic text-3xl md:text-5xl font-medium text-base-content leading-[1.05] max-w-3xl">
					Поток<br class="md:hidden" />
					<span class="text-primary">всегда один.</span>
				</h2>
				<p class="font-body text-sm md:text-base text-base-content/75 mt-3 md:mt-4 max-w-xl leading-relaxed">
					QR → PWA → AI-агент → верификатор → Telegram. Никаких серверов,
					которые нужно администрировать.
				</p>
			</div>

			<!-- Horizontal track -->
			<div class="h-scroll-track" use:horizontalScroll>
				{#each arch as step, i (step.roman)}
					<div class="shrink-0 w-[85vw] md:w-[38vw] lg:w-[28vw] relative">
						<div class="border border-base-content/30 bg-base-100 p-6 md:p-8 h-full flex flex-col gap-5 md:gap-8">
							<div class="flex items-center justify-between masthead border-b border-dotted border-base-content/25 pb-3">
								<span>Шаг № {step.roman}</span>
								<span class="text-accent">{String(i + 1).padStart(2, "0")} / {String(arch.length).padStart(2, "0")}</span>
							</div>

							<!-- Node visual -->
							<div class="flex items-center gap-5">
								<div class="relative w-16 h-16 md:w-20 md:h-20 shrink-0">
									<div class="absolute inset-0 border-[1.5px] border-base-content rounded-full bg-base-200 flex items-center justify-center">
										<span class="font-mono tabular text-[13px] font-semibold text-base-content tracking-wide">
											{step.icon}
										</span>
									</div>
									<div class="absolute inset-0 border-[1.5px] border-accent rounded-full pulse-dot opacity-50"></div>
								</div>
								<div class="flex-1 min-w-0">
									<div class="font-display italic text-3xl md:text-4xl font-medium text-base-content leading-none">
										{step.label}
									</div>
									<div class="font-body text-[13px] text-base-content/65 mt-2">
										{step.desc}
									</div>
								</div>
							</div>

							<!-- Descriptive copy per step -->
							<div class="font-body text-sm text-base-content/80 leading-relaxed">
								{#if i === 0}
									Гость подходит к столу и видит QR. Сканирует камерой — открывается веб-приложение. Устанавливать ничего не нужно, аккаунтов нет.
								{:else if i === 1}
									PWA — HTML и JavaScript на GitHub Pages. Загружается за меньше двух секунд даже на медленном 4G. Работает в любом браузере телефона.
								{:else if i === 2}
									Клод Хайку 4.5 через OpenRouter. Дешёвый, быстрый, говорит на 12 языках. Промпт собирается из меню-JSON и истории разговора.
								{:else if i === 3}
									Отдельная модель проверяет каждый ответ официанта. Сверяет состав, аллергены и цены с картой шефа. Если не сходится — помечает ответ.
								{:else}
									Telegram-бот получает сообщение: номер стола, выбранные блюда, сумма, время. Официант видит и идёт к гостю.
								{/if}
							</div>

							<div class="mt-auto pt-4 border-t border-dotted border-base-content/25 masthead flex items-center justify-between">
								<span>{step.icon} · технически</span>
								<span class="text-accent">→</span>
							</div>
						</div>
					</div>
				{/each}

				<!-- Trailing card -->
				<div class="shrink-0 w-[85vw] md:w-[38vw] lg:w-[28vw]">
					<div class="border border-base-content/30 bg-primary text-primary-content p-6 md:p-8 h-full flex flex-col justify-between">
						<div>
							<div class="masthead opacity-70 border-b border-primary-content/30 pb-3">
								Итого
							</div>
							<h3 class="font-display italic text-4xl md:text-5xl font-medium leading-[1.05] mt-6">
								Работает<br />из коробки.
							</h3>
							<p class="font-body text-sm opacity-85 mt-4 leading-relaxed">
								Пять компонентов, один поток, ноль серверов которые вы администрируете. Я настраиваю всё за день — дальше продукт живёт сам.
							</p>
						</div>
						<a href="#contact" class="btn-glow inline-flex items-center gap-2.5 bg-accent text-accent-content font-body font-semibold text-sm py-4 px-5 mt-6 self-start">
							<span class="font-mono tabular text-[11px] opacity-70">№ →</span>
							<span>Записаться на пилот</span>
						</a>
					</div>
				</div>
			</div>

			<!-- Scroll progress bar (визуально показывает как далеко уехал поток) -->
			<div class="px-6 pt-4 pb-6">
				<div class="h-scroll-progress-track">
					<div class="h-scroll-progress-fill"></div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Dialogue -->
<section id="verifier" class="section-rhythm px-6 py-14 border-b border-base-content/20 md:grid md:grid-cols-[1fr_1.2fr] md:gap-12 md:items-center">
	<div>
		<div class="eyebrow mb-4">№ 03 · Главное</div>
		<h2 class="font-display text-4xl md:text-5xl font-medium italic text-base-content leading-[1.05]">
			Голос,<br />
			который <span class="text-primary">не врёт</span>.
		</h2>
		<p class="font-body text-base text-base-content/80 mt-6 max-w-md leading-relaxed">
			Каждый ответ проходит через отдельную модель-верификатор, которая сверяет сказанное с картой шефа. Если блюда нет в меню — гостю мягко предложат альтернативу, а не фантазию.
		</p>
		<div class="mt-6 flex flex-wrap gap-5 text-sm">
			<span><b class="text-base-content">97 %</b> <span class="text-base-content/60">точность</span></span>
			<span><b class="text-base-content">0</b> <span class="text-base-content/60">галлюцинаций в логах</span></span>
			<span><b class="text-base-content">&lt; 1.4 с</b> <span class="text-base-content/60">ответ</span></span>
		</div>

		<!-- Atmospheric plate shot -->
		<div class="mt-8 border border-base-content/25 overflow-hidden">
			<img
				src="/bg/plate.png"
				alt="Свёкольное карпаччо с козьим сыром"
				class="w-full h-56 md:h-64 object-cover"
				loading="lazy"
			/>
			<div class="px-4 py-2.5 bg-base-200 border-t border-base-content/20 flex items-center justify-between masthead">
				<span>№ 04 · блюдо дня</span>
				<span>Карпаччо из свёклы</span>
			</div>
		</div>
	</div>

	<!-- Dialogue mockup — live typing -->
	<div
		class="bg-base-200 border border-base-content/25 mt-10 md:mt-0 self-start"
		use:typingSequence={{
			messages: dialogueData,
			charDelay: 14,
			delayBetween: 550,
			onUpdate: updateDialogue
		}}
	>
		<div class="px-5 py-3 border-b border-dotted border-base-content/30 flex items-center justify-between masthead">
			<span>СТОЛ · 07</span>
			<span>ДИАЛОГ №014</span>
			<span>20:41</span>
		</div>
		{#each dialogueData as msg, i (i)}
			{#if dialogueShown[i] || i === dialogueActiveIndex}
				<div class="flex gap-4 px-5 py-3.5 {i < dialogueData.length - 1 ? 'border-b border-dotted border-base-content/25' : ''}">
					<div class="font-mono text-[9px] tracking-[0.15em] font-semibold w-12 pt-1 {msg.who === 'ai' ? 'text-primary' : 'text-accent'}">
						{msg.label}
					</div>
					<div class="flex-1 font-body text-sm text-base-content leading-relaxed {dialogueActiveIndex === i ? 'typing-cursor' : ''}">
						{dialogueShown[i]}
					</div>
				</div>
			{/if}
		{/each}
	</div>
</section>

<!-- Tariffs -->
<section id="tarif" class="section-rhythm px-6 py-14 border-b border-base-content/20">
	<div class="flex items-center justify-between pb-2.5 border-b border-base-content masthead sticky-label py-3" use:reveal>
		<span>№ 04 — ТАРИФ · ЧЕСТНЫЙ СЧЁТ</span>
		<span>₽ / месяц</span>
	</div>
	<div class="grid grid-cols-1 md:grid-cols-3 gap-0 mt-8">
		{#each tariffs as p, i (p.n)}
			<div
				class="relative p-7 border-b md:border-b-0 md:border-r border-base-content/20 last:border-b-0 md:last:border-r-0 transition-transform duration-500 hover:-translate-y-1 {p.featured ? 'bg-base-200' : ''}"
				use:reveal={{ delay: 150 + i * 150 }}
			>
				{#if p.featured}
					<div class="absolute top-0 left-0 right-0 h-[3px] bg-accent"></div>
				{/if}
				<div class="font-mono tabular text-[10px] text-accent tracking-[0.2em]">№ {p.n}</div>
				<div class="font-display italic text-3xl font-medium text-base-content mt-2">{p.name}</div>
				<div class="font-display italic text-[13px] text-base-content/65 mt-1 max-w-[260px] leading-snug">{p.sub}</div>
				<div class="flex items-baseline gap-1.5 mt-6">
					<div class="font-mono tabular text-[40px] font-medium text-base-content leading-none">{p.price}</div>
					{#if p.price !== "—" && p.price !== "0"}
						<div class="font-body text-[13px] text-base-content/60">₽ / мес</div>
					{/if}
				</div>
				<div class="border-t border-dotted border-base-content/30 my-5"></div>
				{#each p.bullets as b (b)}
					<div class="flex gap-2.5 py-1.5 text-sm text-base-content/80">
						<span class="font-mono text-accent text-[10px] pt-1">·</span>
						<span>{b}</span>
					</div>
				{/each}
			</div>
		{/each}
	</div>
	<p class="font-display italic text-sm text-base-content/70 mt-8 pt-5 border-t border-dotted border-base-content/30 max-w-3xl leading-relaxed">
		Я разработчик-одиночка. 9 900 ₽/мес — честная плата за то, чтобы продукт жил и работал. Это не агентство, не менеджер аккаунта, не круглосуточная поддержка.
	</p>
</section>

<!-- Contact / Pilot signup -->
<section
	id="contact"
	class="section-rhythm relative px-6 py-14 border-b border-base-content/20 overflow-hidden"
	style="background-image: linear-gradient(rgba(242,234,218,0.94), rgba(242,234,218,0.88)), url('/bg/texture.png'); background-size: cover; background-position: center;"
>
	<div class="relative max-w-2xl">
		<div class="eyebrow mb-4">№ 05 · Связь</div>
		<h2 class="font-display italic text-4xl md:text-5xl font-medium text-base-content leading-[1.05]">
			Пилот<br />
			<span class="text-primary">начинается с письма.</span>
		</h2>
		<p class="font-body text-base text-base-content/80 mt-5 max-w-lg leading-relaxed">
			Первые три пилотных места — бесплатно. Я собираю каталог меню сам, настраиваю QR-коды, передаю ключ от кухни в Telegram.
		</p>

		<!-- Индикатор свободных пилотных мест -->
		<div class="mt-8 border border-base-content/30 bg-base-200/60 backdrop-blur-sm">
			<div class="px-5 py-3 flex items-center justify-between border-b border-base-content/25 masthead">
				<span>№ пилотных мест</span>
				<span class="text-accent">{pilotsFree} из {PILOTS_TOTAL} свободно</span>
			</div>
			<div class="grid grid-cols-3 gap-0">
				{#each pilotRoman as roman, i (roman)}
					{@const taken = i < PILOTS_TAKEN}
					<div class="p-5 border-r last:border-r-0 border-base-content/20 text-center {taken ? 'bg-primary text-primary-content' : 'bg-transparent'}">
						<div class="font-mono tabular text-[10px] tracking-[0.2em] {taken ? 'opacity-80' : 'text-accent'}">
							ПИЛОТ № {roman}
						</div>
						<div class="font-display italic text-3xl font-medium mt-1.5 leading-none">
							{taken ? "Занят" : "Свободен"}
						</div>
						<div class="font-mono tabular text-[10px] tracking-[0.14em] mt-2 {taken ? 'opacity-70' : 'text-base-content/55'}">
							{taken ? "— настройка идёт" : "0 ₽ · 14 дней"}
						</div>
					</div>
				{/each}
			</div>
			{#if pilotsFree > 0}
				<div class="px-5 py-3 border-t border-base-content/25 font-display italic text-sm text-base-content/70 leading-snug">
					Когда все три займутся — тариф «Кафе» от 9 900 ₽/мес, без пилотной скидки.
				</div>
			{:else}
				<div class="px-5 py-3 border-t border-base-content/25 font-display italic text-sm text-error leading-snug">
					Все пилотные места заняты. Пишите — поставлю в очередь на платный запуск по тарифу «Кафе».
				</div>
			{/if}
		</div>

		<div class="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-0 border-y border-base-content/30">
			<a href="https://t.me/tablemind" target="_blank" rel="noopener" class="flex items-baseline gap-3 py-5 px-2 border-b sm:border-b-0 sm:border-r border-base-content/25 hover:bg-base-200 transition-colors">
				<span class="eyebrow tabular w-7">01</span>
				<div class="flex-1">
					<div class="font-body font-semibold text-base text-base-content">Telegram</div>
					<div class="font-display italic text-sm text-base-content/65">@tablemind</div>
				</div>
				<span class="font-mono tabular text-xs text-base-content">→</span>
			</a>
			<a href="mailto:hi@tablemind.ru" class="flex items-baseline gap-3 py-5 px-2 hover:bg-base-200 transition-colors">
				<span class="eyebrow tabular w-7">02</span>
				<div class="flex-1">
					<div class="font-body font-semibold text-base text-base-content">Почта</div>
					<div class="font-display italic text-sm text-base-content/65">hi@tablemind.ru</div>
				</div>
				<span class="font-mono tabular text-xs text-base-content">→</span>
			</a>
		</div>

		<p class="font-display italic text-sm text-base-content/60 mt-6 leading-relaxed">
			Напишите название ресторана и 2–3 фото меню. Я вернусь с персональным демо за 2 дня.
		</p>
	</div>
</section>

<!-- Footer -->
<footer class="px-6 py-12 bg-primary text-primary-content">
	<div class="flex flex-col md:flex-row md:items-end justify-between gap-8">
		<div>
			<div class="flex items-center gap-2.5">
				<span class="inline-block w-7 h-7 border border-primary-content flex items-center justify-center">
					<span class="font-display italic text-base leading-none">T</span>
				</span>
				<span class="font-display italic text-lg font-semibold tracking-wide">TableMind</span>
			</div>
			<p class="masthead mt-4 max-w-md opacity-80" style="color: inherit">
				Калининград · {today.getFullYear()}. Делаю руками для первых трёх ресторанов.<br />
				Без агентств, без пресейла, без маркетинговых баннеров.
			</p>
		</div>
		<div class="grid grid-cols-2 gap-x-10 gap-y-2 masthead opacity-90" style="color: inherit">
			<span>Telegram</span><span>@tablemind</span>
			<span>Почта</span><span>hi@tablemind.ru</span>
			<span>Метод</span><a href="#method" class="underline">#method</a>
			<span>Тариф</span><a href="#tarif" class="underline">#tarif</a>
		</div>
	</div>
	<div class="mt-10 pt-5 border-t border-primary-content/25 flex flex-col sm:flex-row justify-between gap-3 masthead opacity-60" style="color: inherit">
		<span>© {today.getFullYear()} · TABLEMIND</span>
		<span>№ {issueNum} — ВЫПУСК {monthsRoman[today.getMonth()]}</span>
		<span>СДЕЛАНО В КАЛИНИНГРАДЕ</span>
	</div>
</footer>
