<script lang="ts">
	import { enhance } from '$app/forms';
	import Footprints from '@lucide/svelte/icons/footprints';
	import Info from '@lucide/svelte/icons/info';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Route from '@lucide/svelte/icons/route';
	import TrainFront from '@lucide/svelte/icons/train-front';
	import Profile from '#lib/components/Profile.svelte';
	import TextPreview from '#lib/components/admin/TextPreview.svelte';

	export type Waypoint = { name: string; elev: number; min?: number | null };
	export type Hike = {
		id: number | null;
		slug: string;
		name: string;
		de: string;
		url: string;
		source: string;
		wanderland: string | null;
		profile: [number, number][] | null;
		distanceM: number | null;
		ascentM: number | null;
		sort: number;
		category: string;
		sac: string;
		durationMin: number | null;
		seasonDe: string;
		startName: string;
		endName: string;
		transitDe: string;
		waypoints: Waypoint[] | null;
		stops: string[] | null;
		highlightsDe: string;
		tipsDe: string;
		family: boolean;
		loop: boolean;
		fromHut: boolean;
	};

	let { hike, error, onclose }: { hike: Hike; error?: string; onclose: () => void } = $props();

	const fid = $derived(`hike-${hike.id ?? 'new'}`);
	// svelte-ignore state_referenced_locally
	const h = hike;
	// local copies for the live previews
	let de = $state(h.de);
	let highlights = $state(h.highlightsDe);
	let transit = $state(h.transitDe);
	let tips = $state(h.tipsDe);
	const asList = (s: string) =>
		s
			.split('\n')
			.map((l) => l.trim())
			.filter(Boolean)
			.map((l) => `- ${l}`)
			.join('\n');
	const wpText = (w: Waypoint[] | null) => (w ?? []).map((p) => [p.name, p.elev, p.min ?? ''].join(' | ')).join('\n');
	const source = $derived(
		hike.source === 'gpx'
			? 'aus deiner GPX-Datei'
			: hike.source === 'wanderland'
				? `SchweizMobil-Route ${hike.wanderland ?? ''}`
				: hike.source === 'netz'
					? 'auf dem Wanderwegnetz berechnet'
					: hike.source === 'wegpunkte'
						? 'aus den Wegpunkten geschätzt, darum ohne Zahlen'
						: ''
	);
	const close = () => async ({ result, update }: { result: { type: string }; update: (o?: { reset?: boolean }) => Promise<void> }) => {
		await update({ reset: false });
		if (result.type === 'success') onclose();
	};
	const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });
</script>

