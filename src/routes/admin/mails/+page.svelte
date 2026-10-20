<script lang="ts">
	import { confirmFirst } from '#lib/confirm.svelte.ts';
	import { enhance } from '$app/forms';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';

	let { data, form } = $props();
	// svelte-ignore state_referenced_locally
	let forward = $state<string[]>(data.forward.length ? [...data.forward] : ['']);

	// one open editor at a time; drafts keep what was typed until saved or cancelled
	type Draft = { label: string; audience: string; trigger: string; days: number; subject: string; body: string; active: boolean };
	let editing = $state<string | null>(null);
	let drafts = $state<Record<string, Draft>>({});
	let focus = $state<HTMLInputElement | HTMLTextAreaElement | null>(null);
	// drafts are made when an editor opens; state must not change while the page renders
	function edit(t: (typeof data.templates)[number] | null) {
		const key = t ? String(t.id) : 'new';
		if (editing === key) return (editing = null);
		drafts[key] = t
			? { label: t.label, audience: t.audience, trigger: t.trigger, days: t.days, subject: t.subject, body: t.body, active: t.active }
			: { label: '', audience: 'gast', trigger: 'before_arrival', days: 3, subject: '', body: 'Hoi {vorname}\n\n', active: true };
		editing = key;
	}
	const fill = (text: string) => text.replace(/\{(\w+)\}/g, (m, k: string) => data.example[k] ?? m);
	function insert(d: Draft, k: string) {
		const el = focus;
		const field = el?.name === 'subject' ? 'subject' : 'body';
		const at = el ? (el.selectionStart ?? d[field].length) : d[field].length;
		d[field] = d[field].slice(0, at) + `{${k}}` + d[field].slice(at);
		requestAnimationFrame(() => {
			el?.focus();
			el?.setSelectionRange(at + k.length + 2, at + k.length + 2);
		});
	}

	const when = (d: Date) => new Date(d).toLocaleString('de-CH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' });
</script>

