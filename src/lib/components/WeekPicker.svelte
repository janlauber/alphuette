<script lang="ts">
	import Calendar from './Calendar.svelte';
	import Stepper from './Stepper.svelte';
	import { addDays, checkStay, chf, isTaken, toIso, weekday, weekPrice, type Range, type Season } from '#lib/booking.ts';
	import { dict, type Lang } from '#lib/i18n.ts';

	let {
		seasons,
		taken,
		lang,
		checkIn = $bindable(''),
		checkOut = $bindable(''),
		onpick
	}: {
		seasons: Season[];
		taken: Range[];
		lang: Lang;
		checkIn?: string;
		checkOut?: string;
		onpick?: (start: string) => void;
	} = $props();
	const t = $derived(dict[lang]);

	// Saturday-to-Saturday seasons get week tiles; anything else falls back to the day calendar.
	const weekly = $derived(seasons.length > 0 && seasons.every((s) => s.changeover !== null && s.minNights % 7 === 0));

	type Week = { start: string; end: string; taken: boolean; price: number; regular: number };
	const months = $derived.by(() => {
		const today = toIso(Date.now());
		const out: { name: string; weeks: Week[] }[] = [];
		for (const s of seasons) {
			let d = s.start > today ? s.start : addDays(today, 1);
			while (weekday(d) !== s.changeover) d = addDays(d, 1);
			for (; addDays(d, 7) <= s.end; d = addDays(d, 7)) {
				const nights = Array.from({ length: 7 }, (_, i) => addDays(d, i));
				const week = { start: d, end: addDays(d, 7), taken: nights.some((n) => isTaken(n, taken)), price: weekPrice(s, d), regular: s.weekly ?? s.nightly * 7 };
				const name = new Date(d + 'T00:00:00Z').toLocaleDateString(t.locale, { timeZone: 'UTC', month: 'long', year: 'numeric' });
				if (out.at(-1)?.name !== name) out.push({ name, weeks: [] });
				out.at(-1)!.weeks.push(week);
			}
		}
		return out;
	});
	const free = $derived(months.some((m) => m.weeks.some((w) => !w.taken)));
	const all = $derived(months.flatMap((m) => m.weeks));

	// Two steps: tap the arrival week, then set how many weeks with the stepper.
	const count = $derived(checkIn && checkOut ? Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 864e5 / 7) : 0);
	// free weeks in a row from an arrival week, until a taken week or the end of the season
	const run = (start: string) => {
		let n = 0;
		for (let i = all.findIndex((w) => w.start === start); i >= 0 && i < all.length && !all[i].taken && (n === 0 || all[i].start === all[i - 1].end); i++) n++;
		return n;
	};
	const most = $derived(checkIn ? run(checkIn) : 0);

	function pick(w: Week) {
		if (w.taken) return;
		const n = Math.max(1, Math.min(count || 1, run(w.start)));
		checkIn = w.start;
		checkOut = addDays(w.start, 7 * n);
		onpick?.(w.start);
	}
	const weeks = {
		get value() {
			return count;
		},
		set value(n: number) {
			if (checkIn && n >= 1 && n <= most && checkStay(checkIn, addDays(checkIn, 7 * n), seasons, taken) === null) checkOut = addDays(checkIn, 7 * n);
		}
	};

	const day = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString(t.locale, { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });
</script>

{#if weekly}
	<div>
		{#if checkIn && checkOut}
			<!-- step 2 stays in view while the list scrolls -->
			<div class="sticky top-[4.75rem] z-10 rounded-[18px] border-2 border-brand bg-paper px-3 lg:top-0 shadow-[0_6px_12px_-8px_#17251c33]">
				<Stepper label={t.weeks.length} hint={t.weeks.range(day(checkIn), day(checkOut))} bind:value={weeks.value} min={1} max={most} {lang} />
				{#if count === most && most < 8}<p class="-mt-1 pb-2.5 text-xs font-semibold text-accent-dark">{t.weeks.maxed}</p>{/if}
			</div>
		{/if}
		<p class="mt-3 text-sm text-muted">{t.weeks.hint}</p>
		{#if !free}<p class="mt-3 font-semibold">{t.weeks.none}</p>{/if}
		{#each months as m (m.name)}
			<p class="mb-2 mt-5 font-bold text-brand first-letter:uppercase">{m.name}</p>
			<div class="grid grid-cols-2 gap-2">
				{#each m.weeks as w (w.start)}
					{@const selected = !!checkIn && w.start >= checkIn && w.end <= checkOut}
					{@const first = w.start === checkIn}
					<button
						type="button"
						disabled={w.taken}
						aria-pressed={selected}
						onclick={() => pick(w)}
						class="rounded-[18px] border-2 px-3 py-2.5 text-left transition-colors
							{selected ? 'animate-[pop_220ms_ease-out] border-brand bg-brand text-white' : w.taken ? 'taken border-line text-muted' : 'border-line bg-paper hover:border-brand'}"
					>
						<span class="block whitespace-nowrap text-[1.05rem] font-bold tabular-nums">{day(w.start)}</span>
						<span class="block whitespace-nowrap text-sm {selected ? 'text-white/85' : 'text-muted'}">{t.weeks.until(day(w.end))}</span>
						{#if w.taken}
							<span class="chip chip-no mt-1.5">{t.weeks.taken}</span>
						{:else if first}
							<span class="chip mt-1.5 bg-white text-brand">{t.weeks.arrival}</span>
						{:else}
							<span class="mt-1.5 flex items-center gap-1.5 text-sm font-bold {selected ? 'text-white' : 'text-ink'}"><span class="size-2 rounded-full {selected ? 'bg-white' : 'bg-brand'}"></span>{#if w.price < w.regular}<s class="font-normal opacity-70">{chf(w.regular)}</s>{/if}{chf(w.price)}</span>
						{/if}
					</button>
				{/each}
			</div>
		{/each}
	</div>
{:else}
	<Calendar {seasons} {taken} {lang} bind:checkIn bind:checkOut />
{/if}

<style>
	/* taken weeks are hatched, so they read as "not available" at a glance */
	.taken {
		background: repeating-linear-gradient(-45deg, var(--color-off) 0 6px, #fff 6px 12px);
	}
</style>
