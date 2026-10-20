<script lang="ts">
	import Huettli from './Huettli.svelte';

	// The route drawn from LV95 coordinates, north up, with a 1 km grid like a map sheet.
	// `at` (metres from the start) puts a marker on the route, synced with the profile.
	type Point = { name: string; distM?: number | null };
	let {
		geometry,
		waypoints = [],
		at = null,
		label
	}: { geometry: [number, number][]; waypoints?: Point[]; at?: number | null; label: string } = $props();

	const HUT: [number, number] = [2622208, 1157578];
	const W = 600;
	// swisstopo WMTS in the Swiss grid (EPSG:2056): metres per pixel for each zoom level
	const RES = [4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250, 1000, 750, 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1.5, 1, 0.5];
	const tileUrl = (z: number, col: number, row: number) => `https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-grau/default/current/2056/${z}/${col}/${row}.jpeg`;

	const map = $derived.by(() => {
		const es = geometry.map((p) => p[0]), ns = geometry.map((p) => p[1]);
		let [e0, e1, n0, n1] = [Math.min(...es), Math.max(...es), Math.min(...ns), Math.max(...ns)];
		// the hut joins the map when it is near the route
		const showHut = HUT[0] > e0 - 1500 && HUT[0] < e1 + 1500 && HUT[1] > n0 - 1500 && HUT[1] < n1 + 1500;
		if (showHut) [e0, e1, n0, n1] = [Math.min(e0, HUT[0]), Math.max(e1, HUT[0]), Math.min(n0, HUT[1]), Math.max(n1, HUT[1])];
		const pad = 44;
		const k = Math.min((W - 2 * pad) / Math.max(e1 - e0, 800), (560 - 2 * pad) / Math.max(n1 - n0, 500));
		const H = Math.max(280, (n1 - n0) * k + 2 * pad);
		const cx = (e0 + e1) / 2, cy = (n0 + n1) / 2;
		const xy = ([e, n]: [number, number]) => [W / 2 + (e - cx) * k, H / 2 - (n - cy) * k] as const;
		// distance along the route for every vertex, to place waypoints and the marker
		const cum = [0];
		for (let i = 1; i < geometry.length; i++) cum.push(cum[i - 1] + Math.hypot(geometry[i][0] - geometry[i - 1][0], geometry[i][1] - geometry[i - 1][1]));
		const along = (d: number) => {
			const i = Math.max(1, cum.findIndex((c) => c >= d));
			const t = cum[i] === cum[i - 1] ? 0 : (d - cum[i - 1]) / (cum[i] - cum[i - 1]);
			const a = geometry[i - 1], b = geometry[i] ?? a;
			return xy([a[0] + (b[0] - a[0]) * Math.min(1, Math.max(0, t)), a[1] + (b[1] - a[1]) * Math.min(1, Math.max(0, t))]);
		};
		// map tiles: about 1.3 tile pixels per map pixel, sharp enough on high-density screens without loading dozens of tiles
		const left = cx - W / 2 / k, right = cx + W / 2 / k, top = cy + H / 2 / k, bottom = cy - H / 2 / k;
		const z = Math.max(16, RES.findIndex((r) => r <= 1 / k / 1.3) === -1 ? RES.length - 1 : RES.findIndex((r) => r <= 1 / k / 1.3));
		const span = 256 * RES[z];
		const tiles: { href: string; x: number; y: number; size: number }[] = [];
		for (let col = Math.floor((left - 2420000) / span); col <= Math.floor((right - 2420000) / span); col++)
			for (let row = Math.floor((1350000 - top) / span); row <= Math.floor((1350000 - bottom) / span); row++) {
				const [x, y] = xy([2420000 + col * span, 1350000 - row * span]);
				tiles.push({ href: tileUrl(z, col, row), x, y, size: span * k });
			}
		// scale bar: the round length closest to a fifth of the width
		const bar = [100, 200, 500, 1000, 2000, 5000].reduce((a, b) => (Math.abs(b * k - W / 5) < Math.abs(a * k - W / 5) ? b : a));
		const loop = Math.hypot(es[0] - es.at(-1)!, ns[0] - ns.at(-1)!) < 150;
		return {
			H,
			k,
			tiles,
			bar,
			loop,
			path: 'M' + geometry.map((p) => xy(p).map((v) => v.toFixed(1)).join(' ')).join('L'),
			start: xy(geometry[0]),
			end: xy(geometry.at(-1)!),
			hut: showHut ? xy(HUT) : null,
			total: cum.at(-1)!,
			along
		};
	});
	const marks = $derived(waypoints.filter((w) => w.distM != null).slice(1, -1).map((w) => ({ name: w.name, p: map.along(w.distM!) })));
	const dot = $derived(at == null ? null : map.along(Math.min(at, map.total)));
