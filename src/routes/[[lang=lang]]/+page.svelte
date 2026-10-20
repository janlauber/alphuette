<script lang="ts">
	import BedDouble from '@lucide/svelte/icons/bed-double';
	import Bus from '@lucide/svelte/icons/bus';
	import Car from '@lucide/svelte/icons/car';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Info from '@lucide/svelte/icons/info';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import MountainSnow from '@lucide/svelte/icons/mountain-snow';
	import Ticket from '@lucide/svelte/icons/ticket';
	import Users from '@lucide/svelte/icons/users';
	import BookingPanel from '#lib/components/BookingPanel.svelte';
	import Departures from '#lib/components/Departures.svelte';
	import Gallery from '#lib/components/Gallery.svelte';
	import HikeCard from '#lib/components/HikeCard.svelte';
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
	title={data.lang === 'en' ? `${data.hutName}: alpine hut for rent in the Kiental` : `${data.hutName}: Alphütte im Kiental mieten`}
	description={c.tagline + ' ' + (data.lang === 'en' ? 'Solar power, spring water, wood stove. Rented by the week from May to October.' : 'Solarstrom, Quellwasser, Holzherd. Wochenweise zu mieten von Mai bis Oktober.')}
	path="/"
	lang={data.lang}
	siteUrl={data.siteUrl}
	image={hero ? `${data.siteUrl}/bilder/photos/${hero.key}-1600.webp` : ''}
	{jsonld}
/>

<div class="lg:mx-auto lg:max-w-6xl lg:px-6 lg:pt-6">
	<Gallery photos={data.photos} lang={data.lang} title={data.hutName} />
</div>

