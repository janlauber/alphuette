-- Errors of the app, grouped: the same error at the same place is one row with a counter.
create table app_errors (
	id serial primary key,
	fingerprint text not null unique,
	place text not null,
	message text not null,
	stack text not null default '',
	count int not null default 1,
	first_at timestamptz not null default now(),
	last_at timestamptz not null default now(),
	alerted_at timestamptz,
	resolved_at timestamptz
);
create index app_errors_last on app_errors (last_at desc);
