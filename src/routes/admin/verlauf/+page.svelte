<script lang="ts">
	import { confirmFirst } from '#lib/confirm.svelte.ts';
	import { enhance } from '$app/forms';
	import Undo2 from '@lucide/svelte/icons/undo-2';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';

	let { data, form } = $props();
	const day = (d: Date) => new Date(d).toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Zurich' });
	const time = (d: Date) => new Date(d).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' });
	const days = $derived(Object.entries(Object.groupBy(data.entries, (e) => day(e.at))));
	const who = (email: string) => email.split('@')[0];
</script>

<AdminPage title="Verlauf" intro="Alles, was in der Verwaltung geändert wurde, mit Datum und Zeit. Das Neuste steht oben.">
	{#snippet help()}
		<ul>
			<li>Bei Änderungen an Texten, Preisen, Fotos, Wanderungen, Gästebuch und Kalender-Sperren steht «Rückgängig». Damit kommt der alte Stand zurück.</li>
			<li>Wurde dasselbe danach nochmals geändert, mach zuerst die neuere Änderung rückgängig.</li>
			<li>Bestätigen, Ablehnen, Stornieren und Nachrichten schicken Mails an Gäste. Die lassen sich nicht zurückholen, darum fehlt dort der Knopf.</li>
			<li>Ging etwas Grösseres schief, hilft eine <a href="/admin/sicherungen">Sicherung</a>.</li>
		</ul>
	{/snippet}

	{#if data.areas.length > 1}
		<nav class="mb-6 flex flex-wrap gap-2" aria-label="Bereich">
			<a href="/admin/verlauf" class="pill no-underline {data.area ? '' : '!bg-brand !text-white'}">Alles</a>
			{#each data.areas as a (a)}
				<a href="?bereich={encodeURIComponent(a)}" class="pill no-underline {data.area === a ? '!bg-brand !text-white' : ''}">{a}</a>
			{/each}
		</nav>
	{/if}
	{#if form?.error}<p class="mb-4 rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger" role="alert">{form.error}</p>{/if}

	{#each days as [label, entries] (label)}
		<section class="mb-8">
			<h2 class="mb-2 text-lg">{label}</h2>
			<ul class="card divide-y-2 divide-line overflow-hidden">
				{#each entries ?? [] as e (e.id)}
					<li class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 {e.undoneAt ? 'text-off-text' : ''}">
						<span class="w-12 shrink-0 tabular-nums text-muted">{time(e.at)}</span>
						<span class="min-w-0 flex-1">
							{#if e.link && !e.undoneAt && !e.gone}<a href={e.link} class="font-semibold text-ink no-underline hover:underline">{e.title}</a>{:else}<span class="font-semibold {e.undoneAt ? 'line-through' : ''}">{e.title}</span>{/if}
							<span class="block text-sm text-muted">{e.area} · {who(e.actor)}{e.undoneAt ? ' · rückgängig gemacht' : ''}{e.gone ? ' · gibt es nicht mehr' : ''}</span>
						</span>
						{#if e.undoable && !e.undoneAt}
							<form method="POST" action="?/undo" use:enhance={confirmFirst({ title: 'Rückgängig machen?', text: `«${e.title}» wird auf den Stand davor zurückgesetzt.`, ok: 'Rückgängig machen' })}>
								<input type="hidden" name="id" value={e.id} />
								<button class="btn-line !min-h-0 !px-3 !py-1 text-sm"><Undo2 size={15} aria-hidden="true" />Rückgängig</button>
							</form>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{:else}
		<p class="text-muted">Noch nichts. Sobald du etwas änderst, steht es hier.</p>
	{/each}
</AdminPage>
