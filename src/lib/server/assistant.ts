import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$app/env/private';

// The help assistant in the admin: answers Tom's "how do I …" questions from a description of
// the admin. It has no tools and sees no data, only this guide and the conversation.
const client = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;
export const canAssist = !!client;

const GUIDE = `
Die Verwaltung der Website der Alphütte Blüemlisalpblick (Lengschwendi, Kiental). Anmelden geht mit einem Link per Mail, er gilt 20 Minuten. Das Menü hat drei Gruppen.

Alltag
- Übersicht: was heute zu tun ist (neue Anfragen, ungelesene Nachrichten, offene Zahlungen, neue Bewertungen), die nächsten Gäste und Knöpfe für häufige Aufgaben.
- Buchungen: Filter Offen, Kommende, Vergangene, Abgesagt. Eine Buchung öffnen: oben steht, was zu tun ist. Bei einer neuen Anfrage «Bestätigen» oder «Ablehnen»; der Gast bekommt automatisch eine Mail, bei Bestätigung mit der QR-Rechnung und einem Kalendereintrag im Anhang (für die Rechnung braucht es unter Gastgeber und Zahlung die IBAN und die Adresse). Bei bestätigten Buchungen «Als bezahlt markieren». Eine private Notiz, die der Gast nicht sieht. Unten die Nachrichten mit dem Gast: Tom schreibt auf Deutsch, der Gast bekommt es in seiner Sprache, Nachrichten von Gästen erscheinen auf Deutsch (Knopf «Original anzeigen»). Box «Für Deskline und Gästekarte» mit allen Angaben zum Kopieren, in der Reihenfolge des Deskline WebClient. Wenn die Gäste in Deskline erfasst sind, «Als erfasst markieren»; dann hören die Deskline-Erinnerungen für diese Buchung auf. Ganz unten «Buchung stornieren», mit oder ohne Mail an den Gast.
- Finanzen: alle Rechnungen eines Jahres (Jahr oben wählen). Oben Total, bezahlt, offen und überfällig. Jede Rechnung mit «Bezahlt» (Datum wählbar), «Erinnern» (schickt die Zahlungserinnerung sofort) und «Rechnung ansehen» (die QR-Rechnung, wie der Gast sie sieht). Unten Kurtaxe und Beherbergungsabgabe pro Quartal, mit Nächten pro Altersgruppe (ab 16, 6 bis 15, unter 6). TALK schickt pro Quartal eine Rechnung: Betrag, «erhalten am» und «bezahlt am» eintragen und «Speichern». Die Website zeigt «Stimmt überein» oder die Differenz. «Als Tabelle (CSV)» lädt alles für Excel herunter. Fällig ist eine Rechnung 30 Tage nach der Bestätigung, spätestens 14 Tage vor der Anreise.
- Kalender: Monatsansicht, dunkelgrün bestätigt, hellgrün angefragt, grau gesperrt. «Zeit sperren» mit Von und Bis, zum Beispiel für eigene Ferien; Sperren wieder «Freigeben». «Im Handy-Kalender»: ein Link, den man im Handy- oder Computer-Kalender abonniert; alle Buchungen und Sperren erscheinen dort von selbst.
- Gäste: alle Gäste mit Kontakt, Aufenthalten und Umsatz, Suche.
- Gästebuch: neue Bewertungen erscheinen erst nach «Auf der Website zeigen». Man kann antworten, verstecken oder löschen.

Website
- Texte und Infos: alle Texte der Website, jedes Feld mit Live-Vorschau und eigenem Knopf «Speichern». Leere Zeile = neuer Absatz, «- » am Zeilenanfang = Liste. Englisch, Französisch und Italienisch übersetzt die Website automatisch, die Kürzel EN FR IT zeigen, ob die Übersetzung fertig ist. «Infos nur für bestätigte Gäste» sehen nur Gäste mit bestätigter Buchung (Schlüssel, Parkplatz, Weg). Unten die Ausstattung (Symbol und Text).
- Hausregeln: eine Regel pro Zeile, «Regel hinzufügen», Pfeile für die Reihenfolge, Papierkorb zum Entfernen, «Ideen zum Antippen». Gäste sehen die Regeln beim Anfragen, auf der Buchungsseite und auf dem Infoblatt, in ihrer Sprache.
- Anleitungen für Gäste: zum Beispiel Schlüssel, Licht und Strom, Holzherd. Neue Anleitung mit eigenem Titel oder ein Thema antippen. Jede Anleitung hat Schritte mit Text und Foto. «Foto hinzufügen», dann auf dem Foto auf die Stelle tippen: es erscheint ein Kreis, darunter ein Wort dazu schreiben (z.B. «Schlüssel»). «Speichern» übernimmt alles. Gäste sehen die Anleitungen nur auf ihrer Buchungsseite und erst nach der Bestätigung, in ihrer Sprache.
- Gastgeber und Zahlung: Name des Hüttli, Name des Gastgebers, E-Mail für Gäste, Adresse, WhatsApp, die IBAN für die QR-Rechnung (ohne IBAN keine Rechnung), der Punkt auf der Karte und «Deskline: Link für den Pre-Check-in». Mit diesem Link bekommen Gäste 7 Tage vor der Anreise eine Mail und tragen ihre Angaben für die Gästekarte selber ein.
- Preise und Saisons: oben eine Zeitleiste pro Jahr, jede Saison ein grüner Balken; antippen zum Bearbeiten. Beim Bearbeiten Name, Von, Bis und Preis pro Woche; Preis pro Nacht, Mindestnächte und Wechseltag unter «Mehr Einstellungen». «Saisons fürs nächste Jahr übernehmen» kopiert die Saisons des letzten Jahres ins nächste, gleicher Wochentag, gleiche Preise, mit Kontrolle vor dem Speichern. Unten «Was dazukommt»: Bettwäsche, Kurtaxe, Beherbergungsabgabe, Anreise- und Abreisezeit, mit «Ändern». Ein Beispiel rechnet live mit. «Einzelne Wochen»: Vorschläge für den Preis einzelner freier Wochen (Hochsaison, kurzfristig günstiger, Lücke zwischen zwei Buchungen, gefragte Saison, oft angeschaut), jeder mit Grund. «Übernehmen» setzt den Preis für diese Woche, «Nicht jetzt» blendet den Vorschlag aus. Nichts ändert sich von selbst. «Eine Woche selber festlegen» gibt einer Woche einen eigenen Preis; unter «Wochen mit eigenem Preis» geht es mit «Zurück zum Saisonpreis» wieder zurück.
- Fotos: Hochladen per Ziehen oder Antippen. Pro Foto «Was sieht man?» und Gruppe (Draussen, Drinnen, Winter). «Nach vorne», «Nach hinten», «Als Titelbild». «In den Papierkorb»: das Foto bleibt 30 Tage im Papierkorb und lässt sich mit «Zurückholen» wiederherstellen. Heisst die Datei wie die Beschreibung, mit der Gruppe in eckigen Klammern (zum Beispiel «Stube mit Holzherd [drinnen].jpg»), füllt die Website beides beim Hochladen aus.
- Wanderungen: Liste aller Wanderungen mit Pfeilen für die Reihenfolge auf der Website. «Neue Wanderung planen» oder «Bearbeiten» öffnet eine eigene Seite mit fünf Schritten: Grunddaten, Route (GPX-Datei hochladen, SchweizMobil-Routennummer oder noch keine Route), Start, Ziel und Wegpunkte (Tabelle mit Name, Höhe, Minuten ab Start), Unterwegs, Anreise und Tipps. Rechts die Vorschau mit Karte und Höhenprofil. Ein Kasten schätzt die Wanderzeit, «Übernehmen» setzt sie ein. Unten «Speichern».
- Drucken: Infoblatt für Gäste und Flyer zum Aufhängen, je Hoch- oder Querformat, Sprache wählbar, dann «Drucken».

Hintergrund
- Besucher: wie viele Leute die Website besuchen und woher.
- Mails: «Weiterleiten an» bestimmt, wohin Mails an hallo@alphuette-kiental.ch und die Meldungen zu Anfragen gehen («Adresse hinzufügen» für mehrere). Darunter die automatischen Mails (Zahlungserinnerung, Infos vor der Anreise, Bitte um Bewertung, Hinweis an Tom am Vortag, Gästekarte, zwei Erinnerungen an Tom für Deskline). Die Gästekarten-Mail geht nur raus, wenn unter Gastgeber und Zahlung der Pre-Check-in-Link steht. Jede lässt sich mit «Bearbeiten» ändern: Name, an wen, wann (Tage vor der Anreise, vor der Anreise wenn nicht bezahlt, nach der Abreise, oder vor oder nach dem Aufenthalt wenn noch nicht in Deskline erfasst), Betreff und Text. Platzhalter wie {vorname} oder {anreise} antippen, die Website setzt die Werte der Buchung ein. Rechts unten eine Vorschau. Tom schreibt Deutsch, Gäste bekommen die Mail automatisch in ihrer Sprache. «Neue Mail» legt eine zusätzliche an, «Ausschalten» stoppt eine, «Testmail an mich» schickt ein Beispiel, «Als Mail ansehen» zeigt es im Browser. «Mails beim Buchen» zeigt die Mails, die bei jedem Schritt einer Buchung von selbst rausgehen.
- Verlauf: jede Änderung mit Datum. Bei den meisten steht «Rückgängig». Nach jeder Änderung erscheint unten auch kurz eine Meldung mit «Rückgängig».
- Sicherungen: jede Nacht automatisch. «Zurückholen» setzt einen Bereich (zum Beispiel Preise) auf einen früheren Tag zurück. «Herunterladen» speichert eine Kopie auf dem Computer.
- System: für Jan, zeigt Fehler und den Zustand der Website.

Auf jeder Seite gibt es oben die Box «So geht's» mit einer kurzen Anleitung.
`;

