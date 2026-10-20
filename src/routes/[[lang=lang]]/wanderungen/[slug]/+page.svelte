<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Clock from '@lucide/svelte/icons/clock';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Route from '@lucide/svelte/icons/route';
	import TrendingDown from '@lucide/svelte/icons/trending-down';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import Profile from '#lib/components/Profile.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { dict, localize } from '#lib/i18n.ts';

	let { data } = $props();
	const t = $derived(dict[data.lang]);
	const h = $derived(data.hike);
	const km = (m: number) => (m / 1000).toLocaleString(t.locale, { maximumFractionDigits: 1 }) + ' km';
	const stats = $derived(
		[
			h.time && { icon: Clock, label: t.hikes.time, value: h.time },
			h.distanceM && { icon: Route, label: t.hikes.distance, value: km(h.distanceM) },
			h.ascentM && { icon: TrendingUp, label: t.hikes.ascent, value: `${h.ascentM} m` },
			h.descentM && { icon: TrendingDown, label: t.hikes.descent, value: `${h.descentM} m` }
		].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[]
	);
	const jsonld = $derived({
		'@context': 'https://schema.org',
		'@type': 'TouristAttraction',
		name: h.name,
		description: h.text,
		touristType: 'Hiking',
		address: { '@type': 'PostalAddress', addressLocality: 'Kiental', addressRegion: 'BE', addressCountry: 'CH' }
	});
</script>

<Seo title="{h.name}: {data.lang === 'en' ? 'hike in the Kiental' : 'Wanderung im Kiental'}" description={h.text} path="/wanderungen/{h.slug}" lang={data.lang} siteUrl={data.siteUrl} {jsonld} />

<div class="mx-auto max-w-3xl px-5 pt-6 sm:px-6">
	<a href={localize(data.lang, '/wanderungen')} class="inline-flex items-center gap-1 text-sm text-muted no-underline hover:text-ink"><ChevronLeft size={16} aria-hidden="true" />{t.hikes.back}</a>
	<h1 class="mt-3 text-[2.2rem] sm:text-[3rem]">{h.name}</h1>
	{#if h.alpine}<p class="mt-2 inline-block rounded-full bg-blush px-2.5 py-0.5 text-sm font-semibold text-geranium-dark">{t.hikes.mountain}</p>{/if}

	{#if stats.length}
		<dl class="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
			{#each stats as s (s.label)}
				<div class="rounded-[14px] bg-sand px-3 py-3">
					<dt class="flex items-center gap-1.5 text-sm text-muted"><s.icon size={15} aria-hidden="true" />{s.label}</dt>
					<dd class="mt-0.5 text-lg font-bold tabular-nums">{s.value}</dd>
				</div>
			{/each}
		</dl>
	{/if}

	{#if h.profile}
		<section class="mt-8">
			<h2 class="font-sans text-lg font-bold">{t.hikes.profile}</h2>
			<div class="mt-3 rounded-[18px] border border-line p-3"><Profile profile={h.profile} height={180} title={h.name} /></div>
			<p class="mt-2 text-xs text-muted">{h.source === 'gpx' ? t.hikes.fromGpx : h.source === 'wanderland' ? t.hikes.fromWanderland : t.hikes.fromWaypoints}</p>
		</section>
	{/if}

	<p class="mt-8 text-[1.06rem] leading-relaxed">{h.text}</p>
	{#if h.url}
		<a href={h.url} target="_blank" rel="noopener" class="btn-line mt-6 no-underline"><ExternalLink size={16} aria-hidden="true" />{t.hikes.details}</a>
	{/if}
</div>
