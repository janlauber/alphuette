<script lang="ts">
	import Bus from '@lucide/svelte/icons/bus';
	import Car from '@lucide/svelte/icons/car';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import MountainSnow from '@lucide/svelte/icons/mountain-snow';
	import Plus from '@lucide/svelte/icons/plus';
	import Quote from '@lucide/svelte/icons/quote';
	import Ticket from '@lucide/svelte/icons/ticket';
	import Users from '@lucide/svelte/icons/users';
	import BookingPanel from '#lib/components/BookingPanel.svelte';
	import DayRing from '#lib/components/DayRing.svelte';
	import Departures from '#lib/components/Departures.svelte';
	import Gallery from '#lib/components/Gallery.svelte';
	import HikeLines from '#lib/components/HikeLines.svelte';
	import Huettli from '#lib/components/Huettli.svelte';
	import HeroMotion from '#lib/components/HeroMotion.svelte';
	import RouteLine from '#lib/components/RouteLine.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import Stars from '#lib/components/Stars.svelte';
	import Weather from '#lib/components/Weather.svelte';
	import { chf, quote } from '#lib/booking.ts';
	import { toLv95 } from '#lib/geo.ts';
	import { dict, fmtDate, localize } from '#lib/i18n.ts';
	import { iconFor } from '#lib/icons.ts';
	import { textToHtml } from '#lib/text.ts';

	let { data } = $props();
	const t = $derived(dict[data.lang]);
	const c = $derived(data.content);
	const hero = $derived(data.photos[0]);
	let gallery = $state<Gallery>();
	// three small photos next to the title: inside, outside, winter if there are any
	const thumbs = $derived.by(() => {
		const all = data.photos.map((photo, index) => ({ photo, index })).slice(1);
		const first = (c: string) => all.find((x) => x.photo.category === c);
		const picked = [first('drinnen'), first('draussen'), first('winter')].filter((x) => x !== undefined);
		return [...picked, ...all.filter((x) => !picked.includes(x))].slice(0, 3);
	});
	const lv = $derived(toLv95(data.location.lat, data.location.lon));
	const hostFirst = $derived(data.host.name.split(' ')[0]);

	let checkIn = $state('');
	let checkOut = $state('');
	let guests = $state({ adults: 2, children: 0, infants: 0, linen: 0 });
	const q = $derived(checkIn && checkOut ? quote(checkIn, checkOut, guests, data.seasons, data.rates, data.taken) : null);
	const next = $derived(data.seasons[0]);

	// "Mit dem Postauto: …" paragraphs get an icon that fits their label.
	const arrival = $derived(
		c.arrival
			.split(/\n\s*\n/)
			.map((p) => {
				const m = p.match(/^([^:]{2,40}):\s*([\s\S]*)$/);
				const label = m?.[1] ?? '';
				const icon = /auto\b|car/i.test(label) && !/postauto/i.test(label) ? Car : /karte|card/i.test(label) ? Ticket : Bus;
				return { label, text: m?.[2] ?? p, icon };
			})
	);

	const jsonld = $derived([
		{
			'@context': 'https://schema.org',
			'@type': 'VacationRental',
			name: data.hutName,
			description: c.tagline,
			url: data.siteUrl + localize(data.lang, '/'),
			image: data.photos.slice(0, 5).map((p) => `${data.siteUrl}/bilder/photos/${p.key}-${p.widths.at(-1)}.webp`),
			address: { '@type': 'PostalAddress', streetAddress: 'Lengschwendi', postalCode: '3723', addressLocality: 'Kiental', addressRegion: 'BE', addressCountry: 'CH' },
			geo: { '@type': 'GeoCoordinates', latitude: data.location.lat, longitude: data.location.lon },
			containsPlace: { '@type': 'Accommodation', additionalType: 'EntirePlace', occupancy: { '@type': 'QuantitativeValue', maxValue: data.rates.maxGuests } },
			amenityFeature: data.amenities.map((a) => ({ '@type': 'LocationFeatureSpecification', name: a.label, value: true })),
			checkinTime: data.rates.checkIn,
			checkoutTime: data.rates.checkOut,
			...(data.reviews.count
				? {
						aggregateRating: { '@type': 'AggregateRating', ratingValue: data.reviews.avg, reviewCount: data.reviews.count, bestRating: 5 },
						review: data.reviews.reviews.slice(0, 5).map((r) => ({
							'@type': 'Review',
							reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
							author: { '@type': 'Person', name: r.name },
							reviewBody: r.body
						}))
					}
				: {})
		},
		{
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: data.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
		}
	]);
