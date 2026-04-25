// Svelte actions для интерактива сайта.
// reveal/wordHighlight используют GSAP ScrollTrigger для центр-симметричного
// scrub'а — блоки плавно появляются и откатываются вокруг центра viewport.
// parallaxBg/counter/typingSequence/horizontalScroll используют IntersectionObserver.

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
	gsap.registerPlugin(ScrollTrigger);
}

/**
 * Scroll-reveal: блок плавно появляется когда подходит к центру viewport,
 * и откатывается обратно при скролле вверх. Симметричная подача вокруг центра.
 *
 * Прогресс через ScrollTrigger scrub:
 *   start: top 85%   — блок только-только показался снизу (opacity 0)
 *   end:   top 45%   — блок прошёл ~центр viewport (opacity 1, остаётся)
 *
 * Ниже end — блок уже виден на 100% и остаётся видимым (не гаснет когда уходит наверх).
 * Выше start — блок невидим. Между ними — scrub-плавный переход.
 *
 * options:
 *   delay  — staggered-задержка для последовательных блоков (ms)
 *   fromY  — стартовый offset по Y в px (default 32)
 */
export function reveal(node, options = {}) {
	const { delay = 0, fromY = 32 } = options;
	node.classList.add("reveal");

	// delay сдвигает только startTrigger — block появляется чуть позже соседей.
	// Каждые 100ms задержки = +3% сверху на старте (соседи появляются веером).
	const startOffset = Math.min(12, Math.max(0, delay / 100) * 3);
	const startPct = 85 + startOffset;

	const tween = gsap.fromTo(
		node,
		{ opacity: 0, y: fromY },
		{
			opacity: 1,
			y: 0,
			ease: "power2.out",
			scrollTrigger: {
				trigger: node,
				start: `top ${startPct}%`,
				end: "top 45%",
				scrub: 0.6
			}
		}
	);

	return {
		destroy() {
			tween.scrollTrigger?.kill();
			tween.kill();
		}
	};
}

/**
 * Параллакс для background-image элемента — двигает фон чуть медленнее скролла.
 * factor < 1 — замедление, typically 0.3-0.6.
 */
export function parallaxBg(node, options = {}) {
	const { factor = 0.4 } = options;

	function onScroll() {
		const rect = node.getBoundingClientRect();
		const viewportH = window.innerHeight;
		// пересечение элемента с viewport (-H…+H)
		const progress = (rect.top - viewportH) / -viewportH;
		const shift = Math.max(-40, Math.min(40, progress * factor * 80));
		node.style.backgroundPositionY = `calc(50% + ${shift}px)`;
	}

	onScroll();
	window.addEventListener("scroll", onScroll, { passive: true });
	window.addEventListener("resize", onScroll);

	return {
		destroy() {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
		}
	};
}

/**
 * Счётчик: анимирует числовое значение от 0 до target.
 *
 * Запуск:
 * 1) Через IntersectionObserver (default) — стартует когда node появляется в viewport.
 * 2) Через custom event 'counter:start' — для интеграции с GSAP timeline:
 *    `el.dispatchEvent(new CustomEvent('counter:start'))`. В этом случае установите
 *    `manual: true` чтобы IntersectionObserver не дублировал старт.
 *
 * Маркируем node атрибутом data-counter-target для удобного querySelectorAll.
 */
export function counter(node, options = {}) {
	const {
		target = 0,
		duration = 1500,
		onTick,
		formatter = (v) => Math.round(v).toString(),
		decimals = 0,
		manual = false
	} = options;

	node.setAttribute("data-counter-target", String(target));

	let started = false;

	function animate() {
		if (started) return;
		started = true;
		const start = performance.now();
		function tick(now) {
			const t = Math.min(1, (now - start) / duration);
			const eased = 1 - Math.pow(1 - t, 3);
			const val = target * eased;
			const display = decimals > 0 ? val.toFixed(decimals) : formatter(val);
			node.textContent = display;
			if (t < 1) requestAnimationFrame(tick);
			else if (onTick) onTick(target);
		}
		requestAnimationFrame(tick);
	}

	function onManualStart() {
		animate();
	}
	node.addEventListener("counter:start", onManualStart);

	let obs = null;
	if (!manual) {
		obs = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) {
						animate();
						obs?.unobserve(node);
					}
				});
			},
			{ threshold: 0.5 }
		);
		obs.observe(node);
	}

	return {
		destroy() {
			obs?.disconnect();
			node.removeEventListener("counter:start", onManualStart);
		}
	};
}

/**
 * Typing-эффект для диалога: раскрывает массив сообщений по очереди с задержкой.
 * callback — setter для external state.
 */
export function typingSequence(node, options = {}) {
	const { messages = [], delayBetween = 700, charDelay = 15, onUpdate } = options;
	let cancelled = false;

	async function run() {
		// Wait for viewport
		await new Promise((resolve) => {
			const obs = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting) {
					obs.disconnect();
					resolve();
				}
			}, { threshold: 0.2 });
			obs.observe(node);
		});

		for (let i = 0; i < messages.length; i++) {
			if (cancelled) return;
			const msg = messages[i];
			// Typing character by character
			for (let c = 0; c <= msg.text.length; c++) {
				if (cancelled) return;
				if (onUpdate) onUpdate(i, msg.text.slice(0, c));
				await wait(charDelay);
			}
			if (onUpdate) onUpdate(i, msg.text, true); // complete
			await wait(delayBetween);
		}
	}

	run();

	return {
		destroy() {
			cancelled = true;
		}
	};
}

