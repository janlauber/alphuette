<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Thread from '#lib/components/Thread.svelte';
	import { chf, toIso } from '#lib/booking.ts';
	import { dict, fmtDate } from '#lib/i18n.ts';

	let { data, form } = $props();
	const b = $derived(data.b);
	const t = dict.de;
	const today = toIso(Date.now());
	const STATUS: Record<string, [string, string]> = {
		unbestaetigt: ['E-Mail noch nicht bestätigt', 'chip-todo'],
		angefragt: ['Wartet auf dich', 'chip-wait'],
		bestaetigt: ['Bestätigt', 'chip-ok'],
		abgelehnt: ['Abgelehnt', 'chip-off'],
		storniert: ['Storniert', 'chip-off']
	};
	const LANGUAGE: Record<string, string> = { de: 'Deutsch', en: 'Englisch', fr: 'Französisch', it: 'Italienisch' };
	const status = $derived(STATUS[b.status] ?? [b.status, 'chip-off']);
	const past = $derived(b.checkOut < today);
	const people = $derived(b.adults + b.children + b.infants);
	const long = (iso: string) => fmtDate(iso, 'de');
	// Deskline wants Swiss dates: 20.06.2027
	const swiss = (iso: string) => iso.split('-').reverse().join('.');
	const paidOn = $derived(b.paidAt ? long(new Date(b.paidAt).toISOString().slice(0, 10)) : '');

	const ask = (msg: string) => ({ cancel }: { cancel: () => void }) => {
		if (!confirm(msg)) cancel();
	};

	// copy buttons: which one was just used
	let copied = $state('');
	let timer: ReturnType<typeof setTimeout>;
	async function copy(key: string, text: string) {
		await navigator.clipboard.writeText(text);
		copied = key;
		clearTimeout(timer);
		timer = setTimeout(() => (copied = ''), 2000);
	}
	const deskline = $derived([
		['Name', b.name],
		['E-Mail', b.email],
		['Anreise', swiss(b.checkIn)],
		['Abreise', swiss(b.checkOut)],
		['Erwachsene (ab 16)', String(b.adults)],
		['Kinder (6 bis 15)', String(b.children)],
		['Kleinkinder (unter 6)', String(b.infants)],
		['Land', b.country ?? '']
	]);
</script>

