<script lang="ts">
	import Eye from '@lucide/svelte/icons/eye';
	import { parseFaq, textToHtml } from '#lib/text.ts';

	// Shows a text field the way the website will show it, while Tom types.
	let { text, kind = 'text' }: { text: string; kind?: 'text' | 'faq' | 'line' } = $props();
	const faq = $derived(kind === 'faq' ? parseFaq(text) : []);
</script>

<div class="rounded-[14px] border-2 border-dashed border-line bg-paper p-4">
	<p class="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted"><Eye size={14} aria-hidden="true" />So sieht es auf der Website aus</p>
	{#if !text.trim()}
		<p class="text-muted">Leer. Auf der Website erscheint dieser Teil nicht.</p>
	{:else if kind === 'line'}
		<p class="text-lg font-semibold text-brand">{text}</p>
	{:else if kind === 'faq'}
		<div class="grid gap-2">
			{#each faq as f, i (i)}
				<div class="rounded-[12px] border-2 border-line px-3 py-2"><p class="font-bold text-brand">{f.q}</p><div class="richtext mt-1 text-sm">{@html textToHtml(f.a)}</div></div>
			{:else}
				<p class="text-danger">Ich erkenne keine Frage. Schreib die Frage auf eine Zeile, die Antwort darunter, und lass zwischen zwei Fragen eine Zeile leer.</p>
			{/each}
		</div>
	{:else}
		<div class="richtext">{@html textToHtml(text)}</div>
	{/if}
</div>
