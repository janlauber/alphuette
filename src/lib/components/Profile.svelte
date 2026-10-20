<script lang="ts">
	import Huettli from './Huettli.svelte';

	// Elevation profile: [[distance in m, elevation in m], ...]
	// Interactive: pointer or arrow keys move `at` (metres from the start); the Hüttli walks along.
	type Point = { name: string; elev: number; distM?: number | null };
	let {
		profile,
		height = 120,
		labels = true,
		title = '',
		waypoints = [],
		interactive = false,
		readout = (km: string, m: number) => `${km} km, ${m} m`,
		at = $bindable(null)
	}: {
		profile: [number, number][];
		height?: number;
		labels?: boolean;
		title?: string;
		waypoints?: Point[];
		interactive?: boolean;
		readout?: (km: string, m: number) => string;
		at?: number | null;
	} = $props();

	const W = 600;
	const shape = $derived.by(() => {
		if (!profile?.length) return null;
		const dist = profile.at(-1)![0] || 1;
		const els = profile.map((p) => p[1]);
		const lo = Math.min(...els), hi = Math.max(...els);
		const pad = Math.max(40, (hi - lo) * 0.12);
		const y = (e: number) => height - ((e - (lo - pad)) / (hi - lo + 2 * pad)) * height;
		const pts = profile.map(([d, e]) => `${((d / dist) * W).toFixed(1)},${y(e).toFixed(1)}`);
		const top = profile[els.indexOf(hi)];
		const elevAt = (d: number) => {
			const i = Math.max(1, profile.findIndex((p) => p[0] >= d));
			const [a, b] = [profile[i - 1], profile[i] ?? profile[i - 1]];
			return b[0] === a[0] ? a[1] : a[1] + ((b[1] - a[1]) * (d - a[0])) / (b[0] - a[0]);
		};
		return {
			dist,
			line: 'M' + pts.join(' L'),
			area: `M0,${height} L${pts.join(' L')} L${W},${height} Z`,
			lo: Math.round(lo),
			hi: Math.round(hi),
			// positions in percent of the box
			pos: (d: number, e: number) => ({ x: (d / dist) * 100, y: (y(e) / height) * 100 }),
			top: { x: (top[0] / dist) * 100, y: (y(hi) / height) * 100 },
			elevAt
		};
	});

	let box = $state<HTMLDivElement>();
	const here = $derived(shape && at != null ? { ...shape.pos(at, shape.elevAt(at)), m: Math.round(shape.elevAt(at)) } : null);
	const near = $derived(shape && at != null ? waypoints.find((w) => w.distM != null && Math.abs(w.distM - at!) < shape.dist * 0.03) : null);

	function move(e: PointerEvent) {
		if (!interactive || !box || !shape) return;
		const r = box.getBoundingClientRect();
		at = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * shape.dist;
	}
	function keys(e: KeyboardEvent) {
		if (!shape || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
		e.preventDefault();
		const step = shape.dist / 40;
		at = Math.min(shape.dist, Math.max(0, (at ?? 0) + (e.key === 'ArrowRight' ? step : -step)));
	}
</script>

{#if shape}
	<figure class="relative text-brand" class:pt-8={labels}>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			bind:this={box}
			class="relative {interactive ? 'cursor-crosshair touch-pan-y' : ''}"
			onpointermove={move}
			onpointerdown={move}
			onpointerleave={(e) => e.pointerType === 'mouse' && (at = null)}
			onkeydown={interactive ? keys : undefined}
			tabindex={interactive ? 0 : undefined}
			role={interactive ? 'slider' : undefined}
			aria-label={interactive ? title : undefined}
			aria-valuemin={interactive ? 0 : undefined}
			aria-valuemax={interactive ? Math.round(shape.dist) : undefined}
			aria-valuenow={interactive ? Math.round(at ?? 0) : undefined}
			aria-valuetext={interactive && here ? readout(((at ?? 0) / 1000).toFixed(1), here.m) : undefined}
		>
			<svg viewBox="0 0 {W} {height}" preserveAspectRatio="none" class="block w-full" style="height: {height}px" role="img" aria-label={title || `${shape.lo} bis ${shape.hi} m`}>
				<path d={shape.area} fill="currentColor" fill-opacity="0.09" />
				<path d={shape.line} fill="none" stroke="currentColor" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round" />
			</svg>
			{#if labels}
				{#each waypoints.slice(1, -1) as w (w.name)}
					{#if w.distM != null}
						{@const p = shape.pos(w.distM, shape.elevAt(w.distM))}
						<span class="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand bg-white" style="left: {p.x}%; top: {p.y}%" aria-hidden="true"></span>
					{/if}
				{/each}
				<span class="absolute -translate-x-1/2 -translate-y-full" style="left: {shape.top.x}%; top: {shape.top.y}%" aria-hidden="true">
					<svg viewBox="0 0 24 30" class="mb-0.5 h-7 w-6"><path d="M5 29V3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" /><path d="M6 3h14l-4 5 4 5H6Z" fill="currentColor" /></svg>
				</span>
				{#if here}
					<span class="pointer-events-none absolute bottom-0 top-0 border-l-2 border-dashed border-brand" style="left: {here.x}%" aria-hidden="true"></span>
					<span class="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-brand bg-accent" style="left: {here.x}%; top: {here.y}%" aria-hidden="true"></span>
				{/if}
				<span class="pointer-events-none absolute -translate-x-1/2 -translate-y-[88%] transition-[left,top] duration-75" style="left: {here?.x ?? 0}%; top: {here?.y ?? shape.pos(0, profile[0][1]).y}%" aria-hidden="true">
					<Huettli mini class="size-8" />
				</span>
			{/if}
		</div>
		{#if labels}
			<span class="absolute right-1 top-0 rounded-full bg-brand px-2 py-0.5 text-xs font-bold tabular-nums text-white">{shape.hi} m</span>
			<span class="absolute bottom-1 right-1 text-xs font-bold tabular-nums">{shape.lo} m</span>
			{#if here}
				<span class="absolute left-0 top-0 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold tabular-nums text-ink" aria-hidden="true">{near ? `${near.name} · ` : ''}{readout(((at ?? 0) / 1000).toFixed(1), here.m)}</span>
			{/if}
		{/if}
	</figure>
{/if}
