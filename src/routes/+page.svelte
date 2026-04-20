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

<!-- Nav — truly centered grid с интерактивной CTA -->
<header class="grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-8 px-5 md:px-8 py-5 border-b border-base-content/20 bg-base-100">
	<!-- Logo left -->
	<a href="/" class="justify-self-start flex items-center gap-3 group">
		<span class="inline-block w-8 h-8 border-[1.5px] border-base-content flex items-center justify-center transition-all group-hover:bg-base-content group-hover:text-base-100">
			<span class="font-display italic text-lg leading-none">T</span>
		</span>
		<span class="font-display italic text-xl font-semibold text-base-content tracking-wide hidden sm:inline">
			TableMind
		</span>
	</a>

	<!-- Chapter-numbered nav center -->
	<nav class="hidden md:flex gap-7 lg:gap-9 justify-self-center">
		<a href="#method" class="group flex items-baseline gap-1.5 link-underline text-base-content hover:text-accent transition-colors">
			<span class="font-mono tabular text-[10px] text-accent/70 group-hover:text-accent tracking-[0.15em]">I</span>
			<span class="font-body font-medium text-sm">Метод</span>
		</a>
		<a href="#arch" class="group flex items-baseline gap-1.5 link-underline text-base-content hover:text-accent transition-colors">
			<span class="font-mono tabular text-[10px] text-accent/70 group-hover:text-accent tracking-[0.15em]">II</span>
			<span class="font-body font-medium text-sm">Архитектура</span>
		</a>
		<a href="#verifier" class="group flex items-baseline gap-1.5 link-underline text-base-content hover:text-accent transition-colors">
			<span class="font-mono tabular text-[10px] text-accent/70 group-hover:text-accent tracking-[0.15em]">III</span>
			<span class="font-body font-medium text-sm">Верификатор</span>
		</a>
		<a href="#tarif" class="group flex items-baseline gap-1.5 link-underline text-base-content hover:text-accent transition-colors">
			<span class="font-mono tabular text-[10px] text-accent/70 group-hover:text-accent tracking-[0.15em]">IV</span>
			<span class="font-body font-medium text-sm">Тариф</span>
		</a>
	</nav>

	<!-- Interactive CTA right -->
	<a href="#contact" class="justify-self-end group inline-flex items-stretch btn-glow bg-primary text-primary-content hover:bg-base-content transition-colors overflow-hidden">
		<!-- Live pilots counter -->
		<span class="hidden sm:flex items-center gap-1.5 px-3 py-2.5 border-r border-primary-content/25 masthead text-accent">
			<span class="inline-block w-1.5 h-1.5 bg-accent rounded-full pulse-dot"></span>
			<span>{pilotsFree}&nbsp;мест</span>
		</span>
		<!-- Main label -->
		<span class="flex items-center gap-2.5 px-4 py-2.5">
			<span class="masthead">Записаться</span>
			<span class="font-mono tabular text-accent transition-transform duration-300 group-hover:translate-x-1">→</span>
		</span>
	</a>
</header>

<!-- Hero — single focus, full-bleed photo, cinema -->
<section
	class="section-rhythm relative px-6 py-20 md:py-24 border-b border-base-content/20 overflow-hidden flex flex-col justify-end"
	style="background-image: linear-gradient(rgba(242,234,218,0.86), rgba(242,234,218,0.72)), url('/bg/hero.png'); background-size: cover; background-position: center;"
	use:parallaxBg={{ factor: 0.35 }}
