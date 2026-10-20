<script lang="ts">
	import { page } from '$app/state';

	const en = $derived(page.url.pathname.startsWith('/en'));
</script>

<div class="mx-auto max-w-xl px-4 py-24 sm:px-6">
	<p class="text-stein">{page.status}</p>
	<h1 class="mt-2 text-4xl">
		{#if page.status === 404}{en ? 'This page does not exist.' : 'Diese Seite gibt es nicht.'}{:else}{en ? 'Something went wrong.' : 'Da ist etwas schiefgegangen.'}{/if}
	</h1>
	<a href={en ? '/en' : '/'} class="btn-line mt-8">{en ? 'To the hut' : 'Zum Hüttli'}</a>
</div>
