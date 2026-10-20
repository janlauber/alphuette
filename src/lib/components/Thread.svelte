<script lang="ts">
	import { enhance } from '$app/forms';

	type Message = { id: number; author: 'gast' | 'host'; body: string; createdAt: Date | string; via?: string };
	let {
		messages,
		me,
		names,
		placeholder,
		send,
		empty,
		locale = 'de-CH'
	}: {
		messages: Message[];
		me: 'gast' | 'host';
		names: { gast: string; host: string };
		placeholder: string;
		send: string;
		empty: string;
		locale?: string;
	} = $props();
	let sending = $state(false);

	const when = (d: Date | string) =>
		new Date(d).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' });
</script>

<ol class="grid gap-3">
	{#each messages as m (m.id)}
		<li class="max-w-[85%] {m.author === me ? 'justify-self-end' : ''}">
			<div class="whitespace-pre-line rounded-[3px] px-4 py-2.5 {m.author === me ? 'bg-tanne text-kalk' : 'border border-linie bg-paper'}">{m.body}</div>
			<p class="mt-1 text-xs text-stein {m.author === me ? 'text-right' : ''}">
				{names[m.author]}, {when(m.createdAt)}{m.via === 'mail' ? ' · Mail' : ''}
			</p>
		</li>
	{:else}
		<li class="text-stein">{empty}</li>
	{/each}
</ol>

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
	<button class="btn-line justify-self-end" disabled={sending}>{send}</button>
</form>
