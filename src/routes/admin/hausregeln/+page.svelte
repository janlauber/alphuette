<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';

	let { data } = $props();
	// svelte-ignore state_referenced_locally
	let rules = $state<string[]>(data.rules.length ? [...data.rules] : ['']);
	let busy = $state(false);
	const dirty = $derived(JSON.stringify(rules.map((r) => r.trim()).filter(Boolean)) !== JSON.stringify(data.rules));

	const ideas = ['Rauchen nur draussen.', 'Haustiere nur nach Absprache.', 'Nachtruhe ab 22 Uhr.', 'Feuer nur im Gartencheminée, nie bei Trockenheit.', 'Abfall bitte wieder mitnehmen.', 'Parkieren nur auf dem Platz, der in den Infos steht.'];
	const add = (text = '') => rules.push(text);
	const move = (i: number, d: number) => ([rules[i], rules[i + d]] = [rules[i + d], rules[i]]);
</script>

<AdminPage title="Hausregeln" intro="Was im Hüttli gilt. Gäste sehen die Regeln beim Anfragen, auf ihrer Buchungsseite und auf dem Infoblatt.">
	{#snippet help()}
		<ul>
			<li>Eine Regel pro Zeile, kurz und freundlich. Mit den Pfeilen änderst du die Reihenfolge.</li>
			<li>Gäste aus dem Ausland lesen die Regeln automatisch in ihrer Sprache.</li>
			<li>Anreise- und Abreisezeit und die Anzahl Personen stellst du unter <a href="/admin/preise">Preise und Saisons</a> ein.</li>
		</ul>
	{/snippet}

	<form
		method="POST"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update({ reset: false });
				busy = false;
			};
		}}
		class="grid gap-8"
	>
		<div class="grid max-w-3xl content-start gap-3">
			{#each rules as _, i (i)}
				<div class="card p-3">
					<div class="flex items-start gap-3">
						<span class="mt-2 grid size-8 shrink-0 place-items-center rounded-full bg-wash text-sm font-bold text-brand" aria-hidden="true">{i + 1}</span>
						<label class="sr-only" for="rule-{i}">Regel {i + 1}</label>
						<textarea
							id="rule-{i}"
							name="rule"
							bind:value={rules[i]}
							rows={Math.max(2, Math.ceil((rules[i]?.length ?? 0) / 60))}
							placeholder="z. B. Rauchen nur draussen."
							class="field min-w-0 flex-1 resize-none leading-relaxed [field-sizing:content]"
						></textarea>
					</div>
					<div class="mt-2 flex justify-end gap-1">
						<button type="button" class="grid size-10 place-items-center rounded-full text-brand hover:bg-wash disabled:opacity-30" disabled={i === 0} onclick={() => move(i, -1)} aria-label="Regel {i + 1} nach oben"><ArrowUp size={18} /></button>
						<button type="button" class="grid size-10 place-items-center rounded-full text-brand hover:bg-wash disabled:opacity-30" disabled={i === rules.length - 1} onclick={() => move(i, 1)} aria-label="Regel {i + 1} nach unten"><ArrowDown size={18} /></button>
						<button type="button" class="grid size-10 place-items-center rounded-full text-muted hover:bg-danger-wash hover:text-danger" onclick={() => rules.splice(i, 1)} aria-label="Regel {i + 1} entfernen"><Trash2 size={18} /></button>
					</div>
				</div>
			{/each}
			<div class="mt-1 flex flex-wrap gap-3">
				<button type="button" class="btn-line" onclick={() => add()}><Plus size={18} aria-hidden="true" />Regel hinzufügen</button>
				<button class="btn-blue" disabled={busy || !dirty}>{busy ? 'Speichert …' : 'Speichern'}</button>
			</div>
		</div>

		<div class="grid max-w-3xl gap-6 sm:grid-cols-2">
			<div>
				<p class="font-semibold">Ideen zum Antippen</p>
				<div class="mt-2 flex flex-wrap gap-2">
					{#each ideas.filter((x) => !rules.includes(x)) as x (x)}
						<button type="button" class="rounded-full border-2 border-brand px-3 py-1.5 text-left text-sm font-semibold text-brand hover:bg-wash" onclick={() => (rules[rules.length - 1]?.trim() ? add(x) : (rules[rules.length - 1] = x))}>{x}</button>
					{:else}
						<p class="text-sm text-muted">Alle Ideen sind schon drin.</p>
					{/each}
				</div>
			</div>
			<div class="rounded-[14px] border-2 border-dashed border-line bg-paper p-4">
				<p class="text-xs font-bold uppercase tracking-wider text-muted">So sieht es auf der Website aus</p>
				<ul class="richtext mt-2">
					{#each rules.filter((r) => r.trim()) as r, i (i)}<li>{r}</li>{:else}<p class="text-muted">Noch keine Regel.</p>{/each}
				</ul>
			</div>
		</div>
	</form>
</AdminPage>
