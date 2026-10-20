<script lang="ts">
	import { confirmFirst } from '#lib/confirm.svelte.ts';
	import { enhance } from '$app/forms';
	import Download from '@lucide/svelte/icons/download';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';

	let { data, form } = $props();
	let open = $state<string | null>(null);
	let busy = $state(false);
	const when = (iso: string) =>
		new Date(iso).toLocaleString('de-CH', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' });
	const kb = (n: number) => (n < 1_000_000 ? `${Math.max(1, Math.round(n / 1000))} KB` : `${(n / 1_000_000).toFixed(1)} MB`);
	const wait = () => {
		busy = true;
		return async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			busy = false;
			open = null;
		};
	};
</script>

<AdminPage title="Sicherungen" intro="Jede Nacht macht die Website eine Kopie aller Daten. Damit holst du einen alten Stand zurück, wenn etwas schiefging.">
	{#snippet actions()}
		<form method="POST" action="?/create" use:enhance={wait}><button class="btn-blue" disabled={busy}>Jetzt sichern</button></form>
	{/snippet}
	{#snippet help()}
		<ul>
			<li>Für einzelne Änderungen reicht meist der <a href="/admin/verlauf">Verlauf</a> mit «Rückgängig».</li>
			<li>Hier holst du einen ganzen Bereich zurück, zum Beispiel alle Preise, so wie sie an einem Tag waren. Buchungen und Nachrichten bleiben dabei, wie sie sind.</li>
			<li>Bevor etwas zurückkommt, sichert die Website den heutigen Stand. Du kannst also auch das wieder rückgängig machen.</li>
			<li>Sicherungen bleiben 30 Tage. Fotos selbst sind nicht drin: Gelöschte Fotos liegen 30 Tage im Papierkorb bei den Fotos.</li>
			<li>Mit «Herunterladen» legst du eine Kopie auf deinen Computer. Die Datei enthält Namen und Adressen von Gästen, also gut aufbewahren.</li>
		</ul>
	{/snippet}

	{#if form?.error}<p class="mb-4 rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger" role="alert">{form.error}</p>{/if}

	<ul class="grid gap-3">
		{#each data.backups as b (b.name)}
			<li class="card p-4 {open === b.name ? '!border-brand' : ''}">
				<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
					<div class="min-w-0 flex-1">
						<p class="font-bold text-ink">{when(b.at)}</p>
						<p class="text-sm text-muted">{data.reasons[b.reason]} · {kb(b.size)}</p>
					</div>
					<a href="/admin/sicherungen/{b.name}" class="btn-line !min-h-0 !px-3 !py-1.5 text-sm no-underline" data-sveltekit-reload><Download size={15} aria-hidden="true" />Herunterladen</a>
					<button type="button" class="btn-line !min-h-0 !px-3 !py-1.5 text-sm" onclick={() => (open = open === b.name ? null : b.name)} aria-expanded={open === b.name}>
						<RotateCcw size={15} aria-hidden="true" />Zurückholen
					</button>
				</div>
				{#if open === b.name}
					<form
						method="POST"
						action="?/restore"
						class="mt-4 border-t-2 border-line pt-4"
						use:enhance={confirmFirst(
							{ title: `Auf den Stand vom ${when(b.at)} zurücksetzen?`, text: 'Die gewählten Bereiche bekommen den alten Stand. Der heutige Stand wird vorher gesichert, du kannst also zurück.', ok: 'Zurückholen', danger: true },
							wait
						)}
					>
						<input type="hidden" name="name" value={b.name} />
						<fieldset>
							<legend class="font-semibold">Was soll zurück auf diesen Stand?</legend>
							<div class="mt-2 grid gap-2 sm:grid-cols-2">
								{#each data.areas as a (a.key)}
									<label class="flex items-center gap-2.5"><input type="checkbox" name="area" value={a.key} class="check" />{a.label}</label>
								{/each}
							</div>
						</fieldset>
						<button class="btn-primary mt-4" disabled={busy}>{busy ? 'Einen Moment …' : 'Zurückholen'}</button>
					</form>
				{/if}
			</li>
		{:else}
			<li class="text-muted">Noch keine Sicherung. Die erste entsteht heute Nacht, oder jetzt mit «Jetzt sichern».</li>
		{/each}
	</ul>

	<details class="mt-10 text-sm">
		<summary class="cursor-pointer font-semibold text-brand">Sicherung von deinem Computer hochladen</summary>
		<form method="POST" action="?/upload" enctype="multipart/form-data" use:enhance={wait} class="mt-3 flex flex-wrap items-center gap-3">
			<input type="file" name="file" accept=".gz,application/gzip" required />
			<button class="btn-line !min-h-0 !px-4 !py-1.5" disabled={busy}>Hochladen</button>
		</form>
		<p class="mt-2 text-muted">Nur nötig, wenn die Sicherungen auf dem Server verloren gingen. Danach steht die Datei oben in der Liste.</p>
	</details>
</AdminPage>
