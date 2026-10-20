<script lang="ts">
	import { page } from '$app/state';
	import Huettli from './Huettli.svelte';

	const en = $derived(page.url.pathname.startsWith('/en'));
	const missing = $derived(page.status === 404);
</script>

<div class="mx-auto flex max-w-xl flex-col items-center px-5 py-16 text-center sm:px-6">
	<Huettli face="sleep" pose="stand" animate class="w-40 text-brand" />
	<p class="pill mt-6 text-sm">{page.status}</p>
	<h1 class="mt-4 text-[2.6rem]">
		{#if missing}{en ? 'This page does not exist.' : 'Diese Seite gibt es nicht.'}{:else}{en ? 'Something went wrong.' : 'Da ist etwas schiefgegangen.'}{/if}
	</h1>
	<p class="mt-3 text-muted">
		{#if missing}{en ? 'The Hüttli is having a nap. The way back is right here:' : 'Das Hüttli macht ein Nickerchen. Der Weg zurück ist gleich hier:'}{:else}{en ? 'Try again in a moment.' : 'Versuch es gleich nochmals.'}{/if}
	</p>
	<a href={en ? '/en' : '/'} class="btn-primary mt-8">{en ? 'To the hut' : 'Zum Hüttli'}</a>
</div>
