<script lang="ts">
	import Bus from '@lucide/svelte/icons/bus';
	import { dict, type Lang } from '#lib/i18n.ts';

	type Departure = { time: string; arrival: string; line: string; delay: number };
	let { list, winter, lang, route }: { list: Departure[]; winter: boolean; lang: Lang; route: 'toHut' | 'fromHut' } = $props();
	const t = $derived(dict[lang]);
	const title = $derived(winter ? t.transit[route === 'toHut' ? 'toWinter' : 'fromWinter'] : t.transit[route]);
</script>

<div>
	<p class="flex items-center gap-2 font-semibold"><Bus size={18} class="text-fir" aria-hidden="true" />{title}</p>
	{#if winter}<p class="mt-1 text-sm text-muted">{t.transit.winter}</p>{/if}
	{#if list.length}
		<ul class="mt-2 divide-y divide-line">
			{#each list as d (d.time + d.line)}
				<li class="flex items-center justify-between py-2 tabular-nums">
					<span><strong>{d.time}</strong> <span class="text-muted">– {d.arrival}</span></span>
					<span class="flex items-center gap-2 text-sm">
						{#if d.delay}<span class="font-semibold text-geranium">{t.transit.late(d.delay)}</span>{/if}
						<span class="rounded-md bg-sand px-1.5 py-0.5 font-semibold">{d.line}</span>
					</span>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mt-2 text-muted">{t.transit.none}</p>
	{/if}
	<p class="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted">
		<a href="https://www.sbb.ch/" class="underline" target="_blank" rel="noopener">{t.transit.timetable}</a>
		<span>{t.transit.source}</span>
	</p>
</div>
