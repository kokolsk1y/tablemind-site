<script>
	import { onMount } from "svelte";
	import { gsap } from "gsap";
	import { ScrollTrigger } from "gsap/ScrollTrigger";
	import { reveal, parallaxBg, counter, typingSequence, horizontalScroll } from "$lib/actions.js";
	import LeadForm from "$lib/LeadForm.svelte";

	onMount(() => {
		// Защита: если GSAP/ScrollTrigger по какой-то причине не загрузился — выходим тихо,
		// контент остаётся видимым (мы убрали CSS opacity: 0 с .reveal по этой же причине).
		if (typeof gsap?.timeline !== "function" || typeof ScrollTrigger?.create !== "function") {
			console.warn("GSAP unavailable — anim disabled, content stays visible.");
			return;
		}

		try {
			ScrollTrigger.config({ ignoreMobileResize: true });
		} catch (err) {
			console.warn("ScrollTrigger.config failed:", err);
		}

		// Принудительный refresh после полной загрузки страницы — Safari иногда не считает
		// scrollHeight правильно при первом рендере.
		const refreshSafely = () => {
			try { ScrollTrigger.refresh(); } catch (err) { console.warn(err); }
		};
		if (document.readyState === "complete") {
			refreshSafely();
		} else {
			window.addEventListener("load", refreshSafely, { once: true });
		}

		const mm = gsap.matchMedia();

		mm.add("(min-width: 768px) and (hover: hover) and (pointer: fine)", () => {
			try {
				setupNumbersPin();
				setupMethodPin();
				setupPullQuotePin();
				setupTarifPin();
			} catch (err) {
				console.error("Pin setup failed, restoring visibility:", err);
				restoreVisibility();
				return;
			}

			// Safety timer: если за 3с ScrollTrigger не зарегистрировал триггеры —
			// что-то сломано, восстанавливаем все скрытые pin-элементы.
			setTimeout(() => {
				if (ScrollTrigger.getAll().length === 0) {
					console.warn("No ScrollTriggers registered — restoring visibility");
					restoreVisibility();
				}
			}, 3000);

			return () => {
				ScrollTrigger.getAll().forEach((t) => t.kill());
			};
		});
	});

	/** Восстанавливает opacity на всех элементах скрытых через gsap.set в pin-функциях */
	function restoreVisibility() {
		const selectors = [
			".numbers-header", ".numbers-stat", ".numbers-footer",
			".method-masthead", ".method-num", ".method-title", ".method-desc",
			".pq-masthead", ".pq-quote", ".pq-tagline", ".pq-fact",
			".tarif-header", ".tarif-card", ".tarif-bullet", ".tarif-breakdown", ".tarif-price"
		];
		document.querySelectorAll(selectors.join(",")).forEach((el) => {
			el.style.opacity = "";
			el.style.transform = "";
			el.style.filter = "";
		});
	}

	// ============ NUMBERS PIN — 6 цифр последовательно с паузами для чтения ============
	function setupNumbersPin() {
		const nums = document.querySelector(".numbers-pin");
		if (!nums) return;

		const stats = nums.querySelectorAll(".numbers-stat");
		const footer = nums.querySelector(".numbers-footer");
		const folio = nums.querySelector(".chapter-folio");
		const hint = nums.querySelector(".scroll-hint");

		// Header теперь НЕ скрываем — юзер сразу видит «Глава II · Цифры» и понимает где он.
		gsap.set(stats, { opacity: 0, y: 50 });
		if (footer) gsap.set(footer, { opacity: 0, y: 30 });

		// Pin-distance 220vh — без финального hold-а; pin отпускается сразу после footer.
		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: nums,
				start: "top top",
				end: "+=220%",
				pin: true,
				scrub: 1,
				anticipatePin: 1, // сглаживает старт pin (Safari)
				onLeave: () => {
					// при выходе вверх — сбрасываем накопленный transform у folio
					if (folio) gsap.set(folio, { clearProps: "transform" });
				}
			}
		});

		// Scroll-hint исчезает в самом начале — как только юзер начал скроллить.
		if (hint) tl.to(hint, { opacity: 0, duration: 0.15, ease: "power2.out" });

		// Каждый stat: появление (0.3) + hold (0.5). Триггерим counter в момент появления.
		stats.forEach((stat) => {
			tl.to(stat, {
				opacity: 1,
				y: 0,
				duration: 0.3,
				ease: "power2.out",
				onStart: () => triggerCounters(stat)
			});
			tl.to({}, { duration: 0.5 }); // hold — читаем стат и описание
		});

		if (footer) {
			tl.to(footer, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
			// Финальный hold убран — pin отпускается сразу
		}
	}

	/** Триггерим counter-анимации внутри stat-блока через custom event */
	function triggerCounters(stat) {
		const targets = stat.querySelectorAll("[data-counter-target]");
		targets.forEach((el) => {
			el.dispatchEvent(new CustomEvent("counter:start"));
		});
	}

	// ============ METHOD PIN — 4 шага с паузами на чтение каждого ============
	function setupMethodPin() {
		const method = document.querySelector(".method-pin");
		if (!method) return;

		const steps = method.querySelectorAll(".method-step");
		const folio = method.querySelector(".chapter-folio");
		const hint = method.querySelector(".scroll-hint");

		// Masthead теперь НЕ скрываем — юзер сразу видит «Четыре хода / Поток гостя».
		steps.forEach((step) => {
			const num = step.querySelector(".method-num");
			const title = step.querySelector(".method-title");
			const desc = step.querySelector(".method-desc");
			gsap.set([num, title], { opacity: 0, x: -40 });
			gsap.set(desc, { opacity: 0, y: 20 });
		});

		// Pin-distance 320vh (было 380) — финальный hold убран, pin отпускается сразу
		// после описания последнего шага.
		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: method,
				start: "top top",
				end: "+=320%",
				pin: true,
				scrub: 1,
				anticipatePin: 1,
				onLeave: () => {
					if (folio) gsap.set(folio, { clearProps: "transform" });
				}
			}
		});

		// Scroll-hint исчезает сразу как только юзер начал скроллить.
		if (hint) tl.to(hint, { opacity: 0, duration: 0.15, ease: "power2.out" });

		// Каждый шаг: римская+заголовок (0.3) → hold (0.4) → описание (0.3) → hold (0.7).
		// На последнем шаге БЕЗ финального hold — pin отпускается сразу.
		steps.forEach((step, i) => {
			const num = step.querySelector(".method-num");
			const title = step.querySelector(".method-title");
			const desc = step.querySelector(".method-desc");
			const isLast = i === steps.length - 1;

			tl.to([num, title], { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" });
			tl.to({}, { duration: 0.4 }); // hold — читаем заголовок шага
			tl.to(desc, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
			if (!isLast) {
				tl.to({}, { duration: 0.7 }); // hold — читаем описание перед следующим шагом
			}
		});
	}

	// ============ PULL QUOTE PIN — оставил как был, кайфовая референс-секция ============
	function setupPullQuotePin() {
		const pull = document.querySelector(".pull-quote-pin");
		if (!pull) return;

		const folio = pull.querySelector(".chapter-folio");
		const quote = pull.querySelector(".pq-quote");
		const tagline = pull.querySelector(".pq-tagline");
		const facts = pull.querySelectorAll(".pq-fact");
		const hint = pull.querySelector(".scroll-hint");

		// Masthead теперь НЕ скрываем — юзер сразу видит «Главное обещание».
		gsap.set(quote, { opacity: 0, y: 60 });
		gsap.set(tagline, { opacity: 0, y: 40 });
		gsap.set(facts, { opacity: 0, y: 50 });

		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: pull,
				start: "top top",
				end: "+=180%",
				pin: true,
				scrub: 1,
				anticipatePin: 1,
				onLeave: () => {
					if (folio) gsap.set(folio, { clearProps: "transform" });
				}
			}
		});

		if (folio) tl.to(folio, { yPercent: -10, ease: "none" }, 0);
		// Scroll-hint исчезает сразу как только юзер начал скроллить.
		if (hint) tl.to(hint, { opacity: 0, duration: 0.15, ease: "power2.out" }, 0);
		tl.to(quote, { opacity: 1, y: 0, ease: "power2.out", duration: 0.3 }, 0.15);
		tl.to(tagline, { opacity: 1, y: 0, duration: 0.15, ease: "power2.out" }, 0.4);

		const taglineWords = setupWordHighlightInTimeline(tagline);
		tl.to({}, {
			duration: 0.3,
			onUpdate: function () {
				const p = this.progress();
				const idx = Math.round(p * taglineWords.length);
				taglineWords.forEach((w, i) => {
					w.classList.toggle("wh-active", i < idx);
				});
			}
		}, 0.4);

		tl.to(facts, { opacity: 1, y: 0, stagger: 0.08, duration: 0.3, ease: "power2.out" }, 0.7);
	}

	// ============ TARIF PIN — преимущества → ЦЕНА → breakdown («как разложили») ============
	function setupTarifPin() {
		const tarif = document.querySelector(".tarif-pin");
		if (!tarif) return;

		const cards = tarif.querySelectorAll(".tarif-card");
		const prices = tarif.querySelectorAll(".tarif-price");
		const breakdowns = tarif.querySelectorAll(".tarif-breakdown");
		const bullets = tarif.querySelectorAll(".tarif-bullet");
		const folio = tarif.querySelector(".chapter-folio");
		const hint = tarif.querySelector(".scroll-hint");

		// Header теперь НЕ скрываем — юзер сразу видит «Глава VI · Три пакета».
		gsap.set(cards, { opacity: 0, y: 40 });
		gsap.set(bullets, { opacity: 0, y: 12 });
		gsap.set(breakdowns, { opacity: 0, y: 16 });
		gsap.set(prices, { opacity: 0, scale: 0.92 });

		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: tarif,
				start: "top top",
				end: "+=300%",
				pin: true,
				scrub: 1,
				anticipatePin: 1,
				onLeave: () => {
					if (folio) gsap.set(folio, { clearProps: "transform" });
				}
			}
		});

		// Scroll-hint исчезает сразу как только юзер начал скроллить.
		if (hint) tl.to(hint, { opacity: 0, duration: 0.15, ease: "power2.out" });

		// 3 карточки → hold чтобы рассмотреть структуру
		tl.to(cards, { opacity: 1, y: 0, stagger: 0.15, duration: 0.4, ease: "power2.out" });
		tl.to({}, { duration: 0.5 });

		// Преимущества последовательно → долгий hold для чтения списка
		tl.to(bullets, { opacity: 1, y: 0, stagger: 0.04, duration: 0.3, ease: "power2.out" });
		tl.to({}, { duration: 1.0 });

		// ЦЕНА — кульминация! После того как пользователь прочитал ВСЕ преимущества.
		tl.to(prices, { opacity: 1, scale: 1, stagger: 0.15, duration: 0.4, ease: "back.out(1.4)" });
		tl.to({}, { duration: 0.6 }); // hold чтобы осознать цену

		// Breakdown — «а вот как разложили» — после цены показываем что не с потолка
		tl.to(breakdowns, { opacity: 1, y: 0, stagger: 0.1, duration: 0.3, ease: "power2.out" });
		// Без финального hold — pin отпускается сразу
	}

	/**
	 * Разбивает текст внутри node на span'ы с классом .wh-word
	 * (тот же CSS что в actions.js wordHighlight) — но без своего scroll listener,
	 * прогресс задаётся снаружи через timeline.
	 *
	 * @param {Element|null} node
	 * @returns {HTMLElement[]}
	 */
	function setupWordHighlightInTimeline(node) {
		if (!node) return [];
		const raw = node.textContent?.trim() || "";
		const words = raw.split(/\s+/).filter(Boolean);
		node.innerHTML = "";
		/** @type {HTMLElement[]} */
		const spans = [];
		words.forEach((w, i) => {
			const span = document.createElement("span");
			span.className = "wh-word";
			if (i > 0 && i % 4 === 0) span.dataset.accent = "1";
			span.textContent = w;
			node.appendChild(span);
			spans.push(span);
			if (i < words.length - 1) node.appendChild(document.createTextNode(" "));
		});
		return spans;
	}

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
		{ who: "ai", label: "Тим", text: "Есть карпаччо из свёклы с козьим сыром — № 04, 520 ₽. Также крем из тыквы с тимьяновым маслом (№ 03)." },
		{ who: "guest", label: "ГОСТЬ", text: "А аллергены?" },
		{ who: "ai", label: "Тим", text: "В карпаччо — орехи и молочное. В крем-супе — орехи. Предупрежу кухню." },
		{ who: "guest", label: "ГОСТЬ", text: "Позови официанта" },
		{ who: "ai", label: "Тим", text: "→ Отправил Илье в Telegram. Он подойдёт через 1–2 минуты." }
	];
	let dialogueActiveIndex = $state(-1);

	function updateDialogue(i, text, complete) {
		dialogueShown[i] = text;
		dialogueActiveIndex = complete ? -1 : i;
	}

	const today = new Date();

	const method = [
		["I", "QR-меню без приложения", "Гость сканирует QR со стола — и за 2 секунды видит вашу карту. Ничего скачивать, никаких аккаунтов."],
		["II", "12 языков с голосом", "Турист читает на родном, спрашивает про состав и аллергены — голосом или текстом. AI знает меню шефа наизусть."],
		["III", "Подбирает и допродаёт", "Квиз ведёт гостя к комплексу из ваших блюд. Средний чек растёт — без работы официанта."],
		["IV", "Зовёт официанта одним тапом", "Уведомление прилетает в ваш мессенджер — Telegram, VK Max или WhatsApp — со столом и контекстом разговора."]
	];

	const tariffs = [
		{
			n: "I",
			name: "Пилот",
			price: "0",
			sub: "первые 3 ресторана · настройка руками",
			bullets: [
				"Ваше меню — настраиваю сам",
				"До 30 столов",
				"Бот для оповещений в подарок",
				"AI-токены OpenRouter оплачиваю я"
			]
		},
		{
			n: "II",
			name: "Кафе",
			price: "9 900",
			sub: "после пилота — техфи за работу сервиса",
			bullets: [
				"Меню на 12+ языках для туристов",
				"Хостинг, AI-токены, домен и SSL",
				"Обновление меню раз в 2 месяца",
				"Мониторинг аптайма и фиксы",
				"Email-поддержка до 24 ч"
			],
			breakdown: [
				["Инфраструктура и AI-токены", "5 000"],
				["Мультиязычие · 12+ языков", "2 000"],
				["Голосовой режим (Тим говорит)", "1 500"],
				["Поддержка и обновления", "1 400"]
			],
			featured: true
		},
		{
			n: "III",
			name: "Сеть",
			price: "—",
			sub: "поговорим",
			bullets: [
				"От 3 точек",
				"API и интеграции",
				"Белая метка под ваш бренд",
				"SLA и отчётность"
			]
		}
	];
