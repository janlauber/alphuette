create extension if not exists btree_gist;

create table settings (
	key text primary key,
	value jsonb not null
);

create table seasons (
	id serial primary key,
	name text not null,
	start_date date not null,
	end_date date not null check (end_date > start_date),
	nightly_rp int not null check (nightly_rp >= 0),
	weekly_rp int check (weekly_rp >= 0),
	min_nights int not null default 1 check (min_nights between 1 and 60),
	changeover smallint check (changeover between 0 and 6),
	exclude using gist (daterange(start_date, end_date) with &&)
);

-- One row per request, booking or blocked period ("gesperrt", no guest).
create table bookings (
	id serial primary key,
	ref text not null unique,
	status text not null check (status in ('angefragt', 'bestaetigt', 'abgelehnt', 'storniert', 'gesperrt')),
	check_in date not null,
	check_out date not null check (check_out > check_in),
	name text,
	email text,
	phone text,
	city text,
	lang text not null default 'de' check (lang in ('de', 'en')),
	adults smallint not null default 0,
	children smallint not null default 0,
	infants smallint not null default 0,
	linen smallint not null default 0,
	arrival text check (arrival in ('auto', 'oev')),
	note text,
	host_note text,
	quote jsonb,
	total_rp int,
	paid_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	-- The database itself refuses double bookings.
	exclude using gist (daterange(check_in, check_out) with &&)
		where (status in ('angefragt', 'bestaetigt', 'gesperrt'))
);
create index on bookings (lower(email));

create table messages (
	id serial primary key,
	booking_id int not null references bookings on delete cascade,
	author text not null check (author in ('gast', 'host')),
	body text not null check (length(body) between 1 and 5000),
	via text not null default 'web' check (via in ('web', 'mail')),
	read_at timestamptz,
	created_at timestamptz not null default now()
);
create index on messages (booking_id, created_at);

create table photos (
	id serial primary key,
	key text not null unique,
	width int not null,
	height int not null,
	widths int[] not null,
	lqip text not null,
	alt_de text not null default '',
	alt_en text not null default '',
	sort int not null default 0,
	hero boolean not null default false,
	created_at timestamptz not null default now()
);

create table login_tokens (
	token_hash text primary key,
	email text not null,
	expires_at timestamptz not null
);

create table sessions (
	id_hash text primary key,
	email text not null,
	expires_at timestamptz not null
);

-- Summer 2027 as on the old site: Saturday to Saturday, one week minimum, CHF 650 per week.
insert into seasons (name, start_date, end_date, nightly_rp, weekly_rp, min_nights, changeover)
values ('Sommer 2027', '2027-05-01', '2027-10-16', 10000, 65000, 7, 6);
