<script lang="ts">
	let { form } = $props();
</script>

<div class="mx-auto max-w-sm px-4 py-24">
	<h1 class="text-3xl">Anmelden</h1>
	{#if form?.sent}
		<p class="mt-4">Wenn die Adresse berechtigt ist, kommt gleich eine Mail mit dem Login-Link. Er gilt 20 Minuten.</p>
	{:else}
		<p class="mt-2 text-stein">Du bekommst einen Link per Mail, ein Passwort brauchst du nicht.</p>
		<form method="POST" class="mt-6 grid gap-3">
			<label class="label" for="email">E-Mail</label>
			<input id="email" name="email" type="email" autocomplete="email" required class="field" />
			{#if form?.error}<p class="text-rot" role="alert">{form.error}</p>{/if}
			<button class="btn-gelb mt-2">Login-Link senden</button>
		</form>
	{/if}
</div>
