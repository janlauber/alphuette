<script lang="ts">
	import { enhance } from '$app/forms';
	import Thread from '#lib/components/Thread.svelte';
	import { chf } from '#lib/booking.ts';
	import { dict, fmtDate } from '#lib/i18n.ts';

	let { data, form } = $props();
	const b = $derived(data.b);
	const t = dict.de;
	const STATUS: Record<string, string> = { angefragt: 'Angefragt', bestaetigt: 'Bestätigt', abgelehnt: 'Abgelehnt', storniert: 'Storniert' };
	const ask = (msg: string) => ({ cancel }: { cancel: () => void }) => {
		if (!confirm(msg)) cancel();
	};
	let copied = $state(false);
</script>

<a href="/admin/buchungen" class="text-stein">Buchungen</a>
<div class="mt-1 flex flex-wrap items-baseline justify-between gap-3">
	<h1 class="text-3xl">{b.name}</h1>
	<p class="text-stein">{b.ref}, {STATUS[b.status]}</p>
</div>

{#if form?.error}<p class="mt-4 rounded-[3px] bg-rot/10 px-4 py-3 text-rot" role="alert">{form.error}</p>{/if}

{#if b.status === 'angefragt'}
	<div class="mt-6 flex flex-wrap gap-3 rounded-[3px] border-l-4 border-gelb bg-paper p-4">
		<p class="w-full">Wenn du bestätigst, bekommt {b.name} eine Mail mit Rechnung und Infos.</p>
		<form method="POST" action="?/confirm" use:enhance><button class="btn-gelb">Bestätigen</button></form>
		<form method="POST" action="?/decline" use:enhance={ask(`Anfrage von ${b.name} ablehnen? ${b.name} bekommt eine Mail.`)}>
			<button class="btn-line">Ablehnen</button>
		</form>
	</div>
{/if}

<div class="mt-8 grid gap-8 lg:grid-cols-2">
	<section class="rounded-[3px] bg-paper p-5">
		<h2 class="text-xl">Aufenthalt</h2>
		<dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
			<dt class="text-stein">Anreise</dt><dd>{fmtDate(b.checkIn, 'de')}</dd>
			<dt class="text-stein">Abreise</dt><dd>{fmtDate(b.checkOut, 'de')}</dd>
			<dt class="text-stein">Gäste</dt><dd>{b.adults} Erwachsene, {b.children} Kinder, {b.infants} Kleinkinder</dd>
			<dt class="text-stein">Bettwäsche</dt><dd>{b.linen} Sets</dd>
			<dt class="text-stein">Anreise mit</dt><dd>{b.arrival === 'auto' ? 'Auto' : b.arrival === 'oev' ? 'Bus und Bahn' : 'unbekannt'}</dd>
		</dl>
		<table class="mt-4 w-full border-t border-linie">
			<tbody>
				{#each b.quote?.lines ?? [] as line (line.key)}
					<tr><td class="pt-1.5">{t.lines[line.key as keyof typeof t.lines](line.qty)}</td><td class="pt-1.5 text-right tabular-nums">{chf(line.amount)}</td></tr>
				{/each}
			</tbody>
			<tfoot><tr class="font-semibold"><td class="pt-2">Total</td><td class="pt-2 text-right tabular-nums">{chf(b.totalRp ?? 0)}</td></tr></tfoot>
		</table>
		{#if b.status === 'bestaetigt'}
			<form method="POST" action="?/paid" use:enhance class="mt-4 flex items-center justify-between gap-3 border-t border-linie pt-4">
				{#if b.paidAt}
					<span class="text-moos">Bezahlt am {fmtDate(new Date(b.paidAt).toISOString().slice(0, 10), 'de')}</span>
					<button name="paid" value="0" class="text-sm underline">Doch nicht bezahlt</button>
				{:else}
					<span class="text-rot">Noch nicht bezahlt</span>
					<button name="paid" value="1" class="btn-line !py-1">Als bezahlt markieren</button>
				{/if}
			</form>
		{/if}
	</section>

	<section class="rounded-[3px] bg-paper p-5">
		<h2 class="text-xl">Gast</h2>
		<dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
			<dt class="text-stein">E-Mail</dt><dd class="break-all"><a href="mailto:{b.email}">{b.email}</a></dd>
			{#if b.phone}<dt class="text-stein">Telefon</dt><dd><a href="tel:{b.phone}">{b.phone}</a></dd>{/if}
			<dt class="text-stein">Wohnort</dt><dd>{b.city}</dd>
			<dt class="text-stein">Sprache</dt><dd>{b.lang === 'en' ? 'Englisch' : 'Deutsch'}</dd>
			<dt class="text-stein">Aufenthalte</dt><dd>{data.stays} bestätigt</dd>
		</dl>
		<button
			type="button"
			class="mt-4 text-sm underline"
			onclick={async () => {
				await navigator.clipboard.writeText(data.guestLink);
				copied = true;
			}}>{copied ? 'Link kopiert' : 'Link zur Gästeseite kopieren'}</button
		>
		<form method="POST" action="?/note" use:enhance={() => async ({ update }) => update({ reset: false })} class="mt-4 border-t border-linie pt-4">
			<label class="label" for="note">Notiz <span class="hint">(sieht nur du)</span></label>
			<textarea id="note" name="note" rows="3" class="field">{b.hostNote ?? ''}</textarea>
			<button class="btn-line mt-2 !py-1 text-sm">Notiz speichern</button>
			{#if form?.noteSaved}<span class="ml-2 text-sm text-moos">Gespeichert</span>{/if}
		</form>
	</section>
</div>

<section id="nachrichten" class="mt-10">
	<h2 class="text-xl">Nachrichten</h2>
	<p class="text-sm text-stein">{b.name} bekommt deine Nachricht per Mail.</p>
	<div class="mt-4">
		<Thread messages={data.messages} me="host" names={{ gast: b.name, host: 'Du' }} placeholder="Nachricht an {b.name}" send="Senden" empty="Noch keine Nachrichten." />
	</div>
</section>

{#if b.status === 'bestaetigt' || b.status === 'angefragt'}
	<form method="POST" action="?/cancel" use:enhance={ask('Buchung stornieren? Die Daten werden wieder frei.')} class="mt-12 border-t border-linie pt-6">
		<label class="flex items-center gap-2 text-sm"><input type="checkbox" name="notify" checked class="accent-tanne" /> {b.name} per Mail informieren</label>
		<button class="mt-2 text-rot underline">Buchung stornieren</button>
	</form>
{/if}
