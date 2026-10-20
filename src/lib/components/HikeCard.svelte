<script lang="ts">
	import Baby from '@lucide/svelte/icons/baby';
	import Clock from '@lucide/svelte/icons/clock';
	import House from '@lucide/svelte/icons/house';
	import Mountain from '@lucide/svelte/icons/mountain';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Route from '@lucide/svelte/icons/route';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import Profile from './Profile.svelte';
	import TrailBadge from './TrailBadge.svelte';
	import { dict, localize, type Lang } from '#lib/i18n.ts';

	export type Hike = {
		slug: string; name: string; time: string; alpine: boolean; text: string; category: string; sac: string;
		durationMin: number | null; highest: number | null; family: boolean; loop: boolean; fromHut: boolean;
		profile: [number, number][] | null; distanceM: number | null; ascentM: number | null; descentM: number | null;
	};
	let { hike, lang, dim = false, focus = false, onhover }: { hike: Hike; lang: Lang; dim?: boolean; focus?: boolean; onhover?: (slug: string | null) => void } = $props();
	const t = $derived(dict[lang]);
	const km = (m: number) => (m / 1000).toLocaleString(t.locale, { maximumFractionDigits: 1 }) + ' km';
</script>

<a
	href={localize(lang, `/wanderungen/${hike.slug}`)}
	class="card relative flex h-full flex-col gap-3 p-5 no-underline transition duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-[0_6px_0_var(--color-brand)]
		{focus ? '-translate-y-1 border-brand shadow-[0_6px_0_var(--color-brand)]' : ''} {dim ? 'opacity-35 grayscale' : ''}"
	onpointerenter={() => onhover?.(hike.slug)}
	onpointerleave={() => onhover?.(null)}
>
	<div class="flex items-start justify-between gap-3">
		<p class="text-xl font-bold leading-tight text-brand">{hike.name}</p>
		<div class="flex shrink-0 gap-1 text-brand">
			{#if hike.fromHut}<span title={t.hikes.fromHut} class="grid size-7 place-items-center rounded-full bg-brand text-white"><House size={14} strokeWidth={2.5} /><span class="sr-only">{t.hikes.fromHut}</span></span>{/if}
			{#if hike.loop}<span title={t.hikes.loop} class="grid size-7 place-items-center rounded-full border-2 border-brand"><RefreshCw size={13} strokeWidth={2.5} /><span class="sr-only">{t.hikes.loop}</span></span>{/if}
			{#if hike.family}<span title={t.hikes.family} class="grid size-7 place-items-center rounded-full border-2 border-brand"><Baby size={14} strokeWidth={2.5} /><span class="sr-only">{t.hikes.family}</span></span>{/if}
		</div>
	</div>
	<div><TrailBadge category={hike.category} label={t.hikes.category[hike.category] + (hike.sac ? ` · ${hike.sac}` : '')} /></div>
	{#if hike.profile}<Profile profile={hike.profile} height={64} labels={false} title={hike.name} />{/if}
	<div class="mt-auto grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-semibold text-ink">
		{#if hike.durationMin || hike.time}<span class="flex items-center gap-1.5 whitespace-nowrap"><Clock size={16} strokeWidth={2.25} class="text-brand" aria-hidden="true" />{hike.durationMin ? t.hikes.hours(hike.durationMin) : hike.time}</span>{/if}
		{#if hike.distanceM}<span class="flex items-center gap-1.5 whitespace-nowrap"><Route size={16} strokeWidth={2.25} class="text-brand" aria-hidden="true" />{km(hike.distanceM)}</span>{/if}
		{#if hike.ascentM}<span class="flex items-center gap-1.5 whitespace-nowrap"><TrendingUp size={16} strokeWidth={2.25} class="text-brand" aria-hidden="true" />{hike.ascentM} m</span>{/if}
		{#if hike.highest}<span class="flex items-center gap-1.5 whitespace-nowrap"><Mountain size={16} strokeWidth={2.25} class="text-brand" aria-hidden="true" />{hike.highest} m</span>{/if}
	</div>
</a>
