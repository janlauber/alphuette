<script lang="ts">
	import Droplet from '@lucide/svelte/icons/droplet';
	import Flame from '@lucide/svelte/icons/flame';
	import Footprints from '@lucide/svelte/icons/footprints';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import Moon from '@lucide/svelte/icons/moon';
	import Huettli from './Huettli.svelte';
	import { dict, type Lang } from '#lib/i18n.ts';

	// One day at the hut as a 24-hour ring, midnight at the bottom and noon at the top.
	// While the list scrolls past, a dot walks the ring from arrival to the next morning's hike,
	// and the Hüttli in the middle sleeps while the dot is in the night.
	let { lang, checkIn }: { lang: Lang; checkIn: string } = $props();
	const t = $derived(dict[lang].still);
	const arrive = $derived(parseInt(checkIn) || 14);
	const stops = $derived([
		{ hour: arrive, part: t.parts.afternoon, title: t.arrive.title, text: t.arrive.text(checkIn), icon: KeyRound },
		{ hour: 19, part: t.parts.evening, ...t.fire, icon: Flame },
		{ hour: 22.5, part: t.parts.night, ...t.night, icon: Moon },
		{ hour: 7, part: t.parts.morning, ...t.water, icon: Droplet },
		{ hour: 10, part: t.parts.day, ...t.hike, icon: Footprints }
	]);
	// hours counted on from arrival, so the dot keeps going round past midnight
	const along = (h: number) => (h < arrive ? h + 24 : h);
	const last = $derived(along(stops.at(-1)!.hour));

	const C = 200, R = 150;
	const at = (h: number, r = R) => {
		const a = (h / 24) * 2 * Math.PI;
		return [C - r * Math.sin(a), C + r * Math.cos(a)];
	};
	const arc = (from: number, to: number) => {
		const [x1, y1] = at(from), [x2, y2] = at(to);
		return `M${x1} ${y1}A${R} ${R} 0 ${(to - from + 24) % 24 > 12 ? 1 : 0} 1 ${x2} ${y2}`;
	};

	let list = $state<HTMLOListElement>();
	let progress = $state(0); // 0 at arrival, 1 at the last stop
	const hour = $derived(arrive + progress * (last - arrive));
	const dot = $derived(at(hour % 24));
	const active = $derived(stops.reduce((n, s, i) => (along(s.hour) <= hour + 0.01 ? i : n), 0));
	const night = $derived(hour % 24 >= 21 || hour % 24 < 6);

	function measure() {
		if (!list) return;
		const r = list.getBoundingClientRect();
		const mid = innerHeight * 0.55;
		progress = Math.min(1, Math.max(0, (mid - r.top) / Math.max(1, r.height - innerHeight * 0.25)));
	}
	let frame = 0;
	const onscroll = () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(measure);
	};
	$effect(() => {
		measure();
	});
</script>

<svelte:window {onscroll} onresize={onscroll} />

<div class="grid gap-x-16 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
	<div class="sticky top-16 z-10 -mx-5 self-start border-b-2 border-line bg-paper px-5 pb-3 pt-4 md:top-28 md:mx-0 md:border-0 md:bg-transparent md:p-0">
		<div>
			<svg viewBox="0 0 400 400" class="mx-auto block w-[min(13rem,52vw)] overflow-visible md:w-full" role="img" aria-label={t.clock}>
				<path d={arc(6, 20)} fill="none" stroke="var(--color-accent-soft)" stroke-width="30" />
				<path d={arc(20, 6)} fill="none" stroke="var(--color-brand-dark)" stroke-width="30" />
				{#each Array.from({ length: 24 }, (_, i) => i) as h (h)}
					{@const [x1, y1] = at(h, R - 24)}
					{@const [x2, y2] = at(h, R - (h % 6 ? 30 : 36))}
					<line {x1} {y1} {x2} {y2} stroke="var(--color-brand)" stroke-width={h % 6 ? 1.5 : 3} stroke-linecap="round" opacity={h % 6 ? 0.45 : 1} />
				{/each}
				{#each [0, 6, 12, 18] as h (h)}
					{@const [x, y] = at(h, R - 54)}
					<text {x} {y} dy="0.35em" text-anchor="middle" class="fill-muted font-display text-[22px] tabular-nums">{String(h).padStart(2, '0')}</text>
				{/each}
				{#each stops as s, i (s.title)}
					{@const [x, y] = at(s.hour)}
					<g class="transition-opacity duration-500" opacity={i <= active ? 1 : 0.45}>
						<circle cx={x} cy={y} r="19" fill="var(--color-paper)" stroke="var(--color-brand)" stroke-width="3" />
						<s.icon x={x - 10} y={y - 10} width={20} height={20} size={20} strokeWidth={2.25} color="var(--color-brand)" aria-hidden="true" />
					</g>
				{/each}
				<circle cx={dot[0]} cy={dot[1]} r="11" fill={night ? 'var(--color-paper)' : 'var(--color-accent)'} stroke="var(--color-brand-dark)" stroke-width="3" />
				<Huettli face={night ? 'sleep' : 'happy'} pose="stand" animate x="135" y="128" width="130" height="166" class="text-brand [--paper:var(--color-paper)]" />
			</svg>
		</div>
	</div>

	<ol bind:this={list} class="mt-6 grid gap-[18vh] pb-[10vh] md:mt-0 md:gap-[26vh] md:pb-[22vh] md:pt-16">
		{#each stops as s, i (s.title)}
			<li class="max-w-md transition-opacity duration-500 {i === active ? 'opacity-100' : 'opacity-40'}">
				<p class="font-display text-xl text-muted">{s.part}</p>
				<h3 class="mt-1 text-[clamp(2.2rem,4vw,3.2rem)] text-brand">{s.title}</h3>
				<p class="mt-3 text-lg">{s.text}</p>
			</li>
		{/each}
	</ol>
</div>
