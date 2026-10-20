<script lang="ts">
	import BedDouble from '@lucide/svelte/icons/bed-double';
	import Bus from '@lucide/svelte/icons/bus';
	import Car from '@lucide/svelte/icons/car';
	import Images from '@lucide/svelte/icons/images';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import MountainSnow from '@lucide/svelte/icons/mountain-snow';
	import Plus from '@lucide/svelte/icons/plus';
	import Quote from '@lucide/svelte/icons/quote';
	import Ticket from '@lucide/svelte/icons/ticket';
	import Users from '@lucide/svelte/icons/users';
	import BookingPanel from '#lib/components/BookingPanel.svelte';
	import Departures from '#lib/components/Departures.svelte';
	import Gallery from '#lib/components/Gallery.svelte';
	import HikeCard from '#lib/components/HikeCard.svelte';
	import Huettli from '#lib/components/Huettli.svelte';
	import HeroMotion from '#lib/components/HeroMotion.svelte';
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

<!-- Hero: the hut, moving slowly like a drone flight -->
{#if hero}
	<HeroMotion photo={hero} labels={{ pause: t.hero.pause, play: t.hero.play }}>
		<p class="flex items-center gap-1.5 text-sm font-semibold text-white/90 sm:text-base"><MapPin size={16} strokeWidth={2.5} class="shrink-0" aria-hidden="true" />{t.hero.whole}</p>
		<h1 class="mt-2 text-[2.4rem] leading-[1.02] !text-white sm:text-[3.4rem] lg:text-[4.2rem]">{data.hutName}</h1>
		<p class="mt-3 max-w-[48ch] text-lg text-white/90 sm:text-xl">{c.tagline}</p>
		<div class="mt-5 flex flex-wrap items-center gap-3">
			<a href="#buchen" class="btn-primary !border-ink !shadow-[0_4px_0_var(--color-ink)]">{t.card.pick}</a>
			{#if data.photos.length}<a href="#fotos" class="btn-line !border-white !bg-transparent !text-white !shadow-none hover:!bg-white/10"><Images size={18} strokeWidth={2.5} aria-hidden="true" />{t.hero.all(data.photos.length)}</a>{/if}
			{#if data.reviews.count}
				<a href="#gaestebuch" class="inline-flex items-center gap-2 text-sm font-semibold text-white no-underline">
					<Stars value={data.reviews.avg} label={t.review.stars(data.reviews.avg)} />
					<span>{data.reviews.avg.toLocaleString(t.locale)}</span>
					<span class="underline">{t.review.count(data.reviews.count)}</span>
				</a>
			{/if}
		</div>
	</HeroMotion>
{/if}

<div id="fotos" class="-mt-1 bg-hill pb-8 pt-3 sm:pb-12">
	<div class="mx-auto max-w-6xl px-5 sm:px-6">
		<Gallery photos={data.photos} lang={data.lang} title={data.hutName} />
	</div>
</div>

<div class="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] px-5 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-x-16 lg:pt-14">
	<!-- Part 1: what the hut is -->
	<div class="lg:col-start-1">
		<ul class="flex flex-wrap gap-2">
			<li class="pill"><Users size={18} strokeWidth={2.25} aria-hidden="true" />{t.stats.guests(data.rates.maxGuests)}</li>
			<li class="pill"><BedDouble size={18} strokeWidth={2.25} aria-hidden="true" />{t.stats.rooms}</li>
			<li class="pill"><MountainSnow size={18} strokeWidth={2.25} aria-hidden="true" />{t.stats.altitude}</li>
		</ul>

		<div class="mt-7 flex items-center gap-3.5">
			<span class="grid size-13 shrink-0 place-items-center rounded-full bg-brand text-xl font-bold text-white" aria-hidden="true">{hostFirst[0]}</span>
			<div>
				<p class="font-bold">{t.host.title(hostFirst)}</p>
				<p class="text-muted">{t.host.lives(data.host.city)}</p>
			</div>
		</div>

		<div class="richtext mt-6 text-[1.12rem] leading-relaxed">{@html textToHtml(c.intro)}</div>

		<section class="reveal mt-14">
			<h2 class="text-[2rem]">{t.sections.amenities}</h2>
			<ul class="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
				{#each data.amenities as a (a.label)}
					{@const Icon = iconFor(a.icon)}
					<li class="flex items-center gap-2.5 rounded-[18px] border-2 border-line px-3 py-3 text-[15px] font-medium leading-tight transition-colors hover:border-brand">
						<Icon size={22} strokeWidth={2} class="shrink-0 text-brand" aria-hidden="true" />{a.label}
					</li>
				{/each}
			</ul>
		</section>
	</div>

	<!-- Booking: sticky card on desktop, its own section on phones -->
	<aside id="buchen" class="mt-14 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">
		<div class="card-strong p-5 sm:p-6 lg:sticky lg:top-24">
			<h2 class="mb-4 text-[1.9rem]">{t.card.pick}</h2>
			<BookingPanel seasons={data.seasons} taken={data.taken} rates={data.rates} lang={data.lang} bind:checkIn bind:checkOut bind:guests />
		</div>
	</aside>

	<!-- Part 2: details -->
	<div class="lg:col-start-1">
		<section class="reveal mt-14">
			<h2 class="text-[2rem]">{t.sections.sleeping}</h2>
			<div class="richtext mt-4">{@html textToHtml(c.sleeping)}</div>
			<p class="mt-4 flex flex-wrap gap-2 text-sm">
				<span class="pill">{t.facts.checkIn(data.rates.checkIn)}</span>
				<span class="pill">{t.facts.checkOut(data.rates.checkOut)}</span>
			</p>
		</section>

		<section class="reveal relative mt-14 rounded-[28px] bg-accent-wash p-6 pr-24 sm:pr-32">
			<h2 class="text-[1.6rem]">{t.sections.goodToKnow}</h2>
			<div class="richtext mt-3">{@html textToHtml(c.good_to_know)}</div>
			<Huettli face="wink" pose="stand" class="absolute -top-6 right-3 w-20 text-brand [--paper:var(--color-accent-wash)] sm:w-24" />
		</section>

		{#if data.reviews.count}
			<section id="gaestebuch" class="reveal mt-14">
				<h2 class="text-[2rem]">{t.sections.reviews}</h2>
				<p class="mt-2 flex items-center gap-2"><Stars value={data.reviews.avg} label={t.review.stars(data.reviews.avg)} /> <span class="text-muted">{t.review.count(data.reviews.count)}</span></p>
				<div class="snap-row -mx-5 mt-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
					{#each data.reviews.reviews as r (r.id)}
						<article class="card flex w-[82%] shrink-0 snap-start flex-col gap-2 p-5 sm:w-[340px]">
							<Quote size={26} strokeWidth={2} class="text-brand" aria-hidden="true" />
							<p class="line-clamp-6 whitespace-pre-line">{r.body}</p>
							<Stars value={r.rating} size={14} label={t.review.stars(r.rating)} />
							<p class="mt-auto text-sm font-bold">{r.name}{#if r.stay}<span class="font-normal text-muted">, {fmtDate(r.stay, data.lang, { weekday: undefined, day: undefined })}</span>{/if}</p>
							{#if r.reply}<p class="rounded-[16px] bg-wash p-3 text-sm"><span class="font-bold">{t.review.reply}:</span> {r.reply}</p>{/if}
						</article>
					{/each}
				</div>
			</section>
		{/if}

		<section class="reveal mt-14">
			<h2 class="text-[2rem]">{t.sections.location}</h2>
			<div class="mt-5 aspect-[4/3] overflow-hidden rounded-[28px] border-2 border-brand bg-wash sm:aspect-[16/9]">
				<iframe
					title={t.sections.location}
					src="https://map.geo.admin.ch/#/embed?lang={data.lang}&center={lv.e},{lv.n}&z=6&bgLayer=ch.swisstopo.pixelkarte-farbe&topic=ech&layers=&crosshair=point"
					class="size-full"
					loading="lazy"
					referrerpolicy="no-referrer"
				></iframe>
			</div>
			<p class="mt-2 flex items-start gap-2 text-sm text-muted"><MapPin size={16} class="mt-0.5 shrink-0" aria-hidden="true" />{t.map.note}</p>

			<h3 class="mt-10 text-[1.4rem]">{t.sections.arrival}</h3>
			<ul class="mt-4 grid gap-4">
				{#each arrival as a (a.text)}
					<li class="flex gap-3.5">
						<span class="grid size-11 shrink-0 place-items-center rounded-full border-2 border-brand text-brand"><a.icon size={20} strokeWidth={2.25} aria-hidden="true" /></span>
						<p class="pt-2">{#if a.label}<strong>{a.label}.</strong> {/if}{a.text}</p>
					</li>
				{/each}
			</ul>
			{#await data.buses then buses}
				{#if buses}
					<div class="card mt-6 p-5">
						<Departures list={buses.list} winter={buses.winter} lang={data.lang} route="toHut" />
					</div>
				{/if}
			{/await}
		</section>

		{#await data.weather then weather}
			{#if weather?.length}
				<section class="reveal mt-14">
					<h2 class="text-[2rem]">{t.sections.weather}</h2>
					<div class="mt-5"><Weather days={weather} lang={data.lang} /></div>
				</section>
			{/if}
		{/await}

		{#if data.hikes.length}
			<section class="reveal mt-14">
				<div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
					<h2 class="text-[2rem]">{t.sections.hikes}</h2>
					<a href={localize(data.lang, '/wanderungen')} class="shrink-0 font-bold text-brand underline">{t.hikes.more}</a>
				</div>
				<div class="snap-row -mx-5 mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-3 pt-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0">
					{#each data.hikes.slice(0, 4) as hike (hike.slug)}
						<div class="w-[80%] shrink-0 snap-start sm:w-auto"><HikeCard {hike} lang={data.lang} /></div>
					{/each}
				</div>
			</section>
		{/if}

		<section class="reveal mt-14 grid gap-3">
			{#each [{ title: t.sections.rules, html: textToHtml(c.rules) }, { title: t.sections.payment, html: textToHtml(c.payment) }] as d (d.title)}
				<details class="group rounded-[22px] border-2 border-line px-5 py-4 open:border-brand">
					<summary class="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
						{d.title}<span class="grid size-8 shrink-0 place-items-center rounded-full border-2 border-brand text-brand transition group-open:rotate-45 group-open:bg-brand group-open:text-white"><Plus size={16} strokeWidth={3} aria-hidden="true" /></span>
					</summary>
					<div class="richtext mt-3">{@html d.html}</div>
				</details>
			{/each}
		</section>

		{#if data.faq.length}
			<section class="reveal mt-14">
				<h2 class="text-[2rem]">{t.sections.faq}</h2>
				<div class="mt-5 grid gap-3">
					{#each data.faq as f (f.q)}
						<details class="group rounded-[22px] border-2 border-line px-5 py-4 open:border-brand">
							<summary class="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
								<span class="text-balance">{f.q}</span><span class="grid size-8 shrink-0 place-items-center rounded-full border-2 border-brand text-brand transition group-open:rotate-45 group-open:bg-brand group-open:text-white"><Plus size={16} strokeWidth={3} aria-hidden="true" /></span>
							</summary>
							<p class="mt-2 whitespace-pre-line text-muted">{f.a}</p>
						</details>
					{/each}
				</div>
			</section>
		{/if}
	</div>
</div>

<!-- Phones: price and next step always in reach -->
<div class="fixed inset-x-0 bottom-0 z-20 border-t-2 border-brand bg-paper/95 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
	<div class="flex items-center justify-between gap-4">
		<div class="min-w-0">
			{#if q?.ok}
				<p class="w-fit rounded-md bg-accent-soft px-1.5 text-lg font-bold">{chf(q.total)}</p>
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
