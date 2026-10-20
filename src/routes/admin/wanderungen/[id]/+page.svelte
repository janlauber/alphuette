<script lang="ts">
	import { enhance } from '$app/forms';
	import { refreshAll } from '$app/navigation';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import FileUp from '@lucide/svelte/icons/file-up';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import MapPinOff from '@lucide/svelte/icons/map-pin-off';
	import Plus from '@lucide/svelte/icons/plus';
	import Signpost from '@lucide/svelte/icons/signpost';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';
	import TextPreview from '#lib/components/admin/TextPreview.svelte';
	import Profile from '#lib/components/Profile.svelte';
	import RouteMap from '#lib/components/RouteMap.svelte';

	let { data, form } = $props();
	const h = $derived(data.hike);
	const isNew = $derived(h.id === null);

	// editable copies; they start from the stored hike and are sent with the form
	type Row = { name: string; elev: number | null; min: number | null };
	// svelte-ignore state_referenced_locally
	const start = data.hike;
	let name = $state(start.name);
	let duration = $state<number | null>(start.durationMin);
	let de = $state(start.de);
	let highlights = $state(start.highlightsDe);
	let transit = $state(start.transitDe);
	let tips = $state(start.tipsDe);
	let wps = $state<Row[]>((start.waypoints ?? []).map((w) => ({ name: w.name, elev: w.elev || null, min: w.min ?? null })));
	let routeTab = $state<'gpx' | 'nr' | 'none'>(start.source === 'wanderland' ? 'nr' : 'gpx');
	let busy = $state('');
	let at = $state<number | null>(null);

	// another hike in the same page (e.g. right after "anlegen"): start over from its data
	// svelte-ignore state_referenced_locally
	let shownId = start.id;
	$effect(() => {
		const k = data.hike;
		if (k.id === shownId) return;
		shownId = k.id;
		[name, duration, de, highlights, transit, tips] = [k.name, k.durationMin, k.de, k.highlightsDe, k.transitDe, k.tipsDe];
		routeTab = k.source === 'wanderland' ? 'nr' : 'gpx';
		at = null;
	});

	// after a save or a new route the server holds the truth: take over the waypoints again
	// svelte-ignore state_referenced_locally
	let seen = JSON.stringify(start.waypoints);
	$effect(() => {
		const now = JSON.stringify(data.hike.waypoints);
		if (now !== seen) {
			seen = now;
			wps = (data.hike.waypoints ?? []).map((w) => ({ name: w.name, elev: w.elev || null, min: w.min ?? null }));
		}
	});

	// the profile of a new route is computed on the server; look again every few seconds
	$effect(() => {
		if (!data.pending) return;
		const t = setTimeout(() => refreshAll(), 5000);
		return () => clearTimeout(t);
	});

	const measured = $derived(!!h.profile && h.source !== 'wegpunkte');
	const placed = $derived(new Map((h.waypoints ?? []).map((w) => [w.name, w.distM ?? null])));
	const preview = $derived(wps.filter((w) => w.name.trim()).map((w) => ({ name: w.name.trim(), elev: w.elev ?? 0, distM: placed.get(w.name.trim()) ?? null })));
	const highest = $derived(h.profile?.length ? Math.round(Math.max(...h.profile.map((p) => p[1]), ...preview.map((w) => w.elev))) : null);

	// Swiss hiking time: 4 km/h on the flat, 300 m an hour up, 500 m down; the larger part counts fully, the smaller half
	const estimate = $derived.by(() => {
		if (!measured || !h.distanceM) return null;
		const flat = h.distanceM / 1000 / 4;
		const vertical = (h.ascentM ?? 0) / 300 + (h.descentM ?? 0) / 500;
		return Math.round(((Math.max(flat, vertical) + Math.min(flat, vertical) / 2) * 60) / 5) * 5;
	});
	const hm = (min: number | null) => (!min ? '' : min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}` : `${min} min`);
	const km = (m: number) => `${(m / 1000).toLocaleString('de-CH', { maximumFractionDigits: 1 })} km`;
	const source = $derived(
		h.source === 'gpx' ? 'aus deiner GPX-Datei' : h.source === 'wanderland' ? `SchweizMobil-Route ${h.wanderland ?? ''}` : h.source === 'netz' ? 'auf dem Wanderwegnetz berechnet' : h.source === 'wegpunkte' ? 'aus den Wegpunkten geschätzt' : ''
	);
	const asList = (s: string) =>
		s
			.split('\n')
			.map((l) => l.trim())
			.filter(Boolean)
			.map((l) => `- ${l}`)
			.join('\n');

	const move = (i: number, d: -1 | 1) => ([wps[i], wps[i + d]] = [wps[i + d], wps[i]]);
	const keep = (key: string) => () => {
		busy = key;
		return async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			busy = '';
		};
	};
</script>

<AdminPage title={isNew ? 'Neue Wanderung planen' : h.name} intro={isNew ? 'Gib ihr einen Namen und speichere. Danach kannst du die Route laden.' : 'Links änderst du, rechts siehst du sofort, wie es auf der Website aussieht.'}>
	{#snippet actions()}
		<a href="/admin/wanderungen" class="btn-line no-underline"><ArrowLeft size={18} aria-hidden="true" />Alle Wanderungen</a>
		{#if !isNew}<a href="/wanderungen/{h.slug}" target="_blank" class="btn-line no-underline">Vorschau auf der Website<ExternalLink size={16} aria-hidden="true" /></a>{/if}
	{/snippet}
	{#snippet help()}
		<ul>
			<li>Fülle die Schritte von oben nach unten aus. Nur der Name ist Pflicht, alles andere kannst du später ergänzen.</li>
			<li>Die Route kommt aus einer GPX-Datei (zum Beispiel aus der SchweizMobil-App oder von deiner Uhr) oder aus der Nummer einer offiziellen SchweizMobil-Route. Länge, Höhenmeter und Höhenprofil rechnet die Website dann selbst.</li>
			<li>Wegpunkte erscheinen als gelbe Wegweiser. Fahr mit dem Finger oder der Maus über das Höhenprofil, dann zeigt die Karte, wo du bist.</li>
			<li>«Speichern» unten sichert alles ausser der Route; die Route wird sofort beim Laden übernommen. Fehler? Im <a href="/admin/verlauf">Verlauf</a> gibt es «Rückgängig».</li>
		</ul>
	{/snippet}

	<!-- all fields belong to this form through form="hike", so the route forms can sit in between -->
	<form id="hike" method="POST" action="?/save" use:enhance={keep('save')}></form>

	<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
		<div class="grid gap-6">
			<section class="card grid gap-4 p-5">
				<h2 class="text-xl">1. Grunddaten</h2>
				<label><span class="label">Name</span><input form="hike" name="name" bind:value={name} required class="field" placeholder="z. B. Tschingelsee" /></label>
				<label><span class="label">Wegart</span>
					<select form="hike" name="category" class="field">
						{#each [['wanderweg', 'Wanderweg (gelb)'], ['bergwanderweg', 'Bergwanderweg (weiss-rot-weiss)'], ['alpinwanderweg', 'Alpinwanderweg (weiss-blau-weiss)']] as [v, l] (v)}
							<option value={v} selected={h.category === v}>{l}</option>
						{/each}
					</select>
				</label>
				<div class="grid gap-4 sm:grid-cols-2">
					<label><span class="label">Gehzeit in Minuten</span>
						<input form="hike" name="duration_min" type="number" min="0" step="5" bind:value={duration} placeholder="135" class="field" />
						<span class="hint mt-1 block text-sm">{duration ? `Das sind ${hm(duration)}, ohne Pausen.` : 'Ohne Pausen. 135 heisst 2 h 15 min.'}</span>
					</label>
					<label><span class="label">SAC-Skala <span class="hint">(freiwillig)</span></span>
						<input form="hike" name="sac" value={h.sac} placeholder="T2" class="field" />
						<span class="hint mt-1 block text-sm">T1 einfach, T2 Bergweg, T3 anspruchsvoll.</span>
					</label>
				</div>
				<div class="flex flex-wrap gap-x-6 gap-y-1">
					<label class="flex min-h-11 items-center gap-2.5"><input form="hike" type="checkbox" name="from_hut" checked={h.fromHut} class="check" />Start zu Fuss ab Hüttli</label>
					<label class="flex min-h-11 items-center gap-2.5"><input form="hike" type="checkbox" name="loop" checked={h.loop} class="check" />Rundweg</label>
					<label class="flex min-h-11 items-center gap-2.5"><input form="hike" type="checkbox" name="family" checked={h.family} class="check" />Gut mit Kindern</label>
				</div>
				<label><span class="label">Beschreibung</span>
					<textarea form="hike" name="de" rows="4" bind:value={de} class="field leading-relaxed" placeholder="Zwei, drei Sätze: Was macht diese Wanderung schön?"></textarea>
				</label>
				{#if de.trim()}<TextPreview text={de} />{/if}
			</section>

			<section class="card grid gap-4 p-5">
				<h2 class="text-xl">2. Route</h2>
				{#if isNew}
					<p class="text-muted">Speichere die Wanderung zuerst (unten «Wanderung anlegen»). Danach lädst du hier die Route.</p>
				{:else}
					<p class="rounded-[14px] bg-wash px-4 py-3">
						{#if data.pending}
							<span class="flex items-center gap-2 font-semibold"><LoaderCircle size={18} class="animate-spin" aria-hidden="true" />Höhenprofil wird berechnet, das dauert einen Moment …</span>
						{:else if h.profile}
							Aktuell: Route {source}{measured && h.distanceM ? `, ${km(h.distanceM)}, ${h.ascentM} m Aufstieg` : ''}.
						{:else}
							Aktuell: noch keine Route. Auf der Website erscheinen nur die Wegpunkte als Wegweiser.
						{/if}
					</p>
					<div class="grid gap-2" role="radiogroup" aria-label="Woher kommt die Route?">
						{#each [{ k: 'gpx', label: 'GPX-Datei hochladen', Icon: FileUp }, { k: 'nr', label: 'SchweizMobil-Route', Icon: Signpost }, { k: 'none', label: 'Noch keine Route', Icon: MapPinOff }] as o (o.k)}
							<button type="button" role="radio" aria-checked={routeTab === o.k} onclick={() => (routeTab = o.k as typeof routeTab)} class="flex min-h-14 items-center gap-2.5 rounded-[16px] border-2 px-3 py-2 text-left font-semibold transition {routeTab === o.k ? 'border-brand bg-brand text-white' : 'border-line hover:border-brand'}">
								<o.Icon size={20} aria-hidden="true" />{o.label}
							</button>
						{/each}
					</div>
					{#if routeTab === 'gpx'}
						<form method="POST" action="?/gpx" enctype="multipart/form-data" use:enhance={keep('gpx')} class="grid gap-2">
							<p class="hint text-sm">Eine GPX-Datei hast du zum Beispiel aus der SchweizMobil-App («Teilen», dann «GPX»), von deiner Sportuhr oder von einer Wanderseite. Die neue Route ersetzt die alte.</p>
							<input type="file" name="gpx" accept=".gpx,application/gpx+xml" required class="block w-full rounded-[14px] border-2 border-dashed border-line p-3 text-sm" />
							<button class="btn-blue justify-self-start" disabled={busy === 'gpx'}>{busy === 'gpx' ? 'Lädt und rechnet …' : 'Route laden'}</button>
						</form>
					{:else if routeTab === 'nr'}
						<form method="POST" action="?/wanderland" use:enhance={keep('nr')} class="grid gap-2">
							<p class="hint text-sm">Offizielle Routen von SchweizMobil haben eine Nummer, zum Beispiel 1.13 für die Hohtürli-Etappe. Du findest sie auf schweizmobil.ch bei der Route.</p>
							<label class="flex flex-wrap items-center gap-2"><span class="sr-only">Routennummer</span><input name="nr" value={h.wanderland ?? ''} placeholder="1.13" inputmode="decimal" class="field w-32" />
								<button class="btn-blue" disabled={busy === 'nr'}>{busy === 'nr' ? 'Lädt …' : 'Route laden'}</button></label>
						</form>
					{:else}
						<form method="POST" action="?/noroute" use:enhance={(e) => { if (h.profile && !confirm('Die Route entfernen? Du kannst es im Verlauf rückgängig machen.')) return e.cancel(); return keep('none')(); }} class="grid gap-2">
							<p class="hint text-sm">Ohne Route zeigt die Website keine Karte und kein Höhenprofil, nur die Wegpunkte als Wegweiser und deine Gehzeit.</p>
							{#if h.profile}<button class="btn-line justify-self-start">Route entfernen</button>{:else}<p class="text-sm font-semibold">So ist es jetzt.</p>{/if}
						</form>
					{/if}
					{#if form?.routeError}<p class="rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger" role="alert">{form.routeError}</p>{/if}
				{/if}
			</section>

			<section class="card grid gap-4 p-5">
				<h2 class="text-xl">3. Start, Ziel und Wegpunkte</h2>
				<div class="grid gap-4 sm:grid-cols-2">
					<label><span class="label">Start</span><input form="hike" name="start_name" value={h.startName} class="field" placeholder="Lengschwendi, Hüttli" /></label>
					<label><span class="label">Ziel</span><input form="hike" name="end_name" value={h.endName} class="field" placeholder="Tschingelsee" /></label>
				</div>
				<div>
					<p class="label">Wegpunkte</p>
					<p class="hint text-sm">Orte unterwegs, in der Reihenfolge der Wanderung. Sie erscheinen als Wegweiser mit Höhe und Zeit ab Start.</p>
					<ol class="mt-3 grid gap-2">
						{#each wps as w, i (i)}
							<li class="grid grid-cols-2 gap-2 rounded-[16px] border-2 border-line p-2.5">
								<div class="col-span-2 flex items-center justify-between">
									<span class="text-sm font-bold text-muted">{i + 1}. Ort</span>
									<span class="flex gap-0.5">
										<button type="button" disabled={i === 0} onclick={() => move(i, -1)} class="grid size-11 place-items-center rounded-full text-brand hover:bg-wash disabled:opacity-25" aria-label="«{w.name || i + 1}» nach oben"><ArrowUp size={18} /></button>
										<button type="button" disabled={i === wps.length - 1} onclick={() => move(i, 1)} class="grid size-11 place-items-center rounded-full text-brand hover:bg-wash disabled:opacity-25" aria-label="«{w.name || i + 1}» nach unten"><ArrowDown size={18} /></button>
										<button type="button" onclick={() => wps.splice(i, 1)} class="grid size-11 place-items-center rounded-full text-muted hover:bg-danger-wash hover:text-danger" aria-label="«{w.name || i + 1}» entfernen"><Trash2 size={18} /></button>
									</span>
								</div>
								<label class="col-span-2"><span class="sr-only">Name Ort {i + 1}</span><input form="hike" name="wp_name" bind:value={w.name} placeholder="z. B. Bundalp" class="field" /></label>
								<label><span class="text-xs font-semibold text-muted">Höhe (m)</span><input form="hike" name="wp_elev" type="number" min="0" max="4800" bind:value={w.elev} placeholder="1840" class="field" /></label>
								<label><span class="text-xs font-semibold text-muted">Minuten ab Start</span><input form="hike" name="wp_min" type="number" min="0" step="5" bind:value={w.min} placeholder="90" class="field" /></label>
							</li>
						{/each}
					</ol>
					<button type="button" class="btn-line mt-3" onclick={() => wps.push({ name: '', elev: null, min: null })}><Plus size={18} aria-hidden="true" />Wegpunkt hinzufügen</button>
				</div>
			</section>

			<section class="card grid gap-4 p-5">
				<h2 class="text-xl">4. Unterwegs</h2>
				<label><span class="label">Was man unterwegs sieht</span>
					<textarea form="hike" name="highlights_de" rows="4" bind:value={highlights} class="field" placeholder={'Pochtenfall\nHexenkessel'}></textarea>
					<span class="hint mt-1 block text-sm">Eine Zeile pro Punkt.</span>
				</label>
				{#if highlights.trim()}<TextPreview text={asList(highlights)} />{/if}
				<label><span class="label">Einkehren</span>
					<textarea form="hike" name="stops" rows="3" class="field" placeholder="Berghaus Ramslauenen">{(h.stops ?? []).join('\n')}</textarea>
					<span class="hint mt-1 block text-sm">Restaurants und Hütten am Weg, eine Zeile pro Ort.</span>
				</label>
			</section>

			<section class="card grid gap-4 p-5">
				<h2 class="text-xl">5. Anreise und Tipps</h2>
				<label><span class="label">Hin und zurück</span>
					<textarea form="hike" name="transit_de" rows="3" bind:value={transit} class="field" placeholder="Zu Fuss ab dem Hüttli, zurück auf dem gleichen Weg."></textarea>
				</label>
				{#if transit.trim()}<TextPreview text={transit} />{/if}
				<label><span class="label">Wann gehen</span><input form="hike" name="season_de" value={h.seasonDe} placeholder="Juni bis Oktober" class="field" /></label>
				<label><span class="label">Gut zu wissen</span>
					<textarea form="hike" name="tips_de" rows="3" bind:value={tips} class="field" placeholder="Feste Schuhe, nach Regen rutschig."></textarea>
				</label>
				{#if tips.trim()}<TextPreview text={tips} />{/if}
				<details>
					<summary class="cursor-pointer font-semibold text-brand">Mehr: Link und Webadresse</summary>
					<div class="mt-3 grid gap-4 sm:grid-cols-2">
						<label><span class="label">Link mit mehr Infos <span class="hint">(freiwillig)</span></span><input form="hike" name="url" type="url" value={h.url} placeholder="https://" class="field" /></label>
						<label><span class="label">Webadresse</span><input form="hike" name="slug" value={h.slug} placeholder="aus dem Namen" class="field" />
							<span class="hint mt-1 block text-sm">Der letzte Teil der Adresse. Leer lassen geht auch.</span></label>
					</div>
				</details>
			</section>

			{#if form?.error}<p class="rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger" role="alert">{form.error}</p>{/if}
			<div class="sticky bottom-3 z-10 flex items-center gap-3 rounded-[20px] border-2 border-line bg-paper/95 p-3 backdrop-blur">
				<button form="hike" class="btn-primary" disabled={busy === 'save' || !name.trim()}>{busy === 'save' ? 'Speichert …' : isNew ? 'Wanderung anlegen' : 'Speichern'}</button>
				<a href="/admin/wanderungen" class="font-semibold">Abbrechen</a>
			</div>
			{#if !isNew}
				<form method="POST" action="?/delete" class="justify-self-start" use:enhance={({ cancel }) => { if (!confirm(`Wanderung «${h.name}» löschen? Du kannst es im Verlauf rückgängig machen.`)) cancel(); }}>
					<button class="min-h-11 font-semibold text-danger underline">Diese Wanderung löschen</button>
				</form>
			{/if}
		</div>

		<aside class="grid gap-4 lg:sticky lg:top-6" aria-label="Vorschau">
			<div class="card grid gap-4 p-4">
				<p class="text-sm font-bold uppercase tracking-wider text-muted">So sieht es auf der Website aus</p>
				{#if h.geometry && h.source !== 'wegpunkte'}
					<RouteMap geometry={h.geometry} waypoints={preview} {at} label="Karte von {name || 'der Wanderung'}" />
				{/if}
				{#if h.profile}
					<Profile profile={h.profile} waypoints={preview} interactive bind:at title="Höhenprofil {name}" readout={(k, m) => `${k} km, ${m} m`} />
				{:else if data.pending}
					<p class="flex items-center gap-2 rounded-[14px] bg-wash px-4 py-6 text-muted"><LoaderCircle size={18} class="animate-spin" aria-hidden="true" />Höhenprofil wird berechnet …</p>
				{:else}
					<p class="rounded-[14px] bg-wash px-4 py-6 text-center text-muted">Noch keine Karte und kein Höhenprofil. Lade bei Schritt 2 eine Route.</p>
				{/if}
				{#if preview.length}
					<ol class="grid gap-1.5">
						{#each preview as w, i (i)}
							<li class="flex items-center justify-between gap-2 rounded-[10px] bg-[#ffcf3f] px-3 py-1.5 text-sm font-bold text-ink">
								<span class="truncate">{w.name}</span><span class="shrink-0 tabular-nums">{w.elev ? `${w.elev} m` : ''}{wps[i]?.min ? ` · ${hm(wps[i].min)}` : ''}</span>
							</li>
						{/each}
					</ol>
				{/if}
			</div>

			<div class="card grid gap-3 p-4">
				<p class="text-sm font-bold uppercase tracking-wider text-muted">Planung</p>
				{#if measured && h.distanceM}
					<dl class="grid grid-cols-2 gap-x-4 gap-y-2">
						<div><dt class="text-sm text-muted">Länge</dt><dd class="text-lg font-bold">{km(h.distanceM)}</dd></div>
						<div><dt class="text-sm text-muted">Höchster Punkt</dt><dd class="text-lg font-bold">{highest ? `${highest} m` : '–'}</dd></div>
						<div><dt class="text-sm text-muted">Aufstieg</dt><dd class="text-lg font-bold">{h.ascentM ?? 0} m</dd></div>
						<div><dt class="text-sm text-muted">Abstieg</dt><dd class="text-lg font-bold">{h.descentM ?? 0} m</dd></div>
					</dl>
					{#if estimate}
						<div class="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-accent-wash px-4 py-3">
							<p><span class="text-sm text-muted">Geschätzte Gehzeit</span><br /><strong class="text-lg">{hm(estimate)}</strong>{#if duration}<span class="text-sm text-muted"> (bei dir: {hm(duration)})</span>{/if}</p>
							{#if duration !== estimate}<button type="button" class="btn-line !min-h-11 !px-4 !py-1.5 text-sm" onclick={() => (duration = estimate)}>Übernehmen</button>{/if}
						</div>
						<p class="hint text-xs">Nach der Schweizer Faustregel: 4 km pro Stunde in der Ebene, 300 Höhenmeter pro Stunde hinauf, 500 hinunter. Pausen nicht eingerechnet. Speichern nicht vergessen.</p>
					{/if}
				{:else}
					<p class="text-muted">Mit einer Route rechnet die Website hier Länge, Höhenmeter und eine Gehzeit aus.</p>
				{/if}
			</div>
		</aside>
	</div>
</AdminPage>
