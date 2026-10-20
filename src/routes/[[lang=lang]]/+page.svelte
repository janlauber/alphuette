<script lang="ts">
	import BookingCard from '#lib/components/BookingCard.svelte';
	import Gallery from '#lib/components/Gallery.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import Signposts from '#lib/components/Signposts.svelte';
	import { chf } from '#lib/booking.ts';
	import { toLv95 } from '#lib/geo.ts';
	import { dict, localize } from '#lib/i18n.ts';
	import { textToHtml } from '#lib/text.ts';

	let { data } = $props();
	const t = $derived(dict[data.lang]);
	const c = $derived(data.content);
	const hero = $derived(data.photos[0]);
	const lv = $derived(toLv95(data.location.lat, data.location.lon));
	const next = $derived(data.seasons[0]);

	const sections = $derived([
		{ title: t.sections.sleeping, html: textToHtml(c.sleeping) },
		{ title: t.sections.amenities, html: textToHtml(c.amenities), columns: true },
		{ title: t.sections.goodToKnow, html: textToHtml(c.good_to_know) },
		{ title: t.sections.rules, html: textToHtml(c.rules) },
		{ title: t.sections.payment, html: textToHtml(c.payment) }
	]);

	const jsonld = $derived({
		'@context': 'https://schema.org',
		'@type': 'VacationRental',
		name: data.hutName,
		description: c.tagline,
		url: data.siteUrl + localize(data.lang, '/'),
		image: data.photos.slice(0, 5).map((p) => `${data.siteUrl}/bilder/photos/${p.key}-${p.widths.at(-1)}.webp`),
		address: {
			'@type': 'PostalAddress',
			streetAddress: 'Lengschwendi',
			postalCode: '3723',
			addressLocality: 'Kiental',
			addressRegion: 'BE',
			addressCountry: 'CH'
		},
		geo: { '@type': 'GeoCoordinates', latitude: data.location.lat, longitude: data.location.lon },
		containsPlace: { '@type': 'Accommodation', occupancy: { '@type': 'QuantitativeValue', maxValue: data.rates.maxGuests } },
		checkinTime: data.rates.checkIn,
		checkoutTime: data.rates.checkOut
	});
</script>

<Seo
	title={data.lang === 'en' ? `${data.hutName}: alpine hut for rent in the Kiental` : `${data.hutName}: Alphütte im Kiental mieten`}
	description={c.tagline + ' ' + (data.lang === 'en' ? 'Solar power, spring water, wood stove. Rented by the week from May to October.' : 'Solarstrom, Quellwasser, Holzherd. Zu mieten von Mai bis Oktober.')}
	path="/"
	lang={data.lang}
	siteUrl={data.siteUrl}
	image={hero ? `${data.siteUrl}/bilder/photos/${hero.key}-1600.webp` : ''}
	{jsonld}
/>

<div class="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:pb-0">
	<section class="pb-6 pt-6 sm:pt-10">
		<p class="inline-flex items-baseline gap-3 border border-tanne bg-white px-2.5 py-1 text-sm font-bold">
			Lengschwendi, Kiental <span class="font-semibold tabular-nums">1200 m</span>
		</p>
		<h1 class="mt-4 text-[clamp(2.5rem,7vw,4.75rem)]">{data.hutName}</h1>
		<p class="mt-3 max-w-[44ch] text-lg text-stein sm:text-xl">{c.tagline}</p>
	</section>

	<Gallery photos={data.photos} lang={data.lang} />

	<div class="mt-10 grid gap-14 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
		<article class="max-w-[62ch]">
			<ul class="flex flex-wrap gap-x-6 gap-y-1 border-b border-linie pb-5 text-stein">
				<li>{t.facts.guests(data.rates.maxGuests)}</li>
				<li>{t.facts.altitude}</li>
				<li>{t.facts.checkIn(data.rates.checkIn)}</li>
				<li>{t.facts.checkOut(data.rates.checkOut)}</li>
			</ul>

			<div class="richtext mt-6 font-serif text-[1.3rem] leading-relaxed">{@html textToHtml(c.intro)}</div>

			{#each sections as s (s.title)}
				<section class="mt-12 border-t border-linie pt-6">
					<h2 class="text-[1.75rem]">{s.title}</h2>
					<div class="richtext mt-4 {s.columns ? 'sm:[&_ul]:grid-cols-2 sm:[&_ul]:gap-x-8' : ''}">{@html s.html}</div>
				</section>
			{/each}
		</article>

		<aside id="buchen" class="lg:sticky lg:top-6 lg:self-start">
			<BookingCard seasons={data.seasons} taken={data.taken} rates={data.rates} lang={data.lang} />
		</aside>
	</div>

	<section class="mt-20 grid gap-8 border-t border-linie pt-8 lg:grid-cols-2 lg:gap-16">
		<div>
			<h2 class="text-[1.75rem]">{t.sections.location}</h2>
			<div class="mt-4 aspect-[4/3] overflow-hidden rounded-[3px] border border-linie bg-linie">
				<iframe
					title={t.sections.location}
					src="https://map.geo.admin.ch/#/embed?lang={data.lang}&center={lv.e},{lv.n}&z=6&bgLayer=ch.swisstopo.pixelkarte-farbe&topic=ech&layers=&crosshair=point"
					class="size-full"
					loading="lazy"
					referrerpolicy="no-referrer"
				></iframe>
			</div>
			<p class="mt-2 text-sm text-stein">
				{t.map.note}
				<a href="https://map.geo.admin.ch/?swisssearch={data.location.lat},{data.location.lon}&z=8" target="_blank" rel="noopener">{t.map.open}</a>
			</p>
		</div>
		<div>
			<h2 class="text-[1.75rem]">{t.sections.arrival}</h2>
			<div class="richtext mt-4">{@html textToHtml(c.arrival)}</div>
		</div>
	</section>

	<section class="mt-20 border-t border-linie pt-8">
		<h2 class="text-[1.75rem]">{t.sections.hikes}</h2>
		<p class="mt-2 max-w-[60ch] text-stein">{t.hikes.intro}</p>
		<div class="mt-8">
			<Signposts tips={data.tips} lang={data.lang} />
		</div>
		<a href={localize(data.lang, '/umgebung')} class="btn-line mt-8">{t.hikes.more}</a>
	</section>
</div>

{#if next}
	<div class="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 border-t border-linie bg-paper px-4 py-3 lg:hidden">
		<p class="text-sm text-stein">
			{t.card.from} <span class="font-serif text-lg text-tanne">{next.weekly ? chf(next.weekly) : chf(next.nightly)}</span>
			{next.weekly ? t.card.perWeek : t.card.perNight}
		</p>
		<a href="#buchen" class="btn-gelb !py-2.5">{t.card.pick}</a>
	</div>
{/if}
