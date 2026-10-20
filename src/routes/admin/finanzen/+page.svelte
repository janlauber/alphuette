<script lang="ts">
	import { enhance } from '$app/forms';
	import Download from '@lucide/svelte/icons/download';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';
	import { chf } from '#lib/booking.ts';
	import { fmtDate } from '#lib/i18n.ts';

	let { data } = $props();
	const d = (iso: string) => fmtDate(iso, 'de', { weekday: undefined, month: 'short' });
	const month = (ym: string) => new Date(ym + '-01T00:00:00Z').toLocaleDateString('de-CH', { month: 'long', timeZone: 'UTC' });
	const today = new Date().toISOString().slice(0, 10);
	const daysLate = (due: string) => Math.round((Date.parse(today) - Date.parse(due)) / 86400_000);
	// overdue first, then open, then paid; inside by arrival
	const order = { ueberfaellig: 0, offen: 1, bezahlt: 2 };
	const rows = $derived([...data.rows].sort((a, b) => order[a.state] - order[b.state] || a.checkIn.localeCompare(b.checkIn)));
	let paying = $state<number | null>(null);
</script>

<AdminPage title="Finanzen" intro="Alle Rechnungen eines Jahres: was bezahlt ist, was offen ist, und wie viel Kurtaxe an die Gemeinde geht.">
	{#snippet actions()}
		<a href="/admin/finanzen/export.csv?jahr={data.year}" class="btn-line no-underline" data-sveltekit-reload><Download size={18} aria-hidden="true" />Als Tabelle (CSV)</a>
	{/snippet}
	{#snippet help()}
		<ul>
			<li>Jede bestätigte Buchung ist eine Rechnung. Das Jahr richtet sich nach der Anreise.</li>
			<li>Fällig ist eine Rechnung 30 Tage nach der Bestätigung, spätestens 14 Tage vor der Anreise. Ist sie danach noch offen, steht sie rot als «überfällig» oben.</li>
			<li>Ist das Geld auf deinem Konto, tippe «Bezahlt». Das Datum kannst du ändern, falls die Zahlung früher kam. Fehler machst du im <a href="/admin/verlauf">Verlauf</a> rückgängig.</li>
			<li>Die Zahlungserinnerung geht automatisch raus (einstellbar unter <a href="/admin/mails">Mails</a>). «Erinnern» schickt sie sofort nochmals.</li>
			<li>Kurtaxe und Beherbergungsabgabe zahlen die Gäste mit der Rechnung; abgerechnet werden sie über Deskline. Die Tabelle unten zeigt die Beträge pro Monat. «Als Tabelle (CSV)» öffnet alles in Excel, zum Beispiel für die Steuererklärung.</li>
		</ul>
	{/snippet}

	{#if data.missing.length}
		<p class="mb-6 rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger" role="alert">Für die QR-Rechnung fehlt noch: {data.missing.join(', ')}. Bitte unter <a href="/admin/gastgeber" class="text-danger">Gastgeber und Zahlung</a> eintragen, sonst bekommen Gäste keine Rechnung.</p>
	{/if}

	<nav class="mb-6 flex flex-wrap gap-2" aria-label="Jahr">
		{#each data.years as y (y)}<a href="?jahr={y}" class="pill no-underline {y === data.year ? '!bg-brand !text-white' : ''}" aria-current={y === data.year ? 'page' : undefined}>{y}</a>{/each}
	</nav>

	<section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Übersicht {data.year}">
		<div class="card p-4"><p class="text-sm font-semibold text-muted">Total {data.year}</p><p class="text-2xl font-bold tabular-nums text-ink">{chf(data.totals.total)}</p><p class="text-sm text-muted">{data.rows.length} {data.rows.length === 1 ? 'Rechnung' : 'Rechnungen'}</p></div>
		<div class="card p-4"><p class="text-sm font-semibold text-muted">Bezahlt</p><p class="text-2xl font-bold tabular-nums text-brand">{chf(data.totals.paid)}</p></div>
		<div class="card p-4"><p class="text-sm font-semibold text-muted">Offen, noch nicht fällig</p><p class="text-2xl font-bold tabular-nums text-ink">{chf(data.totals.open)}</p></div>
		<div class="card p-4 {data.totals.overdueCount ? '!border-danger' : ''}"><p class="text-sm font-semibold text-muted">Überfällig</p><p class="text-2xl font-bold tabular-nums {data.totals.overdueCount ? 'text-danger' : 'text-ink'}">{chf(data.totals.overdue)}</p>{#if data.totals.overdueCount}<p class="text-sm text-danger">{data.totals.overdueCount} {data.totals.overdueCount === 1 ? 'Rechnung' : 'Rechnungen'}</p>{/if}</div>
	</section>
	<p class="mt-3 text-sm text-muted">Davon Miete, Reinigung und Bettwäsche {chf(data.totals.rent)}, Kurtaxe und Beherbergungsabgabe {chf(data.totals.taxes)}.</p>

	<section class="mt-10">
		<h2 class="text-2xl">Rechnungen</h2>
		{#if rows.length}
			<ul class="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3">
				{#each rows as r (r.id)}
					<li class="card p-4 {r.state === 'ueberfaellig' ? '!border-danger' : ''}">
						<div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
							<div class="min-w-0">
								<a href="/admin/buchungen/{r.id}" class="text-lg font-bold text-ink no-underline hover:underline">{r.name}</a>
								<p class="text-sm text-muted tabular-nums">Nr. {r.ref} · {d(r.checkIn)} bis {d(r.checkOut)} · fällig {d(r.due)}{r.reminded ? ` · erinnert ${d(r.reminded)}` : ''}</p>
							</div>
							<div class="text-right">
								<p class="text-lg font-bold tabular-nums">{chf(r.total)}</p>
								{#if r.state === 'bezahlt'}<span class="chip chip-ok">Bezahlt am {d(r.paidAt!)}</span>
								{:else if r.state === 'ueberfaellig'}<span class="chip bg-danger-wash text-danger">Überfällig seit {daysLate(r.due)} {daysLate(r.due) === 1 ? 'Tag' : 'Tagen'}</span>
								{:else}<span class="chip chip-wait">Offen</span>{/if}
							</div>
						</div>
						<div class="mt-3 flex flex-wrap items-center gap-2">
							{#if r.state !== 'bezahlt'}
								{#if paying === r.id}
									<form method="POST" action="?/paid" use:enhance={() => async ({ update }) => { await update(); paying = null; }} class="flex flex-wrap items-center gap-2">
										<input type="hidden" name="id" value={r.id} />
										<label class="text-sm font-semibold">Eingegangen am <input type="date" name="date" value={today} max={today} class="field ml-1 !inline-block w-auto !py-1.5" /></label>
										<button class="btn-primary !min-h-0 !px-4 !py-1.5 text-sm">Bezahlt</button>
										<button type="button" class="text-sm font-semibold text-brand underline" onclick={() => (paying = null)}>Abbrechen</button>
									</form>
								{:else}
									<button type="button" class="btn-blue !min-h-0 !px-4 !py-1.5 text-sm" onclick={() => (paying = r.id)}>Bezahlt</button>
									<form method="POST" action="?/remind" use:enhance={({ cancel }) => { if (!confirm(`Zahlungserinnerung jetzt an ${r.name} schicken?`)) cancel(); }}>
										<input type="hidden" name="id" value={r.id} /><button class="btn-line !min-h-0 !px-4 !py-1.5 text-sm">Erinnern</button>
									</form>
								{/if}
							{:else}
								<form method="POST" action="?/unpaid" use:enhance={({ cancel }) => { if (!confirm('Wieder als offen markieren?')) cancel(); }}>
									<input type="hidden" name="id" value={r.id} /><button class="text-sm font-semibold text-brand underline">Doch nicht bezahlt</button>
								</form>
							{/if}
							<a href={r.invoice} target="_blank" rel="noopener" class="ml-auto inline-flex items-center gap-1 text-sm font-semibold">Rechnung ansehen <ExternalLink size={14} aria-hidden="true" /></a>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-2 text-muted">Für {data.year} gibt es noch keine bestätigte Buchung.</p>
		{/if}
	</section>

	{#if data.months.length}
		<section class="mt-10">
			<h2 class="text-2xl">Kurtaxe und Beherbergungsabgabe</h2>
			<p class="text-muted">Pro Monat der Anreise. Kinder unter 6 zahlen nichts und sind nicht mitgezählt.</p>
			<div class="card mt-3 overflow-x-auto">
				<table class="w-full min-w-[34rem] text-left tabular-nums">
					<thead class="text-sm text-muted"><tr><th class="px-4 py-2 font-semibold">Monat</th><th class="px-2 font-semibold">Aufenthalte</th><th class="px-2 font-semibold">Nächte</th><th class="px-2 font-semibold">Erw. / Kinder</th><th class="px-2 text-right font-semibold">Kurtaxe</th><th class="px-4 text-right font-semibold">Beherbergung</th></tr></thead>
					<tbody>
						{#each data.months as m (m.month)}
							<tr class="border-t-2 border-line"><td class="px-4 py-2 font-semibold">{month(m.month)}</td><td class="px-2">{m.stays}</td><td class="px-2">{m.nights}</td><td class="px-2">{m.adults} / {m.children}</td><td class="px-2 text-right">{chf(m.tax)}</td><td class="px-4 text-right">{chf(m.levy)}</td></tr>
						{/each}
					</tbody>
					<tfoot><tr class="border-t-2 border-brand font-bold"><td class="px-4 py-2" colspan="4">Total {data.year}</td><td class="px-2 text-right">{chf(data.months.reduce((a, m) => a + m.tax, 0))}</td><td class="px-4 text-right">{chf(data.months.reduce((a, m) => a + m.levy, 0))}</td></tr></tfoot>
				</table>
			</div>
		</section>
	{/if}
</AdminPage>