</script>

<!-- Hero — single focus, full-bleed photo, cinema. Nav лежит ПОВЕРХ hero,
	фотография тянется от самого верха страницы — нет переходной линии. -->
<section
	class="hero-section section-rhythm relative px-6 pt-28 md:pt-32 pb-20 md:pb-24 overflow-hidden flex flex-col justify-end bg-base-100 min-h-screen-safe"
	style="background-image: linear-gradient(rgba(242,234,218,0.92) 0%, rgba(242,234,218,0.82) 50%, rgba(242,234,218,0.74) 100%), url('/bg/hero.webp'); background-size: cover; background-position: center;"
	use:parallaxBg={{ factor: 0.35 }}
>
	<!-- Nav — absolutely positioned поверх hero, с плашкой-фоном под колонтитулом -->
	<header class="absolute top-0 left-0 right-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-8 px-5 md:px-8 py-5 bg-base-100">
		<!-- Logo left -->
		<a href="/" class="justify-self-start flex items-center gap-3 group">
			<img
				src="/logo.png"
				alt="TableMind — QR-меню с AI"
				width="64"
				height="64"
				class="w-14 h-14 md:w-16 md:h-16 object-contain transition-transform duration-500 group-hover:scale-[1.06]"
				style="mix-blend-mode: multiply;"
			/>
			<span class="font-display italic text-xl md:text-2xl font-semibold text-base-content tracking-wide hidden sm:inline">
				TableMind
			</span>
		</a>

		<!-- Nav center — display italic, крупнее, в одном стиле с заголовками глав -->
		<nav class="hidden md:flex gap-9 lg:gap-12 justify-self-center font-display italic text-lg lg:text-xl">
			<a href="#method" class="link-underline text-base-content hover:text-accent transition-colors">Метод</a>
			<a href="#arch" class="link-underline text-base-content hover:text-accent transition-colors">Архитектура</a>
			<a href="#verifier" class="link-underline text-base-content hover:text-accent transition-colors">Верификатор</a>
			<a href="#tarif" class="link-underline text-base-content hover:text-accent transition-colors">Тариф</a>
		</nav>

		<!-- Тихая CTA — только обводка -->
		<a href="#contact" class="justify-self-end group inline-flex items-center gap-3 border-[1.5px] border-base-content text-base-content px-5 py-2.5 hover:bg-base-content hover:text-base-100 transition-all duration-300">
			<span class="font-body font-medium text-base whitespace-nowrap">Записаться</span>
			<span class="font-mono tabular text-accent transition-transform duration-300 group-hover:translate-x-1.5 shrink-0">→</span>
		</a>
	</header>
	<!-- Oversized folio numeral -->
	<div class="chapter-folio chapter-folio-primary" style="top: 4vh; right: -6vw;">I</div>

	<!-- Small top-left meta — без пульсации, чтобы не отвлекать от чтения заголовка -->
	<div class="relative flex items-center gap-3 masthead mb-auto" use:reveal>
		<span class="inline-block w-2 h-2 bg-accent rounded-full"></span>
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
				QR-меню на 12 языках с собеседником-AI на борту. Турист читает на родном, выбирает по подсказке, зовёт официанта одним касанием — уведомление прилетает в ваш мессенджер. AI учится на вашем меню — и со временем становится частью бренда.
			</p>
			<div class="hero-cta-block flex flex-wrap gap-3">
				<a
					href="#contact"
					class="btn-glow bg-primary text-primary-content font-body font-semibold text-sm py-4 px-6 hover:bg-base-content transition-colors"
				>
					Записаться на пилот
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

