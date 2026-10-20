<script lang="ts">
	import type { Hike } from './HikeCard.svelte';
	import { dict, localize, type Lang } from '#lib/i18n.ts';
	import { seen } from '#lib/seen.ts';

	// Hikes as rows of elevation profiles on one shared scale, so length and climb compare at a glance.
	let { hikes, lang }: { hikes: Hike[]; lang: Lang } = $props();
	const t = $derived(dict[lang]);
	const points = $derived(hikes.flatMap((h) => h.profile ?? []));
	const far = $derived(Math.max(1, ...points.map((p) => p[0])));
	const lo = $derived(Math.min(...points.map((p) => p[1])));
	const hi = $derived(Math.max(lo + 1, ...points.map((p) => p[1])));
	const W = 600, H = 60;
	const xy = ([d, e]: [number, number]) => `${((d / far) * W).toFixed(1)} ${(H - ((e - lo) / (hi - lo)) * H).toFixed(1)}`;
	const km = (m: number) => (m / 1000).toLocaleString(t.locale, { maximumFractionDigits: 1 }) + ' km';
	const tags = (h: Hike) => [h.fromHut && t.hikes.fromHut, h.loop && t.hikes.loop, h.family && t.hikes.family, h.distanceM && km(h.distanceM)].filter(Boolean).join(', ');
</script>

<ul {@attach seen} class="hikes border-b-2 border-brand">
	{#each hikes as h, i (h.slug)}
		<li class="border-t-2 border-brand">
			<a href={localize(lang, `/wanderungen/${h.slug}`)} class="group grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-x-5 gap-y-2 py-4 no-underline sm:grid-cols-[8rem_minmax(0,15rem)_minmax(0,1fr)] sm:gap-x-8">
				<span class="font-display text-[1.9rem] leading-none text-brand tabular-nums">{h.durationMin ? t.hikes.hours(h.durationMin) : h.time}</span>
				<span>
					<span class="block text-lg font-bold leading-tight text-ink group-hover:underline">{h.name}</span>
					<span class="text-sm text-muted">{tags(h)}</span>
				</span>
				{#if h.profile?.length}
					{@const path = 'M' + h.profile.map(xy).join('L')}
					<svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" class="col-span-2 h-12 w-full overflow-visible sm:col-span-1" aria-hidden="true">
						<path d="{path}L{xy([h.profile.at(-1)![0], lo])}L0 {H}Z" class="fill-accent-soft transition-colors group-hover:fill-accent" />
						<path d={path} pathLength="1" fill="none" stroke="var(--color-brand)" stroke-width="2.5" stroke-linejoin="round" class="draw" style="--i: {i}" />
					</svg>
				{/if}
			</a>
		</li>
	{/each}
</ul>
<p class="mt-2 text-sm text-muted">{t.still.scale}</p>

<style>
	/* each profile draws itself from the start of the route, one after the other */
	.draw {
		stroke-dasharray: 1;
		transition: stroke-dashoffset 1.4s ease-out;
		transition-delay: calc(var(--i) * 150ms);
	}
	.hikes:global([data-unseen]) .draw {
		stroke-dashoffset: 1;
	}
</style>
