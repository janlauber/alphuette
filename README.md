# alphuette-kiental

Website, Buchungen und Admin für die Alphütte Blüemlisalpblick im Kiental.
SvelteKit 3, Tailwind 4, Postgres, S3 für Fotos, Mails über Resend.

## Lokal starten

```bash
npm install
npm run db:start      # Postgres in .data/pg auf Port 5433
cp .env.example .env
npm run dev
```

Ohne `RESEND_API_KEY` landen Mails in der Konsole, ohne `S3_ENDPOINT` landen Fotos in `.data/uploads`.
Login unter `/admin/login` mit einer Adresse aus `ADMIN_EMAILS`, der Link kommt per Mail (lokal: Konsole).

```bash
npm test              # Preis- und Kalenderregeln
npm run check         # Typen
```

## Aufbau

- `src/lib/booking.ts`: Preise, Saisons, Wechseltag, Mindestnächte. Läuft im Browser und auf dem Server.
- `migrations/`: SQL, läuft beim Start automatisch. Doppelbuchungen verhindert eine Exclusion-Constraint in Postgres.
- `src/lib/server/`: Datenbank, Mails, Login, Fotos, Einstellungen mit Standardtexten.
- `src/routes/[[lang=lang]]/`: öffentliche Seiten auf Deutsch (`/`) und Englisch (`/en`).
- `src/routes/admin/`: Buchungen, Kalender, Gäste, Fotos, Preise, Inhalte.
- `docs/recherche.md`: Fakten mit Quellen (Anreise, Kurtaxe, Wanderungen).

Gäste haben kein Konto. Ihr Link `/buchung/<ref>-<signatur>` ist signiert, mit `APP_SECRET` oder,
falls nicht gesetzt, mit einem Schlüssel, den die App beim ersten Start erzeugt und in der Datenbank ablegt.
Wer den Schlüssel ändert, macht alle Gäste-Links ungültig.

## Funktionen, die man kennen muss

- **Anfrage mit E-Mail-Bestätigung:** Eine neue Anfrage ist `unbestaetigt` und hält die Woche 30 Minuten.
  Erst der Klick im Mail schickt sie an den Gastgeber. Abgelaufene löscht die stündliche Wartung.
- **Spamschutz** (`src/lib/server/spam.ts`): Proof-of-Work im Browser (`src/lib/pow.ts`), Mindest-Ausfüllzeit,
  Honeypot, MX-Prüfung mit Sperrliste für Wegwerf-Domains, höchstens 3 Mails pro Empfänger und Tag.
- **Analytics** (`src/lib/server/analytics.ts`, Admin unter Besucher): Seitenaufrufe zählt der Server, den Rest
  meldet ein Beacon an `/api/p`. Keine Cookies, Besucher = Hash aus IP, Browser und Tagessalz. Orte aus DB-IP Lite,
  das der Docker-Build herunterlädt.
- **Wanderungen:** Route aus GPX, aus Wanderland Schweiz (Nummer wie `1.13`) oder grob aus Wegpunkten.
  Das Höhenprofil kommt von swisstopo und wird im Hintergrund berechnet.
- **Wetter und Postauto:** MeteoSchweiz-Lokalprognose für PLZ 3723 und transport.opendata.ch, beide vom Server
  geholt und gecacht. Ausserhalb der Saison zeigt die Seite die Busse bis Ramslauenen.
- **Gästebuch:** Am Tag nach der Abreise bekommt der Gast einen Link. Einträge erscheinen erst nach Freigabe.

Quellenangaben, die sichtbar bleiben müssen: «Quelle: MeteoSchweiz», «Fahrplandaten: opentransportdata.swiss»,
«© swisstopo», «Wanderland Schweiz (ASTRA und Kantone)» und im Admin «IP Geolocation by DB-IP».

## Betrieb

Das `Dockerfile` baut ein Node-Image auf Port 3000. Nötig sind `DATABASE_URL`, `SITE_URL` und `ADMIN_EMAILS`.
Fotos liegen im Bucket, sobald `BUCKET_HOST`, `BUCKET_NAME`, `AWS_ACCESS_KEY_ID` und `AWS_SECRET_ACCESS_KEY`
gesetzt sind (so liefert sie ein klickops-Bucket). `S3_ENDPOINT` überschreibt Host und Port.

Mail-Antworten im Nachrichtenverlauf brauchen Resend Inbound:
1. In Resend eine Empfangs-Domain einrichten, z. B. `antwort.alphuette-kiental.ch` (MX-Record).
2. Webhook `email.received` auf `https://<domain>/api/mail/inbound` zeigen lassen.
3. `REPLY_DOMAIN` und `RESEND_WEBHOOK_SECRET` setzen.

## Lizenz

Der Code steht unter der [MIT-Lizenz](LICENSE). Texte, Fotos, Logo und Maskottchen der Alphütte
sind davon ausgenommen. Wer den Code für eine eigene Unterkunft nutzt, ersetzt sie durch eigene.
