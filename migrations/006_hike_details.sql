-- More facts per hike: trail category, waypoints like on the signposts, season, getting there, places to eat.
alter table hikes
	add column category text not null default '',
	add column sac text not null default '',
	add column duration_min int,
	add column season_de text not null default '',
	add column season_en text not null default '',
	add column start_name text not null default '',
	add column end_name text not null default '',
	add column transit_de text not null default '',
	add column transit_en text not null default '',
	add column waypoints jsonb,
	add column stops jsonb,
	add column highlights_de text not null default '',
	add column highlights_en text not null default '',
	add column tips_de text not null default '',
	add column tips_en text not null default '',
	add column family boolean not null default false,
	add column loop boolean not null default false,
	add column from_hut boolean not null default false;
update hikes set category = case when alpine then 'bergwanderweg' else 'wanderweg' end;
