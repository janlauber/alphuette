<script lang="ts">
	import { enhance } from '$app/forms';
	import Check from '@lucide/svelte/icons/check';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';
	import TextPreview from '#lib/components/admin/TextPreview.svelte';
	import { ICONS } from '#lib/icons.ts';

	let { data, form } = $props();
	type Key = (typeof data.fields)[number];

	const FIELDS: Record<string, { label: string; hint: string; kind?: 'line' | 'faq'; rows?: number }> = {
		tagline: { label: 'Kurzbeschreibung', hint: 'Ein Satz unter dem Namen. Google zeigt ihn auch in den Suchresultaten.', kind: 'line', rows: 2 },
		intro: { label: 'Einleitung', hint: 'Der erste Text auf der Startseite.' },
		sleeping: { label: 'Schlafen', hint: 'Betten, Matratzen, Bettwäsche.' },
		good_to_know: { label: 'Gut zu wissen', hint: 'Was Gäste wissen sollten, bevor sie anfragen.' },
		faq: { label: 'Häufige Fragen', hint: 'Frage auf eine Zeile, die Antwort darunter. Zwischen zwei Fragen eine leere Zeile.', kind: 'faq', rows: 12 },
		rules: { label: 'Hausregeln', hint: 'Gäste sehen sie beim Anfragen.' },
		payment: { label: 'Zahlung und Absage', hint: 'Gäste sehen das beim Anfragen und auf der Buchungsseite.' },
		packing: { label: 'Packliste', hint: 'Eine Zeile pro Sache, mit «- » am Anfang. Gäste können abhaken.' },
		arrival: { label: 'Anreise', hint: 'Mit Bus und Auto. Erscheint auf der Startseite und bei den Gästen.' },
		area: { label: 'Umgebung', hint: 'Einkaufen, Essen gehen, Gästekarte. Erscheint auf der Seite Umgebung.', rows: 10 },
		guest_info: { label: 'Infos nur für bestätigte Gäste', hint: 'Schlüssel, genaue Lage, Parkplatz, Weg zum Hüttli. Nur Gäste mit bestätigter Buchung sehen das.', rows: 8 }
	};
	const GROUPS: [string, Key[]][] = [
		['Startseite', ['tagline', 'intro', 'sleeping', 'good_to_know', 'faq']],
		['Beim Anfragen', ['rules', 'payment', 'packing']],
		['Anreise und Umgebung', ['arrival', 'area']],
		['Nur für bestätigte Gäste', ['guest_info']]
	];
	const LANGS = { en: 'Englisch', fr: 'Französisch', it: 'Italienisch' } as const;

	// editable copies; a field counts as changed while it differs from data.content
	// svelte-ignore state_referenced_locally
	let values = $state<Record<string, string>>({ ...data.content });
	// svelte-ignore state_referenced_locally
	let amenities = $state(data.amenities.map((a) => ({ ...a })));
	// after a save or an undo, take over what changed on the server; unsaved edits elsewhere stay
	// svelte-ignore state_referenced_locally
	let before = { content: { ...data.content } as Record<string, string>, amenities: JSON.stringify(data.amenities) };
	$effect(() => {
		for (const [k, v] of Object.entries(data.content)) if (v !== before.content[k]) values[k] = v;
		if (JSON.stringify(data.amenities) !== before.amenities) amenities = data.amenities.map((a) => ({ ...a }));
		before = { content: { ...data.content }, amenities: JSON.stringify(data.amenities) };
	});
	let busy = $state('');

	const keep = (key: string) => () => {
		busy = key;
		return async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			busy = '';
		};
	};
</script>

