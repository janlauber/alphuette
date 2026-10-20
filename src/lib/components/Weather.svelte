<script lang="ts">
	import Cloud from '@lucide/svelte/icons/cloud';
	import CloudDrizzle from '@lucide/svelte/icons/cloud-drizzle';
	import CloudFog from '@lucide/svelte/icons/cloud-fog';
	import CloudLightning from '@lucide/svelte/icons/cloud-lightning';
	import CloudRain from '@lucide/svelte/icons/cloud-rain';
	import CloudSnow from '@lucide/svelte/icons/cloud-snow';
	import CloudSun from '@lucide/svelte/icons/cloud-sun';
	import Sun from '@lucide/svelte/icons/sun';
	import { dict, type Lang } from '#lib/i18n.ts';

	export type Day = { date: string; tmin: number; tmax: number; precip: number; kind: string; de: string; en: string; fr: string; it: string };
	let { days, lang }: { days: Day[]; lang: Lang } = $props();
	const t = $derived(dict[lang]);
	const ICON = { sun: Sun, partly: CloudSun, cloud: Cloud, rain: CloudRain, snow: CloudSnow, storm: CloudLightning, fog: CloudFog, drizzle: CloudDrizzle };
	const name = (iso: string, i: number) =>
		i === 0 ? t.weather.today : new Date(iso + 'T00:00:00Z').toLocaleDateString(t.locale, { timeZone: 'UTC', weekday: 'short' });
</script>

<div class="snap-row -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
	{#each days as d, i (d.date)}
		{@const Icon = ICON[d.kind as keyof typeof ICON] ?? Cloud}
		<div class="flex min-w-[80px] flex-1 flex-col items-center gap-1.5 rounded-[20px] border-2 px-2 py-3 text-center {i === 0 ? 'border-accent bg-accent-wash' : 'border-line'}" title={d[lang]}>
			<span class="text-sm font-bold first-letter:uppercase">{name(d.date, i)}</span>
			<Icon size={30} strokeWidth={2} class="text-brand" role="img" aria-label={d[lang]} />
			<span class="text-sm tabular-nums"><strong class="text-base text-brand">{Math.round(d.tmax)}°</strong> <span class="text-muted">{Math.round(d.tmin)}°</span></span>
			<span class="text-xs tabular-nums text-muted">{t.weather.rain(Math.round(d.precip))}</span>
		</div>
	{/each}
</div>
<p class="mt-2 text-xs text-muted">{t.weather.source}</p>
