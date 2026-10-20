<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let lang = $state<'de' | 'en'>('de');
	const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });

	const LABELS: Record<string, [string, string]> = {
		tagline: ['Kurzbeschreibung', 'Ein Satz unter dem Titel, erscheint auch bei Google.'],
		intro: ['Einleitung', 'Leerzeile = neuer Absatz.'],
		sleeping: ['Schlafen', 'Zeilen mit "- " am Anfang werden eine Liste.'],
		good_to_know: ['Gut zu wissen', 'Was Gäste wissen sollten, bevor sie buchen.'],
		arrival: ['Anreise', ''],
		rules: ['Hausregeln', ''],
		payment: ['Zahlung und Absage', ''],
		area: ['Umgebung: Einkaufen, Essen, Gästekarte', 'Erscheint auf der Seite Umgebung. "Titel: Text" wird zu einer Karte.'],
		faq: ['Häufige Fragen', 'Erste Zeile die Frage, darunter die Antwort, Leerzeile dazwischen. Erscheint auch bei Google.'],
		packing: ['Packliste für Gäste', 'Eine Zeile pro Punkt mit "- " am Anfang. Gäste können sie abhaken.'],
		guest_info: ['Infos nur für bestätigte Gäste', 'Schlüssel, genaue Lage, Parkplatz, Weg zum Hüttli. Sehen nur Gäste mit bestätigter Buchung.']
	};
	const amenities = $derived([...data.amenities, { icon: 'info', de: '', en: '' }]);
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
	<h2 class="text-xl">Ausstattung</h2>
	<p class="text-sm text-stein">Erscheint als Liste mit Icons. Leere Zeilen werden entfernt.</p>
	<form method="POST" action="?/amenities" use:enhance={keep} class="mt-4 grid gap-2">
		{#each amenities as a, i (i)}
			<div class="grid grid-cols-[150px_1fr] gap-2 rounded-[12px] bg-paper p-2 sm:grid-cols-[170px_1fr_1fr]">
				<label class="sr-only" for="icon-{i}">Icon</label>
				<select id="icon-{i}" name="icon" class="field !min-h-10 !py-1.5 text-sm">
					{#each data.icons as icon (icon)}<option value={icon} selected={a.icon === icon}>{icon}</option>{/each}
				</select>
				<input name="de" value={a.de} placeholder="Deutsch" aria-label="Deutsch" class="field !min-h-10 !py-1.5" />
				<input name="en" value={a.en} placeholder="Englisch" aria-label="Englisch" class="field col-span-2 !min-h-10 !py-1.5 sm:col-span-1" />
			</div>
		{/each}
		<div class="flex items-center gap-3">
			<button class="btn-gelb !py-2">Ausstattung speichern</button>
			{#if form?.saved === 'amenities'}<span class="text-sm text-moos">Gespeichert</span>{/if}
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
