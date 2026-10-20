-- A different price for single weeks (7 nights from a changeover day). It replaces the season's weekly
-- price for that week only; Tom sets it by hand or by taking a suggestion.
create table week_prices (
	id serial primary key,
	start_date date not null unique,
	weekly_rp int not null check (weekly_rp >= 0),
	reason text not null default '',
	created_at timestamptz not null default now()
);

-- Price suggestions Tom said no to, so they do not come back.
create table price_hints_dismissed (
	key text primary key,
	at timestamptz not null default now()
);
