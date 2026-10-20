<script lang="ts">
	import '@fontsource/gloock';
	import '@fontsource-variable/hanken-grotesk';
	import '../app.css';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { startTracking, trackView } from '#lib/track.ts';

	let { children } = $props();

	const tracked = (path: string) => !path.startsWith('/admin');
	onMount(() => {
		if (tracked(location.pathname)) startTracking();
	});
	afterNavigate(({ type, to }) => {
		if (to && tracked(to.url.pathname)) trackView(to.url.pathname, type !== 'enter');
	});
</script>

{@render children()}