>
	<!-- Oversized folio numeral -->
	<div class="chapter-folio chapter-folio-primary" style="top: 4vh; right: -6vw;">I</div>

	<!-- Small top-left meta -->
	<div class="relative flex items-center gap-3 masthead mb-auto" use:reveal>
		<span class="inline-block w-2 h-2 bg-accent rounded-full pulse-dot"></span>
		<span>Глава I · Закуска</span>
	</div>

	<!-- Bottom headline -->
	<div class="relative max-w-5xl">
		<h1
			class="font-display font-medium text-base-content leading-[0.92]"
			style="font-size: clamp(52px, 11vw, 144px); letter-spacing: -0.035em;"
			use:reveal={{ delay: 80 }}
		>
			<span class="italic">AI-официант,</span><br />
			<span>который</span><br />
			<span class="text-primary">знает ваше меню.</span>
		</h1>

		<div class="mt-10 md:mt-12 grid md:grid-cols-[1fr_auto] gap-6 md:gap-10 items-end">
			<p
				class="font-body text-base md:text-lg text-base-content/80 max-w-xl leading-relaxed"
				use:reveal={{ delay: 220 }}
			>
				Гость сканирует QR со стола — и получает собеседника, который рассказывает о блюдах голосом и текстом, подбирает комплексы, зовёт живого официанта в Telegram, если нужно.
			</p>
			<div class="flex flex-wrap gap-3" use:reveal={{ delay: 360 }}>
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
	</div>

	<!-- Scroll cue -->
	<div class="relative mt-16 flex items-center gap-2 masthead opacity-60" use:reveal={{ delay: 600 }}>
		<div class="w-10 h-px bg-current"></div>
		<span>скроллите вниз</span>
	</div>
</section>

<!-- Numbers — на тёмной болотной подкладке, контраст -->
<section class="section-dark section-rhythm relative px-6 py-20 md:py-24 overflow-hidden">
	<div class="chapter-folio chapter-folio-accent" style="top: -4vh; left: -4vw;">II</div>

	<div class="relative max-w-7xl mx-auto w-full">
		<div class="flex items-center justify-between pb-3 border-b border-current/30" use:reveal>
			<div class="flex items-baseline gap-3">
				<span class="eyebrow">Глава II</span>
				<span class="font-display italic text-xl md:text-2xl font-medium">Цифры, которые важны</span>
			</div>
			<span class="masthead hidden sm:inline">Numbers · Edition 003</span>
		</div>

		<div class="mt-10 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-current/20">
			<!-- Stat 01 -->
			<div class="relative p-6 md:p-10 border-b md:border-r border-current/20" use:reveal={{ delay: 100 }}>
				<div class="eyebrow">01 · отклик</div>
				<div class="font-display italic text-6xl md:text-8xl font-medium mt-6 leading-none">
					&lt;<span use:counter={{ target: 1.4, duration: 1600, decimals: 1 }}>0.0</span>
				</div>
				<div class="font-body text-sm md:text-base mt-4 opacity-80 leading-snug">
					секунд — средний ответ AI на вопрос гостя
				</div>
			</div>
			<!-- Stat 02 -->
			<div class="relative p-6 md:p-10 border-b md:border-r border-current/20" use:reveal={{ delay: 200 }}>
				<div class="eyebrow">02 · точность</div>
				<div class="font-display italic text-6xl md:text-8xl font-medium mt-6 leading-none">
					<span use:counter={{ target: 97, duration: 1600 }}>0</span>&nbsp;<span class="text-3xl md:text-5xl align-top">%</span>
				</div>
				<div class="font-body text-sm md:text-base mt-4 opacity-80 leading-snug">
					верификатор ловит несоответствия между ответом и меню
				</div>
			</div>
			<!-- Stat 03 -->
			<div class="relative p-6 md:p-10 border-b border-current/20" use:reveal={{ delay: 300 }}>
				<div class="eyebrow">03 · языки</div>
				<div class="font-display italic text-6xl md:text-8xl font-medium mt-6 leading-none">
					<span use:counter={{ target: 12, duration: 1600 }}>0</span>
				</div>
				<div class="font-body text-sm md:text-base mt-4 opacity-80 leading-snug">
					языков понимает голосом и текстом — авто-детект
				</div>
			</div>
			<!-- Stat 04 -->
			<div class="relative p-6 md:p-10 border-b md:border-b-0 md:border-r border-current/20" use:reveal={{ delay: 400 }}>
				<div class="eyebrow">04 · себестоимость</div>
				<div class="font-display italic text-6xl md:text-8xl font-medium mt-6 leading-none">
					~<span use:counter={{ target: 3, duration: 1600 }}>0</span>&nbsp;<span class="text-3xl md:text-5xl align-top">₽</span>
				</div>
				<div class="font-body text-sm md:text-base mt-4 opacity-80 leading-snug">
					стоит один полный диалог гостя с AI-официантом
				</div>
			</div>
			<!-- Stat 05 -->
			<div class="relative p-6 md:p-10 border-b md:border-b-0 md:border-r border-current/20" use:reveal={{ delay: 500 }}>
				<div class="eyebrow">05 · пилоты</div>
				<div class="font-display italic text-6xl md:text-8xl font-medium mt-6 leading-none text-accent">
					{pilotsFree}<span class="text-3xl md:text-5xl align-top text-current">/{PILOTS_TOTAL}</span>
				</div>
				<div class="font-body text-sm md:text-base mt-4 opacity-80 leading-snug">
					свободных бесплатных мест — занимайте, пока есть
				</div>
			</div>
			<!-- Stat 06 -->
			<div class="relative p-6 md:p-10" use:reveal={{ delay: 600 }}>
				<div class="eyebrow">06 · кейсы</div>
				<div class="font-display italic text-6xl md:text-8xl font-medium mt-6 leading-none">
					0<span class="text-3xl md:text-5xl align-top font-body not-italic font-normal opacity-60 ml-2">пока</span>
				</div>
				<div class="font-body text-sm md:text-base mt-4 opacity-80 leading-snug">
					клиентских кейсов — первых ищу сейчас
				</div>
			</div>
		</div>

		<p class="font-display italic text-lg md:text-xl mt-12 md:mt-16 max-w-3xl opacity-75 leading-relaxed" use:reveal>
			Первые три ресторана — лично, руками. Без пресейла, без агентств, без красивых слов.
		</p>
	</div>
