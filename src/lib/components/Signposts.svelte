<script lang="ts">
	// Waypoints like a row of signposts: name, walking time from the start, height. The small mark
	// at the end is the real Swiss trail marking (yellow diamond, white-red-white, white-blue-white).
	type Point = { name: string; elev: number; min?: number | null };
	let { points, category, hours, start }: { points: Point[]; category: string; hours: (min: number) => string; start: string } = $props();
	const band = $derived(category === 'alpinwanderweg' ? '#2f6fde' : '#e3242b');
</script>

<ol class="relative grid grid-cols-[minmax(0,1fr)] gap-2.5">
	<span class="absolute bottom-5 left-[7px] top-5 border-l-2 border-dashed border-brand/40" aria-hidden="true"></span>
	{#each points as p, i (p.name + i)}
		{@const end = i === 0 || i === points.length - 1}
		<li class="relative flex items-center gap-3">
			<span class="z-10 size-4 shrink-0 rounded-full border-2 border-brand {end ? 'bg-brand' : 'bg-white'}"></span>
			<div class="sign flex min-w-0 flex-1 items-center gap-3 py-2 pl-3.5 pr-7 {end ? 'is-end' : ''}">
				<span class="min-w-0 flex-1 truncate font-bold">{p.name}</span>
				<span class="shrink-0 text-sm font-bold tabular-nums">{i === 0 ? start : p.min != null ? hours(p.min) : ''}</span>
				{#if category === 'wanderweg'}
					<svg viewBox="0 0 16 16" class="size-3.5 shrink-0" aria-hidden="true"><path d="M8 1 15 8 8 15 1 8Z" fill="#ffcf3f" stroke="#17251c" stroke-width="1.5" /></svg>
				{:else}
					<svg viewBox="0 0 18 12" class="h-3 w-[18px] shrink-0 rounded-[2px] ring-1 ring-ink/40" aria-hidden="true"><rect width="18" height="12" fill="#fff" /><rect y="4" width="18" height="4" fill={band} /></svg>
				{/if}
			</div>
			<span class="w-16 shrink-0 text-right text-sm font-semibold tabular-nums text-muted">{p.elev} m</span>
		</li>
	{/each}
</ol>

<style>
	/* a signpost board pointing on along the route */
	.sign {
		color: var(--color-ink);
		background: var(--color-wash);
		border-radius: 12px 0 0 12px;
		clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%);
	}
	.sign.is-end {
		background: var(--color-hill);
		color: var(--color-brand);
	}
</style>
