<script lang="ts">
	import Mail from '@lucide/svelte/icons/mail';
	import Phone from '@lucide/svelte/icons/phone';
	import Search from '@lucide/svelte/icons/search';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';
	import { chf } from '#lib/booking.ts';
	import { fmtDate } from '#lib/i18n.ts';

	let { data } = $props();
</script>

<AdminPage title="Gäste" intro="Alle, die schon angefragt oder gebucht haben. Wer öfter kommt, steht nur einmal da.">
	{#snippet help()}
		<ul>
			<li>Tipp auf einen Namen, um die letzte Buchung dieser Person zu öffnen.</li>
			<li>Mit der Suche findest du Gäste nach Name, E-Mail oder Ort.</li>
			<li>Daten von Gästen löscht die Website 12 Monate nach dem Aufenthalt.</li>
		</ul>
	{/snippet}

	<form class="flex max-w-lg gap-2" role="search">
		<label class="sr-only" for="q">Gäste suchen</label>
		<input id="q" name="q" type="search" value={data.q} placeholder="Name, E-Mail oder Ort" class="field" />
		<button class="btn-blue shrink-0 !px-5"><Search size={18} aria-hidden="true" />Suchen</button>
	</form>
	{#if data.q}<p class="mt-3 text-muted">{data.guests.length} gefunden für «{data.q}». <a href="/admin/gaeste">Alle zeigen</a></p>{/if}

	<ul class="mt-6 grid gap-3 sm:grid-cols-2">
		{#each data.guests as g (g.email)}
			<li class="card flex flex-col gap-3 p-4">
				<div>
					<a href="/admin/buchungen/{g.lastId}" class="text-lg font-bold text-brand">{g.name}</a>
					{#if g.city}<p class="text-muted">{g.city}</p>{/if}
				</div>
				<div class="grid gap-1 text-sm">
					<a href="mailto:{g.email}" class="flex min-h-9 items-center gap-2 break-all"><Mail size={16} class="shrink-0" aria-hidden="true" />{g.email}</a>
					{#if g.phone}<a href="tel:{g.phone}" class="flex min-h-9 items-center gap-2"><Phone size={16} class="shrink-0" aria-hidden="true" />{g.phone}</a>{/if}
				</div>
				<dl class="mt-auto grid grid-cols-3 gap-2 border-t-2 border-line pt-3 text-sm">
					<div><dt class="text-muted">Aufenthalte</dt><dd class="font-bold tabular-nums text-ink">{g.stays}</dd></div>
					<div><dt class="text-muted">Zuletzt</dt><dd class="font-bold text-ink">{g.lastStay ? fmtDate(g.lastStay, 'de', { weekday: undefined, day: undefined, month: 'short' }) : 'angefragt'}</dd></div>
					<div><dt class="text-muted">Umsatz</dt><dd class="font-bold tabular-nums text-ink">{chf(g.total)}</dd></div>
				</dl>
			</li>
		{:else}
			<li class="text-muted">{data.q ? 'Niemand gefunden.' : 'Noch keine Gäste.'}</li>
		{/each}
	</ul>
</AdminPage>
