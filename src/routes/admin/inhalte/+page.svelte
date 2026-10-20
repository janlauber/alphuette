<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let lang = $state<'de' | 'en'>('de');
	const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });

	const LABELS: Record<string, [string, string]> = {
		tagline: ['Kurzbeschreibung', 'Ein Satz unter dem Titel, erscheint auch bei Google.'],
		intro: ['Einleitung', 'Leerzeile = neuer Absatz.'],
		sleeping: ['Schlafen', 'Zeilen mit "- " am Anfang werden eine Liste.'],
		amenities: ['Ausstattung', ''],
		good_to_know: ['Gut zu wissen', 'Was Gäste wissen sollten, bevor sie buchen.'],
		arrival: ['Anreise', ''],
		rules: ['Hausregeln', ''],
		payment: ['Zahlung und Absage', ''],
		area: ['Umgebung: Einkaufen, Essen, Gästekarte', 'Erscheint auf der Seite Umgebung.'],
		guest_info: ['Infos nur für bestätigte Gäste', 'Schlüssel, genaue Lage, Parkplatz, Weg zum Hüttli. Sehen nur Gäste mit bestätigter Buchung.']
	};
	const tips = $derived([...data.tips, { name: '', time: '', alpine: false, de: '', en: '', url: '' }]);
</script>

<h1 class="text-3xl">Inhalte</h1>

<section class="mt-8">
	<div class="flex items-center justify-between gap-4">
		<h2 class="text-xl">Texte der Website</h2>
		<div class="flex rounded-[3px] border border-tanne text-sm" role="tablist">
			<button type="button" role="tab" aria-selected={lang === 'de'} class="px-3 py-1 {lang === 'de' ? 'bg-tanne text-kalk' : ''}" onclick={() => (lang = 'de')}>Deutsch</button>
			<button type="button" role="tab" aria-selected={lang === 'en'} class="px-3 py-1 {lang === 'en' ? 'bg-tanne text-kalk' : ''}" onclick={() => (lang = 'en')}>Englisch</button>
		</div>
	</div>
	{#key lang}
		<form method="POST" action="?/content" use:enhance={keep} class="mt-4 grid gap-5 rounded-[3px] bg-paper p-4">
			<input type="hidden" name="lang" value={lang} />
			{#each data.fields as key (key)}
				<label class="label">
					{LABELS[key]?.[0] ?? key}
					{#if LABELS[key]?.[1]}<span class="hint block text-sm">{LABELS[key][1]}</span>{/if}
					<textarea name={key} rows={key === 'tagline' ? 2 : 6} class="field mt-1 font-normal leading-relaxed">{data.content[lang][key]}</textarea>
				</label>
			{/each}
			<div class="flex items-center gap-3">
				<button class="btn-gelb !py-2">Texte speichern</button>
				{#if form?.saved === 'content-' + lang}<span class="text-sm text-moos">Gespeichert</span>{/if}
			</div>
		</form>
	{/key}
</section>

<section class="mt-12">
	<h2 class="text-xl">Wanderungen</h2>
	<p class="text-sm text-stein">Erscheinen als Wegweiser. Die ersten vier stehen auf der Startseite. Leere Zeilen werden entfernt.</p>
	<form method="POST" action="?/tips" use:enhance={keep} class="mt-4 grid gap-4">
		{#each tips as tip, i (i)}
			<fieldset class="grid gap-2 rounded-[3px] bg-paper p-4 sm:grid-cols-6">
				<label class="label text-sm sm:col-span-3">Ziel <input name="name" value={tip.name} class="field mt-1 font-normal" /></label>
				<label class="label text-sm sm:col-span-2">Gehzeit <input name="time" value={tip.time} placeholder="2 h 15 min" class="field mt-1 font-normal" /></label>
				<label class="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" name="alpine" value={i} checked={tip.alpine} class="accent-tanne" /> Bergweg</label>
				<label class="label text-sm sm:col-span-3">Beschreibung Deutsch <textarea name="de" rows="2" class="field mt-1 font-normal">{tip.de}</textarea></label>
				<label class="label text-sm sm:col-span-3">Beschreibung Englisch <textarea name="en" rows="2" class="field mt-1 font-normal">{tip.en}</textarea></label>
				<label class="label text-sm sm:col-span-6">Link <input name="url" type="url" value={tip.url} class="field mt-1 font-normal" /></label>
			</fieldset>
		{/each}
		<div class="flex items-center gap-3">
			<button class="btn-gelb !py-2">Wanderungen speichern</button>
			{#if form?.saved === 'tips'}<span class="text-sm text-moos">Gespeichert</span>{/if}
		</div>
	</form>
</section>

<section class="mt-12">
	<h2 class="text-xl">Gastgeber und Zahlung</h2>
	<form method="POST" action="?/host" use:enhance={keep} class="mt-4 grid gap-3 rounded-[3px] bg-paper p-4 sm:grid-cols-2">
		<label class="label text-sm sm:col-span-2">Name des Hüttli <input name="name" value={data.name} class="field mt-1 font-normal" /></label>
		<label class="label text-sm">Dein Name <input name="hostName" value={data.host.name} class="field mt-1 font-normal" /></label>
		<label class="label text-sm">E-Mail für Gäste <input name="email" type="email" value={data.host.email} class="field mt-1 font-normal" /></label>
		<label class="label text-sm">Strasse und Nr. <input name="street" value={data.host.street} class="field mt-1 font-normal" /></label>
		<div class="grid grid-cols-[6rem_1fr] gap-3">
			<label class="label text-sm">PLZ <input name="zip" value={data.host.zip} class="field mt-1 font-normal" /></label>
			<label class="label text-sm">Ort <input name="city" value={data.host.city} class="field mt-1 font-normal" /></label>
		</div>
		<label class="label text-sm">IBAN für die QR-Rechnung <input name="iban" value={data.host.iban} placeholder="CH00 0000 0000 0000 0000 0" class="field mt-1 font-normal" /></label>
		<label class="label text-sm">WhatsApp-Nummer <span class="hint">(leer = kein WhatsApp-Link)</span><input name="whatsapp" type="tel" value={data.host.whatsapp} placeholder="079 123 45 67" class="field mt-1 font-normal" /></label>
		<label class="label text-sm">Karte: Breitengrad <input name="lat" inputmode="decimal" value={data.host.lat} class="field mt-1 font-normal" /></label>
		<label class="label text-sm">Karte: Längengrad <input name="lon" inputmode="decimal" value={data.host.lon} class="field mt-1 font-normal" /></label>
		<p class="text-sm text-stein sm:col-span-2">Die Karte auf der Website zeigt diesen Punkt. Er muss nicht genau beim Hüttli liegen. Die genaue Lage gehört in die Infos für bestätigte Gäste.</p>
		{#if form?.error}<p class="text-rot sm:col-span-2" role="alert">{form.error}</p>{/if}
		<div class="flex items-center gap-3 sm:col-span-2">
			<button class="btn-gelb !py-2">Speichern</button>
			{#if form?.saved === 'host'}<span class="text-sm text-moos">Gespeichert</span>{/if}
		</div>
	</form>
</section>
