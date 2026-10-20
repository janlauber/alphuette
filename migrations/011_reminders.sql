-- Automatic mails per booking, each kind at most once
create table booking_mails (
	booking_id int not null references bookings on delete cascade,
	kind text not null,
	at timestamptz not null default now(),
	primary key (booking_id, kind)
);
-- reviews were asked for before this table existed
insert into booking_mails (booking_id, kind, at) select id, 'review', review_requested_at from bookings where review_requested_at is not null;