{#snippet copyButton(key: string, text: string, label: string)}
	<button
		type="button"
		class="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-2 border-line px-3 text-sm font-semibold text-brand hover:border-brand disabled:opacity-40"
		disabled={!text}
		onclick={() => copy(key, text)}
		aria-label="{label} kopieren"
	>
		{#if copied === key}<Check size={16} aria-hidden="true" />Kopiert{:else}<Copy size={16} aria-hidden="true" />Kopieren{/if}
	</button>
{/snippet}

<a href="/admin/buchungen" class="inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand no-underline hover:underline"><ArrowLeft size={18} aria-hidden="true" />Alle Buchungen</a>

<header class="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
	<div>
		<h1 class="text-3xl sm:text-4xl">{b.name}</h1>
		<p class="mt-2 text-lg text-muted">{long(b.checkIn)} bis {long(b.checkOut)}</p>
	</div>
	<div class="flex flex-wrap items-center gap-2">
		<span class="chip {status[1]} !text-sm">{status[0]}</span>
		<span class="text-sm text-muted">Nummer {b.ref}</span>
	</div>
</header>

{#if form?.error}<p class="mt-5 rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger" role="alert">{form.error}</p>{/if}

<!-- What Tom has to do now -->
<section class="card-strong mt-6 p-5 sm:p-6" aria-labelledby="todo">
	{#if b.status === 'angefragt'}
		<h2 id="todo" class="text-2xl">Neue Anfrage: bestätigen oder ablehnen?</h2>
		<p class="mt-2">{b.name} möchte {people === 1 ? 'allein' : `mit ${people} Personen`} kommen. Die Daten sind reserviert, bis du entscheidest.</p>
		{#if data.ibanMissing}
			<p class="mt-3 flex gap-2 rounded-[14px] bg-accent-wash px-3 py-2 text-accent-dark">
				<TriangleAlert size={20} class="mt-0.5 shrink-0" aria-hidden="true" />
				<span>Deine IBAN fehlt noch. Ohne sie gibt es keine QR-Rechnung. Trag sie unter <a href="/admin/inhalte" class="font-semibold text-accent-dark">Texte und Infos</a> ein.</span>
			</p>
		{/if}
		<div class="mt-5 flex flex-wrap gap-3">
			<form method="POST" action="?/confirm" use:enhance={ask(`Anfrage von ${b.name} bestätigen? ${b.name} bekommt sofort eine Mail.`)}>
				<button class="btn-primary">Bestätigen</button>
			</form>
			<form method="POST" action="?/decline" use:enhance={ask(`Anfrage von ${b.name} ablehnen? ${b.name} bekommt eine Mail und die Daten sind wieder frei.`)}>
				<button class="btn-line">Ablehnen</button>
			</form>
		</div>
		<p class="hint mt-4 text-sm">Bestätigen: {b.name} bekommt eine Mail mit der Bestätigung, der QR-Rechnung und den Infos zur Anreise. Ablehnen: {b.name} bekommt eine kurze Absage.</p>
	{:else if b.status === 'unbestaetigt'}
		<h2 id="todo" class="text-2xl">Noch nichts zu tun</h2>
		<p class="mt-2">{b.name} hat die E-Mail-Adresse noch nicht bestätigt. Erst dann ist die Anfrage bei dir. Ohne Bestätigung verfällt sie nach 30 Minuten.</p>
	{:else if b.status === 'bestaetigt' && !b.paidAt}
		<h2 id="todo" class="text-2xl">{past ? 'Aufenthalt vorbei, aber noch nicht bezahlt' : 'Bestätigt. Noch nicht bezahlt.'}</h2>
		<p class="mt-2">Sobald das Geld ({chf(b.totalRp ?? 0)}) auf deinem Konto ist, markierst du die Buchung als bezahlt.</p>
		<form method="POST" action="?/paid" use:enhance class="mt-5">
			<button name="paid" value="1" class="btn-primary">Als bezahlt markieren</button>
		</form>
	{:else if b.status === 'bestaetigt'}
		<h2 id="todo" class="text-2xl">{past ? 'Alles erledigt' : 'Alles bereit'}</h2>
		<p class="mt-2">
			Bezahlt am {paidOn}.
			{past ? 'Der Aufenthalt ist vorbei.' : `${b.name} kommt am ${long(b.checkIn)}.`}
		</p>
		<form method="POST" action="?/paid" use:enhance={ask('Wirklich wieder als nicht bezahlt markieren?')} class="mt-3">
			<button name="paid" value="0" class="min-h-11 text-sm font-semibold text-brand underline">Doch noch nicht bezahlt</button>
		</form>
	{:else}
		<h2 id="todo" class="text-2xl">{b.status === 'abgelehnt' ? 'Abgelehnt' : 'Storniert'}</h2>
		<p class="mt-2">Hier ist nichts mehr zu tun. Die Daten sind wieder frei.</p>
	{/if}
</section>

<div class="mt-8 grid gap-6 lg:grid-cols-2">
	<section class="card p-5">
		<h2 class="text-xl">Aufenthalt</h2>
		<dl class="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1.5">
			<dt class="text-muted">Anreise</dt><dd>{long(b.checkIn)}</dd>
			<dt class="text-muted">Abreise</dt><dd>{long(b.checkOut)}</dd>
			<dt class="text-muted">Gäste</dt>
			<dd>{b.adults} Erwachsene{b.children ? `, ${b.children} Kinder` : ''}{b.infants ? `, ${b.infants} Kleinkinder` : ''}</dd>
			<dt class="text-muted">Bettwäsche</dt><dd>{b.linen ? `${b.linen} ${b.linen === 1 ? 'Set' : 'Sets'}` : 'keine'}</dd>
			<dt class="text-muted">Kommt mit</dt><dd>{b.arrival === 'auto' ? 'Auto' : b.arrival === 'oev' ? 'Bus und Bahn' : 'nicht angegeben'}</dd>
		</dl>
		<table class="mt-4 w-full border-t-2 border-line">
			<tbody>
				{#each b.quote?.lines ?? [] as line (line.key)}
					<tr><td class="pt-2">{t.lines[line.key as keyof typeof t.lines](line.qty)}</td><td class="pt-2 text-right tabular-nums">{chf(line.amount)}</td></tr>
				{/each}
			</tbody>
			<tfoot>
				<tr class="text-lg font-bold"><td class="pt-3">Total</td><td class="pt-3 text-right tabular-nums">{chf(b.totalRp ?? 0)}</td></tr>
			</tfoot>
		</table>
		{#if b.status === 'bestaetigt'}
			<p class="mt-3"><span class="chip {b.paidAt ? 'chip-ok' : 'chip-todo'}">{b.paidAt ? `Bezahlt am ${paidOn}` : 'Noch nicht bezahlt'}</span></p>
		{/if}
	</section>

	<section class="card p-5">
		<h2 class="text-xl">Gast</h2>
		<dl class="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1.5">
			<dt class="text-muted">E-Mail</dt><dd class="break-all"><a href="mailto:{b.email}">{b.email}</a></dd>
			{#if b.phone}<dt class="text-muted">Telefon</dt><dd><a href="tel:{b.phone}">{b.phone}</a></dd>{/if}
			<dt class="text-muted">Wohnort</dt><dd>{b.city || 'nicht angegeben'}</dd>
			<dt class="text-muted">Land</dt><dd>{b.country || 'nicht angegeben'}</dd>
			<dt class="text-muted">Sprache</dt><dd>{LANGUAGE[b.lang] ?? b.lang}</dd>
			<dt class="text-muted">Bei dir</dt><dd>{data.stays === 0 ? 'Zum ersten Mal' : data.stays === 1 ? '1 bestätigte Buchung' : `${data.stays} bestätigte Buchungen`}</dd>
		</dl>
		<div class="mt-4 flex flex-wrap items-center gap-3 border-t-2 border-line pt-4">
			{@render copyButton('link', data.guestLink, 'Link zur Gästeseite')}
			<span class="text-sm text-muted">Link zur Seite, die {b.name} sieht</span>
		</div>
	</section>
</div>

{#if b.status === 'bestaetigt'}
	<section class="card mt-6 p-5" aria-labelledby="deskline">
		<h2 id="deskline" class="text-xl">Für Deskline und Gästekarte</h2>
		<p class="hint mt-1">
			Trag diese Angaben im Deskline WebClient ein. {b.name} bekommt dann von Deskline den Link für den Pre-Check-in und die Gästekarte. Gäste aus dem Ausland zeigen bei der Ankunft ihren Ausweis.
		</p>
		<dl class="mt-4 grid gap-2">
			{#each deskline as [label, value] (label)}
				<div class="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[14px] bg-wash/60 px-3 py-1.5">
					<dt class="w-44 shrink-0 text-sm text-muted">{label}</dt>
					<dd class="min-w-0 flex-1 break-all font-semibold {value ? '' : 'font-normal text-muted'}">{value || 'nicht angegeben'}</dd>
					{@render copyButton(label, value, label)}
				</div>
			{/each}
		</dl>
	</section>
{/if}

<section class="card mt-6 p-5">
	<form method="POST" action="?/note" use:enhance={() => async ({ update }) => update({ reset: false })}>
		<label class="label text-xl" for="note">Deine Notiz</label>
		<p class="hint mb-2 text-sm">Nur für dich. Der Gast sieht sie nie.</p>
		<textarea id="note" name="note" rows="3" class="field">{b.hostNote ?? ''}</textarea>
		<button class="btn-line mt-3">Notiz speichern</button>
	</form>
</section>

<section id="nachrichten" class="mt-10 scroll-mt-24">
	<h2 class="text-2xl">Nachrichten</h2>
	<p class="hint mt-1">
		{#if b.lang === 'de'}
			{b.name} bekommt deine Nachricht per Mail.
		{:else}
			Schreib auf Deutsch. {b.name} bekommt deine Nachricht per Mail auf {LANGUAGE[b.lang] ?? b.lang}, das Original steht darunter.
		{/if}
	</p>
	<div class="mt-4">
		<Thread
			messages={data.messages}
			me="host"
			names={{ gast: b.name, host: 'Du' }}
			placeholder="Nachricht an {b.name}"
			send="Nachricht senden"
			empty="Noch keine Nachrichten."
			labels={{
				translated: 'Automatisch übersetzt',
				original: 'Original anzeigen',
				hideOriginal: 'Original ausblenden',
				mine: 'So bekommt es der Gast',
				hideMine: 'Übersetzung ausblenden'
			}}
		/>
	</div>
</section>

{#if b.status === 'bestaetigt' || b.status === 'angefragt'}
	<section class="mt-14 rounded-[24px] border-2 border-danger/40 p-5">
		<h2 class="text-xl !text-danger">Buchung stornieren</h2>
		<p class="mt-1 text-muted">Nur wenn der Aufenthalt nicht stattfindet. Die Daten werden auf der Website wieder frei. Das lässt sich nicht rückgängig machen.</p>
		<form method="POST" action="?/cancel" use:enhance={ask(`Buchung von ${b.name} wirklich stornieren? Die Daten werden wieder frei.`)} class="mt-4 flex flex-wrap items-center gap-4">
			<label class="flex min-h-11 items-center gap-2.5"><input type="checkbox" name="notify" checked class="check" />{b.name} per Mail informieren</label>
			<button class="min-h-11 rounded-full border-2 border-danger px-5 font-semibold text-danger hover:bg-danger-wash">Stornieren</button>
		</form>
	</section>
{/if}
