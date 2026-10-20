<script lang="ts">
	import { enhance } from '$app/forms';
	import Profile from '#lib/components/Profile.svelte';

	let { data, form } = $props();
	const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });
	type Waypoint = { name: string; elev: number; min?: number | null };
	const blank = {
		id: null, slug: '', name: '', time: '', alpine: false, de: '', en: '', url: '', source: '', profile: null, distanceM: null, ascentM: null, sort: 0,
		category: 'wanderweg', sac: '', durationMin: null as number | null, seasonDe: '', seasonEn: '', startName: '', endName: '', transitDe: '', transitEn: '',
		waypoints: null as Waypoint[] | null, stops: null as string[] | null, highlightsDe: '', highlightsEn: '', tipsDe: '', tipsEn: '', family: false, loop: false, fromHut: false
	};
	const wpText = (w: Waypoint[] | null) => (w ?? []).map((p) => [p.name, p.elev, p.min ?? ''].join(' | ')).join('\n');
</script>

<h1 class="text-3xl">Wanderungen</h1>
<p class="mt-1 max-w-[62ch] text-stein">Jede Wanderung bekommt eine eigene Seite. Lade eine GPX-Datei hoch (z. B. von deiner Uhr) oder gib die Nummer einer offiziellen Route von Wanderland Schweiz ein. Dann berechnet die Seite Länge, Höhenmeter und das Höhenprofil.</p>

{#snippet hikeForm(h: typeof blank)}
	<div class="card flex flex-col gap-3 p-4">
		{#if h.profile}<Profile profile={h.profile} height={70} />{/if}
		{#if h.id}
			<p class="text-sm text-stein">
				{h.distanceM ? `${(h.distanceM / 1000).toFixed(1)} km, ${h.ascentM} m Aufstieg` : 'Noch kein Profil'}
				{h.source === 'gpx' ? ', aus GPX' : h.source === 'wanderland' ? ', Wanderland-Route' : h.source === 'netz' ? ', auf dem Wanderwegnetz berechnet' : h.source ? ', aus Wegpunkten angenähert' : ''}
			</p>
		{/if}
		<form method="POST" action="?/save" use:enhance={keep} class="grid gap-3 sm:grid-cols-6">
			<input type="hidden" name="id" value={h.id ?? ''} />
			<label class="label text-sm sm:col-span-3">Name <input name="name" value={h.name} required class="field mt-1 font-normal" /></label>
			<label class="label text-sm sm:col-span-2">Gehzeit in Minuten <input name="duration_min" type="number" min="0" value={h.durationMin ?? ''} placeholder="135" class="field mt-1 font-normal" /></label>
			<label class="label text-sm">SAC-Skala <input name="sac" value={h.sac} placeholder="T2" class="field mt-1 font-normal" /></label>
			<label class="label text-sm sm:col-span-2">Wegart
				<select name="category" class="field mt-1 font-normal">
					{#each [['wanderweg', 'Wanderweg (gelb)'], ['bergwanderweg', 'Bergwanderweg (weiss-rot-weiss)'], ['alpinwanderweg', 'Alpinwanderweg (weiss-blau-weiss)']] as [v, l] (v)}<option value={v} selected={h.category === v}>{l}</option>{/each}
				</select>
			</label>
			<div class="flex flex-wrap items-end gap-4 pb-3 text-sm sm:col-span-4">
				<label class="flex items-center gap-2"><input type="checkbox" name="family" checked={h.family} class="check" /> Mit Kindern</label>
				<label class="flex items-center gap-2"><input type="checkbox" name="loop" checked={h.loop} class="check" /> Rundweg</label>
				<label class="flex items-center gap-2"><input type="checkbox" name="from_hut" checked={h.fromHut} class="check" /> Ab Hüttli zu Fuss</label>
			</div>
			<label class="label text-sm sm:col-span-3">Beschreibung Deutsch <textarea name="de" rows="3" class="field mt-1 font-normal">{h.de}</textarea></label>
			<label class="label text-sm sm:col-span-3">Beschreibung Englisch <textarea name="en" rows="3" class="field mt-1 font-normal">{h.en}</textarea></label>
			<label class="label text-sm sm:col-span-3">Start <input name="start_name" value={h.startName} class="field mt-1 font-normal" /></label>
			<label class="label text-sm sm:col-span-3">Ziel <input name="end_name" value={h.endName} class="field mt-1 font-normal" /></label>
			<label class="label text-sm sm:col-span-3">Saison Deutsch <input name="season_de" value={h.seasonDe} placeholder="Juni bis Oktober" class="field mt-1 font-normal" /></label>
			<label class="label text-sm sm:col-span-3">Saison Englisch <input name="season_en" value={h.seasonEn} class="field mt-1 font-normal" /></label>
			<label class="label text-sm sm:col-span-6">Wegpunkte, eine Zeile pro Punkt: Name | Höhe | Minuten ab Start
				<textarea name="waypoints" rows="5" placeholder={'Griesalp | 1408 |\nBundalp | 1840 | 90'} class="field mt-1 font-mono text-sm font-normal">{wpText(h.waypoints)}</textarea></label>
			<label class="label text-sm sm:col-span-3">Hin und zurück, Deutsch <textarea name="transit_de" rows="3" class="field mt-1 font-normal">{h.transitDe}</textarea></label>
			<label class="label text-sm sm:col-span-3">Hin und zurück, Englisch <textarea name="transit_en" rows="3" class="field mt-1 font-normal">{h.transitEn}</textarea></label>
			<label class="label text-sm sm:col-span-6">Einkehren, eine Zeile pro Ort <textarea name="stops" rows="3" class="field mt-1 font-normal">{(h.stops ?? []).join('\n')}</textarea></label>
			<label class="label text-sm sm:col-span-3">Unterwegs, Deutsch (eine Zeile pro Punkt) <textarea name="highlights_de" rows="3" class="field mt-1 font-normal">{h.highlightsDe}</textarea></label>
			<label class="label text-sm sm:col-span-3">Unterwegs, Englisch <textarea name="highlights_en" rows="3" class="field mt-1 font-normal">{h.highlightsEn}</textarea></label>
			<label class="label text-sm sm:col-span-3">Gut zu wissen, Deutsch <textarea name="tips_de" rows="3" class="field mt-1 font-normal">{h.tipsDe}</textarea></label>
			<label class="label text-sm sm:col-span-3">Gut zu wissen, Englisch <textarea name="tips_en" rows="3" class="field mt-1 font-normal">{h.tipsEn}</textarea></label>
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