{#snippet group(title: string, Icon: typeof Info, open: boolean, body: import('svelte').Snippet)}
	<details class="group rounded-[18px] border-2 border-line bg-paper open:border-brand" {open}>
		<summary class="flex min-h-12 cursor-pointer list-none items-center gap-2.5 px-4 py-2 text-lg font-bold text-brand [&::-webkit-details-marker]:hidden">
			<Icon size={20} aria-hidden="true" />{title}<span class="ml-auto text-sm font-semibold text-muted group-open:hidden">aufklappen</span>
		</summary>
		<div class="grid gap-4 px-4 pb-5">{@render body()}</div>
	</details>
{/snippet}

<!-- The fields sit in several boxes; they all belong to this one form through form={fid}. -->
<form id={fid} method="POST" action="?/save" use:enhance={close}><input type="hidden" name="id" value={h.id ?? ''} /></form>

<div class="grid gap-3">
	{#snippet basics()}
		<label><span class="label">Name</span><input form={fid} name="name" value={h.name} required class="field" placeholder="z. B. Tschingelsee" /></label>
		<div class="grid gap-4 sm:grid-cols-2">
			<label><span class="label">Gehzeit in Minuten</span>
				<input form={fid} name="duration_min" type="number" min="0" value={h.durationMin ?? ''} placeholder="135" class="field" />
				<span class="hint mt-1 block text-sm">Ohne Pausen. 135 heisst 2 h 15 min.</span>
			</label>
			<label><span class="label">SAC-Skala <span class="hint">(freiwillig)</span></span>
				<input form={fid} name="sac" value={h.sac} placeholder="T2" class="field" />
				<span class="hint mt-1 block text-sm">T1 einfach, T2 Bergweg, T3 anspruchsvoll.</span>
			</label>
		</div>
		<label><span class="label">Wegart</span>
			<select form={fid} name="category" class="field">
				{#each [['wanderweg', 'Wanderweg (gelb)'], ['bergwanderweg', 'Bergwanderweg (weiss-rot-weiss)'], ['alpinwanderweg', 'Alpinwanderweg (weiss-blau-weiss)']] as [v, l] (v)}
					<option value={v} selected={h.category === v}>{l}</option>
				{/each}
			</select>
		</label>
		<div class="flex flex-wrap gap-x-6 gap-y-2">
			<label class="flex min-h-11 items-center gap-2.5"><input form={fid} type="checkbox" name="family" checked={h.family} class="check" />Gut mit Kindern</label>
			<label class="flex min-h-11 items-center gap-2.5"><input form={fid} type="checkbox" name="loop" checked={h.loop} class="check" />Rundweg</label>
			<label class="flex min-h-11 items-center gap-2.5"><input form={fid} type="checkbox" name="from_hut" checked={h.fromHut} class="check" />Start zu Fuss ab Hüttli</label>
		</div>
		<label><span class="label">Beschreibung</span>
			<textarea form={fid} name="de" rows="4" bind:value={de} class="field leading-relaxed" placeholder="Zwei, drei Sätze: Was macht diese Wanderung schön?"></textarea>
		</label>
		<TextPreview text={de} />
	{/snippet}
	{@render group('Grunddaten', Info, true, basics)}

	{#snippet route()}
		{#if hike.id}
			{#if hike.profile}
				<div class="rounded-[14px] border-2 border-line p-3"><Profile profile={hike.profile} height={80} /></div>
			{/if}
			<p class="text-muted">
				{#if hike.distanceM}
					{(hike.distanceM / 1000).toLocaleString('de-CH', { maximumFractionDigits: 1 })} km, {hike.ascentM} m Aufstieg, {source}.
				{:else}
					{source ? `Route ${source}.` : 'Noch keine Route. Ohne Route gibt es keine Karte und kein Höhenprofil.'}
				{/if}
			</p>
			<p class="text-sm text-muted">Neue Route laden: entweder eine GPX-Datei, zum Beispiel von deiner Uhr oder aus der SchweizMobil-App, oder die Nummer einer offiziellen SchweizMobil-Route. Die Website rechnet dann Länge, Höhenmeter und Höhenprofil neu.</p>
			<div class="grid gap-4 sm:grid-cols-2">
				<form method="POST" action="?/gpx" enctype="multipart/form-data" use:enhance={keep} class="grid gap-2 rounded-[14px] bg-wash p-3">
					<input type="hidden" name="id" value={hike.id} />
					<label><span class="label">GPX-Datei</span><input type="file" name="gpx" accept=".gpx,application/gpx+xml" required class="block w-full text-sm" /></label>
					<button class="btn-line justify-self-start !min-h-11 !px-4 !py-2 text-sm">Route laden</button>
				</form>
				<form method="POST" action="?/wanderland" use:enhance={keep} class="grid gap-2 rounded-[14px] bg-wash p-3">
					<input type="hidden" name="id" value={hike.id} />
					<label><span class="label">SchweizMobil-Route Nr.</span><input name="nr" value={hike.wanderland ?? ''} placeholder="1.13" class="field" /></label>
					<button class="btn-line justify-self-start !min-h-11 !px-4 !py-2 text-sm">Route laden</button>
				</form>
			</div>
		{:else}
			<p class="text-muted">Speichere die Wanderung zuerst. Danach kannst du hier eine Route laden.</p>
		{/if}
	{/snippet}
	{@render group('Route und Höhenprofil', Route, false, route)}

	{#snippet onTheWay()}
		<div class="grid gap-4 sm:grid-cols-2">
			<label><span class="label">Start</span><input form={fid} name="start_name" value={h.startName} class="field" placeholder="Griesalp" /></label>
			<label><span class="label">Ziel</span><input form={fid} name="end_name" value={h.endName} class="field" placeholder="Kiental" /></label>
		</div>
		<label><span class="label">Wegpunkte</span>
			<textarea form={fid} name="waypoints" rows="5" placeholder={'Griesalp | 1408 |\nBundalp | 1840 | 90'} class="field font-mono text-sm">{wpText(h.waypoints)}</textarea>
			<span class="hint mt-1 block text-sm">Eine Zeile pro Ort: Name | Höhe in m | Minuten ab Start. Sie erscheinen als Wegweiser auf der Seite.</span>
		</label>
		<label><span class="label">Was man unterwegs sieht</span>
			<textarea form={fid} name="highlights_de" rows="4" bind:value={highlights} class="field" placeholder={'Pochtenfall\nHexenkessel'}></textarea>
			<span class="hint mt-1 block text-sm">Eine Zeile pro Punkt.</span>
		</label>
		<TextPreview text={asList(highlights)} />
		<label><span class="label">Einkehren</span>
			<textarea form={fid} name="stops" rows="3" class="field" placeholder={'Berghaus Ramslauenen'}>{(h.stops ?? []).join('\n')}</textarea>
			<span class="hint mt-1 block text-sm">Restaurants und Hütten am Weg, eine Zeile pro Ort.</span>
		</label>
	{/snippet}
	{@render group('Unterwegs', MapPin, false, onTheWay)}

	{#snippet getThere()}
		<label><span class="label">Hin und zurück</span>
			<textarea form={fid} name="transit_de" rows="3" bind:value={transit} class="field" placeholder="Postauto bis Griesalp, zurück ab Kiental Dorf."></textarea>
			<span class="hint mt-1 block text-sm">Wie kommt man zum Start und vom Ziel wieder zurück?</span>
		</label>
		<TextPreview text={transit} />
		<label><span class="label">Wann gehen</span>
			<input form={fid} name="season_de" value={h.seasonDe} placeholder="Juni bis Oktober" class="field" />
		</label>
	{/snippet}
	{@render group('Anreise', TrainFront, false, getThere)}

	{#snippet tipsBox()}
		<label><span class="label">Gut zu wissen</span>
			<textarea form={fid} name="tips_de" rows="4" bind:value={tips} class="field" placeholder="Feste Schuhe, nach Regen rutschig."></textarea>
		</label>
		<TextPreview text={tips} />
		<label><span class="label">Link mit mehr Infos <span class="hint">(freiwillig)</span></span><input form={fid} name="url" type="url" value={h.url} placeholder="https://" class="field" /></label>
		<div class="grid gap-4 sm:grid-cols-2">
			<label><span class="label">Webadresse</span>
				<input form={fid} name="slug" value={h.slug} placeholder="aus dem Namen" class="field" />
				<span class="hint mt-1 block text-sm">Der letzte Teil der Adresse. Leer lassen geht auch.</span>
			</label>
			<label><span class="label">Reihenfolge</span>
				<input form={fid} name="sort" type="number" value={h.sort} class="field" />
				<span class="hint mt-1 block text-sm">Kleinere Zahl steht weiter oben.</span>
			</label>
		</div>
	{/snippet}
	{@render group('Tipps', Footprints, false, tipsBox)}

	{#if error}<p class="rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger" role="alert">{error}</p>{/if}
	<div class="flex flex-wrap items-center gap-3 pt-2">
		<button form={fid} class="btn-primary">{h.id ? 'Wanderung speichern' : 'Wanderung anlegen'}</button>
		<button type="button" class="btn-line" onclick={onclose}>Schliessen</button>
		{#if h.id}
			<form
				method="POST"
				action="?/delete"
				class="ml-auto"
				use:enhance={({ cancel }) => {
					if (!confirm(`Wanderung «${h.name}» löschen? Du kannst es im Verlauf rückgängig machen.`)) cancel();
				}}
			>
				<input type="hidden" name="id" value={h.id} />
				<button class="min-h-11 px-2 font-semibold text-danger underline">Wanderung löschen</button>
			</form>
		{/if}
	</div>
</div>
