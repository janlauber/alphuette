-- Tom writes German; every other language comes from this table, keyed by the German text.
create table translations (
	hash text not null, -- md5 of the German text
	lang text not null,
	text text not null,
	manual boolean not null default false, -- written by hand, never replaced by a machine translation
	at timestamptz not null default now(),
	primary key (hash, lang)
);

alter table bookings drop constraint if exists bookings_lang_check;
alter table bookings add constraint bookings_lang_check check (lang in ('de', 'en', 'fr', 'it'));

-- guest messages: German for Tom; Tom's messages: the guest's language
alter table messages add column translation text;
-- country of residence, for the guest card and the tourist tax
alter table bookings add column country text;
