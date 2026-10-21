<script lang="ts">
	import AdminPage from '#lib/components/admin/AdminPage.svelte';
	import GuidePhoto from '#lib/components/GuidePhoto.svelte';
	import type { Mark } from '#lib/guides.ts';

	// Tom's handbook: the usual tasks, each with a screenshot from static/handbuch and a frame around what to tap.
	// The frames were measured on the screenshots (share of width and height); a new screenshot needs new numbers.
	type Part = { id: string; title: string; steps: string[]; shot?: { name: string; alt: string; marks: Mark[] }; link?: { href: string; label: string } };
	const box = (x: number, y: number, w: number, h: number, label = ''): Mark => ({ x, y, w, h, label });

	const parts: Part[] = [
		{
			id: 'anmelden',
			title: 'Anmelden',
			steps: [
				'Geh auf alphuette-kiental.ch/admin und gib deine Mailadresse ein.',
				'Du bekommst ein Mail mit einem Link. Er gilt 20 Minuten. Kommt nichts, schau im Spam nach.',
				'Danach bleibst du auf diesem Gerät 30 Tage angemeldet.'
			]
		},
		{
			id: 'anfrage',
			title: 'Eine neue Anfrage',
			steps: [
				'Kommt eine Anfrage, bekommst du ein Mail. Unter «Buchungen» steht sie bei «Offen».',
				'Öffne sie und tippe auf «Bestätigen» oder «Ablehnen». Bis du entscheidest, sind die Tage für andere gesperrt.',
				'Bestätigst du, bekommt der Gast ein Mail mit der Rechnung und einem Kalendereintrag. Lehnst du ab, bekommt er eine kurze Absage, und die Tage sind wieder frei.'
			],
			shot: { name: 'anfrage', alt: 'Neue Anfrage mit den Knöpfen Bestätigen und Ablehnen', marks: [box(0.1611, 0.6952, 0.1744, 0.1234)] },
			link: { href: '/admin/buchungen', label: 'Buchungen öffnen' }
		},
		{
			id: 'bezahlt',
			title: 'Wenn das Geld da ist',
			steps: [
				'Der Gast zahlt mit der QR-Rechnung direkt auf dein Konto.',
				'Siehst du das Geld auf dem Konto, öffne die Buchung und tippe «Als bezahlt markieren».',
				'Hat jemand 21 Tage vor der Anreise noch nicht bezahlt, schickt die Website von selbst eine Erinnerung. Unter «Finanzen» kannst du auch selber «Erinnern».'
			],
			shot: { name: 'bezahlt', alt: 'Bestätigte Buchung mit dem Knopf Als bezahlt markieren', marks: [box(0.2156, 0.8121, 0.2834, 0.1401)] },
			link: { href: '/admin/finanzen', label: 'Finanzen öffnen' }
		},
		{
			id: 'nachrichten',
			title: 'Nachrichten mit Gästen',
			steps: ['Unten bei jeder Buchung stehen die Nachrichten mit dem Gast.', 'Schreib ins Feld und tippe «Nachricht senden». Der Gast bekommt sie per Mail.'],
			shot: { name: 'nachrichten', alt: 'Nachrichten bei einer Buchung mit Eingabefeld', marks: [box(0.5, 0.721, 0.9185, 0.2407, 'Hier schreiben'), box(0.8392, 0.9162, 0.2401, 0.1132)] }
		},
		{
			id: 'deskline',
			title: 'Vor der Anreise: Deskline und Gästekarte',
			steps: [
				'7 Tage vor der Anreise bekommt der Gast den Link für die Gästekarte. Dafür muss unter «Gastgeber und Zahlung» der Pre-Check-in-Link von Deskline stehen.',
				'Bei der Buchung steht alles, was Deskline braucht, in der gleichen Reihenfolge wie im Deskline WebClient. Mit «Kopieren» holst du jede Angabe und fügst sie dort ein.',
				'Wenn die Gäste in Deskline sind, tippe «Als erfasst markieren». Sonst erinnert dich die Website 3 Tage vor der Anreise.'
			],
			shot: { name: 'deskline', alt: 'Angaben für Deskline mit Kopieren-Knöpfen', marks: [box(0.4977, 0.4177, 0.2223, 0.0705), box(0.8476, 0.5547, 0.1367, 0.0861)] },
			link: { href: '/admin/buchungen?f=kommend', label: 'Kommende Buchungen' }
		},
		{
			id: 'kurtaxe',
			title: 'Kurtaxe pro Quartal',
			steps: [
				'Unter «Finanzen» rechnet die Website Kurtaxe und Beherbergungsabgabe pro Quartal zusammen, so wie Tourismus Adelboden-Lenk-Kandersteg (TALK) sie verrechnet.',
				'Kommt die Rechnung von TALK, trag den Betrag ein, dazu wann sie kam und wann du bezahlt hast. Dann «Speichern».',
				'Die Website zeigt «Stimmt überein» oder die Differenz.'
			],
			shot: { name: 'kurtaxe', alt: 'Kurtaxe im 3. Quartal mit Feld für die TALK-Rechnung', marks: [box(0.1452, 0.8021, 0.1631, 0.0841), box(0.1344, 0.8987, 0.1414, 0.053)] },
			link: { href: '/admin/finanzen', label: 'Finanzen öffnen' }
		},
		{
			id: 'sperren',
			title: 'Zeit sperren',
			steps: [
				'Bist du selbst im Hüttli oder reparierst etwas, sperrst du die Tage unter «Kalender».',
				'Von und Bis wählen, dann «Sperren». Auf der Website sind die Tage dann belegt.',
				'Unter «Deine Sperren» gibst du sie mit «Freigeben» wieder frei.'
			],
			shot: { name: 'sperren', alt: 'Formular Zeit sperren mit Von, Bis und Grund', marks: [box(0.1418, 0.7104, 0.1459, 0.0965)] },
			link: { href: '/admin/kalender', label: 'Kalender öffnen' }
		},
		{
			id: 'handy',
			title: 'Buchungen im Kalender auf dem Handy',
			steps: [
				'Einmal einrichten: Auf dem iPhone «Auf dem iPhone abonnieren» antippen. Danach stehen alle Buchungen in deinem Kalender und bleiben von selbst aktuell.',
				'Mit Android: «Adresse kopieren» und im Google Kalender am Computer bei «Weitere Kalender» über «Per URL» einfügen.'
			],
			shot: { name: 'handykalender', alt: 'Kalender auf dem Handy abonnieren', marks: [box(0.2392, 0.6013, 0.3408, 0.1778)] },
			link: { href: '/admin/kalender', label: 'Kalender öffnen' }
		},
		{
			id: 'saisons',
			title: 'Preise und Saisons',
			steps: [
				'Jede Saison ist ein grüner Balken. Tipp ihn an, um Daten oder Preis zu ändern.',
				'«Saisons fürs nächste Jahr übernehmen» kopiert alle Saisons ins nächste Jahr. Du siehst sie vor dem Speichern.'
			],
			shot: { name: 'saisons', alt: 'Zeitleiste mit der Saison Sommer 2027', marks: [box(0.5868, 0.1987, 0.3594, 0.104, 'Antippen zum Ändern'), box(0.3744, 0.9075, 0.4482, 0.1172)] },
			link: { href: '/admin/preise', label: 'Preise öffnen' }
		},
		{
			id: 'wochen',
			title: 'Einzelne Wochen günstiger oder teurer',
			steps: [
				'Weiter unten bei «Preise und Saisons» schlägt die Website Preise für einzelne freie Wochen vor, jeweils mit Grund. Zum Beispiel günstiger, wenn eine Woche kurz vorher noch frei ist.',
				'«Übernehmen» setzt den Preis für diese Woche, «Nicht jetzt» blendet den Vorschlag aus. Ohne dich ändert sich nichts.'
			],
			shot: { name: 'wochenpreis', alt: 'Preisvorschlag für eine Woche in der Hochsaison', marks: [box(0.3353, 0.8297, 0.152, 0.1229)] },
			link: { href: '/admin/preise', label: 'Preise öffnen' }
		},
		{
			id: 'anleitungen',
			title: 'Anleitungen für Gäste',
			steps: [
				'Unter «Anleitungen für Gäste» ein Thema antippen, zum Beispiel «Schlüssel», oder einen eigenen Titel eingeben.',
				'«Foto hinzufügen», dann auf dem Foto auf die Stelle tippen. Es erscheint ein Kreis. Ins Feld darunter schreibst du ein Wort dazu.',
				'«Speichern». Gäste sehen die Anleitung auf ihrer Buchungsseite, sobald du die Buchung bestätigt hast.'
			],
			shot: { name: 'anleitung', alt: 'Anleitung Schlüssel mit Foto und Kreis', marks: [box(0.4898, 0.862, 0.7707, 0.0678)] },
			link: { href: '/admin/anleitungen', label: 'Anleitungen öffnen' }
		},
		{
			id: 'rueckgaengig',
			title: 'Etwas falsch gemacht?',
			steps: [
				'Nach jeder Änderung erscheint unten kurz eine Meldung mit «Rückgängig».',
				'Später findest du jede Änderung unter «Verlauf», die meisten mit «Rückgängig».',
				'Jede Nacht macht die Website eine Sicherung. Unter «Sicherungen» holst du einen früheren Stand zurück.'
			],
			shot: { name: 'verlauf', alt: 'Verlauf mit Rückgängig-Knöpfen', marks: [box(0.8558, 0.3181, 0.1609, 0.1164)] },
			link: { href: '/admin/verlauf', label: 'Verlauf öffnen' }
		}
	];
