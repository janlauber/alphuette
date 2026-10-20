<script lang="ts">
	import { enhance } from '$app/forms';
	import { weekdayName } from '#lib/i18n.ts';

	let { data, form } = $props();
	const chf = (rp: number | null) => (rp === null ? '' : (rp / 100).toString());
	const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });
	const days = [6, 0, 1, 2, 3, 4, 5];
</script>

<h1 class="text-3xl">Preise und Saisons</h1>
<p class="mt-1 max-w-[60ch] text-stein">Gebucht werden kann nur innerhalb einer Saison. Der Wochenpreis gilt für je 7 Nächte, angebrochene Wochen kosten den Nachtpreis.</p>

{#snippet seasonForm(s: (typeof data.seasons)[number] | null)}
	<form method="POST" action="?/season" use:enhance={keep} class="grid gap-3 rounded-[14px] bg-paper p-4 sm:grid-cols-6">
		<input type="hidden" name="id" value={s?.id ?? ''} />
		<label class="label text-sm sm:col-span-2">Name <input name="name" value={s?.name ?? ''} placeholder="Sommer 2028" class="field mt-1 font-normal" /></label>
		<label class="label text-sm sm:col-span-2">Erste Nacht <input type="date" name="start" value={s?.start ?? ''} required class="field mt-1 font-normal" /></label>
		<label class="label text-sm sm:col-span-2">Letzte Abreise <input type="date" name="end" value={s?.end ?? ''} required class="field mt-1 font-normal" /></label>
		<label class="label text-sm sm:col-span-2">Preis pro Woche, CHF <input name="weekly" inputmode="decimal" value={chf(s?.weekly ?? null)} placeholder="leer = nur Nachtpreis" class="field mt-1 font-normal" /></label>
		<label class="label text-sm sm:col-span-2">Preis pro Nacht, CHF <input name="nightly" inputmode="decimal" value={chf(s?.nightly ?? null)} required class="field mt-1 font-normal" /></label>
		<label class="label text-sm">Min. Nächte <input name="minNights" type="number" min="1" max="60" value={s?.minNights ?? 1} class="field mt-1 font-normal" /></label>
		<label class="label text-sm">Wechseltag
			<select name="changeover" class="field mt-1 font-normal">
				<option value="" selected={s?.changeover === null}>jeder Tag</option>
				{#each days as d (d)}<option value={d} selected={s?.changeover === d}>{weekdayName(d, 'de')}</option>{/each}
			</select>
		</label>
		<div class="flex items-center gap-3 sm:col-span-6">
			<button class="btn-line !py-1.5">{s ? 'Speichern' : 'Saison hinzufügen'}</button>
			{#if form?.saved === (s?.id ?? 'new')}<span class="text-sm text-moos">Gespeichert</span>{/if}
			{#if form?.error && form.id === (s?.id ?? null)}<span class="text-sm text-rot" role="alert">{form.error}</span>{/if}
			{#if s}
				<button formaction="?/deleteSeason" class="ml-auto text-sm text-rot underline" onclick={(e) => !confirm('Saison löschen?') && e.preventDefault()}>Löschen</button>
			{/if}
		</div>
	</form>
{/snippet}

<section class="mt-8 grid gap-4">
	{#each data.seasons as s (s.id)}{@render seasonForm(s)}{/each}
	<h2 class="mt-4 text-xl">Neue Saison</h2>
	{@render seasonForm(null)}
</section>

<section class="mt-12">
	<h2 class="text-xl">Zuschläge und Taxen</h2>
	<form method="POST" action="?/rates" use:enhance={keep} class="mt-4 grid gap-3 rounded-[14px] bg-paper p-4 sm:grid-cols-3">
		<label class="label text-sm">Endreinigung, CHF <input name="cleaning" inputmode="decimal" value={chf(data.rates.cleaning)} class="field mt-1 font-normal" /></label>
		<label class="label text-sm">Bettwäsche pro Set, CHF <input name="linen" inputmode="decimal" value={chf(data.rates.linen)} class="field mt-1 font-normal" /></label>
		<label class="label text-sm">Max. Personen <input name="maxGuests" type="number" min="1" max="20" value={data.rates.maxGuests} class="field mt-1 font-normal" /></label>
		<label class="label text-sm">Kurtaxe ab 16 J., CHF/Nacht <input name="taxAdult" inputmode="decimal" value={chf(data.rates.taxAdult)} class="field mt-1 font-normal" /></label>
		<label class="label text-sm">Kurtaxe 6 bis 15 J., CHF/Nacht <input name="taxChild" inputmode="decimal" value={chf(data.rates.taxChild)} class="field mt-1 font-normal" /></label>
		<label class="label text-sm">Beherbergungsabgabe ab 16 J. <input name="levyAdult" inputmode="decimal" value={chf(data.rates.levyAdult)} class="field mt-1 font-normal" /></label>
		<label class="label text-sm">Anreise ab <input name="checkIn" type="time" value={data.rates.checkIn} class="field mt-1 font-normal" /></label>
		<label class="label text-sm">Abreise bis <input name="checkOut" type="time" value={data.rates.checkOut} class="field mt-1 font-normal" /></label>
		<div class="flex items-center gap-3 sm:col-span-3">
			<button class="btn-line !py-1.5">Speichern</button>
			{#if form?.ratesSaved}<span class="text-sm text-moos">Gespeichert</span>{/if}
		</div>
	</form>
	<p class="mt-2 text-sm text-stein">Kurtaxe Reichenbach seit 2025: CHF 3 pro Nacht ab 16 Jahren, Kinder 6 bis 15 die Hälfte. Dazu die kantonale Beherbergungsabgabe von CHF 1.</p>
</section>
