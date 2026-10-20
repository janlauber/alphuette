# alphuette-kiental

Website, Buchungen und Admin für die Alphütte Blüemlisalpblick im Kiental.
SvelteKit 3, Tailwind 4, Postgres, S3 für Fotos, Mails über Resend.

## Lokal starten

```bash
npm install
npm run db:start      # Postgres in .data/pg auf Port 5433
cp .env.example .env  # APP_SECRET setzen: openssl rand -base64 36
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

Gäste haben kein Konto. Ihr Link `/buchung/<ref>-<signatur>` ist mit `APP_SECRET` signiert.
Wer `APP_SECRET` ändert, macht alle Gäste-Links ungültig.

## Betrieb

Das `Dockerfile` baut ein Node-Image auf Port 3000. Nötige Variablen stehen in `.env.example`.

Mail-Antworten im Nachrichtenverlauf brauchen Resend Inbound:
1. In Resend eine Empfangs-Domain einrichten, z. B. `antwort.alphuette-kiental.ch` (MX-Record).
2. Webhook `email.received` auf `https://<domain>/api/mail/inbound` zeigen lassen.
3. `REPLY_DOMAIN` und `RESEND_WEBHOOK_SECRET` setzen.
