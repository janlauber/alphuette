<script lang="ts">
	import Baby from '@lucide/svelte/icons/baby';
	import Clock from '@lucide/svelte/icons/clock';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import House from '@lucide/svelte/icons/house';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';
	import Profile from '#lib/components/Profile.svelte';
	import HikeForm, { type Hike } from './HikeForm.svelte';

	let { data, form } = $props();
	const hikes = $derived(data.hikes as unknown as Hike[]);
	let open = $state<number | 'new' | null>(null);

	const blank: Hike = {
		id: null, slug: '', name: '', de: '', url: '', source: '', wanderland: null, profile: null, distanceM: null, ascentM: null, sort: 0,
		category: 'wanderweg', sac: '', durationMin: null, seasonDe: '', startName: '', endName: '', transitDe: '',
		waypoints: null, stops: null, highlightsDe: '', tipsDe: '', family: false, loop: false, fromHut: false
	};
	const WAY: Record<string, string> = { wanderweg: 'Wanderweg', bergwanderweg: 'Bergwanderweg', alpinwanderweg: 'Alpinwanderweg' };
	const time = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}` : `${min} min`);
	const error = (id: number | null) => (form?.error && (form.id ?? null) === id ? form.error : undefined);
</script>

<AdminPage title="Wanderungen" intro="Jede Wanderung hat eine eigene Seite mit Karte, Höhenprofil und Wegweisern.">
	{#snippet help()}
		<ul>
			<li>Tipp auf «Bearbeiten», um eine Wanderung zu ändern. Die Felder sind in Gruppen aufgeteilt, die du aufklappen kannst.</li>
			<li>Unter «Route und Höhenprofil» lädst du eine GPX-Datei oder gibst die Nummer einer SchweizMobil-Route ein. Länge, Höhenmeter und Karte rechnet die Website selbst.</li>
			<li>Ortsnamen bleiben in allen Sprachen gleich. Englisch, Französisch und Italienisch übersetzt die Website automatisch, meist innert einer Minute.</li>
			<li>Mit «Ansehen» öffnest du die Seite, wie Gäste sie sehen.</li>
		</ul>
	{/snippet}
	{#snippet actions()}
		<button type="button" class="btn-blue" onclick={() => (open = 'new')} disabled={open === 'new'}><Plus size={18} aria-hidden="true" />Neue Wanderung</button>
	{/snippet}

	<ul class="grid gap-4">
		{#if open === 'new'}
			<li class="card-strong p-5">
				<h2 class="mb-4 text-2xl">Neue Wanderung</h2>
				<HikeForm hike={blank} error={error(null)} onclose={() => (open = null)} />
			</li>
		{/if}
		{#each hikes as h (h.id)}
			<li class={open === h.id ? 'card-strong p-5' : 'card p-4 sm:p-5'}>
				{#if open === h.id}
					<h2 class="mb-4 text-2xl">{h.name}</h2>
					<HikeForm hike={h} error={error(h.id)} onclose={() => (open = null)} />
				{:else}
					<div class="grid gap-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
						<div class="rounded-[14px] bg-wash px-2 pt-2">
							{#if h.profile}<Profile profile={h.profile} height={56} labels={false} title={h.name} />{:else}<p class="py-4 text-center text-sm text-muted">Noch keine Route</p>{/if}
						</div>
						<div class="min-w-0">
							<p class="text-xl font-bold text-brand">{h.name}</p>
							<p class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-ink">
								<span>{WAY[h.category] ?? 'Wanderweg'}{h.sac ? ` · ${h.sac}` : ''}</span>
								{#if h.durationMin}<span class="flex items-center gap-1"><Clock size={15} class="text-brand" aria-hidden="true" />{time(h.durationMin)}</span>{/if}
								{#if h.distanceM}<span>{(h.distanceM / 1000).toLocaleString('de-CH', { maximumFractionDigits: 1 })} km</span>{/if}
								{#if h.ascentM}<span class="flex items-center gap-1"><TrendingUp size={15} class="text-brand" aria-hidden="true" />{h.ascentM} m</span>{/if}
								{#if h.fromHut}<span class="flex items-center gap-1"><House size={15} class="text-brand" aria-hidden="true" />ab Hüttli</span>{/if}
								{#if h.loop}<span class="flex items-center gap-1"><RefreshCw size={15} class="text-brand" aria-hidden="true" />Rundweg</span>{/if}
								{#if h.family}<span class="flex items-center gap-1"><Baby size={15} class="text-brand" aria-hidden="true" />mit Kindern</span>{/if}
							</p>
							<div class="mt-3 flex flex-wrap gap-2">
								<button type="button" class="btn-line !min-h-11 !px-4 !py-2 text-sm" onclick={() => (open = h.id)}><Pencil size={16} aria-hidden="true" />Bearbeiten</button>
								<a href="/wanderungen/{h.slug}" target="_blank" class="btn-line !min-h-11 !px-4 !py-2 text-sm">Ansehen<ExternalLink size={15} aria-hidden="true" /></a>
							</div>
						</div>
					</div>
				{/if}
			</li>
		{:else}
			<li class="text-muted">Noch keine Wanderungen.</li>
		{/each}
	</ul>
</AdminPage>
