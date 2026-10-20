<script lang="ts">
	import { enhance } from '$app/forms';
	import CalendarRange from '@lucide/svelte/icons/calendar-range';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';
	import { addDays, chf, quote, weekday, type Season } from '#lib/booking.ts';
	import { fmtDate, weekdayName } from '#lib/i18n.ts';

	let { data, form } = $props();
	type Row = (typeof data.seasons)[number];

	// which season form is open: an id, 'new' or nothing
	let open = $state<number | 'new' | null>(null);
	const today = new Date().toISOString().slice(0, 10);
	const current = $derived(data.seasons.filter((s) => s.end >= today));
	const past = $derived(data.seasons.filter((s) => s.end < today));
	const days = [6, 0, 1, 2, 3, 4, 5];

	const money = (rp: number | null) => (rp === null ? '' : (rp / 100).toString());
	const d = (iso: string) => fmtDate(iso, 'de', { weekday: undefined });
	const summary = (s: Row) =>
		[
			`${d(s.start)} bis ${d(s.end)}`,
			s.weekly !== null ? `${chf(s.weekly)} pro Woche` : `${chf(s.nightly)} pro Nacht`,
			s.changeover === null ? 'Anreise an jedem Tag' : `Wechsel am ${weekdayName(s.changeover, 'de')}`,
			s.minNights > 1 ? `mindestens ${s.minNights} Nächte` : ''
		]
			.filter(Boolean)
			.join(', ');

	const after = (close = true) => async ({ result, update }: { result: { type: string }; update: (o?: { reset?: boolean }) => Promise<void> }) => {
		await update({ reset: false });
		if (close && result.type === 'success') open = null;
	};

	// The extras, kept live so the example below changes while Tom types.
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
	// back to the saved values after saving (or undo)
	$effect(() => {
		x = fields(r);
	});
	const rp = (v: string) => Math.round(Number(String(v).replace(',', '.').replace(/[^\d.]/g, '') || 0) * 100);

	// Example: the first full week of the next season, 2 adults and 2 children, bed linen for all.
	const example = $derived.by(() => {
		const s = current[0] as (Row & Season) | undefined;
		if (!s) return null;
		let checkIn = s.start > today ? s.start : today;
		for (let i = 0; i < 7 && s.changeover !== null && weekday(checkIn) !== s.changeover; i++) checkIn = addDays(checkIn, 1);
		const checkOut = addDays(checkIn, Math.max(7, s.minNights));
		const rates = { cleaning: rp(x.cleaning), linen: rp(x.linen), taxAdult: rp(x.taxAdult), taxChild: rp(x.taxChild), levyAdult: rp(x.levyAdult), maxGuests: Math.max(4, x.maxGuests) };
		const q = quote(checkIn, checkOut, { adults: 2, children: 2, infants: 0, linen: 4 }, [s], rates);
		return q.ok ? { q, checkIn, checkOut, season: s.name } : null;
	});
	const LINES: Record<string, string> = { stay: 'Miete', cleaning: 'Endreinigung', linen: 'Bettwäsche, 4 Sets', tax: 'Kurtaxe', levy: 'Beherbergungsabgabe' };
</script>

