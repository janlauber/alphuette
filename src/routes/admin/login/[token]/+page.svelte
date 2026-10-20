<script lang="ts">
	let { form } = $props();
</script>

<div class="mx-auto max-w-sm px-4 py-24">
	<h1 class="text-3xl">Anmelden</h1>
	{#if form?.error}
		<p class="mt-4 text-rot" role="alert">Der Link ist abgelaufen oder wurde schon benutzt.</p>
		<a href="/admin/login" class="btn-line mt-6">Neuen Link anfordern</a>
	{:else}
		<form method="POST" class="mt-6"><button class="btn-gelb w-full">Jetzt anmelden</button></form>
	{/if}
</div>