<AdminPage title="Mails" intro="Wohin Mails an die Hütte gehen, und welche Mails die Website selbst an Gäste schickt.">
	{#snippet help()}
		<ul>
			<li>Hake ab, welche Mails rausgehen sollen, und tippe auf «Speichern».</li>
			<li>Gäste bekommen die Mails in ihrer Sprache. Die Vorschau zeigt sie auf Deutsch mit einem erfundenen Gast.</li>
			<li>Die Texte zur Anreise kommen aus <a href="/admin/inhalte">Texte und Infos</a> («Anreise» und «Infos nur für bestätigte Gäste»).</li>
			<li>Jede verschickte Mail steht im <a href="/admin/verlauf?bereich=Mails">Verlauf</a> und unten auf dieser Seite.</li>
		</ul>
	{/snippet}

	<section class="card-strong mb-10 p-5">
		<h2 class="text-2xl">Wohin gehen Mails an die Hütte?</h2>
		<p class="mt-1 text-muted">Alles, was jemand an eine Adresse <strong>@{data.domain}</strong> schickt (zum Beispiel hallo@{data.domain}), und die Meldungen zu neuen Anfragen und Nachrichten gehen an diese Adressen. Antworten von Gästen auf eine Buchung landen direkt bei der Buchung.</p>
		<form method="POST" action="?/forward" use:enhance={() => async ({ update }) => update({ reset: false })} class="mt-4 grid gap-2">
			<p class="label">Weiterleiten an</p>
			{#each forward as _, i (i)}
				<div class="flex items-center gap-2">
					<label class="sr-only" for="forward-{i}">Adresse {i + 1}</label>
					<input id="forward-{i}" name="forward" type="email" bind:value={forward[i]} placeholder="name@beispiel.ch" aria-invalid={form?.forwardError ? 'true' : undefined} class="field min-w-0 flex-1" />
					<button type="button" class="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-danger-wash hover:text-danger" onclick={() => forward.splice(i, 1)} aria-label="Adresse {forward[i] || i + 1} entfernen"><Trash2 size={18} /></button>
				</div>
			{/each}
			<p class="hint text-sm">{forward.some((a) => a.trim()) ? '' : `Ohne Adresse geht alles an ${data.fallback.join(', ')}. `}Adressen bei {data.domain} gehen hier nicht, sonst kreist die Mail im Kreis.</p>
			{#if form?.forwardError}<p class="rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger" role="alert">{form.forwardError}</p>{/if}
			<div class="mt-1 flex flex-wrap gap-3">
				<button type="button" class="btn-line" onclick={() => forward.push('')}><Plus size={18} aria-hidden="true" />Adresse hinzufügen</button>
				<button class="btn-blue">Speichern</button>
			</div>
		</form>
	</section>

	<div class="mb-4 flex flex-wrap items-end justify-between gap-3">
		<div>
			<h2 class="text-2xl">Automatische Mails</h2>
			<p class="text-muted">Die Website schickt sie selbst, jede pro Buchung einmal. Du schreibst Deutsch, Gäste bekommen sie in ihrer Sprache.</p>
		</div>
		<button type="button" class="btn-blue" onclick={() => edit(null)}><Plus size={18} aria-hidden="true" />Neue Mail</button>
	</div>
	{#if form?.templateError && !form?.id}<p class="mb-4 rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger" role="alert">{form.templateError}</p>{/if}


	{#if editing === 'new' && drafts.new}
		<div class="card-strong mb-4 p-4 sm:p-5">
			<p class="text-lg font-bold">Neue Mail</p>
			{@render editor(null)}
		</div>
	{/if}

	<ul class="grid gap-4">
		{#each data.templates as t (t.id)}
			<li class="card p-4 sm:p-5 {t.active ? '' : 'opacity-70'}">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="text-lg font-bold text-ink">{t.label}</p>
						<p class="text-muted">{t.days} {data.triggers[t.trigger]} · an {t.audience === 'host' ? 'dich' : 'den Gast'}</p>
					</div>
					<span class="chip {t.active ? 'chip-ok' : 'chip-off'}">{t.active ? 'Ein' : 'Aus'}</span>
				</div>
				<div class="mt-3 flex flex-wrap gap-2">
					<button type="button" class="btn-line !min-h-0 !px-3 !py-1.5 text-sm" onclick={() => edit(t)} aria-expanded={editing === String(t.id)}>Bearbeiten</button>
					<form method="POST" action="?/toggle" use:enhance={confirmFirst(() => (t.active ? { title: `«${t.label}» ausschalten?`, text: 'Die Website schickt diese Mail dann nicht mehr, bis du sie wieder einschaltest.', ok: 'Ausschalten' } : null))}><input type="hidden" name="id" value={t.id} /><button class="btn-line !min-h-0 !px-3 !py-1.5 text-sm">{t.active ? 'Ausschalten' : 'Einschalten'}</button></form>
					<a href="/admin/mails/vorschau/t{t.id}" target="_blank" rel="noopener" class="btn-line !min-h-0 !px-3 !py-1.5 text-sm no-underline">Als Mail ansehen</a>
					<form method="POST" action="?/test" use:enhance><input type="hidden" name="id" value={t.id} /><button class="btn-line !min-h-0 !px-3 !py-1.5 text-sm">Testmail an mich</button></form>
					{#if !t.key}
						<form method="POST" action="?/delete" use:enhance={confirmFirst({ title: `Mail «${t.label}» löschen?`, text: 'Sie geht dann nicht mehr raus. Du kannst es im Verlauf rückgängig machen.', ok: 'Löschen', danger: true })}>
							<input type="hidden" name="id" value={t.id} /><button class="!min-h-0 px-3 py-1.5 text-sm font-semibold text-danger underline">Löschen</button>
						</form>
					{/if}
				</div>
				{#if editing === String(t.id) && drafts[String(t.id)]}{@render editor(t)}{/if}
			</li>
		{/each}
	</ul>

	<section class="mt-12">
		<h2 class="text-2xl">Mails beim Buchen</h2>
		<p class="mt-1 max-w-[60ch] text-muted">Diese Mails schickt die Website bei jedem Schritt einer Buchung von selbst. Die Bestätigung hat die Rechnung als PDF und einen Kalendereintrag im Anhang.</p>
		<ul class="mt-3 flex flex-wrap gap-2">
			{#each Object.entries(data.flow) as [art, label] (art)}
				<li><a href="/admin/mails/vorschau/{art}" target="_blank" rel="noopener" class="pill no-underline">{label}</a></li>
			{/each}
		</ul>
	</section>

	<section class="mt-12">
		<h2 class="text-2xl">Zuletzt verschickt</h2>
		{#if data.sent.length}
			<ul class="card mt-3 divide-y-2 divide-line">
				{#each data.sent as m (m.id + m.kind)}
					<li class="flex flex-wrap justify-between gap-x-4 px-4 py-2.5"><a href="/admin/buchungen/{m.id}" class="font-semibold text-ink no-underline hover:underline">{m.label}: {m.name}</a><span class="text-sm text-muted">{when(m.at)}</span></li>
				{/each}
			</ul>
		{:else}
			<p class="mt-2 text-muted">Noch keine.</p>
		{/if}
	</section>
</AdminPage>

{#snippet editor(t: (typeof data.templates)[number] | null)}
	{@const key = t ? String(t.id) : 'new'}
	{@const d = drafts[key]}
	<form method="POST" action="?/save" use:enhance={() => async ({ result, update }) => { await update({ reset: false }); if (result.type === 'success') editing = null; }} class="mt-4 grid gap-4 border-t-2 border-line pt-4">
		<input type="hidden" name="id" value={t?.id ?? ''} />
		<div class="grid gap-3 sm:grid-cols-2">
			<label class="label">Name <span class="hint font-normal">(nur für dich)</span><input name="label" bind:value={d.label} required class="field mt-1 font-normal" /></label>
			<fieldset>
				<legend class="label">Geht an</legend>
				<div class="mt-1 flex gap-2">
					{#each [['gast', 'den Gast'], ['host', 'dich']] as [v, l] (v)}
						<label class="flex flex-1 cursor-pointer items-center gap-2 rounded-[14px] border-2 px-3 py-2.5 font-semibold {d.audience === v ? 'border-brand bg-wash' : 'border-line'}"><input type="radio" name="audience" value={v} bind:group={d.audience} class="check" />{l}</label>
					{/each}
				</div>
			</fieldset>
		</div>
		<div class="flex flex-wrap items-end gap-3">
			<label class="label">Wann <input name="days" type="number" min="0" max="365" bind:value={d.days} class="field mt-1 w-24 font-normal" /></label>
			<label class="label min-w-0 flex-1"><span class="sr-only">Bezug</span>
				<select name="trigger" bind:value={d.trigger} class="field mt-1 font-normal">
					{#each Object.entries(data.triggers) as [v, l] (v)}<option value={v}>{l}</option>{/each}
				</select>
			</label>
		</div>
		<label class="label">Betreff <input name="subject" bind:value={d.subject} required class="field mt-1 font-normal" onfocus={(e) => (focus = e.currentTarget)} /></label>
		<label class="label">Text <textarea name="body" rows="9" bind:value={d.body} required class="field mt-1 font-normal leading-relaxed" onfocus={(e) => (focus = e.currentTarget)}></textarea></label>
		<div>
			<p class="hint text-sm">Platzhalter antippen, um sie an der Stelle des Cursors einzufügen. Die Website ersetzt sie für jede Buchung.</p>
			<div class="mt-2 flex flex-wrap gap-1.5">
				{#each Object.entries(data.placeholders) as [k, l] (k)}
					<button type="button" class="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-ink hover:bg-accent" title={l} onclick={() => insert(d, k)}>{'{' + k + '}'}</button>
				{/each}
			</div>
		</div>
		<input type="hidden" name="active" value={d.active ? 'on' : ''} />
		<div class="rounded-[14px] border-2 border-dashed border-line bg-paper p-4">
			<p class="text-xs font-bold uppercase tracking-wider text-muted">Vorschau mit einem erfundenen Gast</p>
			<p class="mt-2 font-bold">{fill(d.subject)}</p>
			<p class="mt-2 whitespace-pre-line text-sm">{fill(d.body)}</p>
		</div>
		{#if form?.templateError && String(form?.id ?? 'new') === key}<p class="rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger" role="alert">{form.templateError}</p>{/if}
		<div class="flex flex-wrap gap-3">
			<button class="btn-blue">Speichern</button>
			<button type="button" class="btn-line" onclick={() => (editing = null)}>Abbrechen</button>
		</div>
	</form>
{/snippet}