</script>

<Seo
	title={t.seo.home(data.hutName)}
	description={c.tagline + ' ' + t.seo.homeDescription}
	path="/"
	lang={data.lang}
	siteUrl={data.siteUrl}
	image={hero ? `${data.siteUrl}/bilder/photos/${hero.key}-1600.webp` : ''}
	{jsonld}
/>

{#snippet heading(text: string, id?: string)}
	<h2 {id} class="text-[clamp(2.5rem,5.2vw,4.2rem)] font-light text-brand">{text}</h2>
{/snippet}

{#snippet details(title: string, html: string)}
	<details class="group border-t-2 border-brand py-4">
		<summary class="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
			<span class="text-balance">{title}</span><span class="grid size-8 shrink-0 place-items-center rounded-full border-2 border-brand text-brand transition group-open:rotate-45 group-open:bg-brand group-open:text-white"><Plus size={16} strokeWidth={3} aria-hidden="true" /></span>
		</summary>
		<div class="richtext mt-3 max-w-[40rem]">{@html html}</div>
	</details>
{/snippet}

<!-- Title image: the hut, moving slowly like a drone flight -->
{#if hero}
	<HeroMotion photo={hero} labels={{ pause: t.hero.pause, play: t.hero.play }} />
	<Gallery bind:this={gallery} photos={data.photos} lang={data.lang} title={data.hutName} />
{/if}

<!-- Under the picture: the name small, what it is large, the next step on the right -->
<div class="mx-auto max-w-6xl px-5 pt-8 sm:px-6 sm:pt-10">
	<div class="flex flex-wrap items-end justify-between gap-x-14 gap-y-8">
		<div class="min-w-0 flex-[1_1_34rem]">
			<h1>
				<span class="block font-text text-base font-semibold text-muted">{data.hutName}</span>
				<span class="mt-3 block text-[clamp(2.7rem,6.4vw,5.8rem)] font-light leading-[0.94] text-brand">{c.tagline}</span>
			</h1>
			<ul class="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-muted">
				<li class="flex items-center gap-2"><MapPin size={18} strokeWidth={2} aria-hidden="true" />{t.hero.whole}</li>
				<li class="flex items-center gap-2"><Users size={18} strokeWidth={2} aria-hidden="true" />{t.stats.guests(data.rates.maxGuests)}</li>
				<li class="flex items-center gap-2"><MountainSnow size={18} strokeWidth={2} aria-hidden="true" />{t.stats.altitude}</li>
			</ul>
		</div>
		<div class="flex flex-[0_1_19rem] flex-col items-start gap-4">
			<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
				<a href="#buchen" class="btn-primary">{t.card.pick}</a>
				{#if next}<p class="text-muted">{t.card.from} <strong class="text-ink">{chf(next.weekly ?? next.nightly)}</strong> {next.weekly ? t.card.perWeek : t.card.perNight}</p>{/if}
			</div>
			{#if data.photos.length > 1}
				<div class="flex items-center gap-3">
					<ul class="flex gap-1.5">
						{#each thumbs as th (th.photo.id)}
							<li>
								<button type="button" onclick={() => gallery?.open(th.index)} class="block size-14 overflow-hidden rounded-[3px] transition hover:-translate-y-0.5" aria-label={t.gallery.open(th.photo.alt)}>
									<img src="/bilder/photos/{th.photo.key}-480.webp" alt="" loading="lazy" class="size-full object-cover" style="background: url({th.photo.lqip}) center / cover" />
								</button>
							</li>
						{/each}
					</ul>
					<button type="button" onclick={() => gallery?.open(0)} class="font-semibold text-brand underline">{t.hero.all(data.photos.length)}</button>
				</div>
			{/if}
			{#if data.reviews.count}
				<a href="#gaestebuch" class="inline-flex items-center gap-2 text-sm font-semibold text-ink no-underline">
					<Stars value={data.reviews.avg} label={t.review.stars(data.reviews.avg)} />
					<span class="underline">{t.review.count(data.reviews.count)}</span>
				</a>
			{/if}
		</div>
	</div>
</div>

<!-- Tom and the hut in his words -->
<section class="mx-auto mt-24 grid max-w-6xl gap-x-16 gap-y-6 px-5 sm:mt-32 sm:px-6 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
	<div class="flex items-center gap-3.5 self-start">
		<span class="grid size-13 shrink-0 place-items-center rounded-full bg-brand text-xl font-bold text-white" aria-hidden="true">{hostFirst[0]}</span>
		<div>
			<p class="font-bold">{t.host.title(hostFirst)}</p>
			<p class="text-muted">{t.host.lives(data.host.city)}</p>
		</div>
	</div>
	<div class="richtext max-w-[38rem] text-[1.3rem] leading-relaxed">{@html textToHtml(c.intro)}</div>
</section>

<!-- A day at the hut, as a clock -->
<section class="mx-auto mt-28 max-w-6xl px-5 sm:mt-36 sm:px-6">
	{@render heading(t.still.day)}
	<div class="mt-6 md:mt-12"><DayRing lang={data.lang} checkIn={data.rates.checkIn} /></div>
</section>

<!-- What is there, where you sleep, and what is simple -->
<section class="mx-auto mt-20 grid max-w-6xl gap-x-16 gap-y-8 px-5 sm:px-6 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
	{@render heading(t.sections.amenities)}
	<ul class="grid grid-cols-2 gap-x-6 gap-y-5 self-end sm:grid-cols-3">
		{#each data.amenities as a (a.label)}
			{@const Icon = iconFor(a.icon)}
			<li class="flex items-center gap-2.5 leading-tight"><Icon size={24} strokeWidth={1.75} class="shrink-0 text-brand" aria-hidden="true" />{a.label}</li>
		{/each}
	</ul>

	<h3 class="mt-10 text-[2.2rem] text-brand">{t.sections.sleeping}</h3>
	<div class="md:mt-10">
		<div class="richtext max-w-[38rem]">{@html textToHtml(c.sleeping)}</div>
		<p class="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-semibold text-brand">
			<span>{t.facts.checkIn(data.rates.checkIn)}</span>
			<span>{t.facts.checkOut(data.rates.checkOut)}</span>
		</p>
	</div>

	<div class="relative mt-10 flex items-start gap-4">
		<h3 class="text-[2.2rem] text-brand">{t.sections.goodToKnow}</h3>
		<Huettli face="wink" pose="stand" animate class="-mt-4 w-16 shrink-0 text-brand [--paper:var(--color-paper)]" />
	</div>
	<div class="richtext max-w-[38rem] md:mt-10">{@html textToHtml(c.good_to_know)}</div>
</section>

<!-- Booking: the whole season at a glance -->
<section id="buchen" class="mt-28 border-y-2 border-brand py-16 sm:mt-36 sm:py-20">
	<div class="mx-auto max-w-6xl px-5 sm:px-6">
		<div class="mb-8">{@render heading(t.card.pick)}</div>
		<BookingPanel wide seasons={data.seasons} taken={data.taken} rates={data.rates} lang={data.lang} bind:checkIn bind:checkOut bind:guests />
	</div>
</section>

{#if data.hikes.length}
	<section class="mx-auto mt-28 max-w-6xl px-5 sm:mt-36 sm:px-6">
		<div class="mb-8 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
			{@render heading(t.sections.hikes)}
			<a href={localize(data.lang, '/wanderungen')} class="shrink-0 font-bold text-brand underline">{t.hikes.more}</a>
		</div>
		<HikeLines hikes={data.hikes.slice(0, 5)} lang={data.lang} />
	</section>
{/if}

<!-- Getting there: the route as a line, the next buses, the map -->
<section class="mx-auto mt-28 max-w-6xl px-5 sm:mt-36 sm:px-6">
	{@render heading(t.sections.arrival)}
	<div class="mt-10">
		{#await data.buses}
			<RouteLine lang={data.lang} buses={null} />
		{:then buses}
			<RouteLine lang={data.lang} {buses} />
		{/await}
	</div>
	<div class="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
		<div>
			<div class="aspect-[4/3] overflow-hidden border-2 border-brand bg-wash sm:aspect-[16/9]">
				<iframe
					title={t.sections.location}
					src="https://map.geo.admin.ch/#/embed?lang={data.lang}&center={lv.e},{lv.n}&z=6&bgLayer=ch.swisstopo.pixelkarte-farbe&topic=ech&layers=&crosshair=point"
					class="size-full"
					loading="lazy"
					referrerpolicy="no-referrer"
				></iframe>
			</div>
			<p class="mt-2 flex items-start gap-2 text-sm text-muted"><MapPin size={16} class="mt-0.5 shrink-0" aria-hidden="true" />{t.map.note}</p>
		</div>
		<div>
			{#await data.buses then buses}
				{#if buses}<Departures list={buses.list} winter={buses.winter} lang={data.lang} route="toHut" />{/if}
			{/await}
			<details class="group mt-6 border-t-2 border-brand pt-4">
				<summary class="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
					{t.still.arrivalMore}<span class="grid size-8 shrink-0 place-items-center rounded-full border-2 border-brand text-brand transition group-open:rotate-45 group-open:bg-brand group-open:text-white"><Plus size={16} strokeWidth={3} aria-hidden="true" /></span>
				</summary>
				<ul class="mt-4 grid gap-4">
					{#each arrival as a (a.text)}
						<li class="flex gap-3">
							<a.icon size={20} strokeWidth={2} class="mt-1 shrink-0 text-brand" aria-hidden="true" />
							<p>{#if a.label}<strong>{a.label}.</strong> {/if}{a.text}</p>
						</li>
					{/each}
				</ul>
			</details>
		</div>
	</div>
</section>

{#await data.weather then weather}
	{#if weather?.length}
		<section class="mx-auto mt-28 max-w-6xl px-5 sm:mt-36 sm:px-6">
			<div class="mb-8">{@render heading(t.sections.weather)}</div>
			<Weather days={weather} lang={data.lang} />
		</section>
	{/if}
{/await}

{#if data.reviews.count}
	<section id="gaestebuch" class="mx-auto mt-28 max-w-6xl px-5 sm:mt-36 sm:px-6">
		{@render heading(t.sections.reviews)}
		<p class="mt-3 flex items-center gap-2"><Stars value={data.reviews.avg} label={t.review.stars(data.reviews.avg)} /> <span class="text-muted">{t.review.count(data.reviews.count)}</span></p>
		<div class="snap-row -mx-5 mt-6 flex snap-x gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
			{#each data.reviews.reviews as r (r.id)}
				<article class="card flex w-[82%] shrink-0 snap-start flex-col gap-2 p-5 sm:w-[340px]">
					<Quote size={26} strokeWidth={2} class="text-brand" aria-hidden="true" />
					<p class="line-clamp-6 whitespace-pre-line">{r.body}</p>
					<Stars value={r.rating} size={14} label={t.review.stars(r.rating)} />
					<p class="mt-auto text-sm font-bold">{r.name}{#if r.stay}<span class="font-normal text-muted">, {fmtDate(r.stay, data.lang, { weekday: undefined, day: undefined })}</span>{/if}</p>
					{#if r.reply}<p class="bg-wash p-3 text-sm"><span class="font-bold">{t.review.reply}:</span> {r.reply}</p>{/if}
				</article>
			{/each}
		</div>
	</section>
{/if}

<!-- The fine print, closed until opened -->
<section class="mx-auto mb-12 mt-28 grid max-w-6xl gap-x-16 gap-y-6 px-5 sm:mt-36 sm:px-6 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
	{@render heading(t.sections.faq)}
	<div class="border-b-2 border-brand">
		{@render details(t.sections.rules, textToHtml(c.rules))}
		{@render details(t.sections.payment, textToHtml(c.payment))}
		{#each data.faq as f (f.q)}
			{@render details(f.q, textToHtml(f.a))}
		{/each}
	</div>
</section>

<!-- Phones: price and next step always in reach -->
<div class="fixed inset-x-0 bottom-0 z-20 border-t-2 border-brand bg-paper/95 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
	<div class="flex items-center justify-between gap-4">
		<div class="min-w-0">
			{#if q?.ok}
				<p class="text-lg font-bold text-ink">{chf(q.total)}</p>
				<p class="truncate text-sm text-muted">{fmtDate(checkIn, data.lang, { year: undefined, month: 'short' })} – {fmtDate(checkOut, data.lang, { year: undefined, month: 'short' })}</p>
			{:else if next}
				<p class="text-lg font-bold text-ink">{chf(next.weekly ?? next.nightly)} <span class="text-base font-normal text-muted">{next.weekly ? t.card.perWeek : t.card.perNight}</span></p>
				<p class="truncate text-sm text-muted">{t.card.noPay}</p>
			{/if}
		</div>
		{#if q?.ok}
			<button form="buchen-form" class="btn-primary shrink-0">{t.card.submit}</button>
		{:else}
			<a href="#buchen" class="btn-primary shrink-0">{t.card.pick}</a>
		{/if}
	</div>
</div>
