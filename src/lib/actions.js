// Svelte actions для интерактива сайта.
// Все используют IntersectionObserver + CSS transitions — никаких тяжёлых зависимостей.

/**
 * Scroll-reveal: добавляет класс .revealed когда элемент попадает в viewport.
 * Параметр delay (ms) — staggered-задержка перед появлением.
 */
export function reveal(node, options = {}) {
	const { delay = 0, threshold = 0.15 } = options;
	node.classList.add("reveal");
	if (delay) node.style.transitionDelay = `${delay}ms`;

	const obs = new IntersectionObserver(
		(entries) => {
			entries.forEach((e) => {
				if (e.isIntersecting) {
					node.classList.add("revealed");
					obs.unobserve(node);
				}
			});
		},
		{ threshold, rootMargin: "0px 0px -60px 0px" }
	);
	obs.observe(node);

	return {
		destroy() {
			obs.disconnect();
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
 * Счётчик: анимирует числовое значение от 0 до target при появлении в viewport.
 * Передаётся через callback onTick, т.к. Svelte-state меняется снаружи.
 * formatter — опциональная функция форматирования.
 */
export function counter(node, options = {}) {
	const {
		target = 0,
		duration = 1500,
		onTick,
		formatter = (v) => Math.round(v).toString(),
		decimals = 0
	} = options;

	let started = false;

	function animate() {
		if (started) return;
		started = true;
		const start = performance.now();
		function tick(now) {
			const t = Math.min(1, (now - start) / duration);
			// ease-out cubic
			const eased = 1 - Math.pow(1 - t, 3);
			const val = target * eased;
			const display = decimals > 0
				? val.toFixed(decimals)
				: formatter(val);
			node.textContent = display;
			if (t < 1) requestAnimationFrame(tick);
			else if (onTick) onTick(target);
		}
		requestAnimationFrame(tick);
	}

	const obs = new IntersectionObserver(
		(entries) => {
			entries.forEach((e) => {
				if (e.isIntersecting) {
					animate();
					obs.unobserve(node);
				}
			});
		},
		{ threshold: 0.5 }
	);
	obs.observe(node);

	return {
		destroy() {
			obs.disconnect();
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
