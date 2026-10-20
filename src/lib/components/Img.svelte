<script lang="ts">
	export type Photo = { id: number; key: string; width: number; height: number; widths: number[]; lqip: string; alt: string };

	let {
		photo,
		sizes = '100vw',
		class: cls = '',
		eager = false
	}: { photo: Photo; sizes?: string; class?: string; eager?: boolean } = $props();

	const src = (w: number) => `/bilder/photos/${photo.key}-${w}.webp`;
</script>

<img
	src={src(photo.widths[Math.min(1, photo.widths.length - 1)])}
	srcset={photo.widths.map((w) => `${src(w)} ${w}w`).join(', ')}
	{sizes}
	width={photo.width}
	height={photo.height}
	alt={photo.alt}
	loading={eager ? 'eager' : 'lazy'}
	fetchpriority={eager ? 'high' : 'auto'}
	decoding="async"
	class={cls}
	style="background: url({photo.lqip}) center / cover"
/>
