<script>
	import "../app.css";
	import { scrollProgress } from "$lib/actions.js";

	let { children } = $props();
</script>

<svelte:head>
	<title>TableMind — AI-официант для ресторанов</title>
</svelte:head>

<!-- Scroll progress — тонкая охровая полоса сверху -->
<div class="fixed top-0 left-0 right-0 h-[2px] bg-transparent z-[100] pointer-events-none">
	<div class="h-full bg-accent" style="width: 0%" use:scrollProgress></div>
</div>

<div class="min-h-screen bg-base-100 text-base-content font-body">
	{@render children()}
</div>
