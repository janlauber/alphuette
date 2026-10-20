<script lang="ts">
	import { enhance } from '$app/forms';
	import Profile from '#lib/components/Profile.svelte';

	let { data, form } = $props();
	const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });
	const blank = { id: null, slug: '', name: '', time: '', alpine: false, de: '', en: '', url: '', source: '', profile: null, distanceM: null, ascentM: null, sort: 0 };
</script>

<h1 class="text-3xl">Wanderungen</h1>
<p class="mt-1 max-w-[62ch] text-stein">Jede Wanderung bekommt eine eigene Seite. Lade eine GPX-Datei hoch (z. B. von deiner Uhr) oder gib die Nummer einer offiziellen Route von Wanderland Schweiz ein. Dann berechnet die Seite Länge, Höhenmeter und das Höhenprofil.</p>

{#snippet hikeForm(h: typeof blank)}
	<div class="card flex flex-col gap-3 p-4">
		{#if h.profile}<Profile profile={h.profile} height={70} />{/if}
		{#if h.id}
			<p class="text-sm text-stein">
				{h.distanceM ? `${(h.distanceM / 1000).toFixed(1)} km, ${h.ascentM} m Aufstieg` : 'Noch kein Profil'}
				{h.source === 'gpx' ? ', aus GPX' : h.source === 'wanderland' ? ', Wanderland-Route' : h.source ? ', aus Wegpunkten angenähert' : ''}
			</p>
		{/if}
		<form method="POST" action="?/save" use:enhance={keep} class="grid gap-3 sm:grid-cols-6">
			<input type="hidden" name="id" value={h.id ?? ''} />
			<label class="label text-sm sm:col-span-3">Name <input name="name" value={h.name} required class="field mt-1 font-normal" /></label>
			<label class="label text-sm sm:col-span-2">Gehzeit <input name="time" value={h.time} placeholder="2 h 15 min" class="field mt-1 font-normal" /></label>
			<label class="flex items-end gap-2 pb-3 text-sm"><input type="checkbox" name="alpine" checked={h.alpine} class="size-4 accent-fir" /> Bergweg</label>
			<label class="label text-sm sm:col-span-3">Beschreibung Deutsch <textarea name="de" rows="3" class="field mt-1 font-normal">{h.de}</textarea></label>
			<label class="label text-sm sm:col-span-3">Beschreibung Englisch <textarea name="en" rows="3" class="field mt-1 font-normal">{h.en}</textarea></label>
			<label class="label text-sm sm:col-span-3">Link mit mehr Infos <input name="url" type="url" value={h.url} class="field mt-1 font-normal" /></label>
			<label class="label text-sm sm:col-span-2">Adresse <input name="slug" value={h.slug} placeholder="aus dem Namen" class="field mt-1 font-normal" /></label>
			<label class="label text-sm">Reihenfolge <input name="sort" type="number" value={h.sort} class="field mt-1 font-normal" /></label>
			<div class="flex items-center gap-3 sm:col-span-6">
				<button class="btn-line !min-h-9 !py-1 text-sm">{h.id ? 'Speichern' : 'Wanderung hinzufügen'}</button>
				{#if form?.saved === (h.id ?? 'new')}<span class="text-sm text-moos">Gespeichert</span>{/if}
				{#if form?.error && form.id === h.id}<span class="text-sm text-geranium" role="alert">{form.error}</span>{/if}
			</div>
		</form>
		{#if h.id}
			<div class="flex flex-wrap items-center gap-3 border-t border-line pt-3">
				<form method="POST" action="?/gpx" enctype="multipart/form-data" use:enhance class="flex flex-wrap items-center gap-2">
					<input type="hidden" name="id" value={h.id} />
					<label class="text-sm font-semibold">GPX-Datei <input type="file" name="gpx" accept=".gpx,application/gpx+xml" required class="ml-1 text-sm font-normal" /></label>
					<button class="btn-line !min-h-9 !py-1 text-sm">Route laden</button>
				</form>
				<form method="POST" action="?/wanderland" use:enhance class="flex flex-wrap items-center gap-2">
					<input type="hidden" name="id" value={h.id} />
					<label class="text-sm font-semibold">oder Wanderland-Route Nr. <input name="nr" placeholder="1.13" class="field ml-1 inline-block !min-h-9 !w-20 !py-1 font-normal" /></label>
					<button class="btn-line !min-h-9 !py-1 text-sm">Laden</button>
				</form>
				<form method="POST" action="?/delete" class="ml-auto" use:enhance={({ cancel }) => { if (!confirm('Wanderung löschen?')) cancel(); }}>
					<input type="hidden" name="id" value={h.id} /><button class="text-sm text-geranium underline">Löschen</button>
				</form>
			</div>
		{/if}
	</div>
{/snippet}

<div class="mt-8 grid gap-4">
	{#each data.hikes as h (h.id)}{@render hikeForm(h as typeof blank)}{/each}
	<h2 class="mt-4 text-xl">Neue Wanderung</h2>
	{@render hikeForm(blank)}
</div>
