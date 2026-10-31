-- Mail to the hut's address from senders the site does not know (no booking, not Tom). Spam stays
-- here instead of being forwarded; the rest is forwarded with "[Unbekannt]" in the subject.
-- The maintenance job deletes rows after 30 days.
create table unknown_mails (
	id serial primary key,
	at timestamptz not null default now(),
	sender text not null,
	from_full text not null default '',
	recipient text not null default '',
	subject text not null default '',
	body text not null default '',
	attachments int not null default 0,
	reasons text[] not null default '{}',
	held boolean not null,
	forwarded_at timestamptz
);
create index on unknown_mails (at desc);

-- Senders Tom let through (always forwarded) or blocked (always kept back).
create table mail_senders (
	address text primary key,
	allowed boolean not null,
	at timestamptz not null default now()
);
