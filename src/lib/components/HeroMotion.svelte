<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import Img, { type Photo } from './Img.svelte';

	// Full-width title image that moves like a drone flight. The photo renders first (fast, it is the
	// LCP image) and glides slowly; a short muted video loop replaces it once it can play.
	// No video for reduced motion or data saver. The button stops all motion.
	export type Video = { av1: string; h264: string; poster: string };
	let { photo, video, labels, children }: { photo: Photo; video?: Video; labels: { pause: string; play: string }; children: Snippet } = $props();

	let paused = $state(false);
	let playing = $state(false);
	let el = $state<HTMLVideoElement>();
	let useVideo = $state(false);

	onMount(() => {
		const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
		useVideo = !!video && !calm && !saveData;
		if (calm) paused = true;
	});

	function toggle() {
		paused = !paused;
		if (el) paused ? el.pause() : el.play().catch(() => {});
	}
</script>

<!-- phone: image on top, text below; from sm on: text on a band over the image -->
<section class="relative isolate overflow-hidden bg-brand-dark text-white sm:h-[min(86svh,780px)] sm:min-h-[520px]">
	<div class="relative h-[46svh] min-h-[260px] overflow-hidden sm:absolute sm:inset-0 sm:h-auto">
		<!-- anchored at the bottom: the hut usually sits low in the picture, the band must not hide it -->
		<Img {photo} eager sizes="100vw" class="glide absolute inset-0 size-full object-cover object-bottom {paused ? 'still' : ''}" />
		{#if useVideo && video}
			<video
				bind:this={el}
				class="absolute inset-0 size-full object-cover object-bottom transition-opacity duration-1000 {playing ? 'opacity-100' : 'opacity-0'}"
				poster={video.poster}
				autoplay
				muted
				loop
				playsinline
				preload="auto"
				aria-hidden="true"
				onplaying={() => (playing = true)}
			>
				<source src={video.av1} type='video/mp4; codecs="av01.0.08M.08"' />
				<source src={video.h264} type="video/mp4" />
			</video>
		{/if}
		<button type="button" onclick={toggle} class="absolute right-4 top-4 grid size-11 place-items-center rounded-full border-2 border-white/80 bg-brand-dark/60 text-white hover:bg-brand-dark/80" aria-label={paused ? labels.play : labels.pause} aria-pressed={paused}>
			{#if paused}<Play size={18} fill="currentColor" aria-hidden="true" />{:else}<Pause size={18} fill="currentColor" aria-hidden="true" />{/if}
		</button>
	</div>

	<div class="relative sm:absolute sm:inset-x-0 sm:bottom-0 sm:bg-brand-dark/90">
		<div class="mx-auto flex max-w-6xl flex-col px-5 pb-8 pt-6 sm:px-6 sm:pb-9 sm:pt-7">
			<div class="min-w-0 flex-1">{@render children()}</div>
		</div>
	</div>
</section>

<style>
	@keyframes glide {
		from {
			transform: scale(1.06) translate(-1.5%, 1%);
		}
		to {
			transform: scale(1.16) translate(2.5%, -1.5%);
		}
	}
	:global(.glide) {
		animation: glide 22s ease-in-out infinite alternate;
		transform-origin: 50% 100%;
	}
	:global(.glide.still) {
		animation-play-state: paused;
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.glide) {
			animation: none;
		}
	}
</style>
