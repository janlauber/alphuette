<script lang="ts">
	import type { Snippet } from 'svelte';
	import CircleHelp from '@lucide/svelte/icons/circle-help';

	// Page frame for the admin: title, one line on what the page is for, and a "So geht's" box.
	let { title, intro, help, actions, children }: { title: string; intro?: string; help?: Snippet; actions?: Snippet; children: Snippet } = $props();
</script>

<header class="flex flex-wrap items-end justify-between gap-4">
	<div class="max-w-2xl">
		<h1 class="text-3xl sm:text-4xl">{title}</h1>
		{#if intro}<p class="mt-2 text-lg text-muted">{intro}</p>{/if}
	</div>
	{#if actions}<div class="flex flex-wrap gap-3">{@render actions()}</div>{/if}
</header>
{#if help}
	<details class="group mt-5 rounded-[18px] border-2 border-line bg-paper open:border-brand">
		<summary class="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold text-brand [&::-webkit-details-marker]:hidden">
			<CircleHelp size={20} aria-hidden="true" />So geht's<span class="ml-auto text-sm text-muted group-open:hidden">aufklappen</span>
		</summary>
		<div class="richtext px-4 pb-4 text-ink [&_li]:mt-1">{@render help()}</div>
	</details>
{/if}
<div class="mt-8">{@render children()}</div>