</section>

<!-- Chapter break III · Метод -->
<section class="relative px-6 py-24 md:py-32 border-b border-base-content/20 overflow-hidden flex flex-col justify-center">
	<div class="chapter-folio" style="top: 50%; left: 50%; transform: translate(-50%, -50%);">III</div>
	<div class="relative text-center">
		<div class="masthead text-accent mb-4" use:reveal>Глава III</div>
		<h2 class="font-display italic font-medium text-base-content leading-[0.9]" style="font-size: clamp(56px, 12vw, 160px); letter-spacing: -0.03em;" use:reveal={{ delay: 120 }}>
			Метод.
		</h2>
		<div class="masthead mt-6" use:reveal={{ delay: 280 }}>четыре хода от стола до кухни</div>
	</div>
</section>

<!-- Method — staircase layout -->
<section id="method" class="section-rhythm relative px-6 py-20 md:py-24 border-b border-base-content/20 overflow-hidden">
	<div class="chapter-folio" style="bottom: -20vh; right: -6vw;">IV</div>

	<div class="relative flex items-center justify-between pb-3 border-b border-base-content masthead sticky-label" use:reveal>
		<span>Четыре хода</span>
		<span>Поток гостя</span>
	</div>

	<div class="relative grid grid-cols-1 md:grid-cols-2 gap-y-10 md:gap-y-20 gap-x-10 mt-12 md:mt-20">
		{#each method as [n, title, desc], i (n)}
			<div
				class="relative {i % 2 === 1 ? 'md:mt-24' : ''} {i > 0 ? 'md:pl-8' : ''}"
				use:reveal={{ delay: 100 + i * 140 }}
			>
				<div class="flex items-start gap-4 md:gap-6">
					<div class="font-display italic font-medium text-accent leading-none shrink-0" style="font-size: clamp(64px, 10vw, 132px); letter-spacing: -0.04em;">
						{n}
					</div>
					<div class="pt-2 md:pt-4">
						<h3 class="font-display italic text-3xl md:text-4xl font-medium text-base-content leading-[1.05]">
							{title}
						</h3>
						<p class="font-body text-sm md:text-base text-base-content/75 leading-relaxed mt-4 max-w-sm">
							{desc}
						</p>
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- Chapter break · Архитектура -->
<section class="section-dark relative px-6 py-24 md:py-32 overflow-hidden flex flex-col justify-center">
	<div class="chapter-folio chapter-folio-accent" style="top: 50%; left: 50%; transform: translate(-50%, -50%);">V</div>
	<div class="relative text-center">
		<div class="masthead mb-4" use:reveal>Глава IV</div>
		<h2 class="font-display italic font-medium leading-[0.9]" style="font-size: clamp(56px, 12vw, 160px); letter-spacing: -0.03em;" use:reveal={{ delay: 120 }}>
			Архитектура.
		</h2>
		<div class="masthead mt-6" use:reveal={{ delay: 280 }}>как устроено внутри — пять компонентов</div>
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

<!-- Pull quote — full-screen cinema moment -->
<section class="section-rhythm relative px-6 py-20 md:py-32 border-b border-base-content/20 overflow-hidden flex flex-col justify-center">
	<div class="chapter-folio chapter-folio-primary" style="top: -12vh; right: -8vw;">VI</div>

	<div class="relative masthead mb-8" use:reveal>
		Глава V · прямая речь продукта
	</div>

	<blockquote class="relative font-display italic font-medium text-base-content leading-[0.95] max-w-6xl" style="font-size: clamp(48px, 9vw, 128px); letter-spacing: -0.03em;" use:reveal={{ delay: 120 }}>
		<span class="text-accent">«</span>В&nbsp;карпаччо&nbsp;—<br class="hidden md:block" />
		орехи&nbsp;и&nbsp;молочное.<br />
		Предупрежу&nbsp;<span class="text-primary">кухню.</span><span class="text-accent">»</span>
	</blockquote>

	<div class="relative mt-10 md:mt-14 font-display italic text-base md:text-xl text-base-content/70 max-w-2xl leading-relaxed" use:reveal={{ delay: 280 }}>
		— AI·TM, настоящий ответ на вопрос гостя «а аллергены?». Без выдумки. Сверено с картой шефа за 1.2 секунды.
	</div>
</section>

<!-- Verifier / Dialogue — натюрморт «блюдо + разговор о нём» -->
<section id="verifier" class="section-rhythm relative px-6 py-14 border-b border-base-content/20 overflow-hidden">
	<div class="max-w-7xl mx-auto w-full">
		<!-- Левая текстовая часть -->
		<div class="md:grid md:grid-cols-[1fr_1.4fr] md:gap-16 md:items-start">
			<div class="md:sticky md:top-20">
				<div class="eyebrow mb-4" use:reveal>№ 03 · Главное</div>
				<h2
					class="font-display font-medium italic text-base-content leading-[1.02]"
					style="font-size: clamp(40px, 5.5vw, 72px); letter-spacing: -0.025em;"
					use:reveal={{ delay: 80 }}
				>
					Голос,<br />
					который<br />
					<span class="text-primary">не врёт.</span>
				</h2>
				<p class="font-body text-base md:text-lg text-base-content/80 mt-6 max-w-md leading-relaxed" use:reveal={{ delay: 180 }}>
					Каждый ответ проходит через отдельную модель-верификатор, которая сверяет сказанное с картой шефа. Если блюда нет в меню — гостю мягко предложат альтернативу, а не фантазию.
				</p>
				<div class="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm" use:reveal={{ delay: 260 }}>
					<span><b class="font-mono tabular text-base-content text-base">97&nbsp;%</b> <span class="text-base-content/60">точность</span></span>
					<span><b class="font-mono tabular text-base-content text-base">0</b> <span class="text-base-content/60">галлюцинаций в логах</span></span>
					<span><b class="font-mono tabular text-base-content text-base">&lt;&nbsp;1.4&nbsp;с</b> <span class="text-base-content/60">ответ</span></span>
				</div>
			</div>

			<!-- Правая композиция: блюдо + мокап диалога -->
			<div class="mt-12 md:mt-0 relative">
				<!-- Атмосферный плейт-шот -->
				<div class="border border-base-content/25 overflow-hidden" use:reveal={{ delay: 120 }}>
					<img
						src="/bg/plate.png"
						alt="Свёкольное карпаччо с козьим сыром"
						class="w-full h-64 md:h-80 object-cover"
						loading="lazy"
					/>
					<div class="px-5 py-3 bg-base-200 border-t border-base-content/20 flex items-center justify-between masthead">
						<span>№ 04 · блюдо дня</span>
						<span>Карпаччо из свёклы</span>
					</div>
				</div>

				<!-- Ambient connector — тонкая точечная линия соединяет блюдо с диалогом -->
				<div class="relative h-8 flex items-center justify-center">
					<div class="w-px h-full border-l border-dotted border-base-content/35"></div>
					<span class="absolute bg-base-100 px-2 masthead text-[9px] text-base-content/50">
						гость спрашивает
					</span>
				</div>

				<!-- Мокап диалога — прямо под блюдом, как продолжение натюрморта -->
				<div
					class="bg-base-200 border border-base-content/25"
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
			</div>
		</div>
	</div>
</section>

<!-- Chapter break · Тариф -->
<section class="relative px-6 py-24 md:py-32 border-b border-base-content/20 overflow-hidden flex flex-col justify-center">
	<div class="chapter-folio" style="top: 50%; left: 50%; transform: translate(-50%, -50%);">VII</div>
	<div class="relative text-center">
		<div class="masthead text-accent mb-4" use:reveal>Глава VI</div>
		<h2 class="font-display italic font-medium text-base-content leading-[0.9]" style="font-size: clamp(56px, 12vw, 160px); letter-spacing: -0.03em;" use:reveal={{ delay: 120 }}>
			Честный счёт.
		</h2>
		<div class="masthead mt-6" use:reveal={{ delay: 280 }}>пилот ноль — кафе девять девятьсот — сеть по разговору</div>
	</div>
</section>

<!-- Tariffs -->
<section id="tarif" class="section-rhythm relative px-6 py-20 md:py-24 border-b border-base-content/20 overflow-hidden">
	<div class="chapter-folio chapter-folio-primary" style="top: -10vh; left: -5vw;">$</div>
	<div class="relative flex items-center justify-between pb-3 border-b border-base-content masthead sticky-label" use:reveal>
		<span>Три пакета</span>
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

<!-- Contact / Pilot signup — распределён по ширине, с editor's letter -->
<section
	id="contact"
	class="section-rhythm relative px-6 py-20 md:py-24 border-b border-base-content/20 overflow-hidden"
	style="background-image: linear-gradient(rgba(242,234,218,0.94), rgba(242,234,218,0.88)), url('/bg/texture.png'); background-size: cover; background-position: center;"
>
	<div class="chapter-folio chapter-folio-accent" style="bottom: -18vh; right: -4vw;">VII</div>

	<div class="relative max-w-7xl mx-auto w-full">
		<!-- Top bar -->
		<div class="flex items-center justify-between pb-3 border-b border-base-content masthead">
			<div class="flex items-baseline gap-3">
				<span class="eyebrow">Глава VII</span>
				<span class="font-display italic text-xl md:text-2xl font-medium text-base-content">Связь</span>
			</div>
			<span>пилот · запись · письмо</span>
		</div>

		<!-- Two-column composition -->
		<div class="mt-12 md:mt-20 grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-10 md:gap-16 items-start">
			<!-- LEFT — заголовок, тариф-описание, пилот-индикатор -->
			<div>
				<h2 class="font-display italic font-medium text-base-content leading-[1.0]" style="font-size: clamp(48px, 7vw, 96px); letter-spacing: -0.03em;">
					Пилот<br />
					<span class="text-primary">начинается</span><br />
					с&nbsp;письма.
				</h2>
				<p class="font-body text-base md:text-lg text-base-content/80 mt-8 max-w-lg leading-relaxed">
					Первые три пилотных места — бесплатно. Я собираю каталог меню сам, настраиваю QR-коды, передаю ключ от кухни в Telegram.
				</p>

				<!-- Индикатор свободных пилотных мест -->
				<div class="mt-10 border border-base-content bg-base-100">
					<div class="px-5 py-3 flex items-center justify-between border-b border-base-content/25 masthead">
						<span>№ пилотных мест</span>
						<span class="text-accent flex items-center gap-1.5">
							<span class="inline-block w-1.5 h-1.5 bg-accent rounded-full pulse-dot"></span>
							{pilotsFree} из {PILOTS_TOTAL} свободно
						</span>
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
			</div>

			<!-- RIGHT — editor's letter (личное письмо от автора) -->
			<aside class="relative bg-base-100 border border-base-content p-8 md:p-10">
				<div class="flex items-center justify-between masthead pb-3 mb-6 border-b border-base-content/25">
					<span>Письмо от автора</span>
					<span class="text-accent">Kaliningrad · {today.getFullYear()}</span>
				</div>

				<p class="font-display italic text-lg md:text-xl text-base-content leading-[1.55] drop-cap">
					Я&nbsp;делаю этот продукт один. Сам пишу код, сам собираю каталог, сам отвечаю на вопросы. Поэтому первые три ресторана — бесплатно.
				</p>
				<p class="font-display italic text-base md:text-lg text-base-content/80 leading-[1.55] mt-5">
					Не пресейл, не воронка, не агентство. Работа руками с конкретным шефом и&nbsp;конкретным меню. Я отвечаю на письма в&nbsp;течение суток.
				</p>
				<p class="font-display italic text-base md:text-lg text-base-content/80 leading-[1.55] mt-5">
					Если ваше заведение в&nbsp;Калининграде — могу приехать и&nbsp;показать всё вживую.
				</p>

				<!-- Signature -->
				<div class="mt-10 pt-5 border-t border-dotted border-base-content/30 flex items-center justify-between">
					<div>
						<div class="font-display italic text-2xl md:text-3xl font-medium text-base-content leading-none">
							— К.
						</div>
						<div class="masthead mt-2">разработчик · автор · TableMind</div>
					</div>
					<div class="w-14 h-14 border border-base-content rounded-full flex items-center justify-center">
						<span class="font-display italic text-xl text-base-content leading-none">T</span>
					</div>
				</div>
			</aside>
		</div>

		<!-- Contacts — full-width band -->
		<div class="mt-14 md:mt-20 grid grid-cols-1 sm:grid-cols-2 gap-0 border-y border-base-content">
			<a href="https://t.me/tablemind" target="_blank" rel="noopener" class="group flex items-center gap-5 py-6 md:py-8 px-5 md:px-8 border-b sm:border-b-0 sm:border-r border-base-content/25 hover:bg-base-100 transition-colors">
				<span class="eyebrow tabular shrink-0">01</span>
				<div class="flex-1 min-w-0">
					<div class="font-display italic text-3xl md:text-4xl font-medium text-base-content leading-none">
						Telegram
					</div>
					<div class="font-body text-sm text-base-content/65 mt-2">
						@tablemind · обычно отвечаю за&nbsp;пару часов
					</div>
				</div>
				<span class="font-mono tabular text-xl text-accent shrink-0 group-hover:translate-x-2 transition-transform duration-300">→</span>
			</a>
			<a href="mailto:hi@tablemind.ru" class="group flex items-center gap-5 py-6 md:py-8 px-5 md:px-8 hover:bg-base-100 transition-colors">
				<span class="eyebrow tabular shrink-0">02</span>
				<div class="flex-1 min-w-0">
					<div class="font-display italic text-3xl md:text-4xl font-medium text-base-content leading-none">
						Почта
					</div>
					<div class="font-body text-sm text-base-content/65 mt-2">
						hi@tablemind.ru · до&nbsp;суток на&nbsp;ответ
					</div>
				</div>
				<span class="font-mono tabular text-xl text-accent shrink-0 group-hover:translate-x-2 transition-transform duration-300">→</span>
			</a>
		</div>

		<p class="font-display italic text-base md:text-lg text-base-content/65 mt-8 leading-relaxed max-w-3xl">
			Напишите название ресторана и&nbsp;2–3 фото меню. Я&nbsp;вернусь с&nbsp;персональным демо за&nbsp;2&nbsp;дня.
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
