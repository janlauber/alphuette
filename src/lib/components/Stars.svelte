<script lang="ts">
	import Star from '@lucide/svelte/icons/star';
	let { value, size = 16, label }: { value: number; size?: number; label: string } = $props();
</script>

<span class="inline-flex gap-0.5 text-brand" role="img" aria-label={label}>
	{#each [1, 2, 3, 4, 5] as n (n)}
		<Star {size} fill={n <= Math.round(value) ? 'currentColor' : 'none'} strokeWidth={2.25} aria-hidden="true" />
	{/each}
</span>
