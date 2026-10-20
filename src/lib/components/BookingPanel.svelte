<script lang="ts">
	import Quote from './Quote.svelte';
	import Stepper from './Stepper.svelte';
	import WeekPicker from './WeekPicker.svelte';
	import { chf, type Guests, type Range, type Rates, type Season } from '#lib/booking.ts';
	import { dict, localize, type Lang } from '#lib/i18n.ts';
	import { track } from '#lib/track.ts';

	// Wide: the season as a strip on the left, guests and price on the right (tiles on phones).
	let {
		seasons,
		taken,
		rates,
		lang,
		wide = false,
		checkIn = $bindable(''),
		checkOut = $bindable(''),
		guests = $bindable({ adults: 2, children: 0, infants: 0, linen: 0 })
	}: {
		seasons: Season[];
		taken: Range[];
		rates: Rates;
		lang: Lang;
		wide?: boolean;
		checkIn?: string;
		checkOut?: string;
		guests?: Guests;
	} = $props();
	const t = $derived(dict[lang]);
	const people = $derived(guests.adults + guests.children + guests.infants);
	const next = $derived(seasons[0]);
	const onpick = () => track('week_selected');
</script>

{#snippet price()}
	{#if next}
		<p class="text-muted">
			{t.card.from} <mark class="rounded-lg bg-accent-soft px-1.5 text-[1.9rem] font-bold tracking-tight text-ink">{chf(next.weekly ?? next.nightly)}</mark>
			{next.weekly ? t.card.perWeek : t.card.perNight}
		</p>
	{/if}
{/snippet}

{#snippet clear()}
	{#if checkIn}
		<button type="button" class="self-start text-sm font-semibold text-brand underline" onclick={() => ((checkIn = ''), (checkOut = ''))}>{t.card.clear}</button>
	{/if}
{/snippet}

{#snippet rest()}
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
{/snippet}

{#if wide}
	<form id="buchen-form" method="get" action={localize(lang, '/anfrage')} class="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
		<div class="flex min-w-0 flex-col gap-4">
			{@render price()}
			<div class="hidden sm:block"><WeekPicker {seasons} {taken} {lang} view="strip" bind:checkIn bind:checkOut {onpick} /></div>
			<div class="sm:hidden"><WeekPicker {seasons} {taken} {lang} bind:checkIn bind:checkOut {onpick} /></div>
			{@render clear()}
		</div>
		<div class="flex flex-col gap-4">
			<h3 class="text-[1.9rem] text-brand">{t.still.stay}</h3>
			{@render rest()}
		</div>
	</form>
{:else}
	<form id="buchen-form" method="get" action={localize(lang, '/anfrage')} class="flex flex-col gap-4">
		{@render price()}
		<div class="lg:-mx-1 lg:max-h-[min(50vh,460px)] lg:overflow-y-auto lg:px-1 lg:pb-1 lg:[scrollbar-gutter:stable] lg:[scrollbar-width:thin]">
			<WeekPicker {seasons} {taken} {lang} bind:checkIn bind:checkOut {onpick} />
		</div>
		{@render clear()}
		{@render rest()}
	</form>
{/if}
