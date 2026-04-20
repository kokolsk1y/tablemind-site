<script>
	import "../app.css";

	let { children } = $props();
</script>

<svelte:head>
	<title>TableMind — AI-официант для ресторанов</title>
</svelte:head>

<div class="min-h-screen bg-base-100 text-base-content font-body">
	{@render children()}
</div>
