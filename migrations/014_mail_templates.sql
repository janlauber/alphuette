-- Automatic mails Tom can edit and add himself. Written in German with {placeholders};
-- guests get them in their language through the translations table.
create table mail_templates (
	id serial primary key,
	key text unique, -- the four built-in ones; booking_mails uses it as kind
	label text not null,
	audience text not null default 'gast' check (audience in ('gast', 'host')),
	trigger text not null check (trigger in ('before_arrival', 'unpaid_before_arrival', 'after_departure')),
	days int not null default 7 check (days between 0 and 365),
	subject text not null,
	body text not null,
	active boolean not null default true,
	sort int not null default 0
);

insert into mail_templates (key, label, audience, trigger, days, subject, body, sort) values
('payment', 'Zahlungserinnerung', 'gast', 'unpaid_before_arrival', 21,
 'Erinnerung: Rechnung für das Hüttli ({nummer})',
 E'Hoi {vorname}\n\nKurze Erinnerung: Die Rechnung über {betrag} ist bis {faellig} fällig. Die QR-Rechnung findest du hier:\n{rechnung}\n\nHast du schon bezahlt? Dann ist alles gut, die Zahlung ist einfach noch nicht bei Tom eingetragen.', 1),
('arrival', 'Infos vor der Anreise', 'gast', 'before_arrival', 7,
 'In einer Woche geht es los ({nummer})',
 E'Hoi {vorname}\n\nAm {anreise} geht es ins Hüttli, Anreise ab {anreisezeit} Uhr. Alles weitere, die Packliste und den Wetterbericht findest du auf deiner Buchungsseite:\n{link}\n\n{anreiseinfos}', 2),
('review', 'Bitte um eine Bewertung', 'gast', 'after_departure', 1,
 'Wie war deine Woche im Hüttli?',
 E'Hoi {vorname}\n\nDanke, dass du im Hüttli warst. Tom freut sich, wenn du ihm schreibst, wie es war. Ein paar Zeilen reichen:\n\n{bewertung}', 3),
('host', 'Hinweis an dich am Vortag', 'host', 'before_arrival', 1,
 'Morgen kommt {name}',
 E'Morgen, {anreise}, kommt {name} aus {ort}. Abreise {abreise}.\n\n{gaeste}\nZahlung: {zahlung}\nTelefon: {telefon}\n\nDenk an die Meldung in Deskline für die Gästekarte.\n\n{verwaltung}', 4);
