<script lang="ts">
	// Elevation profile: [[distance in m, elevation in m], ...]
	let { profile, height = 120, labels = true, title = '' }: { profile: [number, number][]; height?: number; labels?: boolean; title?: string } = $props();

	const W = 600;
	const shape = $derived.by(() => {
		if (!profile?.length) return null;
		const dist = profile.at(-1)![0] || 1;
		const els = profile.map((p) => p[1]);
		const lo = Math.min(...els), hi = Math.max(...els);
		const pad = Math.max(40, (hi - lo) * 0.12);
		const y = (e: number) => height - ((e - (lo - pad)) / (hi - lo + 2 * pad)) * height;
		const pts = profile.map(([d, e]) => `${((d / dist) * W).toFixed(1)},${y(e).toFixed(1)}`);
		return { line: 'M' + pts.join(' L'), area: `M0,${height} L${pts.join(' L')} L${W},${height} Z`, lo: Math.round(lo), hi: Math.round(hi) };
	});
</script>

{#if shape}
	<figure class="relative">
		<svg viewBox="0 0 {W} {height}" preserveAspectRatio="none" class="block w-full" style="height: {height}px" role="img" aria-label={title || `${shape.lo} bis ${shape.hi} m`}>
			<path d={shape.area} fill="#2f5d46" fill-opacity="0.12" />
			<path d={shape.line} fill="none" stroke="#2f5d46" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
		</svg>
		{#if labels}
			<span class="absolute left-1 top-0 text-xs font-semibold tabular-nums text-muted">{shape.hi} m</span>
			<span class="absolute bottom-1 left-1 text-xs font-semibold tabular-nums text-muted">{shape.lo} m</span>
		{/if}
	</figure>
{/if}
