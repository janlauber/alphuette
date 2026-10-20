<script lang="ts">
	import ShoppingBasket from '@lucide/svelte/icons/shopping-basket';
	import Ticket from '@lucide/svelte/icons/ticket';
	import Utensils from '@lucide/svelte/icons/utensils';
	import Info from '@lucide/svelte/icons/info';
	import Departures from '#lib/components/Departures.svelte';
	import Huettli from '#lib/components/Huettli.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import Weather from '#lib/components/Weather.svelte';
	import { dict, localize } from '#lib/i18n.ts';
	import { textToHtml } from '#lib/text.ts';

	let { data } = $props();
	const t = $derived(dict[data.lang]);

	// "Einkaufen: …" paragraphs become cards with a matching icon.
	const cards = $derived(
		data.area.split(/\n\s*\n/).map((p) => {
			const m = p.match(/^([^:]{2,40}):\s*([\s\S]*)$/);
			const label = m?.[1] ?? '';
			const icon = /einkauf|shop|course|achat|spesa|acquist/i.test(label)
				? ShoppingBasket
				: /essen|eat|manger|restaur|mangia|ristor/i.test(label)
					? Utensils
					: /karte|card|carte|carta/i.test(label)
						? Ticket
						: Info;
			return { label, html: textToHtml(m?.[2] ?? p), icon };
		})
	);
</script>

<Seo
	title={t.seo.area}
	description={t.seo.areaDescription}
	path="/umgebung"
	lang={data.lang}
	siteUrl={data.siteUrl}
/>

<div class="mx-auto max-w-6xl px-5 pt-8 sm:px-6">
	<div class="flex items-end justify-between gap-6">
		<div>
			<h1 class="text-[2.6rem] sm:text-[3.6rem]">{t.area.title}</h1>
			<p class="mt-3 max-w-[58ch] text-lg">
				{t.area.intro}
			</p>
		</div>
		<Huettli face="wink" pose="stand" animate class="hidden w-32 shrink-0 text-brand sm:block" />
	</div>

	<div class="mt-8 grid gap-4 md:grid-cols-3">
		{#each cards as c, i (i)}
			<section class="card reveal p-6">
				<span class="grid size-12 place-items-center rounded-full bg-brand text-white"><c.icon size={22} strokeWidth={2.25} aria-hidden="true" /></span>
				{#if c.label}<h2 class="mt-4 text-[1.5rem]">{c.label}</h2>{/if}
				<div class="richtext mt-2">{@html c.html}</div>
			</section>
		{/each}
	</div>

	{#await data.weather then weather}
		{#if weather?.length}
			<section class="mt-12">
				<h2 class="text-[1.9rem]">{t.sections.weather}</h2>
				<div class="mt-4"><Weather days={weather} lang={data.lang} /></div>
			</section>
		{/if}
	{/await}

	<section class="mt-12">
		<h2 class="text-[1.9rem]">{t.sections.transit}</h2>
		<div class="mt-4 grid gap-4 md:grid-cols-2">
			{#await data.toHut then list}
				{#if list}<div class="card p-5"><Departures list={list.list} winter={list.winter} lang={data.lang} route="toHut" /></div>{/if}
			{/await}
			{#await data.fromHut then list}
				{#if list}<div class="card p-5"><Departures list={list.list} winter={list.winter} lang={data.lang} route="fromHut" /></div>{/if}
			{/await}
		</div>
	</section>

	<a href={localize(data.lang, '/wanderungen')} class="btn-line mt-12">{t.hikes.more}</a>
</div>
