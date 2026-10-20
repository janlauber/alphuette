<script lang="ts">
	import { enhance } from '$app/forms';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';

	let { data } = $props();
	const when = (d: Date) => new Date(d).toLocaleString('de-CH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' });
	const open = $derived(data.errors.filter((e) => !e.resolvedAt));
	const done = $derived(data.errors.filter((e) => e.resolvedAt));
</script>

<AdminPage title="System" intro="Für Jan: läuft alles, und welche Fehler gab es? Tom muss hier nichts tun.">
	{#snippet actions()}
		<form method="POST" action="?/test" use:enhance><button class="btn-line">Testalarm schicken</button></form>
	{/snippet}
	{#snippet help()}
		<ul>
			<li>Jeder unerwartete Fehler landet hier, gleiche Fehler am gleichen Ort zusammen mit einem Zähler. Links zu Buchungen stehen nie im Protokoll.</li>
			<li>Bei einem neuen Fehler geht eine Mail an {data.owner}, zum gleichen Fehler höchstens alle 6 Stunden. Fehler aus dem Browser von Besuchern und Probleme beim Mailversand stehen nur hier.</li>
			<li>«Erledigt», wenn er behoben ist. Kommt er wieder, gibt es sofort eine neue Mail.</li>
		</ul>
	{/snippet}

	<section>
		<h2 class="text-2xl">Zustand</h2>
		<ul class="card mt-3 divide-y-2 divide-line">
			{#each data.checks as c (c.label)}
				<li class="flex items-center gap-3 px-4 py-3">
					{#if c.ok === true}<CircleCheck class="shrink-0 text-brand" size={22} aria-label="in Ordnung" />{:else if c.ok === false}<CircleAlert class="shrink-0 text-danger" size={22} aria-label="Problem" />{:else}<CircleHelp class="shrink-0 text-muted" size={22} aria-label="unbekannt" />{/if}
					<span class="w-44 shrink-0 font-semibold">{c.label}</span>
					<span class="min-w-0 text-muted">{c.text}</span>
				</li>
			{/each}
		</ul>
	</section>

	<section class="mt-10">
		<h2 class="text-2xl">Offene Fehler {#if open.length}<span class="chip chip-wait ml-2 align-middle">{open.length}</span>{/if}</h2>
		{#if open.length}
			<ul class="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3">
				{#each open as e (e.id)}
					<li class="card min-w-0 p-4">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="break-words font-bold text-ink">{e.message}</p>
								<p class="text-sm text-muted">{e.place} · {e.count} mal · zuletzt {when(e.lastAt)} · zuerst {when(e.firstAt)}</p>
							</div>
							<form method="POST" action="?/resolve" use:enhance><input type="hidden" name="id" value={e.id} /><button class="btn-line !min-h-0 !px-3 !py-1.5 text-sm">Erledigt</button></form>
						</div>
						{#if e.stack}
							<details class="mt-2"><summary class="cursor-pointer text-sm font-semibold text-brand">Details</summary><pre class="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-[12px] bg-wash p-3 text-xs">{e.stack}</pre></details>
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-2 text-muted">Keine. Alles ruhig.</p>
		{/if}
	</section>

	{#if done.length}
		<details class="mt-10">
			<summary class="cursor-pointer text-lg font-bold text-brand">Erledigte Fehler ({done.length})</summary>
			<ul class="card mt-3 divide-y-2 divide-line text-sm">
				{#each done as e (e.id)}
					<li class="px-4 py-2.5"><span class="font-semibold">{e.message}</span> <span class="text-muted">· {e.place} · {e.count} mal · erledigt {when(e.resolvedAt!)}</span></li>
				{/each}
			</ul>
		</details>
	{/if}
</AdminPage>
