-- A new request stays "unbestaetigt" until the guest clicks the link in the mail.
-- It holds its dates for 30 minutes; createRequest clears expired ones first.
alter table bookings drop constraint bookings_status_check;
alter table bookings add constraint bookings_status_check
	check (status in ('unbestaetigt', 'angefragt', 'bestaetigt', 'abgelehnt', 'storniert', 'gesperrt'));
alter table bookings drop constraint bookings_daterange_excl;
alter table bookings add constraint bookings_daterange_excl
	exclude using gist (daterange(check_in, check_out) with &&)
	where (status in ('unbestaetigt', 'angefragt', 'bestaetigt', 'gesperrt'));
alter table bookings add column review_requested_at timestamptz;

create table reviews (
	id serial primary key,
	booking_id int unique references bookings on delete set null,
	name text not null,
	rating smallint not null check (rating between 1 and 5),
	body text not null check (length(body) between 10 and 3000),
	lang text not null default 'de',
	approved boolean not null default false,
	reply text,
	stay date,
	created_at timestamptz not null default now()
);

-- Route geometry in LV95 ([[e, n], ...]); the elevation profile is computed from it.
create table hikes (
	id serial primary key,
	slug text not null unique,
	name text not null,
	time text not null default '',
	alpine boolean not null default false,
	de text not null default '',
	en text not null default '',
	url text not null default '',
	geometry jsonb,
	source text not null default '',
	profile jsonb,
	distance_m int,
	ascent_m int,
	descent_m int,
	sort int not null default 0
);

-- Anonymous analytics: no cookies, visitor is a hash with a daily salt.
create table events (
	id bigserial primary key,
	ts timestamptz not null default now(),
	kind text not null check (kind in ('view', 'leave', 'event', 'vital')),
	path text not null,
	name text,
	value real,
	visitor text not null,
	ref text,
	utm_source text,
	utm_medium text,
	utm_campaign text,
	country text,
	region text,
	city text,
	device text,
	browser text,
	os text,
	lang text
);
create index on events (ts);
create index on events (kind, ts);
