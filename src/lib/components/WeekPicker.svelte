<script lang="ts">
	import Calendar from './Calendar.svelte';
	import { addDays, checkStay, chf, isTaken, toIso, weekday, type Range, type Season } from '#lib/booking.ts';
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

	function pick(w: Week) {
		if (w.taken) return;
		// A later week right after a free stretch extends the stay, everything else starts over.
		if (checkIn && checkOut && w.start >= checkOut && checkStay(checkIn, w.end, seasons, taken) === null) checkOut = w.end;
		else {
			checkIn = w.start;
			checkOut = w.end;
		}
		onpick?.();
	}

	const day = (iso: string) =>
		new Date(iso + 'T00:00:00Z').toLocaleDateString(t.locale, { timeZone: 'UTC', day: 'numeric', month: 'short' });
</script>

{#if weekly}
	<div>
		<p class="text-sm text-muted">{t.weeks.hint}</p>
		{#if !free}<p class="mt-3 font-semibold">{t.weeks.none}</p>{/if}
		{#each months as m (m.name)}
			<p class="mb-2 mt-4 text-sm font-bold first-letter:uppercase">{m.name}</p>
			<div class="grid grid-cols-2 gap-2">
				{#each m.weeks as w (w.start)}
					{@const selected = !!checkIn && w.start >= checkIn && w.end <= checkOut}
					<button
						type="button"
						disabled={w.taken}
						aria-pressed={selected}
						onclick={() => pick(w)}
						class="rounded-[14px] border-[1.5px] px-3 py-2.5 text-left transition-colors
							{selected ? 'border-geranium bg-geranium text-white' : w.taken ? 'border-transparent bg-sand/70 text-muted' : 'border-line bg-paper hover:border-ink'}"
					>
						<span class="block font-bold tabular-nums {w.taken ? 'line-through decoration-muted/60' : ''}">{day(w.start)} – {day(w.end)}</span>
						<span class="block text-sm {selected ? 'text-white/90' : 'text-muted'}">{w.taken ? t.weeks.taken : chf(w.price)}</span>
					</button>
				{/each}
			</div>
		{/each}
	</div>
{:else}
	<Calendar {seasons} {taken} {lang} bind:checkIn bind:checkOut />
{/if}
