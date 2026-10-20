<script lang="ts">
	import Calendar from './Calendar.svelte';
	import Stepper from './Stepper.svelte';
	import { addDays, checkStay, chf, isTaken, toIso, weekday, type Range, type Season } from '#lib/booking.ts';
	import { dict, type Lang } from '#lib/i18n.ts';
	import { seen } from '#lib/seen.ts';

	// `strip` shows the whole season as one row of bars (wide screens), `list` as tiles per month.
	let {
		seasons,
		taken,
		lang,
		view = 'list',
		checkIn = $bindable(''),
		checkOut = $bindable(''),
		onpick
	}: {
		seasons: Season[];
		taken: Range[];
		lang: Lang;
		view?: 'list' | 'strip';
		checkIn?: string;
		checkOut?: string;
		onpick?: () => void;
	} = $props();
	const t = $derived(dict[lang]);

	// Saturday-to-Saturday seasons get week tiles; anything else falls back to the day calendar.
	const weekly = $derived(seasons.length > 0 && seasons.every((s) => s.changeover !== null && s.minNights % 7 === 0));

	type Week = { start: string; end: string; taken: boolean; price: number };
	const months = $derived.by(() => {
		const today = toIso(Date.now());
		const out: { name: string; weeks: Week[] }[] = [];
		for (const s of seasons) {
			let d = s.start > today ? s.start : addDays(today, 1);
			while (weekday(d) !== s.changeover) d = addDays(d, 1);
			for (; addDays(d, 7) <= s.end; d = addDays(d, 7)) {
				const nights = Array.from({ length: 7 }, (_, i) => addDays(d, i));
				const week = { start: d, end: addDays(d, 7), taken: nights.some((n) => isTaken(n, taken)), price: s.weekly ?? s.nightly * 7 };
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
		onpick?.();
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

{#if weekly && view === 'strip'}
	<div>
		{#if !free}<p class="mb-3 font-semibold">{t.weeks.none}</p>{/if}
		<div class="overflow-x-auto pb-2">
			<div {@attach seen} class="strip grid min-w-[36rem] items-end gap-x-[3px] gap-y-2" style="grid-template-columns: repeat({all.length}, minmax(0, 1fr))">
				{#each all as w, i (w.start)}
					{@const selected = !!checkIn && w.start >= checkIn && w.end <= checkOut}
					<button
						type="button"
						disabled={w.taken}
						aria-pressed={selected}
						aria-label="{day(w.start)} {t.weeks.until(day(w.end))}, {w.taken ? t.weeks.taken : chf(w.price)}"
						title="{day(w.start)} {t.weeks.until(day(w.end))}"
						onclick={() => pick(w)}
						style="--i: {i}"
						class="bar h-24 origin-bottom transition-[background-color,height] duration-200 {selected ? 'h-28 bg-brand' : w.taken ? 'taken cursor-not-allowed' : 'cursor-pointer bg-accent hover:h-28 hover:bg-accent-dark'}"
					></button>
				{/each}
				{#each months as m (m.name)}
					<span class="border-t-2 border-brand pt-1 text-sm font-semibold first-letter:uppercase" style="grid-column: span {m.weeks.length}">{m.name.split(' ')[0]}</span>
				{/each}
			</div>
		</div>
		<p class="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
			<span class="flex items-center gap-2"><span class="size-3 bg-accent"></span>{t.weeks.free}</span>
			<span class="flex items-center gap-2"><span class="taken size-3"></span>{t.weeks.taken}</span>
			<span class="flex items-center gap-2"><span class="size-3 bg-brand"></span>{t.still.yours}</span>
		</p>
		{#if checkIn && checkOut}
			<div class="mt-5 border-y-2 border-brand">
				<Stepper label={t.weeks.length} hint={t.weeks.range(day(checkIn), day(checkOut))} bind:value={weeks.value} min={1} max={most} {lang} />
				{#if count === most && most < 8}<p class="-mt-1 pb-2.5 text-xs font-semibold text-accent-dark">{t.weeks.maxed}</p>{/if}
			</div>
		{:else}
			<p class="mt-5 text-muted">{t.weeks.hint}</p>
		{/if}
	</div>
{:else if weekly}
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
							<span class="mt-1.5 flex items-center gap-1.5 text-sm font-bold {selected ? 'text-white' : 'text-ink'}"><span class="size-2 rounded-full {selected ? 'bg-white' : 'bg-brand'}"></span>{chf(w.price)}</span>
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
	/* the bars grow out of the month line, one after the other, the first time the strip is seen */
	.strip:global([data-unseen]) > .bar {
		transform: scaleY(0);
	}
	.strip:not([data-unseen]) > .bar {
		animation: grow 600ms cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
		animation-delay: calc(var(--i) * 18ms);
	}
	@keyframes grow {
		from {
			transform: scaleY(0);
		}
	}
</style>
