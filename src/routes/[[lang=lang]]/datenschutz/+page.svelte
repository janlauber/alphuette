<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';

	let { data } = $props();
	const en = $derived(data.lang === 'en');
	const contact = $derived(`${data.host.name}, ${data.host.street ? data.host.street + ', ' : ''}${data.host.zip} ${data.host.city}, ${data.host.email}`);
</script>

<Seo title={en ? 'Privacy policy' : 'Datenschutz'} description={data.hutName} path="/datenschutz" lang={data.lang} siteUrl={data.siteUrl} />

<div class="richtext mx-auto max-w-[62ch] px-4 pt-8 sm:px-6 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2+p]:mt-3">
	{#if en}
		<h1 class="text-4xl">Privacy policy</h1>
		<p class="mt-6">This website only collects the data needed to handle your stay. There is no tracking, no analytics and no advertising.</p>
		<h2>Who is responsible</h2>
		<p>{contact}</p>
		<h2>What we collect</h2>
		<p>When you send a request: name, email, phone (optional), postcode and town, number of guests, dates, how you arrive and your messages. We use this to answer your request, confirm the booking, send the bill and register you for the tourist tax with the destination (Tourismus Adelboden-Lenk-Kandersteg) and the municipality of Reichenbach.</p>
		<p>Booking records are kept as long as Swiss accounting law requires (10 years). Messages and contact details you can have deleted earlier unless they belong to an invoice.</p>
		<h2>Who processes data for us</h2>
		<p>The website and database run on klickops. Emails are sent with Resend (Resend, Inc., USA). Resend stores emails in the USA; the transfer is based on the EU standard contractual clauses with the Swiss amendments.</p>
		<p>The map on the home page is loaded from swisstopo (Federal Office of Topography, Switzerland), which sees your IP address. If you use the WhatsApp link, WhatsApp (Meta) processes your message under its own terms.</p>
		<h2>Cookies</h2>
		<p>The public website sets no cookies. The host's admin area uses one technically necessary login cookie.</p>
		<h2>Your rights</h2>
		<p>You can ask what data we hold about you, have it corrected or deleted, by writing to {data.host.email}. You can also complain to the Federal Data Protection and Information Commissioner (FDPIC).</p>
	{:else}
		<h1 class="text-4xl">Datenschutz</h1>
		<p class="mt-6">Diese Website sammelt nur die Daten, die es für deinen Aufenthalt braucht. Es gibt kein Tracking, keine Statistik-Tools und keine Werbung.</p>
		<h2>Verantwortlich</h2>
		<p>{contact}</p>
		<h2>Welche Daten</h2>
		<p>Wenn du eine Anfrage sendest: Name, E-Mail, Telefon (freiwillig), PLZ und Wohnort, Anzahl Gäste, Daten, Anreiseart und deine Nachrichten. Damit beantworten wir die Anfrage, bestätigen die Buchung, stellen die Rechnung und melden dich für die Kurtaxe bei der Destination (Tourismus Adelboden-Lenk-Kandersteg) und der Gemeinde Reichenbach an.</p>
		<p>Buchungen bewahren wir so lange auf, wie es das Buchführungsrecht verlangt (10 Jahre). Nachrichten und Kontaktdaten löschen wir auf Wunsch früher, sofern sie nicht zu einer Rechnung gehören.</p>
		<h2>Wer Daten für uns bearbeitet</h2>
		<p>Website und Datenbank laufen bei klickops. Mails verschicken wir mit Resend (Resend, Inc., USA). Resend speichert Mails in den USA. Grundlage für die Übermittlung sind die Standardvertragsklauseln der EU mit den Anpassungen für die Schweiz.</p>
		<p>Die Karte auf der Startseite lädt von swisstopo (Bundesamt für Landestopografie). swisstopo sieht dabei deine IP-Adresse. Wenn du den WhatsApp-Link benutzt, bearbeitet WhatsApp (Meta) deine Nachricht nach eigenen Regeln.</p>
		<h2>Cookies</h2>
		<p>Die öffentliche Website setzt keine Cookies. Im Admin-Bereich des Gastgebers gibt es ein technisch nötiges Login-Cookie.</p>
		<h2>Deine Rechte</h2>
		<p>Du kannst Auskunft über deine Daten verlangen und sie berichtigen oder löschen lassen. Schreib dafür an {data.host.email}. Beschweren kannst du dich beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB).</p>
	{/if}
</div>
