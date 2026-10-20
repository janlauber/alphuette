<script lang="ts">
	import HikeCard from '#lib/components/HikeCard.svelte';
	import Huettli from '#lib/components/Huettli.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { dict, localize } from '#lib/i18n.ts';

	let { data } = $props();
	const t = $derived(dict[data.lang]);

	// Finder: the filters only dim hikes that don't fit, so the whole valley stays in view.
	let maxH = $state(0);
	let easy = $state(false);
	let kids = $state(false);
	let hut = $state(false);
	let focus = $state<string | null>(null);
	const fits = (h: (typeof data.hikes)[number]) =>
		(!maxH || (h.durationMin ?? Infinity) <= maxH * 60) && (!easy || h.category === 'wanderweg') && (!kids || h.family) && (!hut || h.fromHut);
	const matching = $derived(data.hikes.filter(fits).length);

	// Chart: walking time (x) against ascent (y), dot size by length.
	const CW = 600, CH = 320, L = 52, B = 40, T = 16, Rm = 24;
	const plot = $derived.by(() => {
		const hs = data.hikes.filter((h) => h.durationMin && h.ascentM != null);
		const xMax = Math.max(2, Math.ceil(Math.max(...hs.map((h) => h.durationMin!)) / 60));
		const yMax = Math.max(500, Math.ceil(Math.max(...hs.map((h) => h.ascentM!)) / 250) * 250);
		const x = (min: number) => L + (min / 60 / xMax) * (CW - L - Rm);
		// square-root scale: spreads out the many short hikes with little climbing
		const y = (m: number) => CH - B - Math.sqrt(m / yMax) * (CH - B - T);
		const dots = hs.map((h) => ({ h, x: x(h.durationMin!), y: y(h.ascentM!), r: Math.min(22, 7 + (h.distanceM ?? 0) / 1200), lx: 0, ly: 0, anchor: 'start' }));
		// Labels: try right, left, above and below each dot; take the first spot that hits no dot,
		// no other label and stays inside the chart.
		type Box = [number, number, number, number];
		const hit = (a: Box, b: Box) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
		const taken: Box[] = dots.map((d) => [d.x - d.r, d.y - d.r, d.x + d.r, d.y + d.r]);
		for (const d of [...dots].sort((a, b) => b.r - a.r)) {
			const w = d.h.name.length * 7.6, g = d.r + 5;
			const tries: [number, number, string][] = [
				[d.x + g, d.y + 5, 'start'],
				[d.x - g, d.y + 5, 'end'],
				[d.x - w / 2, d.y - g - 2, 'start'],
				[d.x - w / 2, d.y + g + 12, 'start'],
				[d.x + g, d.y - g, 'start'],
				[d.x - g, d.y - g, 'end'],
				[d.x - w / 2, d.y - g - 20, 'start'],
				[d.x + g, d.y - g - 20, 'start'],
				[d.x - g, d.y - g - 20, 'end']
			];
			const box = ([lx, ly, an]: [number, number, string]): Box => (an === 'end' ? [lx - w, ly - 13, lx, ly + 3] : [lx, ly - 13, lx + w, ly + 3]);
			const fits = (b: Box) => b[0] >= L - 10 && b[2] <= CW - 4 && b[1] >= T && b[3] <= CH - B && !taken.some((t) => hit(t, b));
			const overlap = (b: Box) => taken.reduce((sum, t) => sum + Math.max(0, Math.min(b[2], t[2]) - Math.max(b[0], t[0])) * Math.max(0, Math.min(b[3], t[3]) - Math.max(b[1], t[1])), 0);
			const pick = tries.find((c) => fits(box(c))) ?? [...tries].sort((p, q) => overlap(box(p)) - overlap(box(q)))[0];
			[d.lx, d.ly, d.anchor] = pick;
			taken.push(box(pick));
		}
		return {
			dots,
			xs: Array.from({ length: xMax + 1 }, (_, i) => ({ v: i, p: x(i * 60) })),
			ys: [0, 100, 250, 500, 1000, 1500, 2000].filter((v) => v <= yMax).map((v) => ({ v, p: y(v) }))
		};
	});

	// All profiles on one scale, with the hut's altitude as a reference line.
	const PW = 600, PH = 240;
	const lines = $derived.by(() => {
		const hs = data.hikes.filter((h) => h.profile?.length);
		const dMax = Math.max(...hs.map((h) => h.profile!.at(-1)![0]));
		const els = hs.flatMap((h) => h.profile!.map((p) => p[1]));
		const lo = Math.floor(Math.min(...els, 1170) / 250) * 250, hi = Math.ceil(Math.max(...els) / 250) * 250;
		const y = (e: number) => PH - 24 - ((e - lo) / (hi - lo)) * (PH - 40);
		return {
			paths: hs.map((h) => ({ h, d: 'M' + h.profile!.map(([d, e]) => `${((d / dMax) * PW).toFixed(1)} ${y(e).toFixed(1)}`).join('L') })),
			hut: y(1170),
			lo,
			hi,
			km: Math.round(dMax / 1000)
		};
	});
