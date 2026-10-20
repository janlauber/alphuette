<script lang="ts">
	import Clock from '@lucide/svelte/icons/clock';
	import Route from '@lucide/svelte/icons/route';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import Profile from './Profile.svelte';
	import { dict, localize, type Lang } from '#lib/i18n.ts';

	export type Hike = {
		slug: string; name: string; time: string; alpine: boolean; text: string;
		profile: [number, number][] | null; distanceM: number | null; ascentM: number | null; descentM: number | null;
	};
	let { hike, lang }: { hike: Hike; lang: Lang } = $props();
	const t = $derived(dict[lang]);
	const km = (m: number) => (m / 1000).toLocaleString(t.locale, { maximumFractionDigits: 1 }) + ' km';
</script>

<a href={localize(lang, `/wanderungen/${hike.slug}`)} class="card flex h-full flex-col gap-3 p-4 no-underline transition hover:border-ink">
	<div class="flex items-start justify-between gap-3">
		<p class="font-serif text-xl leading-tight">{hike.name}</p>
		{#if hike.alpine}<span class="shrink-0 rounded-full bg-blush px-2 py-0.5 text-xs font-semibold text-geranium-dark">{t.hikes.mountain}</span>{/if}
	</div>
	{#if hike.profile}<Profile profile={hike.profile} height={64} labels={false} title={hike.name} />{/if}
	<div class="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
		{#if hike.time}<span class="flex items-center gap-1.5"><Clock size={15} aria-hidden="true" />{hike.time}</span>{/if}
		{#if hike.distanceM}<span class="flex items-center gap-1.5"><Route size={15} aria-hidden="true" />{km(hike.distanceM)}</span>{/if}
		{#if hike.ascentM}<span class="flex items-center gap-1.5"><TrendingUp size={15} aria-hidden="true" />{hike.ascentM} m</span>{/if}
	</div>
</a>