{#snippet seasonForm(s: Row | null)}
	<form method="POST" action="?/season" use:enhance={() => after()} class="grid gap-4 sm:grid-cols-2">
		<input type="hidden" name="id" value={s?.id ?? ''} />
		<label class="sm:col-span-2"><span class="label">Name</span>
			<input name="name" value={s?.name ?? ''} placeholder="Sommer 2028" class="field" />
			<span class="hint mt-1 block text-sm">Nur für dich, Gäste sehen ihn nicht.</span>
		</label>
		<label><span class="label">Erste Anreise</span><input type="date" name="start" value={s?.start ?? ''} required class="field" /></label>
		<label><span class="label">Letzte Abreise</span><input type="date" name="end" value={s?.end ?? ''} required class="field" /></label>
		<label><span class="label">Preis pro Woche (CHF)</span>
			<input name="weekly" inputmode="decimal" value={money(s?.weekly ?? null)} placeholder="650" class="field" />
			<span class="hint mt-1 block text-sm">Für je 7 Nächte. Leer lassen, wenn nur der Nachtpreis gilt.</span>
		</label>
		<label><span class="label">Preis pro Nacht (CHF)</span>
			<input name="nightly" inputmode="decimal" value={money(s?.nightly ?? null)} required placeholder="100" class="field" />
			<span class="hint mt-1 block text-sm">Für Nächte, die keine ganze Woche ergeben.</span>
		</label>
		<label><span class="label">Wechseltag</span>
			<select name="changeover" class="field">
				<option value="" selected={s?.changeover === null}>Jeder Tag</option>
				{#each days as day (day)}<option value={day} selected={(s?.changeover ?? 6) === day && s?.changeover !== null}>{weekdayName(day, 'de')}</option>{/each}
			</select>
			<span class="hint mt-1 block text-sm">An diesem Tag ist Anreise und Abreise.</span>
		</label>
		<label><span class="label">Mindestens Nächte</span>
			<input name="minNights" type="number" min="1" max="60" value={s?.minNights ?? 7} class="field" />
			<span class="hint mt-1 block text-sm">7 heisst: nur ganze Wochen.</span>
		</label>
		{#if form?.error && (form.id ?? 'new') === (s?.id ?? 'new')}<p class="rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger sm:col-span-2" role="alert">{form.error}</p>{/if}
		<div class="flex flex-wrap items-center gap-3 sm:col-span-2">
			<button class="btn-primary">{s ? 'Saison speichern' : 'Saison anlegen'}</button>
			<button type="button" class="btn-line" onclick={() => (open = null)}>Abbrechen</button>
			{#if s}
				<button
					formaction="?/deleteSeason"
					class="ml-auto min-h-11 px-2 font-semibold text-danger underline"
					onclick={(e) => !confirm(`Saison «${s.name}» löschen? Du kannst es im Verlauf rückgängig machen.`) && e.preventDefault()}
				>
					Saison löschen
				</button>
			{/if}
		</div>
	</form>
{/snippet}

<AdminPage title="Preise und Saisons" intro="Wann man das Hüttli buchen kann und was es kostet.">
	{#snippet help()}
		<ul>
			<li>Gäste können nur Daten innerhalb einer Saison anfragen. Lege also für jedes Jahr eine Saison an, zum Beispiel «Sommer 2028».</li>
			<li>Der Wochenpreis gilt für je 7 Nächte. Bleibt jemand länger oder kürzer, kosten die übrigen Nächte den Nachtpreis.</li>
			<li>Der Wechseltag ist der Tag für Anreise und Abreise. Bisher ist das der Samstag.</li>
			<li>Unten bei «Zuschläge, Kurtaxe, Zeiten» stehen die Beträge, die zur Miete dazukommen. Das Beispiel daneben rechnet sofort mit.</li>
			<li>Jede Änderung kannst du im <a href="/admin/verlauf">Verlauf</a> rückgängig machen.</li>
		</ul>
	{/snippet}
	{#snippet actions()}
		<button type="button" class="btn-blue" onclick={() => (open = 'new')} disabled={open === 'new'}><Plus size={18} aria-hidden="true" />Neue Saison</button>
	{/snippet}


	<section aria-labelledby="saisons">
		<h2 id="saisons" class="text-2xl">Saisons</h2>
		<ul class="mt-4 grid gap-3">
			{#if open === 'new'}
				<li class="card-strong p-5">
					<h3 class="mb-4 text-xl">Neue Saison</h3>
					{@render seasonForm(null)}
				</li>
			{/if}
			{#each current as s (s.id)}
				<li class={open === s.id ? 'card-strong p-5' : 'card p-5'}>
					{#if open === s.id}
						<h3 class="mb-4 text-xl">{s.name} bearbeiten</h3>
						{@render seasonForm(s)}
					{:else}
						<div class="flex flex-wrap items-center gap-4">
							<span class="grid size-12 shrink-0 place-items-center rounded-full bg-wash text-brand"><CalendarRange size={22} aria-hidden="true" /></span>
							<div class="min-w-0 flex-1">
								<p class="text-lg font-bold text-ink">{s.name}</p>
								<p class="text-muted">{summary(s)}</p>
							</div>
							<button type="button" class="btn-line !min-h-11 !px-4 !py-2 text-sm" onclick={() => (open = s.id)}><Pencil size={16} aria-hidden="true" />Bearbeiten</button>
						</div>
					{/if}
				</li>
			{:else}
				{#if open !== 'new'}
					<li class="rounded-[18px] bg-accent-wash p-5">
						<p class="font-semibold text-ink">Im Moment gibt es keine Saison. Gäste können darum nichts anfragen.</p>
						<button type="button" class="btn-primary mt-3" onclick={() => (open = 'new')}>Saison anlegen</button>
					</li>
				{/if}
			{/each}
		</ul>
		{#if past.length}
			<details class="mt-4">
				<summary class="min-h-11 cursor-pointer py-2 font-semibold text-brand">Vergangene Saisons ({past.length})</summary>
				<ul class="mt-2 grid gap-2">
					{#each past as s (s.id)}
						<li class="rounded-[18px] bg-off px-4 py-3 text-off-text"><span class="font-semibold">{s.name}</span>: {summary(s)}</li>
					{/each}
				</ul>
			</details>
		{/if}
	</section>

	<section class="mt-14" aria-labelledby="extras">
		<h2 id="extras" class="text-2xl">Zuschläge, Kurtaxe, Zeiten</h2>
		<p class="mt-1 text-muted">Das kommt zur Miete dazu. Die Kurtaxe und die Beherbergungsabgabe gibst du an die Gemeinde weiter.</p>
		<div class="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
			<form method="POST" action="?/rates" use:enhance={() => after(false)} class="card grid gap-4 p-5 sm:grid-cols-2">
				<label><span class="label">Endreinigung (CHF)</span>
					<input name="cleaning" inputmode="decimal" bind:value={x.cleaning} class="field" />
					<span class="hint mt-1 block text-sm">0, wenn sie im Wochenpreis drin ist.</span>
				</label>
				<label><span class="label">Bettwäsche pro Set (CHF)</span>
					<input name="linen" inputmode="decimal" bind:value={x.linen} class="field" />
					<span class="hint mt-1 block text-sm">Pro Person und Aufenthalt, wenn der Gast sie mietet.</span>
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
				<div class="sm:col-span-2"><button class="btn-primary">Speichern</button></div>
			</form>

			<aside class="h-fit rounded-[24px] border-2 border-dashed border-line bg-paper p-5" aria-live="polite">
				<p class="text-xs font-bold uppercase tracking-wider text-muted">Beispiel</p>
				{#if example}
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
				{:else}
					<p class="mt-1 text-muted">Sobald es eine Saison gibt, rechnet hier ein Beispiel mit.</p>
				{/if}
			</aside>
		</div>
	</section>
</AdminPage>
