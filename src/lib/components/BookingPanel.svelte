<script lang="ts">
	import Quote from './Quote.svelte';
	import Stepper from './Stepper.svelte';
	import WeekPicker from './WeekPicker.svelte';
	import { chf, type Guests, type Range, type Rates, type Season } from '#lib/booking.ts';
	import { dict, localize, type Lang } from '#lib/i18n.ts';
	import { track } from '#lib/track.ts';

	let {
		seasons,
		taken,
		rates,
		lang,
		checkIn = $bindable(''),
		checkOut = $bindable(''),
		guests = $bindable({ adults: 2, children: 0, infants: 0, linen: 0 })
	}: {
		seasons: Season[];
		taken: Range[];
		rates: Rates;
		lang: Lang;
		checkIn?: string;
		checkOut?: string;
		guests?: Guests;
	} = $props();
	const t = $derived(dict[lang]);
	const people = $derived(guests.adults + guests.children + guests.infants);
	const next = $derived(seasons[0]);
</script>

<form id="buchen-form" method="get" action={localize(lang, '/anfrage')} class="flex flex-col gap-4">
	{#if next}
		<p class="text-muted">
			{t.card.from} <mark class="rounded-lg bg-accent-soft px-1.5 text-[1.9rem] font-bold tracking-tight text-ink">{chf(next.weekly ?? next.nightly)}</mark>
			{next.weekly ? t.card.perWeek : t.card.perNight}
		</p>
	{/if}

	<div class="lg:max-h-[min(46vh,420px)] lg:overflow-y-auto lg:pr-1">
		<WeekPicker {seasons} {taken} {lang} bind:checkIn bind:checkOut onpick={() => track('week_selected')} />
	</div>
	{#if checkIn}
		<button type="button" class="self-start text-sm font-semibold text-brand underline" onclick={() => ((checkIn = ''), (checkOut = ''))}>{t.card.clear}</button>
	{/if}

	<div class="divide-y-2 divide-line border-y-2 border-line">
		<Stepper label={t.card.adults} hint={t.card.adultsHint} bind:value={guests.adults} min={1} max={rates.maxGuests - guests.children - guests.infants} {lang} />
		<Stepper label={t.card.children} hint={t.card.childrenHint} bind:value={guests.children} max={rates.maxGuests - guests.adults - guests.infants} {lang} />
		<Stepper label={t.card.infants} hint={t.card.infantsHint} bind:value={guests.infants} max={rates.maxGuests - guests.adults - guests.children} {lang} />
		<Stepper label={t.card.linen} hint={t.card.linenHint(chf(rates.linen))} bind:value={guests.linen} max={people} {lang} />
	</div>

	<input type="hidden" name="in" value={checkIn} />
	<input type="hidden" name="out" value={checkOut} />
	<input type="hidden" name="a" value={guests.adults} />
	<input type="hidden" name="c" value={guests.children} />
	<input type="hidden" name="i" value={guests.infants} />
	<input type="hidden" name="l" value={Math.min(guests.linen, people)} />

	{#if checkIn && checkOut}
		<Quote {checkIn} {checkOut} guests={{ ...guests, linen: Math.min(guests.linen, people) }} {seasons} {rates} {taken} {lang} />
	{/if}

	<button class="btn-primary w-full" disabled={!checkIn || !checkOut}>{t.card.submit}</button>
	<p class="-mt-1 text-center text-sm text-muted">{t.card.noPay}</p>
</form>