<div class="relative -mt-6 rounded-t-[26px] bg-paper lg:mt-0 lg:rounded-none">
	<div class="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] px-5 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-x-16 lg:pt-10">
		<!-- Part 1: what the hut is -->
		<div class="lg:col-start-1">
			<h1 class="text-[2rem] sm:text-[2.6rem] lg:text-[3.2rem]">{data.hutName}</h1>
			<p class="mt-2 text-muted">{t.hero.whole}</p>
			{#if data.reviews.count}
				<a href="#gaestebuch" class="mt-2 inline-flex items-center gap-2 text-sm no-underline">
					<Stars value={data.reviews.avg} label={t.review.stars(data.reviews.avg)} />
					<span class="font-semibold">{data.reviews.avg.toLocaleString(t.locale)}</span>
					<span class="text-muted underline">{t.review.count(data.reviews.count)}</span>
				</a>
			{/if}

			<div class="mt-5 grid grid-cols-3 border-y border-line text-center text-sm font-semibold">
				<div class="flex flex-col items-center gap-1.5 px-1 py-3.5"><Users size={22} strokeWidth={1.75} class="text-fir" aria-hidden="true" />{t.stats.guests(data.rates.maxGuests)}</div>
				<div class="flex flex-col items-center gap-1.5 border-x border-line px-1 py-3.5"><BedDouble size={22} strokeWidth={1.75} class="text-fir" aria-hidden="true" />{t.stats.rooms}</div>
				<div class="flex flex-col items-center gap-1.5 px-1 py-3.5"><MountainSnow size={22} strokeWidth={1.75} class="text-fir" aria-hidden="true" />{t.stats.altitude}</div>
			</div>

			<div class="mt-5 flex items-center gap-3.5">
				<span class="grid size-12 shrink-0 place-items-center rounded-full bg-fir font-serif text-xl text-white" aria-hidden="true">{hostFirst[0]}</span>
				<div>
					<p class="font-semibold">{t.host.title(hostFirst)}</p>
					<p class="text-sm text-muted">{t.host.lives(data.host.city)}</p>
				</div>
			</div>

			<div class="richtext mt-6 text-[1.06rem] leading-relaxed">{@html textToHtml(c.intro)}</div>

			<section class="mt-10 border-t border-line pt-8">
				<h2 class="text-[1.65rem]">{t.sections.amenities}</h2>
				<ul class="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
					{#each data.amenities as a (a.label)}
						{@const Icon = iconFor(a.icon)}
						<li class="flex items-center gap-2.5 rounded-[14px] bg-sand px-3 py-3 text-[0.95rem] font-medium">
							<Icon size={20} strokeWidth={1.75} class="shrink-0 text-fir" aria-hidden="true" />{a.label}
						</li>
					{/each}
				</ul>
			</section>
		</div>

		<!-- Booking: sticky card on desktop, its own section on phones -->
		<aside id="buchen" class="mt-10 border-t border-line pt-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:border-0 lg:pt-0">
			<div class="lg:card lg:sticky lg:top-20 lg:p-6 lg:shadow-[0_12px_40px_-24px_#2a201b55]">
				<h2 class="mb-4 text-[1.65rem] lg:hidden">{t.card.pick}</h2>
				<BookingPanel seasons={data.seasons} taken={data.taken} rates={data.rates} lang={data.lang} bind:checkIn bind:checkOut bind:guests />
			</div>
		</aside>

		<!-- Part 2: details -->
		<div class="lg:col-start-1">
			<section class="mt-10 border-t border-line pt-8">
				<h2 class="text-[1.65rem]">{t.sections.sleeping}</h2>
				<div class="richtext mt-4">{@html textToHtml(c.sleeping)}</div>
				<p class="mt-4 text-sm text-muted">{t.facts.checkIn(data.rates.checkIn)}, {t.facts.checkOut(data.rates.checkOut).toLowerCase()}</p>
			</section>

			<section class="mt-10 rounded-[18px] bg-sand p-5">
				<h2 class="flex items-center gap-2 text-[1.4rem]"><Info size={22} strokeWidth={1.75} class="text-geranium" aria-hidden="true" />{t.sections.goodToKnow}</h2>
				<div class="richtext mt-3">{@html textToHtml(c.good_to_know)}</div>
			</section>

			{#if data.reviews.count}
				<section id="gaestebuch" class="mt-10 border-t border-line pt-8">
					<h2 class="text-[1.65rem]">{t.sections.reviews}</h2>
					<p class="mt-1 flex items-center gap-2"><Stars value={data.reviews.avg} label={t.review.stars(data.reviews.avg)} /> <span class="text-muted">{t.review.count(data.reviews.count)}</span></p>
					<div class="snap-row -mx-5 mt-4 flex snap-x gap-3 overflow-x-auto px-5 sm:mx-0 sm:px-0">
						{#each data.reviews.reviews as r (r.id)}
							<article class="card flex w-[82%] shrink-0 snap-start flex-col gap-2 p-4 sm:w-[340px]">
								<Stars value={r.rating} size={14} label={t.review.stars(r.rating)} />
								<p class="line-clamp-6 whitespace-pre-line">{r.body}</p>
								<p class="mt-auto text-sm font-semibold">{r.name}{#if r.stay}<span class="font-normal text-muted">, {fmtDate(r.stay, data.lang, { weekday: undefined, day: undefined })}</span>{/if}</p>
								{#if r.reply}<p class="rounded-[10px] bg-sand p-3 text-sm"><span class="font-semibold">{t.review.reply}:</span> {r.reply}</p>{/if}
							</article>
						{/each}
					</div>
				</section>
			{/if}

			<section class="mt-10 border-t border-line pt-8">
				<h2 class="text-[1.65rem]">{t.sections.location}</h2>
				<div class="mt-4 aspect-[4/3] overflow-hidden rounded-[18px] bg-sand sm:aspect-[16/9]">
					<iframe
						title={t.sections.location}
						src="https://map.geo.admin.ch/#/embed?lang={data.lang}&center={lv.e},{lv.n}&z=6&bgLayer=ch.swisstopo.pixelkarte-farbe&topic=ech&layers=&crosshair=point"
						class="size-full"
						loading="lazy"
						referrerpolicy="no-referrer"
					></iframe>
				</div>
				<p class="mt-2 flex items-start gap-2 text-sm text-muted"><MapPin size={16} class="mt-0.5 shrink-0" aria-hidden="true" />{t.map.note}</p>

				<h3 class="mt-8 font-sans text-lg font-bold">{t.sections.arrival}</h3>
				<ul class="mt-3 grid gap-3">
					{#each arrival as a (a.text)}
						<li class="flex gap-3">
							<span class="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-fir"><a.icon size={20} strokeWidth={1.75} aria-hidden="true" /></span>
							<p>{#if a.label}<strong>{a.label}.</strong> {/if}{a.text}</p>
						</li>
					{/each}
				</ul>
				{#await data.buses then buses}
					{#if buses}
						<div class="mt-6 rounded-[18px] border border-line p-4">
							<Departures list={buses.list} winter={buses.winter} lang={data.lang} route="toHut" />
						</div>
					{/if}
				{/await}
			</section>

			{#await data.weather then weather}
				{#if weather?.length}
					<section class="mt-10 border-t border-line pt-8">
						<h2 class="text-[1.65rem]">{t.sections.weather}</h2>
						<div class="mt-4"><Weather days={weather} lang={data.lang} /></div>
					</section>
				{/if}
			{/await}

			{#if data.hikes.length}
				<section class="mt-10 border-t border-line pt-8">
					<div class="flex items-end justify-between gap-4">
						<h2 class="text-[1.65rem]">{t.sections.hikes}</h2>
						<a href={localize(data.lang, '/wanderungen')} class="shrink-0 text-sm font-semibold underline">{t.hikes.more}</a>
					</div>
					<div class="snap-row -mx-5 mt-4 flex snap-x gap-3 overflow-x-auto px-5 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0">
						{#each data.hikes.slice(0, 4) as hike (hike.slug)}
							<div class="w-[78%] shrink-0 snap-start sm:w-auto"><HikeCard {hike} lang={data.lang} /></div>
						{/each}
					</div>
				</section>
			{/if}

			<section class="mt-10 border-t border-line">
				{#each [{ title: t.sections.rules, html: textToHtml(c.rules) }, { title: t.sections.payment, html: textToHtml(c.payment) }] as d (d.title)}
					<details class="group border-b border-line py-4">
						<summary class="flex cursor-pointer list-none items-center justify-between text-lg font-semibold">
							{d.title}<ChevronDown size={20} class="transition group-open:rotate-180" aria-hidden="true" />
						</summary>
						<div class="richtext mt-3">{@html d.html}</div>
					</details>
				{/each}
			</section>

			{#if data.faq.length}
				<section class="mt-10">
					<h2 class="text-[1.65rem]">{t.sections.faq}</h2>
					<div class="mt-3">
						{#each data.faq as f (f.q)}
							<details class="group border-b border-line py-4">
								<summary class="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
									{f.q}<ChevronDown size={20} class="shrink-0 transition group-open:rotate-180" aria-hidden="true" />
								</summary>
								<p class="mt-2 whitespace-pre-line text-muted">{f.a}</p>
							</details>
						{/each}
					</div>
				</section>
			{/if}
		</div>
	</div>
</div>

<!-- Phones: price and next step always in reach -->
<div class="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
	<div class="flex items-center justify-between gap-4">
		<div class="min-w-0">
			{#if q?.ok}
				<p class="font-bold">{chf(q.total)}</p>
				<p class="truncate text-sm text-muted">{fmtDate(checkIn, data.lang, { year: undefined, month: 'short' })} – {fmtDate(checkOut, data.lang, { year: undefined, month: 'short' })}</p>
			{:else if next}
				<p class="font-bold">{chf(next.weekly ?? next.nightly)} <span class="font-normal text-muted">{next.weekly ? t.card.perWeek : t.card.perNight}</span></p>
				<p class="truncate text-sm text-muted">{t.card.noPay}</p>
			{/if}
		</div>
		{#if q?.ok}
			<button form="buchen-form" class="btn-primary shrink-0">{t.card.submit}</button>
		{:else}
			<a href="#buchen" class="btn-primary shrink-0 no-underline">{t.card.pick}</a>
		{/if}
	</div>
</div>
