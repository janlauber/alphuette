<script lang="ts">
	import { onMount } from 'svelte';
	import { reveal } from '#lib/hidemail.ts';

	// The server sends the address without a mailto link and with a hidden decoy in it, which bots read
	// along (hallo.entfernen@…) and people do not see. In the browser it becomes a normal link.
	let { hidden, class: cls = '' }: { hidden: string; class?: string } = $props();
	const address = $derived(reveal(hidden));
	const at = $derived(address.indexOf('@'));
	let ready = $state(false);
	onMount(() => (ready = true));
</script>

{#if ready}
	<a href="mailto:{address}" class={cls}>{address}</a>
{:else if at > 0}
	<span class={cls}>{address.slice(0, at)}<span class="hidden">.entfernen</span>&#64;{address.slice(at + 1)}</span>
{/if}
