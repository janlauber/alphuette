<script lang="ts">
	import { enhance } from '$app/forms';
	import Languages from '@lucide/svelte/icons/languages';

	// Messages are stored as written, plus a translation: guest messages into German for Tom,
	// Tom's messages into the guest's language. Each side reads the other side in its own language.
	type Message = { id: number; author: 'gast' | 'host'; body: string; translation?: string | null; createdAt: Date | string; via?: string };
	type Labels = { translated: string; original: string; hideOriginal: string; mine?: string; hideMine?: string };
	let {
		messages,
		me,
		names,
		placeholder,
		send,
		empty,
		hint = '',
		labels = { translated: 'Automatisch übersetzt', original: 'Original anzeigen', hideOriginal: 'Original ausblenden' },
		locale = 'de-CH',
		readonly = false
	}: {
		messages: Message[];
		me: 'gast' | 'host';
		names: { gast: string; host: string };
		placeholder: string;
		send: string;
		empty: string;
		hint?: string;
		labels?: Labels;
		locale?: string;
		/** no writing, e.g. while the guest has not confirmed the email address */
		readonly?: boolean;
	} = $props();
	let sending = $state(false);

	const when = (d: Date | string) =>
		new Date(d).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' });
</script>

{#snippet toggle(show: string, hide: string, text: string, mine: boolean)}
	<details class="group mt-1 text-sm {mine ? 'text-right' : ''}">
		<summary class="inline-flex min-h-8 cursor-pointer list-none items-center gap-1.5 font-semibold text-brand [&::-webkit-details-marker]:hidden">
			<Languages size={15} aria-hidden="true" /><span class="group-open:hidden">{show}</span><span class="hidden group-open:inline">{hide}</span>
		</summary>
		<div class="mt-1 whitespace-pre-line rounded-[16px] border-2 border-dashed border-line bg-paper px-3 py-2 text-left text-ink">{text}</div>
	</details>
{/snippet}

<ol class="grid gap-4">
	{#each messages as m (m.id)}
		{@const mine = m.author === me}
		<!-- the other side's message in my language, if it was translated -->
		{@const shown = !mine && m.translation ? m.translation : m.body}
		<li class="max-w-[85%] {mine ? 'justify-self-end' : ''}">
			<div class="whitespace-pre-line rounded-[22px] px-4 py-2.5 {mine ? 'rounded-br-[6px] bg-brand text-white' : 'rounded-bl-[6px] border-2 border-line bg-paper'}">{shown}</div>
			<p class="mt-1 text-xs text-muted {mine ? 'text-right' : ''}">
				{names[m.author]}, {when(m.createdAt)}{m.via === 'mail' ? ' · Mail' : ''}{!mine && m.translation ? ` · ${labels.translated}` : ''}
			</p>
			{#if m.translation && !mine}
				{@render toggle(labels.original, labels.hideOriginal, m.body, false)}
			{:else if m.translation && labels.mine}
				{@render toggle(labels.mine, labels.hideMine ?? labels.hideOriginal, m.translation, true)}
			{/if}
		</li>
	{:else}
		<li class="text-muted">{empty}</li>
	{/each}
</ol>

{#if !readonly}
<form
	method="POST"
	action="?/message"
	class="mt-5 grid gap-2"
	use:enhance={() => {
		sending = true;
		return async ({ update }) => {
			await update();
			sending = false;
		};
	}}
>
	<label class="sr-only" for="body">{placeholder}</label>
	<textarea id="body" name="body" rows="3" required maxlength="5000" {placeholder} class="field"></textarea>
	<div class="flex flex-wrap items-start justify-between gap-3">
		{#if hint}<p class="hint max-w-md text-sm">{hint}</p>{/if}
		<button class="btn-primary ml-auto" disabled={sending} aria-busy={sending}>{send}</button>
	</div>
</form>
{/if}