</script>

<Seo
	title={t.seo.hikes}
	description={t.seo.hikesDescription}
	path="/wanderungen"
	lang={data.lang}
	siteUrl={data.siteUrl}
/>

<div class="mx-auto max-w-6xl px-5 pt-8 sm:px-6">
	<div class="flex items-end justify-between gap-6">
		<div>
			<h1 class="text-[2.6rem] sm:text-[3.6rem]">{t.hikes.title}</h1>
			<p class="mt-3 max-w-[58ch] text-lg">{t.hikes.intro}</p>
		</div>
		<Huettli animate class="hidden w-36 shrink-0 text-brand sm:block" />
	</div>

	<!-- Finder -->
	<section class="mt-8 rounded-[28px] bg-wash p-5 sm:p-6">
		<h2 class="text-[1.5rem]">{t.hikes.finder}</h2>
		<div class="mt-4 flex flex-wrap items-center gap-2">
			<span class="mr-1 text-sm font-bold text-muted">{t.hikes.maxTime}</span>
			{#each [0, 2, 4] as h (h)}
				<button type="button" aria-pressed={maxH === h} onclick={() => (maxH = h)} class="whitespace-nowrap rounded-full border-2 border-brand px-3.5 py-1.5 text-sm font-bold transition-colors {maxH === h ? 'bg-brand text-white' : 'bg-white text-brand hover:bg-wash'}">{h ? t.hikes.upTo(h) : t.hikes.any}</button>
			{/each}
		</div>
		<div class="mt-3 flex flex-wrap gap-2">
			{#each [{ get: () => easy, set: (v: boolean) => (easy = v), label: t.hikes.easyOnly }, { get: () => kids, set: (v: boolean) => (kids = v), label: t.hikes.family }, { get: () => hut, set: (v: boolean) => (hut = v), label: t.hikes.fromHut }] as f (f.label)}
				<label class="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border-2 border-line bg-white px-3.5 py-1.5 text-sm font-bold has-[:checked]:border-brand has-[:checked]:text-brand">
					<input type="checkbox" class="check !size-5 !rounded-md" checked={f.get()} onchange={(e) => f.set(e.currentTarget.checked)} />{f.label}
				</label>
			{/each}
		</div>
		<p class="mt-4 font-bold {matching ? 'text-brand' : 'text-accent-dark'}" aria-live="polite">{matching ? t.hikes.match(matching) : t.hikes.none}</p>
	</section>

	<div class="mt-6 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.hikes as hike (hike.slug)}
			<HikeCard {hike} lang={data.lang} dim={!fits(hike)} focus={focus === hike.slug} onhover={(s) => (focus = s)} />
		{/each}
	</div>

	<!-- Data: all hikes at a glance -->
	<div class="mt-16 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-2">
		{#if plot.dots.length}
			<section class="reveal">
				<h2 class="text-[1.9rem]">{t.hikes.chart}</h2>
				<p class="mt-1 text-sm text-muted">{t.hikes.chartHint}</p>
				<svg viewBox="0 0 {CW} {CH}" class="mt-4 w-full overflow-visible rounded-[24px] border-2 border-line bg-white" role="img" aria-label={t.hikes.chart}>
					{#each plot.ys as g (g.v)}
						<line x1={L} x2={CW - Rm} y1={g.p} y2={g.p} class="grid-line" />
						<text x={L - 8} y={g.p + 4} text-anchor="end" class="tick">{g.v}</text>
					{/each}
					{#each plot.xs as g (g.v)}
						<text x={g.p} y={CH - B + 20} text-anchor="middle" class="tick">{g.v} h</text>
					{/each}
					<text x={L} y={T + 2} class="tick">m ↑</text>
					{#each plot.dots as d (d.h.slug)}
						<a href={localize(data.lang, `/wanderungen/${d.h.slug}`)} onpointerenter={() => (focus = d.h.slug)} onpointerleave={() => (focus = null)} aria-label={d.h.name}>
							<circle cx={d.x} cy={d.y} r={d.r + (focus === d.h.slug ? 3 : 0)} class="dot {d.h.category}" class:off={!fits(d.h)} />
							<text x={d.lx} y={d.ly} text-anchor={d.anchor === 'end' ? 'end' : 'start'} class="name" class:off={!fits(d.h)}>{d.h.name}</text>
						</a>
					{/each}
				</svg>
			</section>
		{/if}
		{#if lines.paths.length}
			<section class="reveal">
				<h2 class="text-[1.9rem]">{t.hikes.compare}</h2>
				<p class="mt-1 text-sm text-muted">{t.hikes.compareHint}</p>
				<svg viewBox="0 0 {PW} {PH}" class="mt-4 w-full rounded-[24px] border-2 border-line bg-white" role="img" aria-label={t.hikes.compare}>
					<line x1="0" x2={PW} y1={lines.hut} y2={lines.hut} class="hut-line" />
					<text x="10" y={lines.hut - 8} class="tick hut">{t.hikes.hutLine}</text>
					<text x="10" y="22" class="tick">{lines.hi} m</text>
					<text x={PW - 10} y={PH - 8} text-anchor="end" class="tick">{lines.km} km</text>
					{#each lines.paths as p (p.h.slug)}
						<path d={p.d} class="profile" class:focus={focus === p.h.slug} class:off={!fits(p.h)} />
						<path d={p.d} class="hit" role="presentation" onpointerenter={() => (focus = p.h.slug)} onpointerleave={() => (focus = null)} />
					{/each}
				</svg>
				<ul class="mt-3 flex flex-wrap gap-2">
					{#each lines.paths as p (p.h.slug)}
						<li><button type="button" class="whitespace-nowrap rounded-full border-2 px-3 py-1 text-sm font-bold transition-colors {focus === p.h.slug ? 'border-brand bg-brand text-white' : 'border-line text-brand hover:border-brand'}" onpointerenter={() => (focus = p.h.slug)} onpointerleave={() => (focus = null)} onfocus={() => (focus = p.h.slug)} onblur={() => (focus = null)}>{p.h.name}</button></li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>
</div>

<style>
	.grid-line {
		stroke: var(--color-line);
		stroke-width: 1.5;
	}
	.tick {
		font-size: 13px;
		font-weight: 600;
		fill: var(--color-muted);
	}
	.tick.hut {
		fill: var(--color-accent-dark);
		font-weight: 700;
	}
	.dot {
		stroke: var(--color-brand);
		stroke-width: 3;
		transition: r 150ms;
	}
	.dot.wanderweg {
		fill: var(--color-accent);
	}
	.dot.bergwanderweg,
	.dot.alpinwanderweg {
		fill: var(--color-brand);
	}
	.name {
		font-size: 14px;
		font-weight: 700;
		fill: var(--color-ink);
		paint-order: stroke;
		stroke: #fff;
		stroke-width: 5px;
		stroke-linejoin: round;
	}
	.off {
		opacity: 0.25;
	}
	.hut-line {
		stroke: var(--color-accent);
		stroke-width: 2;
		stroke-dasharray: 6 6;
	}
	.profile {
		fill: none;
		stroke: var(--color-brand);
		stroke-opacity: 0.35;
		stroke-width: 2.5;
		stroke-linejoin: round;
		transition:
			stroke-opacity 150ms,
			stroke-width 150ms;
	}
	.profile.focus {
		stroke-opacity: 1;
		stroke-width: 5;
	}
	.profile.off {
		stroke-opacity: 0.1;
	}
	.hit {
		fill: none;
		stroke: transparent;
		stroke-width: 16;
	}
</style>
