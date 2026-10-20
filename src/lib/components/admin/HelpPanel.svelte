<script lang="ts">
	import { page } from '$app/state';
	import Send from '@lucide/svelte/icons/send';
	import X from '@lucide/svelte/icons/x';
	import Huettli from '#lib/components/Huettli.svelte';
	import { textToHtml } from '#lib/text.ts';

	// Help drawer: a chat with the help assistant, and a message to Jan as the way out.
	let { assistant }: { assistant: boolean } = $props();

	type Turn = { role: 'user' | 'assistant'; content: string };
	let dialog = $state<HTMLDialogElement>();
	let turns = $state<Turn[]>([]);
	let question = $state('');
	let busy = $state(false);
	let problem = $state('');
	let toJan = $state('');
	let sent = $state(false);
	let log = $state<HTMLDivElement>();

	const examples = ['Wie bestätige ich eine Anfrage?', 'Wie sperre ich eine Woche für mich?', 'Ich habe ein Foto gelöscht, wie hole ich es zurück?'];

	export function open() {
		sent = false;
		dialog?.showModal();
	}

	async function post(body: object) {
		const res = await fetch('/admin/hilfe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...body, page: page.url.pathname }) });
		if (!res.ok) throw new Error(String(res.status));
		return res.json();
	}

	async function ask(text = question) {
		if (!text.trim() || busy) return;
		turns.push({ role: 'user', content: text.trim() });
		question = '';
		busy = true;
		problem = '';
		try {
			const { answer } = await post({ kind: 'ask', messages: turns });
			turns.push({ role: 'assistant', content: answer });
		} catch {
			turns.pop();
			question = text;
			problem = 'Der Assistent antwortet gerade nicht. Schreib Jan unten direkt.';
		} finally {
			busy = false;
			requestAnimationFrame(() => log?.scrollTo({ top: log.scrollHeight, behavior: 'smooth' }));
		}
	}

	async function writeJan() {
		if (!toJan.trim() || busy) return;
		busy = true;
		problem = '';
		try {
			const chat = turns.length ? `\n\nBisher mit dem Assistenten:\n${turns.map((t) => `${t.role === 'user' ? 'Frage' : 'Antwort'}: ${t.content}`).join('\n')}` : '';
			await post({ kind: 'jan', text: toJan + chat });
			toJan = '';
			sent = true;
		} catch {
			problem = 'Das Senden ging nicht. Versuch es später nochmals.';
		} finally {
			busy = false;
		}
	}
</script>

<dialog bind:this={dialog} class="ml-auto mr-0 mt-0 h-dvh max-h-none w-full max-w-md bg-paper p-0 text-ink backdrop:bg-ink/40" aria-label="Hilfe">
	<div class="flex h-full flex-col">
		<div class="flex items-center gap-3 border-b-2 border-line px-4 py-3">
			<Huettli mini face="happy" class="size-10 text-brand" />
			<p class="flex-1 text-xl font-bold text-brand">Hilfe</p>
			<button type="button" class="grid size-11 place-items-center rounded-full border-2 border-brand text-brand" onclick={() => dialog?.close()} aria-label="Hilfe schliessen"><X size={20} /></button>
		</div>

		<div bind:this={log} class="min-h-0 flex-1 overflow-y-auto px-4 py-4">
			{#if assistant}
				<div class="grid gap-3" aria-live="polite">
					<div class="max-w-[90%] rounded-[20px] rounded-bl-[6px] border-2 border-line bg-white px-4 py-3">
						Hoi! Frag mich, wie etwas in der Verwaltung geht. Ich erkläre es dir Schritt für Schritt.
					</div>
					{#if !turns.length}
						<div class="flex flex-wrap gap-2">
							{#each examples as ex (ex)}
								<button type="button" class="rounded-full border-2 border-brand px-3 py-1.5 text-left text-sm font-semibold text-brand hover:bg-wash" onclick={() => ask(ex)}>{ex}</button>
							{/each}
						</div>
					{/if}
					{#each turns as t, i (i)}
						{#if t.role === 'user'}
							<p class="max-w-[85%] justify-self-end whitespace-pre-line rounded-[20px] rounded-br-[6px] bg-brand px-4 py-2.5 text-white">{t.content}</p>
						{:else}
							<div class="richtext max-w-[90%] rounded-[20px] rounded-bl-[6px] border-2 border-line bg-white px-4 py-3">{@html textToHtml(t.content)}</div>
						{/if}
					{/each}
					{#if busy && !toJan}<p class="text-muted">Einen Moment …</p>{/if}
				</div>
			{:else}
				<p class="text-muted">Unten kannst du Jan direkt schreiben. Er meldet sich per Mail.</p>
			{/if}
			{#if problem}<p class="mt-3 rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger" role="alert">{problem}</p>{/if}
		</div>

		<div class="grid gap-3 border-t-2 border-line px-4 py-4">
			{#if assistant}
				<form class="flex items-end gap-2" onsubmit={(e) => (e.preventDefault(), ask())}>
					<label class="sr-only" for="help-q">Deine Frage</label>
					<textarea id="help-q" bind:value={question} rows="2" placeholder="Deine Frage …" class="field min-w-0 flex-1" onkeydown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), ask())}></textarea>
					<button class="btn-blue !px-4" disabled={busy || !question.trim()} aria-label="Frage senden"><Send size={18} aria-hidden="true" /></button>
				</form>
			{/if}
			<details open={!assistant}>
				<summary class="cursor-pointer font-semibold text-brand">Jan fragen</summary>
				{#if sent}
					<p class="mt-2 rounded-[14px] bg-wash px-4 py-3" role="status">Gesendet. Jan meldet sich bei dir per Mail.</p>
				{:else}
					<form class="mt-2 grid gap-2" onsubmit={(e) => (e.preventDefault(), writeJan())}>
						<label class="sr-only" for="help-jan">Nachricht an Jan</label>
						<textarea id="help-jan" bind:value={toJan} rows="3" placeholder="Was ist los? Wo hängt es?" class="field"></textarea>
						<p class="hint text-sm">Jan sieht dazu, auf welcher Seite du bist{turns.length ? ' und was du den Assistenten gefragt hast' : ''}.</p>
						<button class="btn-line justify-self-start" disabled={busy || !toJan.trim()}>An Jan schicken</button>
					</form>
				{/if}
			</details>
		</div>
	</div>
</dialog>
