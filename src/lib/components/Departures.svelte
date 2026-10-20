<script lang="ts">
	import Bus from '@lucide/svelte/icons/bus';
	import { dict, type Lang } from '#lib/i18n.ts';

	type Departure = { time: string; arrival: string; line: string; delay: number };
	let { list, winter, lang, route }: { list: Departure[]; winter: boolean; lang: Lang; route: 'toHut' | 'fromHut' } = $props();
	const t = $derived(dict[lang]);
	const SBB: Record<Lang, string> = { de: 'de/kaufen', en: 'en/buying', fr: 'fr/acheter', it: 'it/acquistare' };
	const title = $derived(winter ? t.transit[route === 'toHut' ? 'toWinter' : 'fromWinter'] : t.transit[route]);
	// SBB timetable with both stops filled in
	const sbb = $derived.by(() => {
		const valley = 'Reichenbach im Kandertal', hut = winter ? 'Kiental, Ramslauenen' : 'Kiental, Abzw. Spiggengrund';
		const [von, nach] = route === 'toHut' ? [valley, hut] : [hut, valley];
		return `https://www.sbb.ch/${SBB[lang]}/pages/fahrplan/fahrplan.xhtml?von=${encodeURIComponent(von)}&nach=${encodeURIComponent(nach)}`;
	});
</script>

<div>
	<p class="flex items-center gap-2.5 font-bold text-brand"><span class="grid size-9 place-items-center rounded-full bg-brand text-white"><Bus size={18} strokeWidth={2.25} aria-hidden="true" /></span>{title}</p>
	{#if winter}<p class="mt-1 text-sm text-muted">{t.transit.winter}</p>{/if}
	{#if list.length}
		<ul class="mt-3 divide-y-2 divide-dashed divide-line">
			{#each list as d (d.time + d.line)}
				<li class="flex items-center justify-between py-2 tabular-nums">
					<span><strong class="text-lg text-brand">{d.time}</strong> <span class="text-muted">→ {d.arrival}</span></span>
					<span class="flex items-center gap-2 text-sm">
						{#if d.delay}<span class="font-semibold text-accent-dark">{t.transit.late(d.delay)}</span>{/if}
						<span class="rounded-full border-2 border-brand px-2 py-0.5 text-xs font-bold text-brand">{d.line}</span>
					</span>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mt-2 text-muted">{t.transit.none}</p>
	{/if}
	<p class="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted">
		<a href={sbb} class="font-semibold text-brand underline" target="_blank" rel="noopener">{t.transit.timetable}</a>
		<span>{t.transit.source}</span>
	</p>
</div>
