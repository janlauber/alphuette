<script lang="ts">
	// Swiss trail marking: yellow diamond, white-red-white or white-blue-white.
	let { category, label }: { category: string; label: string } = $props();
	const stripe = $derived(category === 'alpinwanderweg' ? '#2f6fde' : '#e3242b');
</script>

<span class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-ink/80 bg-white px-2.5 py-0.5 text-sm font-bold text-ink">
	{#if category === 'wanderweg'}
		<svg viewBox="0 0 16 16" class="size-3.5" aria-hidden="true"><path d="M8 1 15 8 8 15 1 8Z" fill="#ffcf3f" stroke="#1b1847" stroke-width="1.5" /></svg>
	{:else}
		<svg viewBox="0 0 18 12" class="h-3 w-[18px] rounded-[2px] ring-1 ring-ink/40" aria-hidden="true"><rect width="18" height="12" fill="#fff" /><rect y="4" width="18" height="4" fill={stripe} /></svg>
	{/if}
	{label}
</span>
