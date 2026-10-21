<script lang="ts">
	import type { Mark } from '#lib/guides.ts';

	// A guide photo with rings and labels on it. With onpick (admin) a tap on the photo places a new mark.
	let { src, marks, alt = '', onpick }: { src: string; marks: Mark[]; alt?: string; onpick?: (x: number, y: number) => void } = $props();

	function pick(e: MouseEvent) {
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		onpick?.((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
	}
	// the label sits under the ring, above it near the bottom edge, and stays inside the photo at the sides
	const side = (m: Mark) => (m.x < 0.2 ? 'left-[-1.25rem]' : m.x > 0.8 ? 'right-[-1.25rem]' : 'left-1/2 -translate-x-1/2');
</script>

<div class="relative overflow-hidden rounded-[14px] bg-wash">
	<img {src} {alt} class="block w-full" loading={onpick ? 'eager' : 'lazy'} />
	{#if onpick}
		<button type="button" class="absolute inset-0 cursor-crosshair" onclick={pick} aria-label="Stelle auf dem Foto markieren"></button>
	{/if}
	{#each marks as m, i (i)}
		<span class="pointer-events-none absolute" style:left="{m.x * 100}%" style:top="{m.y * 100}%">
			<span class="mark absolute size-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-accent"></span>
			{#if m.label || onpick}
				<span class="absolute whitespace-nowrap rounded-full bg-white px-3 py-1 text-sm font-bold text-ink shadow-md {side(m)} {m.y > 0.8 ? 'bottom-9' : 'top-9'}">{m.label || `Markierung ${i + 1}`}</span>
			{/if}
		</span>
	{/each}
</div>

<style>
	/* a dark edge inside and out, so the ring shows on bright snow and dark wood alike */
	.mark {
		box-shadow:
			0 0 0 2px rgb(23 37 28 / 0.55),
			inset 0 0 0 2px rgb(23 37 28 / 0.55);
	}
</style>
