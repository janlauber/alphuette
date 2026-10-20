<script lang="ts">
	import Calendar from './Calendar.svelte';
	import Stepper from './Stepper.svelte';
	import Quote from './Quote.svelte';
	import { chf, type Range, type Rates, type Season } from '#lib/booking.ts';
	import { dict, fmtDate, localize, type Lang } from '#lib/i18n.ts';

	let { seasons, taken, rates, lang }: { seasons: Season[]; taken: Range[]; rates: Rates; lang: Lang } = $props();
	const t = $derived(dict[lang]);

	let checkIn = $state('');
	let checkOut = $state('');
	let adults = $state(2);
	let children = $state(0);
	let infants = $state(0);
	let linen = $state(0);
	const people = $derived(adults + children + infants);

	const next = $derived(seasons[0]);
	const from = $derived(
		next ? (next.weekly ? `${chf(next.weekly)} ${t.card.perWeek}` : `${chf(next.nightly)} ${t.card.perNight}`) : ''
	);
</script>

<form method="get" action={localize(lang, '/anfrage')} class="rounded-[3px] border border-linie bg-paper p-5 shadow-[0_1px_0_#d6d9d0,0_12px_32px_-20px_#1e2b2640] sm:p-6">
	{#if from}
		<p class="text-stein">{t.card.from} <span class="font-serif text-2xl text-tanne">{from}</span></p>
	{/if}

	<div class="mt-4 grid grid-cols-2 overflow-hidden rounded-[3px] border border-[#b9beb4] text-sm">
		<div class="border-r border-[#b9beb4] px-3 py-2">
			<span class="block text-xs font-semibold">{t.card.checkIn}</span>
			<span class={checkIn ? '' : 'text-stein'}>{checkIn ? fmtDate(checkIn, lang, { year: undefined, month: 'short' }) : t.card.pick}</span>
		</div>
		<div class="px-3 py-2">
			<span class="block text-xs font-semibold">{t.card.checkOut}</span>
			<span class={checkOut ? '' : 'text-stein'}>{checkOut ? fmtDate(checkOut, lang, { year: undefined, month: 'short' }) : t.card.pick}</span>
		</div>
	</div>

	<div class="mt-4">
		<Calendar {seasons} {taken} {lang} bind:checkIn bind:checkOut />
		{#if checkIn}
			<button type="button" class="text-sm underline" onclick={() => ((checkIn = ''), (checkOut = ''))}>{t.card.clear}</button>
		{/if}
	</div>

	<div class="mt-4 divide-y divide-linie border-y border-linie">
		<Stepper label={t.card.adults} hint={t.card.adultsHint} bind:value={adults} min={1} max={rates.maxGuests - children - infants} {lang} />
		<Stepper label={t.card.children} hint={t.card.childrenHint} bind:value={children} max={rates.maxGuests - adults - infants} {lang} />
		<Stepper label={t.card.infants} hint={t.card.infantsHint} bind:value={infants} max={rates.maxGuests - adults - children} {lang} />
		<Stepper label={t.card.linen} hint={t.card.linenHint(chf(rates.linen))} bind:value={linen} max={people} {lang} />
	</div>

	<input type="hidden" name="in" value={checkIn} />
	<input type="hidden" name="out" value={checkOut} />
	<input type="hidden" name="a" value={adults} />
	<input type="hidden" name="c" value={children} />
	<input type="hidden" name="i" value={infants} />
	<input type="hidden" name="l" value={Math.min(linen, people)} />

	{#if checkIn && checkOut}
		<div class="mt-4">
			<Quote {checkIn} {checkOut} guests={{ adults, children, infants, linen: Math.min(linen, people) }} {seasons} {rates} {taken} {lang} />
		</div>
	{/if}

	<button class="btn-gelb mt-5 w-full" disabled={!checkIn || !checkOut}>{t.card.submit}</button>
	<p class="mt-2 text-center text-sm text-stein">{t.card.noPay}</p>
</form>