<!-- Numbers — на тёмной болотной подкладке, контраст. PIN на десктопе. -->
<section class="numbers-pin section-dark section-rhythm relative px-6 py-20 md:py-24 overflow-hidden min-h-screen-safe">
	<div class="chapter-folio chapter-folio-accent" style="top: -4vh; left: -4vw;">II</div>

	<div class="relative max-w-7xl mx-auto w-full">
		<div class="numbers-header flex items-center justify-between pb-3 border-b border-current/30">
			<div class="flex items-baseline gap-3">
				<span class="eyebrow">Глава II</span>
				<span class="font-display italic text-xl md:text-2xl font-medium">Цифры, которые важны</span>
			</div>
			<span class="masthead hidden sm:inline">Что проверено</span>
		</div>

		<!-- Scroll hint — виден до старта pin-таймлайна, чтобы юзер не подумал что страница не загрузилась -->
		<div class="scroll-hint hidden md:flex items-center gap-3 mt-6 masthead opacity-80">
			<span class="inline-block w-2 h-2 bg-accent rounded-full pulse-dot"></span>
			<span>скроллите вниз — цифры раскроются по очереди</span>
			<div class="flex-1 h-px bg-current/20"></div>
			<span class="font-display italic text-base opacity-70">↓</span>
		</div>

		<div class="mt-10 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-current/20">
			<!-- Stat 01 -->
			<div class="numbers-stat relative p-6 md:p-10 border-b md:border-r border-current/20">
				<div class="eyebrow">01 · языки</div>
				<div class="font-display italic text-6xl md:text-8xl font-medium mt-6 leading-none">
					<span use:counter={{ target: 12, duration: 1600, manual: true }}>0</span>
				</div>
				<div class="font-body text-sm md:text-base mt-4 opacity-80 leading-snug">
					языков читает турист и говорит голосом — авто-детект
				</div>
			</div>
			<!-- Stat 02 -->
			<div class="numbers-stat relative p-6 md:p-10 border-b md:border-r border-current/20">
				<div class="eyebrow">02 · точность</div>
				<div class="font-display italic text-6xl md:text-8xl font-medium mt-6 leading-none">
					<span use:counter={{ target: 97, duration: 1600, manual: true }}>0</span>&nbsp;<span class="text-3xl md:text-5xl align-top">%</span>
				</div>
				<div class="font-body text-sm md:text-base mt-4 opacity-80 leading-snug">
					верификатор ловит несоответствия между ответом и меню
				</div>
			</div>
			<!-- Stat 03 -->
			<div class="numbers-stat relative p-6 md:p-10 border-b border-current/20">
				<div class="eyebrow">03 · отклик</div>
				<div class="font-display italic text-6xl md:text-8xl font-medium mt-6 leading-none">
					&lt;<span use:counter={{ target: 1.4, duration: 1600, decimals: 1, manual: true }}>0.0</span>
				</div>
				<div class="font-body text-sm md:text-base mt-4 opacity-80 leading-snug">
					секунд — средний ответ AI на вопрос гостя
				</div>
			</div>
			<!-- Stat 04 -->
			<div class="numbers-stat relative p-6 md:p-10 border-b md:border-b-0 md:border-r border-current/20">
				<div class="eyebrow">04 · себестоимость</div>
				<div class="font-display italic text-6xl md:text-8xl font-medium mt-6 leading-none">
					~<span use:counter={{ target: 3, duration: 1600, manual: true }}>0</span>&nbsp;<span class="text-3xl md:text-5xl align-top">₽</span>
				</div>
				<div class="font-body text-sm md:text-base mt-4 opacity-80 leading-snug">
					стоит один полный диалог гостя с AI-официантом
				</div>
			</div>
			<!-- Stat 05 -->
			<div class="numbers-stat relative p-6 md:p-10 border-b md:border-b-0 md:border-r border-current/20">
				<div class="eyebrow">05 · пилоты</div>
				<div class="font-display italic text-6xl md:text-8xl font-medium mt-6 leading-none text-accent">
					{pilotsFree}<span class="text-3xl md:text-5xl align-top text-current">/{PILOTS_TOTAL}</span>
				</div>
				<div class="font-body text-sm md:text-base mt-4 opacity-80 leading-snug">
					свободных бесплатных мест — занимайте, пока есть
				</div>
			</div>
			<!-- Stat 06 -->
			<div class="numbers-stat relative p-6 md:p-10">
				<div class="eyebrow">06 · кейсы</div>
				<div class="font-display italic text-6xl md:text-8xl font-medium mt-6 leading-none">
					0<span class="text-3xl md:text-5xl align-top font-body not-italic font-normal opacity-60 ml-2">пока</span>
				</div>
				<div class="font-body text-sm md:text-base mt-4 opacity-80 leading-snug">
					клиентских кейсов — первых ищу сейчас
				</div>
			</div>
		</div>

		<p class="numbers-footer font-display italic text-lg md:text-xl mt-12 md:mt-16 max-w-3xl opacity-75 leading-relaxed">
			Первые три ресторана — лично, руками. Без пресейла, без агентств, без красивых слов.
		</p>
	</div>
