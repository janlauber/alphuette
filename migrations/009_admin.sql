-- What happened in the admin, in plain words, with what is needed to undo it.
create table activity (
	id serial primary key,
	at timestamptz not null default now(),
	actor text not null default '',
	area text not null,
	title text not null,
	link text,
	-- 'table:id' or 'settings:key': an older change can only be undone if nothing newer touched the same thing
	target text,
	-- {"settings": {"key": "<json text or null>"}} or {"table": "hikes", "id": 3, "before": "<json text or null>"}
	undo jsonb,
	undone_at timestamptz
);
create index activity_at on activity (at desc);
create index activity_target on activity (target);

-- Deleted photos stay in a trash for 30 days, files included.
alter table photos add column deleted_at timestamptz;
