<script lang="ts">
	import { enhance } from '$app/forms';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';

	let { data } = $props();
	const when = (d: Date) => new Date(d).toLocaleString('de-CH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' });
</script>

<AdminPage title="Automatische Mails" intro="Diese Mails schickt die Website selbst, damit du nicht daran denken musst. Jede geht pro Buchung nur einmal raus.">
	{#snippet help()}
		<ul>
			<li>Hake ab, welche Mails rausgehen sollen, und tippe auf «Speichern».</li>
			<li>Gäste bekommen die Mails in ihrer Sprache. Die Vorschau zeigt sie auf Deutsch mit einem erfundenen Gast.</li>
			<li>Die Texte zur Anreise kommen aus <a href="/admin/inhalte">Texte und Infos</a> («Anreise» und «Infos nur für bestätigte Gäste»).</li>
			<li>Jede verschickte Mail steht im <a href="/admin/verlauf?bereich=Mails">Verlauf</a> und unten auf dieser Seite.</li>
		</ul>
	{/snippet}

	<form method="POST" action="?/save" use:enhance={() => async ({ update }) => update({ reset: false })} class="grid gap-4">
		{#each data.kinds as k (k.key)}
			<div class="card p-4 sm:p-5">
				<label class="flex items-start gap-3">
					<input type="checkbox" name={k.key} checked={k.on} class="check mt-1" />
					<span><span class="block text-lg font-bold text-ink">{k.label}</span><span class="text-muted">{k.when}</span></span>
				</label>
				<details class="mt-3">
					<summary class="cursor-pointer font-semibold text-brand">Vorschau</summary>
					<div class="mt-2 rounded-[14px] border-2 border-dashed border-line p-4">
						<p class="font-bold">{k.preview.subject}</p>
						<p class="mt-2 whitespace-pre-line text-sm">{k.preview.text}</p>
					</div>
				</details>
			</div>
		{/each}
		<div><button class="btn-blue">Speichern</button></div>
	</form>

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