</section>

<!-- Chapter break III · Метод -->
<section class="relative px-6 py-12 md:py-16 overflow-hidden flex flex-col justify-center">
	<div class="chapter-folio" style="top: 50%; left: 50%; transform: translate(-50%, -50%);">III</div>
	<div class="relative text-center">
		<div class="masthead text-accent mb-4" use:reveal>Глава III</div>
		<h2 class="font-display italic font-medium text-base-content leading-[0.9]" style="font-size: clamp(56px, 12vw, 160px); letter-spacing: -0.03em;" use:reveal={{ delay: 120 }}>
			Метод.
		</h2>
		<div class="masthead mt-6" use:reveal={{ delay: 280 }}>четыре хода от стола до кухни</div>
	</div>
</section>

<!-- Method — staircase layout. PIN на десктопе: 4 шага последовательно (заголовок → описание → следующий). -->
<section id="method" class="method-pin section-rhythm relative px-6 py-20 md:py-24 overflow-hidden min-h-screen-safe">
	<div class="chapter-folio" style="bottom: -20vh; right: -6vw;">IV</div>

	<div class="method-masthead relative flex items-center justify-between pb-3 border-b border-base-content masthead sticky-label">
		<span>Четыре хода</span>
		<span>Поток гостя</span>
	</div>

	<!-- Scroll hint — виден до старта pin-таймлайна -->
	<div class="scroll-hint hidden md:flex items-center gap-3 mt-6 masthead opacity-80">
		<span class="inline-block w-2 h-2 bg-accent rounded-full pulse-dot"></span>
		<span>скроллите вниз — четыре хода развернутся один за другим</span>
		<div class="flex-1 h-px bg-base-content/20"></div>
		<span class="font-display italic text-base text-base-content/70">↓</span>
	</div>

	<div class="relative grid grid-cols-1 md:grid-cols-2 gap-y-10 md:gap-y-20 gap-x-10 mt-12 md:mt-20">
		{#each method as [n, title, desc], i (n)}
			<div class="method-step relative {i % 2 === 1 ? 'md:mt-24' : ''} {i > 0 ? 'md:pl-8' : ''}">
				<div class="flex items-start gap-4 md:gap-6">
					<div class="method-num font-display italic font-medium text-accent leading-none shrink-0" style="font-size: clamp(64px, 10vw, 132px); letter-spacing: -0.04em;">
						{n}
					</div>
					<div class="pt-2 md:pt-4">
						<h3 class="method-title font-display italic text-3xl md:text-4xl font-medium text-base-content leading-[1.05]">
							{title}
						</h3>
						<p class="method-desc font-body text-[15px] md:text-base text-base-content/80 leading-relaxed mt-4 max-w-sm">
							{desc}
						</p>
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- Chapter break · Архитектура -->
<section class="section-dark relative px-6 py-12 md:py-16 overflow-hidden flex flex-col justify-center">
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
<section id="arch" class="bg-base-200">
	<div class="h-scroll-wrapper" data-horizontal-wrapper>
		<div class="h-scroll-pin">
			<!-- Header (sticky внутри pin) -->
			<div class="px-6 pt-6 pb-3 flex items-center justify-between masthead border-b border-base-content/25">
				<span>№ 03 — АРХИТЕКТУРА</span>
				<span class="hidden md:inline">Скроллите вниз — поток идёт вправо</span>
				<span class="md:hidden">Как устроено внутри</span>
			</div>

			<!-- Horizontal track -->
			<div class="h-scroll-track" use:horizontalScroll>
				{#each arch as step, i (step.roman)}
					<div class="shrink-0 w-[85vw] md:w-[38vw] lg:w-[28vw] relative">
						<div class="border border-base-content/30 bg-base-100 p-6 md:p-8 h-full flex flex-col gap-5 md:gap-8 overflow-hidden">
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
									<div class="font-display italic text-2xl md:text-3xl lg:text-4xl font-medium text-base-content leading-[1.05] break-words hyphens-auto">
										{step.label}
									</div>
									<div class="font-body text-[13px] text-base-content/65 mt-2">
										{step.desc}
									</div>
								</div>
							</div>

							<!-- Descriptive copy per step -->
							<div class="font-body text-[15px] md:text-base text-base-content/85 leading-relaxed">
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
						<a href="#contact" class="btn-glow bg-accent text-accent-content font-body font-semibold text-sm py-4 px-5 mt-6 self-start">
							Записаться на пилот
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

<!-- Pull quote — full-screen cinema moment. PIN на десктопе. -->
<section class="pull-quote-pin section-rhythm relative px-6 py-20 md:py-32 overflow-hidden flex flex-col justify-center min-h-screen-safe">
	<div class="chapter-folio chapter-folio-primary" style="top: -12vh; right: -8vw;">VI</div>

	<div class="relative max-w-7xl mx-auto w-full">
		<div class="pq-masthead masthead mb-6 md:mb-8">
			Главное обещание
		</div>

		<!-- Scroll hint — виден до старта pin-таймлайна -->
		<div class="scroll-hint hidden md:flex items-center gap-3 mb-6 masthead opacity-80">
			<span class="inline-block w-2 h-2 bg-accent rounded-full pulse-dot"></span>
			<span>скроллите вниз — обещание раскрывается</span>
			<div class="flex-1 h-px bg-base-content/20"></div>
			<span class="font-display italic text-base text-base-content/70">↓</span>
		</div>

		<blockquote class="pq-quote font-display italic font-medium text-base-content leading-[0.95] max-w-6xl" style="font-size: clamp(44px, 8.5vw, 120px); letter-spacing: -0.03em;">
			<span class="text-accent">«</span>Всё, что скажет AI,<br />
			уже&nbsp;<span class="text-primary">в&nbsp;вашем меню.</span><span class="text-accent">»</span>
		</blockquote>

		<div class="pq-tagline mt-10 md:mt-14 font-display italic text-base md:text-xl max-w-2xl leading-relaxed">
			Ни одного выдуманного блюда. Ни одного несуществующего ингредиента. Ни одного ответа без сверки с картой шефа.
		</div>

		<!-- 3 факт-подпорки: раскрывают обещание конкретикой -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-0 mt-14 md:mt-20 border-y border-base-content/25">
			<div class="pq-fact p-6 md:p-8 border-b md:border-b-0 md:border-r border-base-content/25">
				<div class="font-mono tabular text-[11px] text-accent tracking-[0.2em]">01 · источник</div>
				<div class="font-display italic text-2xl md:text-3xl font-medium text-base-content mt-3 leading-tight">
					Из меню шефа
				</div>
				<div class="font-body text-sm text-base-content/70 mt-3 leading-snug">
					AI читает только ваш JSON-каталог. Если блюда нет в карте — его нет и в ответе.
				</div>
			</div>
			<div class="pq-fact p-6 md:p-8 border-b md:border-b-0 md:border-r border-base-content/25">
				<div class="font-mono tabular text-[11px] text-accent tracking-[0.2em]">02 · сверка</div>
				<div class="font-display italic text-2xl md:text-3xl font-medium text-base-content mt-3 leading-tight">
					97&nbsp;% точность
				</div>
				<div class="font-body text-sm text-base-content/70 mt-3 leading-snug">
					Отдельная модель-верификатор проверяет состав, аллергены и цены перед каждой отправкой гостю.
				</div>
			</div>
			<div class="pq-fact p-6 md:p-8">
				<div class="font-mono tabular text-[11px] text-accent tracking-[0.2em]">03 · скорость</div>
				<div class="font-display italic text-2xl md:text-3xl font-medium text-base-content mt-3 leading-tight">
					1,4&nbsp;секунды
				</div>
				<div class="font-body text-sm text-base-content/70 mt-3 leading-snug">
					Средний ответ — быстрее, чем гость дочитает описание блюда в меню.
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Verifier / Dialogue — натюрморт «блюдо + разговор о нём» -->
<section id="verifier" class="section-rhythm relative px-6 py-20 md:py-24 overflow-hidden bg-base-200">
	<div class="chapter-folio" style="bottom: -12vh; left: -4vw;">VI</div>
	<div class="relative max-w-7xl mx-auto w-full">
		<!-- Top bar -->
		<div class="flex items-center justify-between pb-3 border-b border-base-content masthead mb-12 md:mb-16" use:reveal>
			<div class="flex items-baseline gap-3">
				<span class="eyebrow">Глава V</span>
				<span class="font-display italic text-xl md:text-2xl font-medium text-base-content">Главное</span>
			</div>
			<span>Голос · верификатор · диалог</span>
		</div>

		<!-- Левая текстовая часть -->
		<div class="md:grid md:grid-cols-[1fr_1.4fr] md:gap-16 md:items-start">
			<div class="md:sticky md:top-20">
				<div class="eyebrow mb-4" use:reveal>№ 03 · суть продукта</div>
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
						src="/bg/plate.webp"
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
<section class="relative px-6 py-12 md:py-16 overflow-hidden flex flex-col justify-center">
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
<section id="tarif" class="tarif-pin section-rhythm relative px-6 py-20 md:py-24 overflow-hidden min-h-screen-safe">
	<div class="chapter-folio chapter-folio-primary" style="top: -10vh; left: -5vw;">$</div>

	<div class="relative max-w-5xl mx-auto w-full">
		<div class="tarif-header flex items-center justify-between pb-3 border-b border-base-content masthead">
			<div class="flex items-baseline gap-3">
				<span class="eyebrow">Глава VI</span>
				<span class="font-display italic text-xl md:text-2xl font-medium text-base-content">Три пакета</span>
			</div>
			<span>₽ / месяц</span>
		</div>

		<!-- Scroll hint — виден до старта pin-таймлайна -->
		<div class="scroll-hint hidden md:flex items-center gap-3 mt-6 masthead opacity-80">
			<span class="inline-block w-2 h-2 bg-accent rounded-full pulse-dot"></span>
			<span>скроллите вниз — три тарифа развернутся с разбивкой по цене</span>
			<div class="flex-1 h-px bg-base-content/20"></div>
			<span class="font-display italic text-base text-base-content/70">↓</span>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-0 mt-10 md:mt-14 border border-base-content/25">
			{#each tariffs as p (p.n)}
				<div class="tarif-card relative p-7 md:p-8 border-b md:border-b-0 md:border-r border-base-content/20 last:border-b-0 md:last:border-r-0 transition-all duration-500 hover:bg-base-100 group overflow-hidden">
					<!-- Верхняя линия-акцент появляется плавно при hover — равноправно для всех -->
					<div class="absolute top-0 left-0 right-0 h-[3px] bg-accent transition-transform duration-500 scale-x-0 group-hover:scale-x-100" style="transform-origin: left center;"></div>

					<div class="font-mono tabular text-[11px] text-accent tracking-[0.2em]">№ {p.n}</div>
					<div class="font-display italic text-3xl md:text-4xl font-medium text-base-content mt-2 transition-transform duration-500 group-hover:translate-x-1">{p.name}</div>
					<div class="font-display italic text-sm text-base-content/70 mt-2 leading-snug min-h-[2.6em]">{p.sub}</div>

					<div class="tarif-price flex items-baseline gap-1.5 mt-6">
						<div class="font-mono tabular text-[44px] md:text-[52px] font-medium text-base-content leading-none">{p.price}</div>
						{#if p.price !== "—" && p.price !== "0"}
							<div class="font-body text-[13px] text-base-content/60">₽ / мес</div>
						{/if}
					</div>

					<div class="border-t border-dotted border-base-content/30 my-5 md:my-6"></div>

					{#each p.bullets as b (b)}
						<div class="tarif-bullet flex gap-2.5 py-1.5 text-sm md:text-[15px] text-base-content/85 leading-snug">
							<span class="font-mono text-accent text-[11px] pt-1 shrink-0">·</span>
							<span>{b}</span>
						</div>
					{/each}

					{#if p.breakdown}
						<div class="tarif-breakdown mt-6 pt-5 border-t border-dotted border-base-content/30">
							<div class="font-mono tabular text-[10px] text-base-content/50 tracking-[0.18em] mb-3">
								ИЗ ЧЕГО СКЛАДЫВАЕТСЯ
							</div>
							{#each p.breakdown as [label, amount] (label)}
								<div class="flex items-baseline justify-between gap-3 py-1 text-[13px] text-base-content/75 leading-snug">
									<span>{label}</span>
									<span class="font-mono tabular text-base-content/90 whitespace-nowrap">{amount} ₽</span>
								</div>
							{/each}
							<div class="flex items-baseline justify-between gap-3 pt-2 mt-2 border-t border-base-content/20 text-[13px] font-medium">
								<span class="text-base-content">Итого</span>
								<span class="font-mono tabular text-base-content whitespace-nowrap">9 900 ₽</span>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Contact / Pilot signup — распределён по ширине, с editor's letter -->
<section
	id="contact"
	class="section-rhythm relative px-6 py-20 md:py-24 overflow-hidden"
	style="background-image: linear-gradient(rgba(242,234,218,0.94), rgba(242,234,218,0.88)), url('/bg/texture.webp'); background-size: cover; background-position: center;"
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

		<!-- Two-column composition: LEFT = заголовок + пилот-индикатор, RIGHT = форма заявки -->
		<div class="mt-12 md:mt-20 grid grid-cols-1 md:grid-cols-[1fr_1.05fr] gap-10 md:gap-12 items-start">
			<!-- LEFT — заголовок, описание, пилот-индикатор -->
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

			<!-- RIGHT — форма заявки на пилот -->
			<div>
				<LeadForm />
			</div>
		</div>

		<!-- Editor's letter — full-width band под формой -->
		<aside class="relative bg-base-100 border border-base-content p-8 md:p-10 mt-14 md:mt-20">
			<div class="flex items-center justify-between masthead pb-3 mb-6 border-b border-base-content/25">
				<span>Письмо от автора</span>
				<span class="text-accent">Калининград · {today.getFullYear()}</span>
			</div>

			<div class="md:grid md:grid-cols-[1fr_auto] md:gap-10 md:items-end">
				<div>
					<p class="font-display italic text-lg md:text-xl text-base-content leading-[1.55] drop-cap">
						Я&nbsp;делаю этот продукт один. Сам пишу код, сам собираю каталог, сам отвечаю на вопросы. Поэтому первые три ресторана — бесплатно.
					</p>
					<p class="font-display italic text-base md:text-lg text-base-content/80 leading-[1.55] mt-5">
						Не пресейл, не воронка, не агентство. Работа руками с конкретным шефом и&nbsp;конкретным меню. Я отвечаю на письма в&nbsp;течение суток. Если ваше заведение в&nbsp;Калининграде — могу приехать и&nbsp;показать всё вживую.
					</p>

					<!-- Signature -->
					<div class="mt-10 pt-5 border-t border-dotted border-base-content/30 flex items-end justify-between">
						<div>
							<div class="font-display italic text-2xl md:text-3xl font-medium text-base-content leading-none">
								— К.
							</div>
							<div class="masthead mt-2">разработчик · автор · TableMind</div>
						</div>
					</div>
				</div>
				<img
					src="/logo.png"
					alt="TableMind"
					width="120"
					height="120"
					class="hidden md:block w-28 h-28 object-contain self-start"
					style="mix-blend-mode: multiply;"
					loading="lazy"
				/>
			</div>
		</aside>

		<!-- Contacts — full-width band: альтернативные каналы -->
		<div class="mt-12 md:mt-16">
			<div class="masthead mb-3">или напрямую</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-0 border-y border-base-content">
			<a href="https://t.me/tablemind_orders_bot" target="_blank" rel="noopener" class="group flex items-center gap-5 py-6 md:py-8 px-5 md:px-8 border-b sm:border-b-0 sm:border-r border-base-content/25 hover:bg-base-100 transition-colors">
				<span class="eyebrow tabular shrink-0">01</span>
				<div class="flex-1 min-w-0">
					<div class="font-display italic text-3xl md:text-4xl font-medium text-base-content leading-none">
						Telegram
					</div>
					<div class="font-body text-sm text-base-content/65 mt-2">
						@tablemind_orders_bot · бот соберёт заявку и передаст мне
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
		</div>
	</div>
</section>

<!-- Footer -->
<footer class="px-6 py-12 bg-primary text-primary-content">
	<div class="max-w-7xl mx-auto w-full">
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-8">
			<div class="flex items-center gap-4">
				<div class="w-14 h-14 bg-base-100 rounded-full flex items-center justify-center shrink-0">
					<img
						src="/logo.png"
						alt="TableMind"
						width="56"
						height="56"
						class="w-full h-full object-contain"
						style="mix-blend-mode: multiply;"
						loading="lazy"
					/>
				</div>
				<span class="font-display italic text-2xl md:text-3xl font-semibold tracking-wide">TableMind</span>
			</div>
			<div class="flex flex-col sm:flex-row gap-6 md:gap-10 masthead opacity-90" style="color: inherit">
				<a href="https://t.me/tablemind_orders_bot" target="_blank" rel="noopener" class="link-underline">
					Telegram · @tablemind_orders_bot
				</a>
				<a href="mailto:hi@tablemind.ru" class="link-underline">
					Почта · hi@tablemind.ru
				</a>
			</div>
		</div>
		<div class="mt-10 pt-5 border-t border-primary-content/25 flex flex-col sm:flex-row justify-between gap-3 masthead opacity-55" style="color: inherit">
			<span>© {today.getFullYear()} · TableMind</span>
			<span>сделано в Калининграде</span>
		</div>
	</div>
</footer>
