<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';

	let { data } = $props();
	const en = $derived(data.lang === 'en');
	const contact = $derived(`${data.host.name}, ${data.host.street ? data.host.street + ', ' : ''}${data.host.zip} ${data.host.city}, ${data.host.email}`);
</script>

<Seo title={en ? 'Privacy policy' : 'Datenschutz'} description={data.hutName} path="/datenschutz" lang={data.lang} siteUrl={data.siteUrl} />

<div class="richtext mx-auto max-w-[62ch] px-4 pt-8 sm:px-6 [&_h2]:mt-10 [&_h2]:text-[1.6rem] [&_h2+p]:mt-3">
	{#if en}
		<h1 class="text-[2.6rem]">Privacy policy</h1>
		<p class="mt-6">This website collects the data needed to handle your stay and counts visits anonymously. There is no advertising, no third-party tracking and no cookie on the public pages.</p>
		<h2>Who is responsible</h2>
		<p>{contact}</p>
		<h2>What we collect</h2>
		<p>When you send a request: name, email, phone (optional), postcode and town, number of guests, dates, how you arrive and your messages. We use this to answer your request, confirm the booking, send the bill and register you for the tourist tax with the destination (Tourismus Adelboden-Lenk-Kandersteg) and the municipality of Reichenbach.</p>
		<p>Booking records are kept as long as Swiss accounting law requires (10 years). Messages and contact details you can have deleted earlier unless they belong to an invoice.</p>
		<h2>Who processes data for us</h2>
		<p>The website and database run on klickops. Emails are sent with Resend (Resend, Inc., USA). Resend stores emails in the USA; the transfer is based on the EU standard contractual clauses with the Swiss amendments.</p>
		<p>The map on the home page is loaded from swisstopo (Federal Office of Topography, Switzerland), which sees your IP address. If you use the WhatsApp link, WhatsApp (Meta) processes your message under its own terms.</p>
		<h2>Visitor statistics</h2>
		<p>We count visits ourselves, without cookies and without third-party services. We store the page, time, referring website, device type, browser, loading times and the approximate place (town) derived from the IP address with the DB-IP database on our own server. We do not store the IP address. Together with the browser it becomes a hash with a random value that changes every day, so visits cannot be linked across days. Raw data is deleted after 13 months.</p>
		<h2>Spam protection, weather and buses</h2>
		<p>The request form lets your browser solve a small calculation; no data goes to third parties for this. Weather forecasts (MeteoSwiss) and bus times (transport.opendata.ch) are fetched by our server, your browser does not contact these services.</p>
		<h2>Guest book</h2>
		<p>If you write an entry after your stay, it is published with the name you choose once the host has approved it. You can have it removed at any time.</p>
		<h2>Cookies</h2>
		<p>The public website sets no cookies. The host's admin area uses one technically necessary login cookie.</p>
		<h2>Your rights</h2>
		<p>You can ask what data we hold about you, have it corrected or deleted, by writing to {data.host.email}. You can also complain to the Federal Data Protection and Information Commissioner (FDPIC).</p>
	{:else}
		<h1 class="text-[2.6rem]">Datenschutz</h1>
		<p class="mt-6">Diese Website sammelt die Daten, die es für deinen Aufenthalt braucht, und zählt Besuche anonym. Es gibt keine Werbung, kein Tracking von Drittanbietern und auf den öffentlichen Seiten kein Cookie.</p>
		<h2>Verantwortlich</h2>
		<p>{contact}</p>
		<h2>Welche Daten</h2>
		<p>Wenn du eine Anfrage sendest: Name, E-Mail, Telefon (freiwillig), PLZ und Wohnort, Anzahl Gäste, Daten, Anreiseart und deine Nachrichten. Damit beantworten wir die Anfrage, bestätigen die Buchung, stellen die Rechnung und melden dich für die Kurtaxe bei der Destination (Tourismus Adelboden-Lenk-Kandersteg) und der Gemeinde Reichenbach an.</p>
		<p>Buchungen bewahren wir so lange auf, wie es das Buchführungsrecht verlangt (10 Jahre). Nachrichten und Kontaktdaten löschen wir auf Wunsch früher, sofern sie nicht zu einer Rechnung gehören.</p>
		<h2>Wer Daten für uns bearbeitet</h2>
		<p>Website und Datenbank laufen bei klickops. Mails verschicken wir mit Resend (Resend, Inc., USA). Resend speichert Mails in den USA. Grundlage für die Übermittlung sind die Standardvertragsklauseln der EU mit den Anpassungen für die Schweiz.</p>
		<p>Die Karte auf der Startseite lädt von swisstopo (Bundesamt für Landestopografie). swisstopo sieht dabei deine IP-Adresse. Wenn du den WhatsApp-Link benutzt, bearbeitet WhatsApp (Meta) deine Nachricht nach eigenen Regeln.</p>
		<h2>Besuchsstatistik</h2>
		<p>Wir zählen Besuche selbst, ohne Cookies und ohne Drittanbieter. Gespeichert werden die aufgerufene Seite, der Zeitpunkt, die Herkunftsseite, Gerätetyp, Browser, Ladezeiten und der ungefähre Ort (Gemeinde), den wir mit der Datenbank von DB-IP auf unserem eigenen Server aus der IP-Adresse ableiten. Die IP-Adresse selbst speichern wir nicht. Zusammen mit dem Browser wird sie zu einem Hash mit einem täglich wechselnden Zufallswert, sodass sich Besuche nicht über mehrere Tage verbinden lassen. Rohdaten löschen wir nach 13 Monaten.</p>
		<h2>Spamschutz, Wetter und Postauto</h2>
		<p>Das Anfrageformular lässt deinen Browser eine kleine Rechenaufgabe lösen. Dafür gehen keine Daten an Dritte. Wetterprognosen (MeteoSchweiz) und Fahrplandaten (transport.opendata.ch) holt unser Server, dein Browser hat dabei keinen Kontakt zu diesen Diensten.</p>
		<h2>Gästebuch</h2>
		<p>Schreibst du nach deinem Aufenthalt einen Eintrag, erscheint er nach der Freigabe durch den Gastgeber öffentlich, mit dem Namen, den du angibst. Du kannst ihn jederzeit löschen lassen.</p>
		<h2>Cookies</h2>
		<p>Die öffentliche Website setzt keine Cookies. Im Admin-Bereich des Gastgebers gibt es ein technisch nötiges Login-Cookie.</p>
		<h2>Deine Rechte</h2>
		<p>Du kannst Auskunft über deine Daten verlangen und sie berichtigen oder löschen lassen. Schreib dafür an {data.host.email}. Beschweren kannst du dich beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB).</p>
	{/if}
</div>
