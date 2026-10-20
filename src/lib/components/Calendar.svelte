<script lang="ts">
	import { addDays, checkStay, isTaken, seasonOf, toIso, weekday, type Range, type Season } from '#lib/booking.ts';
	import { dict, type Lang } from '#lib/i18n.ts';

	let {
		seasons,
		taken,
		lang,
		checkIn = $bindable(''),
		checkOut = $bindable(''),
		months = 1
	}: { seasons: Season[]; taken: Range[]; lang: Lang; checkIn?: string; checkOut?: string; months?: number } = $props();

	const t = $derived(dict[lang]);
	const today = toIso(Date.now());

	// First month that still has a bookable night.
	const firstOpen = () => {
		const s = seasons.find((s) => s.end > today);
		const start = s && s.start > today ? s.start : today;
		return (checkIn || start).slice(0, 7);
	};
	let month = $state(firstOpen());
	const lastMonth = $derived(seasons.length ? addDays(seasons[seasons.length - 1].end, -1).slice(0, 7) : month);
	const shift = (ym: string, n: number) => {
		const d = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7) - 1 + n, 1));
		return d.toISOString().slice(0, 7);
	};
	const shown = $derived(Array.from({ length: months }, (_, i) => shift(month, i)));

	/** Days of a month grid, Monday first, with leading blanks. */
	const grid = (ym: string) => {
		const first = ym + '-01';
		const lead = (weekday(first) + 6) % 7;
		const days: (string | null)[] = Array(lead).fill(null);
		for (let d = first; d.startsWith(ym); d = addDays(d, 1)) days.push(d);
		return days;
	};
	const weekdays = $derived(
		Array.from({ length: 7 }, (_, i) =>
			new Date(Date.UTC(2024, 0, 1 + i)).toLocaleDateString(t.locale, { timeZone: 'UTC', weekday: 'short' })
		)
	);
	const monthName = (ym: string) =>
		new Date(ym + '-01T00:00:00Z').toLocaleDateString(t.locale, { timeZone: 'UTC', month: 'long', year: 'numeric' });

	const canCheckIn = (d: string) => {
		const s = seasonOf(d, seasons);
		return d > today && !!s && !isTaken(d, taken) && (s.changeover === null || weekday(d) === s.changeover);
	};
	const picking = $derived(checkIn && !checkOut ? 'out' : 'in');
	const enabled = (d: string) =>
		picking === 'out' ? (d > checkIn && checkStay(checkIn, d, seasons, taken) === null) || canCheckIn(d) : canCheckIn(d);

	function pick(d: string) {
		if (picking === 'out' && d > checkIn && checkStay(checkIn, d, seasons, taken) === null) checkOut = d;
		else {
			checkIn = d;
			checkOut = '';
		}
	}

	const label = (d: string) =>
		new Date(d + 'T00:00:00Z').toLocaleDateString(t.locale, {
			timeZone: 'UTC',
			weekday: 'long',
			day: 'numeric',
			month: 'long'
		}) + (isTaken(d, taken) ? `, ${t.calendar.taken}` : '');
</script>

<div class="select-none">
	<div class="flex items-center justify-between gap-2">
		<button
			type="button"
			class="grid size-9 place-items-center rounded-full hover:bg-sand disabled:opacity-25"
			aria-label={t.calendar.prev}
			disabled={month <= today.slice(0, 7)}
			onclick={() => (month = shift(month, -1))}
		>
			<svg viewBox="0 0 16 16" class="size-4" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.6" /></svg>
		</button>
		<div class="flex flex-1 justify-around">
			{#each shown as ym (ym)}
				<p class="font-semibold first-letter:uppercase" aria-live="polite">{monthName(ym)}</p>
			{/each}
		</div>
		<button
			type="button"
			class="grid size-9 place-items-center rounded-full hover:bg-sand disabled:opacity-25"
			aria-label={t.calendar.next}
			disabled={shift(month, months - 1) >= lastMonth}
			onclick={() => (month = shift(month, 1))}
		>
			<svg viewBox="0 0 16 16" class="size-4" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" /></svg>
		</button>
	</div>

	<div class="mt-3 grid gap-6" style="grid-template-columns: repeat({months}, minmax(0, 1fr))">
		{#each shown as ym (ym)}
			<div>
				<div class="grid grid-cols-7 text-center text-xs text-muted" aria-hidden="true">
					{#each weekdays as w (w)}<span class="pb-1">{w.slice(0, 2)}</span>{/each}
				</div>
				<div class="grid grid-cols-7" role="group" aria-label={monthName(ym)}>
					{#each grid(ym) as d, i (d ?? 'blank' + i)}
						{#if d}
							{@const inRange = checkIn && checkOut && d > checkIn && d < checkOut}
							{@const edge = d === checkIn || d === checkOut}
							<button
								type="button"
								class="relative aspect-square text-[0.95rem] tabular-nums transition-colors
									{edge ? 'z-10 rounded-full bg-geranium font-semibold text-white' : ''}
									{inRange ? 'bg-blush' : ''}
									{!edge && enabled(d) ? 'rounded-full hover:outline hover:outline-1 hover:outline-tanne' : ''}
									{!edge && !enabled(d) ? 'text-muted/40' : ''}
									{isTaken(d, taken) && !edge ? 'line-through decoration-muted/60' : ''}"
								disabled={!enabled(d) && !edge}
								aria-pressed={edge}
								aria-label={label(d)}
								onclick={() => pick(d)}
							>
								{+d.slice(8)}
							</button>
						{:else}
							<span></span>
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	</div>
	<p class="mt-2 min-h-6 text-sm text-muted" aria-live="polite">
		{picking === 'out' ? t.calendar.pickOut : !checkIn ? t.calendar.pickIn : ''}
	</p>
</div>
