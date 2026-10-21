-- Guides for guests: where the key is, how the light and the stove work. Only confirmed guests see them.
-- steps: [{ "text": "...", "photo": "<uuid>" or null, "marks": [{ "x": 0.42, "y": 0.3, "label": "Schlüssel" }] }],
-- x and y as a share of the photo's width and height.
create table guides (
	id serial primary key,
	title text not null default '',
	steps jsonb not null default '[]',
	sort int not null default 0
);
