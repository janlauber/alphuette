<script lang="ts">
	import { onMount } from 'svelte';
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import Img, { type Photo } from './Img.svelte';

	// Full-width title image that moves like a drone flight. The photo renders first (fast, it is the
	// LCP image) and glides slowly; a short muted video loop replaces it once it can play.
	// No video for reduced motion or data saver. The button stops all motion. The text sits below it.
	export type Video = { av1: string; h264: string; poster: string };
	let { photo, video, labels }: { photo: Photo; video?: Video; labels: { pause: string; play: string } } = $props();

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

<section class="relative isolate h-[min(64svh,46rem)] min-h-[20rem] overflow-hidden bg-brand-dark">
	<!-- anchored at the bottom: the hut usually sits low in the picture -->
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
	<button type="button" onclick={toggle} class="absolute bottom-4 right-4 grid size-11 place-items-center rounded-full border-2 border-white/80 bg-brand-dark/50 text-white hover:bg-brand-dark/80" aria-label={paused ? labels.play : labels.pause} aria-pressed={paused}>
		{#if paused}<Play size={18} fill="currentColor" aria-hidden="true" />{:else}<Pause size={18} fill="currentColor" aria-hidden="true" />{/if}
	</button>
</section>

<style>
	@keyframes glide {
		from {
			transform: scale(1.04) translate(-1%, 0.5%);
		}
		to {
			transform: scale(1.12) translate(1.5%, -1%);
		}
	}
	:global(.glide) {
		animation: glide 40s ease-in-out infinite alternate;
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