<AdminPage title="Texte und Infos" intro="Was Gäste auf der Website lesen. Du schreibst auf Deutsch, die anderen Sprachen kommen automatisch dazu.">
	{#snippet help()}
		<ul>
			<li>Rechts (auf dem Handy darunter) siehst du sofort, wie der Text auf der Website aussieht.</li>
			<li>Eine leere Zeile macht einen neuen Absatz. Zeilen mit «- » am Anfang werden eine Liste. Links wie https://… werden anklickbar.</li>
			<li>Jedes Feld hat seinen eigenen Knopf «Speichern». Er wird blau, sobald du etwas geändert hast.</li>
			<li>Englisch, Französisch und Italienisch übersetzt die Website automatisch, meist innert einer Minute. Bei jedem Feld siehst du, welche Sprachen schon fertig sind.</li>
			<li>Etwas falsch gespeichert? Im <a href="/admin/verlauf">Verlauf</a> holst du den alten Text mit «Rückgängig» zurück.</li>
		</ul>
	{/snippet}

	{#if !data.canTranslate}
		<p class="mb-6 rounded-[14px] bg-accent-wash px-4 py-3 text-sm">Die automatische Übersetzung ist noch nicht eingerichtet. Bis dahin zeigt die Website Deutsch, wo eine Übersetzung fehlt.</p>
	{/if}

	<nav class="mb-8 flex flex-wrap gap-2" aria-label="Abschnitte">
		{#each GROUPS as [g] (g)}<a href="#{g}" class="pill no-underline">{g}</a>{/each}
		<a href="#ausstattung" class="pill no-underline">Ausstattung</a>
		<a href="#gastgeber" class="pill no-underline">Gastgeber und IBAN</a>
	</nav>

	{#each GROUPS as [group, keys] (group)}
		<section id={group} class="mb-12 scroll-mt-20">
			<h2 class="mb-4 text-2xl">{group}</h2>
			<div class="grid gap-5">
				{#each keys as key (key)}
					{@const f = FIELDS[key]}
					{@const dirty = values[key] !== data.content[key]}
					{@const tr = data.translations[key]}
					<form method="POST" action="?/content" use:enhance={keep(key)} class="card p-4 sm:p-5 {dirty ? '!border-brand' : ''}">
						<div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
							<div>
								<label for="f-{key}" class="text-lg font-bold text-ink">{f.label}</label>
								<p class="hint text-sm">{f.hint}</p>
							</div>
							<ul class="flex gap-1.5" aria-label="Übersetzungen">
								{#each Object.entries(LANGS) as [l, name] (l)}
									{@const ok = !dirty && tr[l as keyof typeof tr] !== null}
									<li class="chip {ok ? 'chip-ok' : 'chip-wait'} gap-1" title="{name}: {ok ? 'übersetzt' : 'kommt gleich'}">
										{#if ok}<Check size={13} strokeWidth={3} aria-hidden="true" />{:else}<LoaderCircle size={13} strokeWidth={3} aria-hidden="true" />{/if}{l.toUpperCase()}
									</li>
								{/each}
							</ul>
						</div>
						<div class="mt-3 grid gap-4 lg:grid-cols-2">
							<textarea id="f-{key}" name={key} rows={f.rows ?? 6} bind:value={values[key]} class="field font-normal leading-relaxed"></textarea>
							<TextPreview text={values[key]} kind={f.kind} />
						</div>
						<div class="mt-3 flex flex-wrap items-center gap-3">
							<button class="btn-blue" disabled={!dirty || busy === key}>{busy === key ? 'Speichert …' : 'Speichern'}</button>
							{#if dirty}
								<button type="button" class="font-semibold text-brand underline" onclick={() => (values[key] = data.content[key])}>Änderung verwerfen</button>
							{/if}
						</div>
					</form>
					{#if data.content[key].trim() && Object.values(tr).some((t) => t)}
						<details class="-mt-3 ml-4 text-sm">
							<summary class="cursor-pointer font-semibold text-brand">Übersetzungen von «{f.label}» ansehen oder korrigieren</summary>
							<div class="mt-3 grid gap-4">
								{#each Object.entries(LANGS) as [l, name] (l)}
									{@const text = tr[l as keyof typeof tr]}
									{#if text}
										<form method="POST" action="?/translation" use:enhance={keep(key + l)} class="grid gap-2">
											<input type="hidden" name="key" value={key} /><input type="hidden" name="lang" value={l} />
											<label class="font-semibold" for="t-{key}-{l}">{name}</label>
											<textarea id="t-{key}-{l}" name="text" rows="4" class="field font-normal" lang={l}>{text}</textarea>
											<button class="btn-line justify-self-start !min-h-0 !px-4 !py-1.5" disabled={busy === key + l}>Korrektur speichern</button>
										</form>
									{/if}
								{/each}
								<p class="text-muted">Ändert sich der deutsche Text, wird neu übersetzt und deine Korrektur gilt nicht mehr.</p>
							</div>
						</details>
					{/if}
				{/each}
			</div>
		</section>
	{/each}

	<section id="ausstattung" class="mb-12 scroll-mt-20">
		<h2 class="text-2xl">Ausstattung</h2>
		<p class="hint mt-1">Die Liste mit Symbolen auf der Startseite. Wähle ein Symbol und schreib, was es gibt.</p>
		<form method="POST" action="?/amenities" use:enhance={keep('amenities')} class="mt-4 grid gap-2">
			{#each amenities as a, i (i)}
				{@const Icon = ICONS[a.icon as keyof typeof ICONS] ?? ICONS.info}
				<div class="card flex items-center gap-2 p-2">
					<span class="grid size-11 shrink-0 place-items-center rounded-full bg-wash text-brand" aria-hidden="true"><Icon size={20} strokeWidth={2.25} /></span>
					<label class="sr-only" for="icon-{i}">Symbol</label>
					<select id="icon-{i}" name="icon" bind:value={a.icon} class="field w-36 shrink-0 text-sm">
						{#each data.icons as icon (icon)}<option value={icon}>{icon}</option>{/each}
					</select>
					<input name="de" bind:value={a.de} placeholder="z. B. Holzkochherd" aria-label="Was es gibt" class="field min-w-0 flex-1" />
					<button type="button" class="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-danger-wash hover:text-danger" onclick={() => amenities.splice(i, 1)} aria-label="«{a.de}» entfernen"><Trash2 size={18} /></button>
				</div>
			{/each}
			<div class="mt-2 flex flex-wrap items-center gap-3">
				<button type="button" class="btn-line" onclick={() => amenities.push({ icon: 'info', de: '' })}><Plus size={18} aria-hidden="true" />Zeile dazu</button>
				<button class="btn-blue" disabled={busy === 'amenities'}>Ausstattung speichern</button>
			</div>
		</form>
	</section>

	<section id="gastgeber" class="scroll-mt-20">
		<h2 class="text-2xl">Gastgeber und Zahlung</h2>
		<p class="hint mt-1">Steht im Impressum, auf den Rechnungen und in den Mails an Gäste.</p>
		<form method="POST" action="?/host" use:enhance={keep('host')} class="card mt-4 grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
			<label class="label sm:col-span-2">Name des Hüttli <input name="name" value={data.name} class="field mt-1 font-normal" /></label>
			<label class="label">Dein Name <input name="hostName" value={data.host.name} class="field mt-1 font-normal" /></label>
			<label class="label">E-Mail für Gäste <input name="email" type="email" value={data.host.email} class="field mt-1 font-normal" /></label>
			<label class="label">Strasse und Nr. <input name="street" value={data.host.street} class="field mt-1 font-normal" /></label>
			<div class="grid grid-cols-[6rem_1fr] gap-3">
				<label class="label">PLZ <input name="zip" value={data.host.zip} inputmode="numeric" class="field mt-1 font-normal" /></label>
				<label class="label">Ort <input name="city" value={data.host.city} class="field mt-1 font-normal" /></label>
			</div>
			<label class="label sm:col-span-2">IBAN für die QR-Rechnung
				<span class="hint block text-sm font-normal">Dein Konto bei einer Schweizer Bank. Ohne IBAN gibt es keine Rechnung für die Gäste.</span>
				<input name="iban" value={data.host.iban} placeholder="CH00 0000 0000 0000 0000 0" class="field mt-1 font-normal" aria-invalid={form?.error ? 'true' : undefined} />
			</label>
			<label class="label">WhatsApp-Nummer <span class="hint block text-sm font-normal">Leer lassen, wenn Gäste dich nicht per WhatsApp erreichen sollen.</span><input name="whatsapp" type="tel" value={data.host.whatsapp} placeholder="079 123 45 67" class="field mt-1 font-normal" /></label>
			<div class="grid grid-cols-2 gap-3">
				<label class="label">Breitengrad <input name="lat" inputmode="decimal" value={data.host.lat} class="field mt-1 font-normal" /></label>
				<label class="label">Längengrad <input name="lon" inputmode="decimal" value={data.host.lon} class="field mt-1 font-normal" /></label>
			</div>
			<p class="hint text-sm sm:col-span-2">Die Karte auf der Website zeigt diesen Punkt. Er muss nicht genau beim Hüttli liegen. Die genaue Lage gehört in die Infos für bestätigte Gäste.</p>
			{#if form?.error}<p class="rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger sm:col-span-2" role="alert">{form.error}</p>{/if}
			<div class="sm:col-span-2"><button class="btn-blue" disabled={busy === 'host'}>Speichern</button></div>
		</form>
	</section>
</AdminPage>