function wait(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

/**
 * Pinned horizontal scroll — Apple/Stripe pattern.
 * Контейнер-родитель остаётся тянуться (height 300-400vh), внутренняя
 * sticky-секция прибита к viewport, а её содержимое едет translateX
 * пропорционально прогрессу скролла по родителю.
 *
 * Usage: <div.wrapper><div.pin><div use:horizontalScroll>...</div></div></div>
 */
export function horizontalScroll(node, options = {}) {
	const { easing = (t) => t } = options;

	function getWrapper() {
		// Ищем ближайшего родителя с data-horizontal-wrapper
		let el = node;
		while (el && el.parentElement) {
			el = el.parentElement;
			if (el.dataset?.horizontalWrapper !== undefined) return el;
		}
		return null;
	}

	const wrapper = getWrapper();
	if (!wrapper) return { destroy() {} };

	function onScroll() {
		const rect = wrapper.getBoundingClientRect();
		const range = wrapper.offsetHeight - window.innerHeight;
		if (range <= 0) return;
		const raw = -rect.top / range;
		const progress = Math.max(0, Math.min(1, raw));
		const eased = easing(progress);
		const maxShift = Math.max(0, node.scrollWidth - window.innerWidth + 48);
		node.style.transform = `translate3d(${-eased * maxShift}px, 0, 0)`;

		// Пробрасываем progress вниз через CSS-переменную для child-анимаций
		node.style.setProperty("--scroll-progress", String(eased));
		wrapper.style.setProperty("--scroll-progress", String(eased));
	}

	onScroll();
	const throttled = () => requestAnimationFrame(onScroll);
	window.addEventListener("scroll", throttled, { passive: true });
	window.addEventListener("resize", throttled);

	return {
		destroy() {
			window.removeEventListener("scroll", throttled);
			window.removeEventListener("resize", throttled);
		}
	};
}

/**
 * Word Highlight on Scroll — текст «печатается жирным» по мере скролла.
 * Прогресс привязан к ЦЕНТРУ параграфа относительно ЦЕНТРА viewport — именно туда
 * смотрит пользователь. Когда центр параграфа достигает центра экрана — все слова
 * подсвечены. Когда параграф уехал выше центра — остаётся подсвеченным (по умолчанию
 * текст не «разжиривается» обратно — это было бы шумом на информативном сайте).
 *
 * options:
 *   accentEvery — каждое N-е слово красится в --color-accent (default 4, 0/false — выкл.)
 *   reverse — true → слова гаснут обратно при скролле вверх (default false: один раз и остаётся)
 */
export function wordHighlight(node, options = {}) {
	const { accentEvery = 4, reverse = false } = options;

	const raw = node.textContent?.trim() || "";
	const words = raw.split(/\s+/).filter(Boolean);
	node.innerHTML = "";
	/** @type {HTMLElement[]} */
	const spans = [];
	words.forEach((w, i) => {
		const span = document.createElement("span");
		span.className = "wh-word";
		if (accentEvery && i > 0 && i % accentEvery === 0) {
			span.dataset.accent = "1";
		}
		span.textContent = w;
		node.appendChild(span);
		spans.push(span);
		if (i < words.length - 1) node.appendChild(document.createTextNode(" "));
	});

	let visible = false;
	let maxProgress = 0; // запоминаем достигнутый максимум — для не-реверсивного режима
	const obs = new IntersectionObserver(
		([e]) => {
			visible = e.isIntersecting;
		},
		{ threshold: 0, rootMargin: "200px 0px 200px 0px" }
	);
	obs.observe(node);

	let raf = 0;
	function onScroll() {
		if (!visible) return;
		const rect = node.getBoundingClientRect();
		const vh = window.innerHeight;
		const mid = rect.top + rect.height / 2;
		// 0 когда центр параграфа = низ viewport (vh)
		// 1 когда центр параграфа = центр viewport (vh/2)
		// Дальше (mid < vh/2) — clamp 1
		const range = vh / 2;
		const raw = (vh - mid) / range;
		const progress = Math.max(0, Math.min(1, raw));

		const effective = reverse ? progress : Math.max(progress, maxProgress);
		if (!reverse) maxProgress = effective;

		const activeIndex = Math.round(effective * spans.length);
		spans.forEach((s, i) => {
			s.classList.toggle("wh-active", i < activeIndex);
		});
	}

	function tick() {
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(onScroll);
	}

	onScroll();
	window.addEventListener("scroll", tick, { passive: true });
	window.addEventListener("resize", tick);

	return {
		destroy() {
			obs.disconnect();
			cancelAnimationFrame(raf);
			window.removeEventListener("scroll", tick);
			window.removeEventListener("resize", tick);
		}
	};
}

/**
 * Scroll-progress bar: привязывается к <div> и обновляет width 0-100% по вертикальному скроллу.
 */
export function scrollProgress(node) {
	function onScroll() {
		const h = document.documentElement;
		const scrolled = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
		node.style.width = `${Math.min(100, Math.max(0, scrolled * 100))}%`;
	}

	onScroll();
	window.addEventListener("scroll", onScroll, { passive: true });
	window.addEventListener("resize", onScroll);

	return {
		destroy() {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
		}
	};
}
