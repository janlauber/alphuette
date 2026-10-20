<script lang="ts">
	import { chf } from '#lib/booking.ts';

	// One row per year, January to December; each season is a bar you can tap to edit it.
	type S = { id: number; name: string; start: string; end: string; weekly: number | null; nightly: number };
	let { seasons, selected, today, onpick }: { seasons: S[]; selected: number | 'new' | null; today: string; onpick: (id: number) => void } = $props();

	const t = (iso: string) => new Date(iso + 'T00:00:00Z').getTime();
	const thisYear = $derived(Number(today.slice(0, 4)));
	const months = Array.from({ length: 12 }, (_, m) => new Date(Date.UTC(2026, m, 1)).toLocaleDateString('de-CH', { month: 'short', timeZone: 'UTC' }).replace('.', ''));

	const rows = $derived.by(() => {
		const years = new Set<number>();
		for (const s of seasons) {
			const last = new Date(t(s.end) - 86400_000).getUTCFullYear();
			for (let y = Number(s.start.slice(0, 4)); y <= last; y++) if (y >= thisYear - 1) years.add(y);
		}
		return [...years].sort().map((year) => {
			const from = Date.UTC(year, 0, 1), to = Date.UTC(year + 1, 0, 1);
			const pct = (ms: number) => ((Math.min(Math.max(ms, from), to) - from) / (to - from)) * 100;
			const bars = seasons
				.filter((s) => t(s.start) < to && t(s.end) > from)
				.map((s) => ({ s, left: pct(t(s.start)), width: pct(t(s.end)) - pct(t(s.start)), past: s.end <= today }));
			return { year, bars, todayAt: year === thisYear ? pct(t(today)) : null };
		});
	});
	const price = (s: S) => (s.weekly !== null ? `${chf(s.weekly)} pro Woche` : `${chf(s.nightly)} pro Nacht`);
</script>

{#if rows.length}
	<div class="card overflow-hidden px-3 pb-3 pt-2 sm:px-5 sm:pb-5">
		{#each rows as row (row.year)}
			<div class="mt-3 grid grid-cols-[3rem_minmax(0,1fr)] items-end gap-2 sm:grid-cols-[3.5rem_minmax(0,1fr)]">
				<p class="pb-3 text-lg font-bold tabular-nums {row.year < thisYear ? 'text-off-text' : 'text-brand'}">{row.year}</p>
				<div>
					<div class="grid grid-cols-12 text-[11px] font-semibold uppercase text-muted sm:text-xs" aria-hidden="true">
						{#each months as m, i (i)}<span class="truncate border-l-2 border-line pl-1"><span class="sm:hidden">{m[0]}</span><span class="hidden sm:inline">{m}</span></span>{/each}
					</div>
					<div class="relative mt-1 h-14 rounded-[14px] bg-wash">
						{#each row.bars as b (b.s.id)}
							<button
								type="button"
								onclick={() => onpick(b.s.id)}
								class="absolute top-1.5 h-11 min-w-11 overflow-hidden rounded-[12px] px-2 text-left text-xs font-bold leading-tight transition hover:brightness-110 sm:text-sm
									{b.past ? 'bg-off text-off-text' : 'bg-brand text-white'} {selected === b.s.id ? 'ring-4 ring-accent ring-offset-2 ring-offset-wash' : ''}"
								style="left: {b.left}%; width: {b.width}%"
								aria-label="{b.s.name}, {price(b.s)}. Bearbeiten"
								aria-pressed={selected === b.s.id}
							>
								<span class="block truncate">{b.s.name}</span>
								<span class="block truncate font-semibold opacity-85">{price(b.s)}</span>
							</button>
						{/each}
						{#if row.todayAt !== null}
							<span class="pointer-events-none absolute -bottom-1 -top-1 border-l-2 border-dashed border-ink" style="left: {row.todayAt}%" aria-hidden="true">
								<span class="absolute -top-4 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-1.5 text-[10px] font-bold text-white">heute</span>
							</span>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