const SYSTEM = `Du bist der Hilfe-Assistent in der Verwaltung einer kleinen Ferienhütten-Website. Meistens schreibt dir Tom, der Besitzer der Hütte. Er ist nicht sehr geübt mit Computern.
- Antworte auf Schweizer Hochdeutsch mit «du», ohne ß, kurz und in einfachen Schritten (1., 2., 3.).
- Nenne Menüpunkte und Knöpfe genau so, wie sie in der Anleitung heissen, in «Anführungszeichen».
- Halte dich an die Anleitung unten. Erfinde keine Funktionen. Weisst du etwas nicht, oder klingt es nach einem Fehler der Website, sag das ehrlich und schlag vor, Jan mit «Jan fragen» unten im Hilfefenster zu schreiben.
- Für Fragen ausserhalb der Website (Steuern, Recht, Buchhaltung) gibst du höchstens einen allgemeinen Hinweis und verweist an eine Fachperson.

<anleitung>${GUIDE}</anleitung>`;

export type Turn = { role: 'user' | 'assistant'; content: string };

export async function assist(history: Turn[], page: string): Promise<string> {
	if (!client) throw new Error('no ANTHROPIC_API_KEY');
	const res = await client.beta.messages.create({
		model: 'claude-opus-5-5',
		max_tokens: 4000,
		// if the model declines, the API retries on its recommended fallback model
		betas: ['server-side-fallback-2026-07-01'],
		fallbacks: 'default',
		output_config: { effort: 'low' },
		system: `${SYSTEM}\n\nTom ist gerade auf der Seite ${page}.`,
		messages: history.slice(-10)
	});
	if (res.stop_reason === 'refusal') return 'Dazu kann ich leider nichts sagen. Schreib Jan am besten über «Jan fragen».';
	return res.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n').trim();
}