</script>

<div class="overflow-hidden rounded-[24px] border-2 border-line bg-wash">
<svg viewBox="0 0 {W} {map.H}" class="block w-full" role="img" aria-label={label}>
	{#each map.tiles as t (t.href)}
		<image href={t.href} x={t.x} y={t.y} width={t.size + 0.5} height={t.size + 0.5} preserveAspectRatio="none" class="tile" />
	{/each}
	<path d={map.path} class="casing" />
	<path d={map.path} class="route" />
	{#each marks as m (m.name)}
		<circle cx={m.p[0]} cy={m.p[1]} r="5" class="way" />
		<text x={m.p[0] + 9} y={m.p[1] + 4} class="label">{m.name}</text>
	{/each}
	{#if map.hut}
		<Huettli mini x={map.hut[0] - 16} y={map.hut[1] - 30} width="32" height="32" />
		<text x={map.hut[0] + 18} y={map.hut[1] - 8} class="label hut">Hüttli</text>
	{/if}
	<circle cx={map.start[0]} cy={map.start[1]} r="9" class="start" />
	{#if !map.loop}
		<path d="M{map.end[0]} {map.end[1]}v-30" class="pole" />
		<path d="M{map.end[0] + 1} {map.end[1] - 30}h20l-6 7 6 7h-20Z" class="flag" />
	{/if}
	{#if dot}<circle cx={dot[0]} cy={dot[1]} r="10" class="dot" />{/if}
	<!-- scale bar and north arrow -->
	<g transform="translate(20 {map.H - 22})">
		<path d="M0 0h{map.bar * map.k}" class="bar" />
		<text x={map.bar * map.k + 8} y="5" class="label">{map.bar >= 1000 ? `${map.bar / 1000} km` : `${map.bar} m`}</text>
	</g>
	<text x={W - 10} y={map.H - 10} text-anchor="end" class="credit">© swisstopo</text>
	<g transform="translate({W - 30} 32)">
		<path d="M0-16 8 8 0 3-8 8Z" class="north" />
		<text x="0" y="24" text-anchor="middle" class="label">N</text>
	</g>
</svg>
</div>

<style>
	.tile {
		opacity: 0.75;
	}
	.credit {
		font-size: 11px;
		font-weight: 600;
		fill: var(--color-muted);
		paint-order: stroke;
		stroke: #fff;
		stroke-width: 4px;
	}
	.casing {
		fill: none;
		stroke: #fff;
		stroke-width: 10;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.route {
		fill: none;
		stroke: var(--color-brand);
		stroke-width: 4.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.way {
		fill: #fff;
		stroke: var(--color-brand);
		stroke-width: 3;
	}
	.label {
		font-size: 14px;
		font-weight: 700;
		fill: var(--color-ink);
		paint-order: stroke;
		stroke: #fff;
		stroke-width: 5px;
		stroke-linejoin: round;
	}
	.label.hut {
		fill: var(--color-brand);
	}
	.start {
		fill: #fff;
		stroke: var(--color-brand);
		stroke-width: 3;
	}
	.pole {
		stroke: var(--color-brand);
		stroke-width: 3;
		stroke-linecap: round;
	}
	.flag {
		fill: var(--color-brand);
	}
	.dot {
		fill: var(--color-accent);
		stroke: var(--color-brand);
		stroke-width: 3.5;
	}
	.bar {
		stroke: var(--color-brand);
		stroke-width: 4;
		stroke-linecap: round;
	}
	.north {
		fill: var(--color-brand);
	}
	svg :global(.huettli) {
		color: var(--color-brand);
	}
</style>
