-- Guest registration in Deskline (feratel) and the quarterly Kurtaxe bill from the tourism office (TALK).

-- When Tom registered the guests in Deskline; reminders go out while it is empty.
alter table bookings add column deskline_at timestamptz;

-- The quarterly bill from TALK for Kurtaxe and Beherbergungsabgabe, to compare with what guests paid.
create table levy_quarters (
	quarter text primary key check (quarter ~ '^\d{4}-Q[1-4]$'),
	invoiced_rp int check (invoiced_rp >= 0),
	invoiced_at date,
	paid_at date
);

alter table mail_templates drop constraint mail_templates_trigger_check;
alter table mail_templates add constraint mail_templates_trigger_check check (trigger in (
	'before_arrival', 'unpaid_before_arrival', 'after_departure', 'unregistered_before_arrival', 'unregistered_after_departure'));

insert into mail_templates (key, label, audience, trigger, days, subject, body, sort) values
('precheckin', 'Gästekarte: Angaben erfassen', 'gast', 'before_arrival', 7,
 'Deine Gästekarte für das Kiental ({nummer})',
 E'Hoi {vorname}\n\nMit der Gästekarte fahrt ihr gratis mit Bus und Bahn in der Region, zum Beispiel von Reichenbach ins Kiental und mit der Sesselbahn auf die Ramslauenen.\n\nDamit sie ausgestellt werden kann, trag bitte bis spätestens 2 Tage vor der Anreise die Angaben von allen ein, die mitkommen:\n{voranmeldung}\n\nDie Gästekarte kommt dann am Tag vor der Anreise per Mail.', 5),
('deskline_before', 'Erinnerung: Gäste in Deskline erfassen', 'host', 'unregistered_before_arrival', 3,
 'Deskline: {name} kommt am {anreise}',
 E'{name} reist am {anreise} an und ist auf der Website noch nicht als «in Deskline erfasst» markiert.\n\nDie Voranmeldung braucht es spätestens 2 Tage vor der Anreise, sonst kommt die Gästekarte nicht rechtzeitig. Alle Angaben zum Kopieren stehen bei der Buchung:\n{verwaltung}', 6),
('deskline_after', 'Erinnerung: Deskline-Meldung prüfen', 'host', 'unregistered_after_departure', 4,
 'Deskline: Meldung für {name} prüfen',
 E'{name} ist am {abreise} abgereist. Die Buchung ist noch nicht als «in Deskline erfasst» markiert.\n\nDeskline schickt die Meldung nur an die Tourismusorganisation, wenn alle Pflichtfelder ausgefüllt sind. Prüf sie bitte und setz danach das Häkchen bei der Buchung:\n{verwaltung}', 7);