</script>

<AdminPage title="Handbuch" intro="Die üblichen Aufgaben Schritt für Schritt. Der grüne Rahmen zeigt, wo du tippst.">
	<nav aria-label="Inhalt" class="max-w-3xl">
		<ol class="grid gap-x-6 gap-y-1 sm:grid-cols-2">
			{#each parts as p, i (p.id)}
				<li><a href="#{p.id}" class="font-semibold text-brand">{i + 1}. {p.title}</a></li>
			{/each}
		</ol>
	</nav>

	<div class="mt-10 grid max-w-3xl gap-14">
		{#each parts as p, i (p.id)}
			<section id={p.id} class="scroll-mt-24">
				<h2 class="text-2xl">{i + 1}. {p.title}</h2>
				<ol class="mt-3 grid gap-2">
					{#each p.steps as s, j (j)}
						<li class="flex gap-3 text-lg leading-relaxed">
							<span class="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-wash text-sm font-bold text-brand" aria-hidden="true">{j + 1}</span>{s}
						</li>
					{/each}
				</ol>
				{#if p.shot}
					<figure class="mt-5 rounded-[18px] border-2 border-line p-2">
						<GuidePhoto src="/handbuch/{p.shot.name}.webp" alt={p.shot.alt} marks={p.shot.marks} />
					</figure>
				{/if}
				{#if p.link}
					<a href={p.link.href} class="btn-line mt-4 no-underline">{p.link.label}</a>
				{/if}
			</section>
		{/each}
		<p class="rounded-[18px] bg-wash px-5 py-4 text-lg">Oben auf jeder Seite erklärt «So geht's», was die Seite kann. Und sonst: Jan fragen.</p>
	</div>
</AdminPage>
