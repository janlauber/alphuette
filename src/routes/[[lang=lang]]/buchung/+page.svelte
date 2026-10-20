<script lang="ts">
	import { enhance } from '$app/forms';
	import Huettli from '#lib/components/Huettli.svelte';
	import { dict } from '#lib/i18n.ts';

	let { data, form } = $props();
	const t = $derived(dict[data.lang]);
	let busy = $state(false);
</script>

<svelte:head>
	<title>{t.find.title} · Alphütte</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-lg px-4 py-16 sm:py-24">
	<Huettli mini face="wink" class="size-16 text-brand" />
	<h1 class="mt-4 text-[2.2rem] leading-tight">{t.find.title}</h1>
	{#if form?.sent}
		<p class="mt-4 rounded-[18px] bg-wash px-5 py-4 text-lg" role="status">{t.find.sent}</p>
	{:else}
		<p class="mt-3 text-lg text-muted">{t.find.intro}</p>
		<form
			method="POST"
			class="mt-6 grid gap-3"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update();
					busy = false;
				};
			}}
		>
			<label class="label" for="email">{t.find.email}</label>
			<input id="email" name="email" type="email" autocomplete="email" required value={form?.email ?? ''} aria-invalid={form?.invalid ? 'true' : undefined} class="field" />
			<button class="btn-primary mt-2 justify-self-start" disabled={busy}>{t.find.send}</button>
		</form>
	{/if}
</div>
