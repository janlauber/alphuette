<script lang="ts">
	import { ask } from '#lib/confirm.svelte.ts';
	import { enhance } from '$app/forms';
	import CalendarPlus from '@lucide/svelte/icons/calendar-plus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';
	import Timeline from './Timeline.svelte';
	import { addDays, chf, quote, weekday, type Quote, type Season } from '#lib/booking.ts';
	import { fmtDate, weekdayName } from '#lib/i18n.ts';

	let { data, form } = $props();
	type Row = (typeof data.seasons)[number];

	const today = new Date().toISOString().slice(0, 10);
	const upcoming = $derived(data.seasons.filter((s) => s.end > today));
	const past = $derived(data.seasons.filter((s) => s.end <= today));
	// can guests book anything in the next six months?
	const bookable = $derived(data.seasons.some((s) => s.end > today && s.start < addDays(today, 183)));
	const next = $derived(upcoming.find((s) => s.start > today));
	const days = [6, 0, 1, 2, 3, 4, 5];

	const money = (rp: number | null) => (rp === null ? '' : (rp / 100).toString());
	const rp = (v: string) => (String(v).trim() === '' ? null : Math.round(Number(String(v).replace(',', '.').replace(/[^\d.]/g, '') || 0) * 100));
	const d = (iso: string) => fmtDate(iso, 'de', { weekday: undefined });
	const wd = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? weekdayName(weekday(iso), 'de') : '');
	const weeks = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / (7 * 86400_000));
	const price = (s: { weekly: number | null; nightly: number }) => (s.weekly !== null ? `${chf(s.weekly)} pro Woche` : `${chf(s.nightly)} pro Nacht`);

	// The season being edited, as plain form values: an existing one, a new one, or none.
	type Draft = { id: number | null; name: string; start: string; end: string; weekly: string; nightly: string; minNights: number; changeover: string };
	let draft = $state<Draft | null>(null);
	let endTouched = false;
	let length = 0;
	let editor = $state<HTMLElement>();

	function edit(s: Row | null) {
		const last = upcoming.at(-1) ?? data.seasons.at(-1);
		const template = s ?? last;
		length = template ? Math.round((new Date(template.end).getTime() - new Date(template.start).getTime()) / 86400_000) : 168;
		endTouched = !!s;
		draft = s
			? { id: s.id, name: s.name, start: s.start, end: s.end, weekly: money(s.weekly), nightly: s.weekly !== null && s.nightly === Math.round(s.weekly / 7) ? '' : money(s.nightly), minNights: s.minNights, changeover: s.changeover === null ? '' : String(s.changeover) }
			: { id: null, name: '', start: '', end: '', weekly: last ? money(last.weekly) : '', nightly: '', minNights: last?.minNights ?? 7, changeover: last ? (last.changeover === null ? '' : String(last.changeover)) : '6' };
		requestAnimationFrame(() => editor?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
	}
	// picking "Von" suggests "Bis" with the same length, until Tom sets "Bis" himself
	function startChanged() {
		if (draft && !endTouched && draft.start) draft.end = addDays(draft.start, length);
	}

	const after = (close = true) => async ({ result, update }: { result: { type: string }; update: (o?: { reset?: boolean }) => Promise<void> }) => {
		await update({ reset: false });
		if (close && result.type === 'success') draft = null;
	};

	// The extras, kept live so the example changes while Tom types.
	const r = $derived(data.rates);
	const fields = (v: typeof r) => ({
		cleaning: money(v.cleaning),
		linen: money(v.linen),
		taxAdult: money(v.taxAdult),
		taxChild: money(v.taxChild),
		levyAdult: money(v.levyAdult),
		maxGuests: v.maxGuests,
		checkIn: v.checkIn,
		checkOut: v.checkOut
	});
	// svelte-ignore state_referenced_locally
	let x = $state(fields(data.rates));
	let editExtras = $state(false);
	$effect(() => {
		x = fields(r);
	});

	// Example: the first full week of the season being edited (else the next one), 2 adults and 2 children with bed linen.
	type Example = { problem: string } | { q: Extract<Quote, { ok: true }>; checkIn: string; checkOut: string; season: string } | null;
	const example: Example = $derived.by((): Example => {
		let s: Season | undefined = upcoming[0];
		if (draft) {
			const weekly = rp(draft.weekly);
			const nightly = rp(draft.nightly) ?? (weekly !== null ? Math.round(weekly / 7) : null);
			if (!draft.start || !draft.end || draft.end <= draft.start || nightly === null) return { problem: 'Sobald Von, Bis und Preis stimmen, rechnet hier ein Beispiel mit.' };
			s = { name: draft.name || 'neue Saison', start: draft.start, end: draft.end, weekly, nightly, minNights: draft.minNights, changeover: draft.changeover === '' ? null : Number(draft.changeover) };
		}
		if (!s) return null;
		let checkIn = s.start > today ? s.start : today;
		for (let i = 0; i < 7 && s.changeover !== null && weekday(checkIn) !== s.changeover; i++) checkIn = addDays(checkIn, 1);
		const checkOut = addDays(checkIn, Math.max(7, s.minNights));
		const rates = { cleaning: rp(x.cleaning) ?? 0, linen: rp(x.linen) ?? 0, taxAdult: rp(x.taxAdult) ?? 0, taxChild: rp(x.taxChild) ?? 0, levyAdult: rp(x.levyAdult) ?? 0, maxGuests: Math.max(4, x.maxGuests) };
		const q = quote(checkIn, checkOut, { adults: 2, children: 2, infants: 0, linen: 4 }, [s], rates);
		return q.ok ? { q, checkIn, checkOut, season: s.name } : { problem: 'Diese Saison ist kürzer als eine Woche, darum gibt es kein Beispiel.' };
	});
	const LINES: Record<string, string> = { stay: 'Miete', cleaning: 'Endreinigung', linen: 'Bettwäsche, 4 Sets', tax: 'Kurtaxe', levy: 'Beherbergungsabgabe' };

	let copying = $state(false);
</script>

<AdminPage title="Preise und Saisons" intro="Wann man das Hüttli buchen kann und was es kostet.">
	{#snippet help()}
		<ul>
			<li>Gäste können nur Wochen innerhalb einer Saison anfragen. Oben siehst du jedes Jahr als Balken. Tipp auf eine Saison, um sie zu ändern.</li>
			<li>Für eine Saison brauchst du nur Name, Von, Bis und den Preis pro Woche. Der Rest steht unter «Mehr Einstellungen» und passt meistens schon.</li>
			<li>«Saisons fürs nächste Jahr übernehmen» legt die Saisons vom letzten Jahr ein Jahr später nochmals an, mit gleichem Wochentag und gleichen Preisen. Das ist ein Schritt ohne «Rückgängig»: Gefällt dir eine übernommene Saison nicht, ändere oder lösche sie einfach.</li>
			<li>Alle anderen Änderungen kannst du im <a href="/admin/verlauf">Verlauf</a> rückgängig machen.</li>
		</ul>
	{/snippet}
	{#snippet actions()}
		<button type="button" class="btn-blue" onclick={() => edit(null)} disabled={draft?.id === null}><Plus size={18} aria-hidden="true" />Neue Saison</button>
	{/snippet}

	{#if !bookable}
		<div class="mb-6 flex items-start gap-3 rounded-[18px] border-2 p-4 {next ? 'border-line bg-accent-wash' : 'border-danger bg-danger-wash'}" role="status">
			<TriangleAlert class="mt-0.5 shrink-0 {next ? 'text-accent-dark' : 'text-danger'}" size={22} aria-hidden="true" />
			<p class="font-semibold text-ink">
				{#if next}In den nächsten 6 Monaten gibt es keine Saison. Die nächste beginnt am {d(next.start)}, vorher können Gäste nichts anfragen.{:else}Es gibt keine kommende Saison. Gäste können darum nichts anfragen. Leg eine an oder übernimm die vom letzten Jahr.{/if}
			</p>
		</div>
	{/if}

	<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
		<div class="min-w-0">
			{#if data.seasons.length}
				<Timeline seasons={data.seasons} selected={draft?.id ?? null} {today} onpick={(id) => edit(data.seasons.find((s) => s.id === id) ?? null)} />
			{:else if !draft}
				<div class="card p-6 text-center">
					<p class="text-lg font-semibold text-ink">Noch keine Saison. Leg die erste an.</p>
					<button type="button" class="btn-primary mt-4" onclick={() => edit(null)}><Plus size={18} aria-hidden="true" />Erste Saison anlegen</button>
				</div>
			{/if}

			{#if draft}
				<section bind:this={editor} class="card-strong mt-6 scroll-mt-24 p-5" aria-labelledby="editor-title">
					<h2 id="editor-title" class="text-xl">{draft.id ? `«${draft.name}» ändern` : 'Neue Saison'}</h2>
					<form method="POST" action="?/season" use:enhance={() => after()} class="mt-4 grid gap-4 sm:grid-cols-2">
						<input type="hidden" name="id" value={draft.id ?? ''} />
						<label class="sm:col-span-2"><span class="label">Name</span>
							<input name="name" bind:value={draft.name} placeholder="Sommer 2028" class="field" />
							<span class="hint mt-1 block text-sm">Nur für dich, Gäste sehen ihn nicht.</span>
						</label>
						<label><span class="label">Von (erste Anreise)</span>
							<input type="date" name="start" bind:value={draft.start} oninput={startChanged} required class="field" />
							<span class="hint mt-1 block text-sm font-semibold">{wd(draft.start)}</span>
						</label>
						<label><span class="label">Bis (letzte Abreise)</span>
							<input type="date" name="end" bind:value={draft.end} oninput={() => (endTouched = true)} min={draft.start || undefined} required class="field" />
							<span class="hint mt-1 block text-sm font-semibold">{wd(draft.end)}{draft.start && draft.end > draft.start ? `, ${weeks(draft.start, draft.end)} Wochen` : ''}</span>
						</label>
						<label class="sm:col-span-2"><span class="label">Preis pro Woche (CHF)</span>
							<input name="weekly" inputmode="decimal" bind:value={draft.weekly} placeholder="650" class="field sm:max-w-xs" />
						</label>

						<details class="rounded-[14px] border-2 border-line px-4 py-2 sm:col-span-2">
							<summary class="min-h-11 cursor-pointer py-2 font-semibold text-brand">Mehr Einstellungen</summary>
							<div class="grid gap-4 pb-3 pt-1 sm:grid-cols-3">
								<label><span class="label">Preis pro Nacht (CHF)</span>
									<input name="nightly" inputmode="decimal" bind:value={draft.nightly} placeholder={draft.weekly ? (Math.round((rp(draft.weekly) ?? 0) / 7) / 100).toFixed(2) : '100'} class="field" />
									<span class="hint mt-1 block text-sm">Für Nächte, die keine ganze Woche ergeben. Leer: ein Siebtel vom Wochenpreis.</span>
								</label>
								<label><span class="label">Mindestens Nächte</span>
									<input name="minNights" type="number" min="1" max="60" bind:value={draft.minNights} class="field" />
									<span class="hint mt-1 block text-sm">7 heisst: nur ganze Wochen.</span>
								</label>
								<label><span class="label">Wechseltag</span>
									<select name="changeover" bind:value={draft.changeover} class="field">
										<option value="">Jeder Tag</option>
										{#each days as day (day)}<option value={String(day)}>{weekdayName(day, 'de')}</option>{/each}
									</select>
									<span class="hint mt-1 block text-sm">An diesem Tag ist Anreise und Abreise.</span>
								</label>
							</div>
						</details>

						{#if form?.error && (form.id ?? null) === draft.id}<p class="rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger sm:col-span-2" role="alert">{form.error}</p>{/if}
						<div class="flex flex-wrap items-center gap-3 sm:col-span-2">
							<button class="btn-primary">{draft.id ? 'Speichern' : 'Saison anlegen'}</button>
							<button type="button" class="btn-line" onclick={() => (draft = null)}>Abbrechen</button>
							{#if draft.id}
								<button
									formaction="?/deleteSeason"
									class="ml-auto min-h-11 px-2 font-semibold text-danger underline"
									onclick={async (e) => {
										e.preventDefault();
										const button = e.currentTarget;
										if (await ask({ title: `Saison «${draft?.name}» löschen?`, text: 'In dieser Zeit kann dann niemand mehr anfragen. Du kannst es im Verlauf rückgängig machen.', ok: 'Löschen', danger: true }))
											button.form?.requestSubmit(button);
									}}
								>
									Saison löschen
								</button>
							{/if}
						</div>
					</form>
				</section>
			{/if}

			{#if upcoming.length}
				<ul class="mt-6 grid gap-2">
					{#each upcoming as s (s.id)}
						<li>
							<button type="button" onclick={() => edit(s)} class="card flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left hover:border-brand {draft?.id === s.id ? '!border-brand' : ''}">
								<span class="min-w-0 flex-1"><span class="block font-bold text-ink">{s.name}</span><span class="text-sm text-muted">{d(s.start)} bis {d(s.end)} · {price(s)}</span></span>
								<span class="flex items-center gap-1.5 text-sm font-semibold text-brand"><Pencil size={15} aria-hidden="true" />Ändern</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
			{#if past.length}
				<details class="mt-3">
					<summary class="min-h-11 cursor-pointer py-2 font-semibold text-brand">Vergangene Saisons ({past.length})</summary>
					<ul class="mt-2 grid gap-2">
						{#each past as s (s.id)}
							<li class="rounded-[18px] bg-off px-4 py-3 text-off-text"><span class="font-semibold">{s.name}</span>: {d(s.start)} bis {d(s.end)}, {price(s)}</li>
						{/each}
					</ul>
				</details>
			{/if}

			{#if data.plan?.create.length}
				<section class="card mt-8 p-5" aria-labelledby="copy-title">
					<div class="flex items-start gap-4">
						<span class="grid size-12 shrink-0 place-items-center rounded-full bg-wash text-brand"><CalendarPlus size={22} aria-hidden="true" /></span>
						<div class="min-w-0 flex-1">
							<h2 id="copy-title" class="text-xl">Saisons fürs Jahr {data.plan.year}</h2>
							<p class="text-muted">Gleiche Saisons wie {data.plan.year - 1}, mit gleichem Wochentag und gleichen Preisen.</p>
							{#if !copying}<button type="button" class="btn-blue mt-3" onclick={() => (copying = true)}>Saisons fürs nächste Jahr übernehmen</button>{/if}
						</div>
					</div>
					{#if copying}
						<div class="mt-4 border-t-2 border-line pt-4">
							<p class="font-semibold">Das wird neu angelegt:</p>
							<ul class="mt-2 grid gap-2">
								{#each data.plan.create as p (p.start)}
									<li class="rounded-[14px] bg-wash px-4 py-3"><span class="font-bold">{p.name}</span>: {wd(p.start)}, {d(p.start)} bis {wd(p.end)}, {d(p.end)} · {price(p)}</li>
								{/each}
							</ul>
							{#if data.plan.skip.length}
								<p class="mt-3 text-sm text-muted">Nicht übernommen, weil es dort schon eine Saison gibt: {data.plan.skip.map((p) => p.name).join(', ')}.</p>
							{/if}
							{#if form?.copyError}<p class="mt-3 rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger" role="alert">{form.copyError}</p>{/if}
							<form
								method="POST"
								action="?/copyYear"
								use:enhance={() =>
									async ({ update }) => {
										copying = false;
										await update({ reset: false });
									}}
								class="mt-4 flex flex-wrap gap-3"
							>
								<button class="btn-primary">Ja, so übernehmen</button>
								<button type="button" class="btn-line" onclick={() => (copying = false)}>Abbrechen</button>
							</form>
						</div>
					{/if}
				</section>
			{/if}
		</div>

		<aside class="h-fit rounded-[24px] border-2 border-dashed border-line bg-paper p-5 lg:sticky lg:top-6" aria-live="polite">
			<p class="text-xs font-bold uppercase tracking-wider text-muted">Beispiel {draft ? 'für diese Saison' : ''}</p>
			{#if example && 'q' in example}
				<p class="mt-1 font-semibold text-ink">
					Eine Woche vom {fmtDate(example.checkIn, 'de', { year: undefined, month: 'short' })} bis {fmtDate(example.checkOut, 'de', { year: undefined, month: 'short' })}, 2 Erwachsene und 2 Kinder
				</p>
				<dl class="mt-3 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 tabular-nums">
					{#each example.q.lines as l (l.key)}
						<dt class="text-muted">{LINES[l.key]}</dt>
						<dd class="text-right">{chf(l.amount)}</dd>
					{/each}
					<dt class="border-t-2 border-line pt-2 font-bold text-ink">Total</dt>
					<dd class="border-t-2 border-line pt-2 text-right font-bold text-brand">{chf(example.q.total)}</dd>
				</dl>
				<p class="mt-3 text-sm text-muted">So sieht der Gast den Preis bei der Anfrage. Saison: {example.season}.</p>
			{:else if example}
				<p class="mt-1 text-muted">{example.problem}</p>
			{:else}
				<p class="mt-1 text-muted">Sobald es eine Saison gibt, rechnet hier ein Beispiel mit.</p>
			{/if}
		</aside>
	</div>

	<section class="mt-14" aria-labelledby="wochen">
		<h2 id="wochen" class="text-2xl">Einzelne Wochen</h2>
		<p class="mt-1 max-w-[64ch] text-muted">Eine Woche kann einen eigenen Preis haben, zum Beispiel günstiger, wenn sie kurz vorher noch frei ist. Die Vorschläge kommen aus den Buchungen und Besuchen. Es ändert sich nichts, bis du einen übernimmst.</p>

		{#if data.hints.length}
			<ul class="mt-4 grid gap-3">
				{#each data.hints as h (h.key)}
					<li class="card flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-4">
						<div class="min-w-0 flex-[1_1_22rem]">
							<p class="flex flex-wrap items-center gap-2"><span class="chip {h.suggested > h.current ? 'chip-ok' : 'chip-wait'}">{h.label}</span><span class="font-bold">Woche ab {d(h.start)}</span></p>
							<p class="mt-1 text-sm text-muted">{h.reason}</p>
						</div>
						<div class="flex flex-wrap items-center gap-3">
							<p class="tabular-nums"><s class="text-muted">{chf(h.current)}</s> <strong class="text-lg">{chf(h.suggested)}</strong></p>
							<form method="POST" action="?/hintTake" use:enhance><input type="hidden" name="key" value={h.key} /><button class="btn-primary !min-h-0 !px-4 !py-1.5 text-sm">Übernehmen</button></form>
							<form method="POST" action="?/hintDismiss" use:enhance><input type="hidden" name="key" value={h.key} /><button class="text-sm font-semibold text-brand underline">Nicht jetzt</button></form>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="card mt-4 p-4 text-muted">Im Moment kein Vorschlag. Die Website rechnet bei jedem Besuch dieser Seite neu.</p>
		{/if}

		<div class="mt-6 grid gap-4 lg:grid-cols-2">
			<div class="card p-4">
				<h3 class="text-lg">Wochen mit eigenem Preis</h3>
				{#if data.own.length}
					<ul class="mt-2 divide-y-2 divide-line">
						{#each data.own as w (w.id)}
							<li class="flex flex-wrap items-center justify-between gap-2 py-2">
								<span><strong>Ab {d(w.start)}</strong> <span class="text-sm text-muted">{w.reason}</span></span>
								<span class="flex items-center gap-3 tabular-nums">
									<strong>{chf(w.weekly)}</strong>
									<form method="POST" action="?/weekReset" use:enhance><input type="hidden" name="id" value={w.id} /><button class="text-sm font-semibold text-brand underline">Zurück zum Saisonpreis</button></form>
								</span>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-2 text-muted">Keine. Alle Wochen kosten den Saisonpreis.</p>
				{/if}
			</div>
			<form method="POST" action="?/week" use:enhance class="card grid content-start gap-3 p-4">
				<h3 class="text-lg">Eine Woche selber festlegen</h3>
				<label class="label">Woche
					<select name="start" class="field mt-1 font-normal">
						{#each data.weeks.filter((w) => w.free) as w (w.start)}<option value={w.start}>ab {d(w.start)}, jetzt {chf(w.price)}{w.views ? `, ${w.views}-mal angeschaut` : ''}</option>{/each}
					</select>
				</label>
				<label class="label">Preis für diese Woche in CHF <input name="weekly" inputmode="decimal" class="field mt-1 font-normal" placeholder="z. B. 590" /></label>
				{#if form && 'weekError' in form && form.weekError}<p class="font-semibold text-danger">{form.weekError}</p>{/if}
				<button class="btn-line justify-self-start">Speichern</button>
			</form>
		</div>
	</section>

	<section class="mt-14" aria-labelledby="extras">
		<div class="flex flex-wrap items-end justify-between gap-3">
			<div>
				<h2 id="extras" class="text-2xl">Was dazukommt</h2>
				<p class="mt-1 text-muted">Zur Miete kommen diese Beträge. Kurtaxe und Beherbergungsabgabe gibst du an die Gemeinde weiter.</p>
			</div>
			<button type="button" class="btn-line" onclick={() => (editExtras = !editExtras)} aria-expanded={editExtras}><Pencil size={16} aria-hidden="true" />{editExtras ? 'Schliessen' : 'Ändern'}</button>
		</div>

		{#if !editExtras}
			<dl class="card mt-4 grid divide-y-2 divide-line">
				{#each [['Bettwäsche', `${chf(r.linen)} pro Set, wenn der Gast sie mietet`], ['Endreinigung', r.cleaning ? `${chf(r.cleaning)} pro Aufenthalt` : 'im Wochenpreis drin'], ['Kurtaxe', `${chf(r.taxAdult)} pro Nacht ab 16 Jahren, ${chf(r.taxChild)} von 6 bis 15, unter 6 gratis`], ['Beherbergungsabgabe', `${chf(r.levyAdult)} pro Nacht ab 16 Jahren`], ['Anreise und Abreise', `Anreise ab ${r.checkIn} Uhr, Abreise bis ${r.checkOut} Uhr`], ['Höchstens', `${r.maxGuests} Personen, Kleinkinder zählen mit`]] as [k, v] (k)}
					<div class="grid gap-x-4 px-4 py-3 sm:grid-cols-[12rem_1fr]"><dt class="font-semibold text-ink">{k}</dt><dd class="text-muted">{v}</dd></div>
				{/each}
			</dl>
		{:else}
			<form
				method="POST"
				action="?/rates"
				use:enhance={() =>
					async ({ result, update }) => {
						await update({ reset: false });
						if (result.type === 'success') editExtras = false;
					}}
				class="card mt-4 grid gap-4 p-5 sm:grid-cols-2"
			>
				<label><span class="label">Bettwäsche pro Set (CHF)</span>
					<input name="linen" inputmode="decimal" bind:value={x.linen} class="field" />
					<span class="hint mt-1 block text-sm">Pro Person und Aufenthalt, wenn der Gast sie mietet.</span>
				</label>
				<label><span class="label">Endreinigung (CHF)</span>
					<input name="cleaning" inputmode="decimal" bind:value={x.cleaning} class="field" />
					<span class="hint mt-1 block text-sm">0, wenn sie im Wochenpreis drin ist.</span>
				</label>
				<label><span class="label">Kurtaxe ab 16 Jahren (CHF pro Nacht)</span>
					<input name="taxAdult" inputmode="decimal" bind:value={x.taxAdult} class="field" />
					<span class="hint mt-1 block text-sm">Reichenbach seit 2025: CHF 3.</span>
				</label>
				<label><span class="label">Kurtaxe 6 bis 15 Jahre (CHF pro Nacht)</span>
					<input name="taxChild" inputmode="decimal" bind:value={x.taxChild} class="field" />
					<span class="hint mt-1 block text-sm">Die Hälfte, also CHF 1.50. Unter 6 gratis.</span>
				</label>
				<label><span class="label">Beherbergungsabgabe ab 16 (CHF pro Nacht)</span>
					<input name="levyAdult" inputmode="decimal" bind:value={x.levyAdult} class="field" />
					<span class="hint mt-1 block text-sm">Vom Kanton, CHF 1.</span>
				</label>
				<label><span class="label">Höchstens Personen</span>
					<input name="maxGuests" type="number" min="1" max="20" bind:value={x.maxGuests} class="field" />
					<span class="hint mt-1 block text-sm">Kleinkinder zählen mit.</span>
				</label>
				<label><span class="label">Anreise ab</span><input name="checkIn" type="time" bind:value={x.checkIn} class="field" /></label>
				<label><span class="label">Abreise bis</span><input name="checkOut" type="time" bind:value={x.checkOut} class="field" /></label>
				<div class="flex flex-wrap gap-3 sm:col-span-2">
					<button class="btn-primary">Speichern</button>
					<button type="button" class="btn-line" onclick={() => ((editExtras = false), (x = fields(r)))}>Abbrechen</button>
				</div>
			</form>
		{/if}
	</section>
</AdminPage>
