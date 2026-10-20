<script lang="ts">
	import ShoppingBasket from '@lucide/svelte/icons/shopping-basket';
	import Ticket from '@lucide/svelte/icons/ticket';
	import Utensils from '@lucide/svelte/icons/utensils';
	import Info from '@lucide/svelte/icons/info';
	import Departures from '#lib/components/Departures.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import Weather from '#lib/components/Weather.svelte';
	import { dict, localize } from '#lib/i18n.ts';
	import { textToHtml } from '#lib/text.ts';

	let { data } = $props();
	const t = $derived(dict[data.lang]);
	const en = $derived(data.lang === 'en');

	// "Einkaufen: …" paragraphs become cards with a matching icon.
	const cards = $derived(
		data.area.split(/\n\s*\n/).map((p) => {
			const m = p.match(/^([^:]{2,40}):\s*([\s\S]*)$/);
			const label = m?.[1] ?? '';
			const icon = /einkauf|shop/i.test(label) ? ShoppingBasket : /essen|eat/i.test(label) ? Utensils : /karte|card/i.test(label) ? Ticket : Info;
			return { label, html: textToHtml(m?.[2] ?? p), icon };
		})
	);
</script>

<Seo
	title={en ? 'Around the hut: shops, restaurants, weather and buses in the Kiental' : 'Rund ums Hüttli: Einkaufen, Restaurants, Wetter und Postauto im Kiental'}
	description={en ? 'Village shop, restaurants, guest card with free public transport, weather forecast and the next buses to the hut.' : 'Dorfladen, Restaurants, Gästekarte mit Gratis-ÖV, Wetterprognose und die nächsten Postautos zum Hüttli.'}
	path="/umgebung"
	lang={data.lang}
	siteUrl={data.siteUrl}
/>

<div class="mx-auto max-w-6xl px-5 pt-8 sm:px-6">
	<h1 class="text-[2.2rem] sm:text-[3rem]">{en ? 'Around the hut' : 'Rund ums Hüttli'}</h1>
	<p class="mt-2 max-w-[58ch] text-muted">
		{en ? 'The Kiental is a quiet side valley of the Kandertal. Here is what you need nearby.' : 'Das Kiental ist ein ruhiges Seitental des Kandertals. Das findest du in der Nähe.'}
	</p>

	<div class="mt-8 grid gap-4 md:grid-cols-3">
		{#each cards as c, i (i)}
			<section class="card p-5">
				<span class="grid size-11 place-items-center rounded-full bg-sand text-fir"><c.icon size={22} strokeWidth={1.75} aria-hidden="true" /></span>
				{#if c.label}<h2 class="mt-3 text-[1.4rem]">{c.label}</h2>{/if}
				<div class="richtext mt-2">{@html c.html}</div>
			</section>
		{/each}
	</div>

	{#await data.weather then weather}
		{#if weather?.length}
			<section class="mt-12">
				<h2 class="text-[1.65rem]">{t.sections.weather}</h2>
				<div class="mt-4"><Weather days={weather} lang={data.lang} /></div>
			</section>
		{/if}
	{/await}

	<section class="mt-12">
		<h2 class="text-[1.65rem]">{t.sections.transit}</h2>
		<div class="mt-4 grid gap-4 md:grid-cols-2">
			{#await data.toHut then list}
				{#if list}<div class="card p-4"><Departures list={list.list} winter={list.winter} lang={data.lang} route="toHut" /></div>{/if}
			{/await}
			{#await data.fromHut then list}
				{#if list}<div class="card p-4"><Departures list={list.list} winter={list.winter} lang={data.lang} route="fromHut" /></div>{/if}
			{/await}
		</div>
	</section>

	<a href={localize(data.lang, '/wanderungen')} class="btn-line mt-12 no-underline">{t.hikes.more}</a>
</div>
