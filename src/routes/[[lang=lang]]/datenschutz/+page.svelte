<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';
	import type { Lang } from '#lib/i18n.ts';

	let { data } = $props();
	const contact = $derived(`${data.host.name}, ${data.host.street ? data.host.street + ', ' : ''}${data.host.zip} ${data.host.city}, ${data.host.email}`);

	// [heading, ...paragraphs]
	type Page = { title: string; intro: string; sections: string[][] };
	const _ = ' '; // French: no-break space before the colon
	const TEXT: Record<Lang, (contact: string, email: string) => Page> = {
		de: (contact, email) => ({
			title: 'Datenschutz',
			intro: 'Diese Website sammelt die Daten, die es für deinen Aufenthalt braucht, und zählt Besuche anonym. Es gibt keine Werbung, kein Tracking von Drittanbietern und keine Cookies.',
			sections: [
				['Verantwortlich', contact],
				[
					'Welche Daten',
					'Wenn du eine Anfrage sendest: Name, E-Mail, Telefon (freiwillig), PLZ und Wohnort, Anzahl Gäste, Daten, Anreiseart und deine Nachrichten. Damit beantworten wir die Anfrage, bestätigen die Buchung, stellen die Rechnung und melden dich für die Kurtaxe bei der Destination (Tourismus Adelboden-Lenk-Kandersteg) und der Gemeinde Reichenbach an.',
					'Buchungen bewahren wir so lange auf, wie es das Buchführungsrecht verlangt (10 Jahre). Nachrichten und Kontaktdaten löschen wir auf Wunsch früher, sofern sie nicht zu einer Rechnung gehören.'
				],
				[
					'Wer Daten für uns bearbeitet',
					'Website und Datenbank laufen bei klickops. Mails verschicken wir mit Resend (Resend, Inc., USA). Resend speichert Mails in den USA. Grundlage für die Übermittlung sind die Standardvertragsklauseln der EU mit den Anpassungen für die Schweiz.',
					'Die Karte auf der Startseite und die Karten bei den Wanderungen laden von swisstopo (Bundesamt für Landestopografie). swisstopo sieht dabei deine IP-Adresse. Wenn du den WhatsApp-Link benutzt, bearbeitet WhatsApp (Meta) deine Nachricht nach eigenen Regeln.',
					'Für die Gästekarte und die Kurtaxe gehen deine Angaben an Tourismus Adelboden-Lenk-Kandersteg. Die Destination erfasst sie im System Deskline von feratel.',
					'Nachrichten zwischen dir und dem Gastgeber und die Texte dieser Website übersetzen wir automatisch mit Claude von Anthropic (USA). Anthropic verwendet diese Texte nicht, um Modelle zu trainieren.'
				],
				[
					'Besuchsstatistik',
					'Wir zählen Besuche selbst, ohne Cookies und ohne Drittanbieter. Gespeichert werden die aufgerufene Seite, der Zeitpunkt, die Herkunftsseite, Gerätetyp, Browser, Ladezeiten und der ungefähre Ort (Gemeinde), den wir mit der Datenbank von DB-IP auf unserem eigenen Server aus der IP-Adresse ableiten. Die IP-Adresse selbst speichern wir nicht. Zusammen mit dem Browser wird sie zu einem Hash mit einem täglich wechselnden Zufallswert, sodass sich Besuche nicht über mehrere Tage verbinden lassen. Rohdaten löschen wir nach 13 Monaten.'
				],
				[
					'Spamschutz, Wetter und Postauto',
					'Das Anfrageformular lässt deinen Browser eine kleine Rechenaufgabe lösen. Dafür gehen keine Daten an Dritte. Wetterprognosen (MeteoSchweiz) und Fahrplandaten (transport.opendata.ch) holt unser Server, dein Browser hat dabei keinen Kontakt zu diesen Diensten.'
				],
				[
					'Gästebuch',
					'Schreibst du nach deinem Aufenthalt einen Eintrag, erscheint er nach der Freigabe durch den Gastgeber öffentlich, mit dem Namen, den du angibst. Du kannst ihn jederzeit löschen lassen.'
				],
				['Cookies', 'Für Besucherinnen und Besucher setzt die Website keine Cookies.'],
				[
					'Deine Rechte',
					`Du kannst Auskunft über deine Daten verlangen und sie berichtigen oder löschen lassen. Schreib dafür an ${email}. Beschweren kannst du dich beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB).`
				]
			]
		}),
		en: (contact, email) => ({
			title: 'Privacy policy',
			intro: 'This website collects the data needed to handle your stay and counts visits anonymously. There is no advertising, no third-party tracking and no cookies.',
			sections: [
				['Who is responsible', contact],
				[
					'What we collect',
					'When you send a request: name, email, phone (optional), postcode and town, number of guests, dates, how you arrive and your messages. We use this to answer your request, confirm the booking, send the bill and register you for the tourist tax with the destination (Tourismus Adelboden-Lenk-Kandersteg) and the municipality of Reichenbach.',
					'Booking records are kept as long as Swiss accounting law requires (10 years). Messages and contact details you can have deleted earlier unless they belong to an invoice.'
				],
				[
					'Who processes data for us',
					'The website and database run on klickops. Emails are sent with Resend (Resend, Inc., USA). Resend stores emails in the USA; the transfer is based on the EU standard contractual clauses with the Swiss amendments.',
					'The map on the home page and the maps on the hiking pages are loaded from swisstopo (Federal Office of Topography, Switzerland), which sees your IP address. If you use the WhatsApp link, WhatsApp (Meta) processes your message under its own terms.',
					'For the guest card and the tourist tax, your details go to Tourismus Adelboden-Lenk-Kandersteg, which records them in feratel’s Deskline system.',
					'Messages between you and the host, and the texts of this website, are translated automatically with Claude by Anthropic (USA). Anthropic does not use these texts to train its models.'
				],
				[
					'Visitor statistics',
					'We count visits ourselves, without cookies and without third-party services. We store the page, time, referring website, device type, browser, loading times and the approximate place (town) derived from the IP address with the DB-IP database on our own server. We do not store the IP address. Together with the browser it becomes a hash with a random value that changes every day, so visits cannot be linked across days. Raw data is deleted after 13 months.'
				],
				[
					'Spam protection, weather and buses',
					'The request form lets your browser solve a small calculation; no data goes to third parties for this. Weather forecasts (MeteoSwiss) and bus times (transport.opendata.ch) are fetched by our server, your browser does not contact these services.'
				],
				[
					'Guest book',
					'If you write an entry after your stay, it is published with the name you choose once the host has approved it. You can have it removed at any time.'
				],
				['Cookies', 'The website sets no cookies for visitors.'],
				[
					'Your rights',
					`You can ask what data we hold about you, have it corrected or deleted, by writing to ${email}. You can also complain to the Federal Data Protection and Information Commissioner (FDPIC).`
				]
			]
		}),
		fr: (contact, email) => ({
			title: 'Protection des données',
			intro: 'Ce site collecte les données nécessaires à ton séjour et compte les visites de façon anonyme. Il n’y a ni publicité, ni suivi par des tiers, ni cookies.',
			sections: [
				['Responsable', contact],
				[
					'Quelles données',
					`Quand tu envoies une demande${_}: nom, e-mail, téléphone (facultatif), NPA et localité, nombre de personnes, dates, moyen de transport et tes messages. Nous les utilisons pour répondre à ta demande, confirmer la réservation, établir la facture et t’annoncer pour la taxe de séjour auprès de la destination (Tourismus Adelboden-Lenk-Kandersteg) et de la commune de Reichenbach.`,
					'Nous conservons les réservations aussi longtemps que le droit comptable l’exige (10 ans). Sur demande, nous effaçons plus tôt les messages et les coordonnées, s’ils ne font pas partie d’une facture.'
				],
				[
					'Qui traite des données pour nous',
					'Le site et la base de données sont hébergés chez klickops. Nous envoyons les e-mails avec Resend (Resend, Inc., USA). Resend stocke les e-mails aux USA. Le transfert repose sur les clauses contractuelles types de l’UE, avec les adaptations pour la Suisse.',
					'La carte de la page d’accueil et les cartes des randonnées sont chargées depuis swisstopo (Office fédéral de topographie), qui voit ton adresse IP. Si tu utilises le lien WhatsApp, WhatsApp (Meta) traite ton message selon ses propres règles.',
					'Pour la carte d’hôte et la taxe de séjour, tes données vont à Tourismus Adelboden-Lenk-Kandersteg, qui les saisit dans le système Deskline de feratel.',
					'Les messages entre toi et l’hôte ainsi que les textes de ce site sont traduits automatiquement avec Claude d’Anthropic (USA). Anthropic n’utilise pas ces textes pour entraîner ses modèles.'
				],
				[
					'Statistiques de visites',
					'Nous comptons les visites nous-mêmes, sans cookies ni services tiers. Nous enregistrons la page consultée, l’heure, le site de provenance, le type d’appareil, le navigateur, les temps de chargement et le lieu approximatif (commune), que nous déduisons de l’adresse IP avec la base de données DB-IP sur notre propre serveur. Nous n’enregistrons pas l’adresse IP elle-même. Avec le navigateur, elle devient un hachage avec une valeur aléatoire qui change chaque jour, si bien que les visites ne peuvent pas être reliées d’un jour à l’autre. Nous effaçons les données brutes après 13 mois.'
				],
				[
					'Anti-spam, météo et car postal',
					'Le formulaire de demande fait résoudre un petit calcul à ton navigateur. Aucune donnée ne part chez des tiers pour cela. Notre serveur récupère les prévisions météo (MétéoSuisse) et les horaires (transport.opendata.ch). Ton navigateur n’a aucun contact avec ces services.'
				],
				[
					'Livre d’or',
					'Si tu écris un message après ton séjour, il paraît publiquement après validation par l’hôte, avec le nom que tu indiques. Tu peux le faire supprimer à tout moment.'
				],
				['Cookies', 'Le site ne pose aucun cookie pour les visiteurs.'],
				[
					'Tes droits',
					`Tu peux demander quelles données nous avons sur toi et les faire corriger ou effacer. Écris pour cela à ${email}. Tu peux aussi déposer une plainte auprès du Préposé fédéral à la protection des données et à la transparence (PFPDT).`
				]
			]
		}),
		it: (contact, email) => ({
			title: 'Protezione dei dati',
			intro: 'Questo sito raccoglie i dati necessari per il tuo soggiorno e conta le visite in forma anonima. Non ci sono pubblicità, tracciamento da parte di terzi né cookie.',
			sections: [
				['Responsabile', contact],
				[
					'Quali dati',
					'Quando invii una richiesta: nome, e-mail, telefono (facoltativo), NPA e località, numero di ospiti, date, mezzo di trasporto e i tuoi messaggi. Li usiamo per rispondere alla richiesta, confermare la prenotazione, emettere la fattura e annunciarti per la tassa di soggiorno presso la destinazione (Tourismus Adelboden-Lenk-Kandersteg) e il Comune di Reichenbach.',
					'Conserviamo le prenotazioni per il tempo richiesto dal diritto contabile (10 anni). Su richiesta cancelliamo prima i messaggi e i dati di contatto, se non fanno parte di una fattura.'
				],
				[
					'Chi tratta i dati per noi',
					'Il sito e la banca dati girano su klickops. Inviamo le e-mail con Resend (Resend, Inc., USA). Resend salva le e-mail negli USA. Il trasferimento si basa sulle clausole contrattuali standard dell’UE, con gli adeguamenti per la Svizzera.',
					'La carta sulla pagina iniziale e le carte delle escursioni vengono caricate da swisstopo (Ufficio federale di topografia), che vede il tuo indirizzo IP. Se usi il link WhatsApp, WhatsApp (Meta) tratta il tuo messaggio secondo le proprie regole.',
					'Per la carta ospiti e la tassa di soggiorno i tuoi dati vanno a Tourismus Adelboden-Lenk-Kandersteg, che li registra nel sistema Deskline di feratel.',
					'I messaggi tra te e il padrone di casa e i testi di questo sito vengono tradotti automaticamente con Claude di Anthropic (USA). Anthropic non usa questi testi per addestrare i suoi modelli.'
				],
				[
					'Statistiche delle visite',
					'Contiamo le visite da soli, senza cookie e senza servizi di terzi. Salviamo la pagina visitata, l’ora, il sito di provenienza, il tipo di dispositivo, il browser, i tempi di caricamento e il luogo approssimativo (comune), che ricaviamo dall’indirizzo IP con la banca dati DB-IP sul nostro server. L’indirizzo IP stesso non lo salviamo. Insieme al browser diventa un hash con un valore casuale che cambia ogni giorno, così le visite non si possono collegare tra un giorno e l’altro. Cancelliamo i dati grezzi dopo 13 mesi.'
				],
				[
					'Antispam, meteo e autopostale',
					'Il modulo di richiesta fa risolvere al tuo browser un piccolo calcolo. Per questo nessun dato va a terzi. Le previsioni meteo (MeteoSvizzera) e gli orari (transport.opendata.ch) li recupera il nostro server, il tuo browser non ha contatti con questi servizi.'
				],
				[
					'Libro degli ospiti',
					'Se scrivi un messaggio dopo il soggiorno, appare pubblicamente dopo l’approvazione del padrone di casa, con il nome che indichi. Puoi farlo cancellare in qualsiasi momento.'
				],
				['Cookie', 'Il sito non imposta cookie per i visitatori.'],
				[
					'I tuoi diritti',
					`Puoi chiedere quali dati abbiamo su di te e farli correggere o cancellare. Scrivi a ${email}. Puoi anche presentare reclamo all’Incaricato federale della protezione dei dati e della trasparenza (IFPDT).`
				]
			]
		})
	};
	const text = $derived(TEXT[data.lang](contact, data.host.email));
</script>

<Seo title={text.title} description={data.hutName} path="/datenschutz" lang={data.lang} siteUrl={data.siteUrl} />

<div class="richtext mx-auto max-w-[62ch] px-4 pt-8 sm:px-6 [&_h2]:mt-10 [&_h2]:text-[1.6rem] [&_h2+p]:mt-3">
	<h1 class="text-[2.6rem]">{text.title}</h1>
	<p class="mt-6">{text.intro}</p>
	{#each text.sections as [heading, ...paragraphs] (heading)}
		<h2>{heading}</h2>
		{#each paragraphs as p, i (i)}<p>{p}</p>{/each}
	{/each}
</div>
