<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Baby from '@lucide/svelte/icons/baby';
	import Clock from '@lucide/svelte/icons/clock';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import House from '@lucide/svelte/icons/house';
	import MapPinned from '@lucide/svelte/icons/map-pinned';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';
	import Profile from '#lib/components/Profile.svelte';

	let { data } = $props();
	const WAY: Record<string, string> = { wanderweg: 'Wanderweg', bergwanderweg: 'Bergwanderweg', alpinwanderweg: 'Alpinwanderweg' };
	const time = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}` : `${min} min`);
	const km = (m: number) => `${(m / 1000).toLocaleString('de-CH', { maximumFractionDigits: 1 })} km`;
	// numbers from waypoint-only routes are rough, so they stay hidden like on the website
	const measured = (h: (typeof data.hikes)[number]) => h.source !== 'wegpunkte' && !!h.distanceM;
</script>

<AdminPage title="Wanderungen" intro="Die Wanderungen auf der Website, in dieser Reihenfolge. Jede hat eine eigene Seite mit Karte, Höhenprofil und Wegweisern.">
	{#snippet actions()}
		<a href="/admin/wanderungen/neu" class="btn-primary no-underline"><Plus size={18} aria-hidden="true" />Neue Wanderung planen</a>
	{/snippet}
	{#snippet help()}
		<ul>
			<li>«Bearbeiten» öffnet die Wanderung. Rechts siehst du sofort Karte und Höhenprofil, so wie Gäste sie sehen.</li>
			<li>Mit den Pfeilen änderst du die Reihenfolge auf der Website. Die erste Wanderung steht auch auf der Startseite zuoberst.</li>
			<li>Du schreibst Deutsch. Englisch, Französisch und Italienisch übersetzt die Website automatisch, meist innert einer Minute.</li>
		</ul>
	{/snippet}

	<ol class="grid gap-3">
		{#each data.hikes as h, i (h.id)}
			<li class="card grid gap-4 p-4 sm:grid-cols-[180px_minmax(0,1fr)_auto] sm:items-center">
				<a href="/admin/wanderungen/{h.id}" class="block rounded-[14px] bg-wash px-2 pt-2 no-underline" aria-label="{h.name} bearbeiten">
					{#if h.profile}<Profile profile={h.profile} height={56} labels={false} title={h.name} />{:else}<p class="flex h-[64px] items-center justify-center gap-1.5 text-sm text-muted"><MapPinned size={16} aria-hidden="true" />Noch keine Route</p>{/if}
				</a>
				<div class="min-w-0">
					<p class="flex items-baseline gap-2"><span class="text-sm font-bold tabular-nums text-muted">{i + 1}.</span><a href="/admin/wanderungen/{h.id}" class="text-xl font-bold text-brand no-underline hover:underline">{h.name}</a></p>
					<p class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-ink">
						<span>{WAY[h.category] ?? 'Wanderweg'}{h.sac ? ` · ${h.sac}` : ''}</span>
						{#if h.durationMin}<span class="flex items-center gap-1"><Clock size={15} class="text-brand" aria-hidden="true" />{time(h.durationMin)}</span>{/if}
						{#if measured(h)}<span>{km(h.distanceM!)}</span>{/if}
						{#if measured(h) && h.ascentM}<span class="flex items-center gap-1"><TrendingUp size={15} class="text-brand" aria-hidden="true" />{h.ascentM} m</span>{/if}
					</p>
					<p class="mt-2 flex flex-wrap gap-1.5">
						{#if h.fromHut}<span class="chip chip-ok gap-1"><House size={13} aria-hidden="true" />ab Hüttli</span>{/if}
						{#if h.loop}<span class="chip gap-1"><RefreshCw size={13} aria-hidden="true" />Rundweg</span>{/if}
						{#if h.family}<span class="chip gap-1"><Baby size={13} aria-hidden="true" />mit Kindern</span>{/if}
						{#if !h.profile}<span class="chip chip-wait">ohne Route</span>{/if}
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
					<a href="/admin/wanderungen/{h.id}" class="btn-blue !min-h-11 !px-4 !py-2 text-sm no-underline"><Pencil size={16} aria-hidden="true" />Bearbeiten</a>
					<a href="/wanderungen/{h.slug}" target="_blank" class="btn-line !min-h-11 !px-4 !py-2 text-sm no-underline">Ansehen<ExternalLink size={15} aria-hidden="true" /></a>
					<form method="POST" action="?/move" use:enhance class="flex gap-2 sm:justify-center">
						<input type="hidden" name="id" value={h.id} />
						<button name="dir" value="up" disabled={i === 0} class="grid size-11 place-items-center rounded-full border-2 border-brand text-brand hover:bg-wash disabled:opacity-25" aria-label="«{h.name}» nach oben"><ArrowUp size={18} /></button>
						<button name="dir" value="down" disabled={i === data.hikes.length - 1} class="grid size-11 place-items-center rounded-full border-2 border-brand text-brand hover:bg-wash disabled:opacity-25" aria-label="«{h.name}» nach unten"><ArrowDown size={18} /></button>
					</form>
				</div>
			</li>
		{:else}
			<li class="card p-6 text-muted">Noch keine Wanderungen. Mit «Neue Wanderung planen» legst du die erste an.</li>
		{/each}
	</ol>
</AdminPage>
