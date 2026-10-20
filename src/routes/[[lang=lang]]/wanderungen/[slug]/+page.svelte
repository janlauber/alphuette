<script lang="ts">
	import Baby from '@lucide/svelte/icons/baby';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Clock from '@lucide/svelte/icons/clock';
	import Download from '@lucide/svelte/icons/download';
	import CalendarRange from '@lucide/svelte/icons/calendar-range';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Footprints from '@lucide/svelte/icons/footprints';
	import House from '@lucide/svelte/icons/house';
	import Mountain from '@lucide/svelte/icons/mountain';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Sparkle from '@lucide/svelte/icons/sparkle';
	import Route from '@lucide/svelte/icons/route';
	import TrainFront from '@lucide/svelte/icons/train-front';
	import TrendingDown from '@lucide/svelte/icons/trending-down';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import Utensils from '@lucide/svelte/icons/utensils';
	import Profile from '#lib/components/Profile.svelte';
	import RouteMap from '#lib/components/RouteMap.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import Signposts from '#lib/components/Signposts.svelte';
	import TrailBadge from '#lib/components/TrailBadge.svelte';
	import { dict, localize } from '#lib/i18n.ts';

	let { data } = $props();
	const t = $derived(dict[data.lang]);
	const h = $derived(data.hike);
	const num = (n: number, digits = 0) => n.toLocaleString(t.locale, { maximumFractionDigits: digits });
	const km = (m: number) => num(m / 1000, 1) + ' km';
	const stats = $derived(
		[
			(h.durationMin || h.time) && { icon: Clock, label: t.hikes.time, value: h.durationMin ? t.hikes.hours(h.durationMin) : h.time },
			h.distanceM && { icon: Route, label: t.hikes.distance, value: km(h.distanceM) },
			h.ascentM && { icon: TrendingUp, label: t.hikes.ascent, value: `${num(h.ascentM)} m` },
			h.descentM && { icon: TrendingDown, label: t.hikes.descent, value: `${num(h.descentM)} m` },
			h.highest && { icon: Mountain, label: t.hikes.highest, value: `${num(h.highest)} m` }
		].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[]
	);
	// a bit of fun with the numbers: steps of about 70 cm, the Bern Minster tower is 100.6 m
	const facts = $derived(
		[
			h.distanceM && t.hikes.steps(num(Math.round(h.distanceM / 0.7 / 100) * 100)),
			h.ascentM && h.ascentM >= 100 && t.hikes.towers(num(h.ascentM / 100.6, 1))
		].filter(Boolean) as string[]
	);
	const points = $derived(h.waypoints.length ? h.waypoints : [h.start && { name: h.start, elev: h.profile?.[0]?.[1] ?? 0 }, h.end && { name: h.end, elev: h.profile?.at(-1)?.[1] ?? 0 }].filter(Boolean) as { name: string; elev: number }[]);
	// swisstopo map centred on the route, with the route itself loaded as a KML layer
	const swisstopo = $derived.by(() => {
		if (!h.geometry) return '';
		const es = h.geometry.map((p) => p[0]), ns = h.geometry.map((p) => p[1]);
		const span = Math.max(Math.max(...es) - Math.min(...es), Math.max(...ns) - Math.min(...ns));
		const z = span < 2500 ? 8 : span < 5000 ? 7 : span < 10000 ? 6 : 5;
		const kml = `${data.siteUrl}/wanderungen/${h.slug}/route.kml`;
		return `https://map.geo.admin.ch/#/map?lang=${data.lang}&center=${Math.round((Math.max(...es) + Math.min(...es)) / 2)},${Math.round((Math.max(...ns) + Math.min(...ns)) / 2)}&z=${z}&bgLayer=ch.swisstopo.pixelkarte-farbe&layers=ch.swisstopo.swisstlm3d-wanderwege;KML|${kml}`;
	});
	let at = $state<number | null>(null);

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

