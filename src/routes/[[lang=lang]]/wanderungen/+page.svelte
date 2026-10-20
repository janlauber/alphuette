<script lang="ts">
	import HikeCard from '#lib/components/HikeCard.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { dict } from '#lib/i18n.ts';

	let { data } = $props();
	const t = $derived(dict[data.lang]);
</script>

<Seo
	title={data.lang === 'en' ? 'Hiking in the Kiental: routes with elevation profiles' : 'Wandern im Kiental: Routen mit Höhenprofil'}
	description={data.lang === 'en'
		? 'Hikes from Griesalp and Kiental: Pochten falls, Tschingelsee, Gamchi, Hohtürli. With walking time, length and elevation profile.'
		: 'Wanderungen ab Griesalp und Kiental: Pochtenfall, Tschingelsee, Gamchi, Hohtürli. Mit Gehzeit, Länge und Höhenprofil.'}
	path="/wanderungen"
	lang={data.lang}
	siteUrl={data.siteUrl}
/>

<div class="mx-auto max-w-6xl px-5 pt-8 sm:px-6">
	<h1 class="text-[2.2rem] sm:text-[3rem]">{t.hikes.title}</h1>
	<p class="mt-2 max-w-[58ch] text-muted">{t.hikes.intro}</p>
	<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.hikes as hike (hike.slug)}
			<HikeCard {hike} lang={data.lang} />
		{/each}
	</div>
</div>