<div class="mx-auto max-w-6xl px-5 pt-6 sm:px-6">
	<a href={localize(data.lang, '/wanderungen')} class="inline-flex items-center gap-1 text-sm font-semibold text-brand no-underline hover:underline"><ChevronLeft size={16} strokeWidth={2.5} aria-hidden="true" />{t.hikes.back}</a>
	<h1 class="mt-3 text-[2.6rem] sm:text-[3.6rem]">{h.name}</h1>
	<div class="mt-4 flex flex-wrap items-center gap-2">
		<TrailBadge category={h.category} label={t.hikes.category[h.category] + (h.sac ? ` · ${h.sac}` : '')} />
		{#if h.season}<span class="pill max-w-full !whitespace-normal !rounded-[16px] text-sm"><CalendarRange size={15} strokeWidth={2.5} class="shrink-0" aria-hidden="true" />{h.season}</span>{/if}
		{#if h.fromHut}<span class="chip chip-ok text-sm"><House size={14} strokeWidth={2.5} aria-hidden="true" />{t.hikes.fromHut}</span>{/if}
		{#if h.loop}<span class="pill text-sm"><RefreshCw size={15} strokeWidth={2.5} aria-hidden="true" />{t.hikes.loop}</span>{/if}
		{#if h.family}<span class="pill text-sm"><Baby size={15} strokeWidth={2.5} aria-hidden="true" />{t.hikes.family}</span>{/if}
	</div>
	<p class="mt-2 text-sm text-muted">{t.hikes.categoryHint[h.category]}</p>

	{#if stats.length}
		<dl class="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
			{#each stats as s (s.label)}
				<div class="rounded-[20px] border-2 border-line px-4 py-3">
					<dt class="flex items-center gap-1.5 text-sm font-semibold text-muted"><s.icon size={16} strokeWidth={2.25} class="text-brand" aria-hidden="true" />{s.label}</dt>
					<dd class="mt-0.5 whitespace-nowrap text-xl font-bold tabular-nums text-brand">{s.value}</dd>
				</div>
			{/each}
		</dl>
		{#if facts.length}
			<p class="mt-3 flex flex-wrap gap-2 text-sm">
				{#each facts as f (f)}<span class="inline-flex items-center gap-1.5 rounded-full bg-accent-wash px-3 py-1 font-semibold text-accent-dark"><Footprints size={15} strokeWidth={2.5} aria-hidden="true" />{f}</span>{/each}
			</p>
		{/if}
	{/if}

	<div class="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
		<div class="flex min-w-0 flex-col gap-6">
			{#if h.profile}
				<section>
					<h2 class="text-[1.9rem]">{t.hikes.profile}</h2>
					<p class="mt-1 text-sm text-muted">{t.hikes.scrub}</p>
					<div class="mt-4 rounded-[28px] border-2 border-brand p-4 pt-3">
						<Profile profile={h.profile} height={190} title={h.name} waypoints={h.waypoints} interactive readout={t.hikes.at} bind:at />
					</div>
				</section>
			{/if}
			{#if h.geometry}
				<section>
					<h2 class="sr-only">{t.hikes.route}</h2>
					<RouteMap geometry={h.geometry} waypoints={h.waypoints} {at} label="{t.hikes.route}: {h.name}" />
					<p class="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted">
						<span>{h.source === 'gpx' ? t.hikes.fromGpx : h.source === 'wanderland' ? t.hikes.fromWanderland : h.source === 'netz' ? t.hikes.fromNetwork : t.hikes.fromWaypoints}</span>
						{#if swisstopo}<a href={swisstopo} target="_blank" rel="noopener" class="font-semibold text-brand underline">{t.hikes.openMap}</a>{/if}
					</p>
				</section>
			{:else if h.profile}
				<p class="-mt-3 text-xs text-muted">{h.source === 'wanderland' ? t.hikes.fromWanderland : t.hikes.fromWaypoints}</p>
			{/if}

			<section>
				<p class="text-[1.12rem] leading-relaxed">{h.text}</p>
				{#if h.highlights.length}
					<h3 class="mt-8 text-[1.4rem]">{t.hikes.highlights}</h3>
					<ul class="mt-3 grid gap-2.5">
						{#each h.highlights as x (x)}<li class="flex gap-3"><span class="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-dark"><Sparkle size={12} strokeWidth={2.5} aria-hidden="true" /></span>{x}</li>{/each}
					</ul>
				{/if}
				{#if h.tips}
					<div class="mt-8 rounded-[24px] bg-accent-wash p-5">
						<h3 class="text-[1.3rem]">{t.hikes.tips}</h3>
						<p class="mt-2 whitespace-pre-line">{h.tips}</p>
					</div>
				{/if}
			</section>
		</div>

		<aside class="flex flex-col gap-8">
			{#if points.length}
				<section>
					<h2 class="text-[1.9rem]">{t.hikes.signposts}</h2>
					<div class="mt-4"><Signposts {points} category={h.category} hours={t.hikes.hours} start={t.hikes.start} /></div>
				</section>
			{/if}
			{#if h.transit}
				<section class="card p-5">
					<h3 class="flex items-center gap-2.5 text-[1.3rem]"><span class="grid size-9 place-items-center rounded-full bg-brand text-white"><TrainFront size={18} strokeWidth={2.25} aria-hidden="true" /></span>{t.hikes.transit}</h3>
					<p class="mt-3 whitespace-pre-line">{h.transit}</p>
				</section>
			{/if}
			{#if h.stops.length}
				<section class="card p-5">
					<h3 class="flex items-center gap-2.5 text-[1.3rem]"><span class="grid size-9 place-items-center rounded-full bg-brand text-white"><Utensils size={18} strokeWidth={2.25} aria-hidden="true" /></span>{t.hikes.stops}</h3>
					<ul class="mt-3 grid gap-1.5">
						{#each h.stops as s (s)}<li class="flex gap-2"><span class="mt-2 size-2 shrink-0 rounded-full bg-accent"></span>{s}</li>{/each}
					</ul>
				</section>
			{/if}
			<div class="flex flex-wrap gap-3">
				{#if h.geometry}
					<a href="{localize(data.lang, `/wanderungen/${h.slug}`)}/route.gpx" download="{h.slug}.gpx" class="btn-blue" data-sveltekit-reload><Download size={18} strokeWidth={2.5} aria-hidden="true" />{t.hikes.gpx}</a>
				{/if}
				{#if h.url}
					<a href={h.url} target="_blank" rel="noopener" class="btn-line"><ExternalLink size={18} strokeWidth={2.5} aria-hidden="true" />{t.hikes.details}</a>
				{/if}
			</div>
			{#if h.geometry}<p class="-mt-5 text-sm text-muted">{t.hikes.gpxHint}</p>{/if}
		</aside>
	</div>
</div>
