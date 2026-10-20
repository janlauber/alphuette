import { sql } from '#lib/server/db.ts';

const FILTERS = {
	offen: () => sql`status = 'angefragt'`,
	kommend: () => sql`status = 'bestaetigt' and check_out >= current_date`,
	vergangen: () => sql`status = 'bestaetigt' and check_out < current_date`,
	abgesagt: () => sql`status in ('abgelehnt', 'storniert')`
};
type Filter = keyof typeof FILTERS;

export const load = async ({ url }) => {
	const [counts] = await sql<Record<Filter, number>[]>`
		select count(*) filter (where status = 'angefragt')::int as offen,
			count(*) filter (where status = 'bestaetigt' and check_out >= current_date)::int as kommend,
			count(*) filter (where status = 'bestaetigt' and check_out < current_date)::int as vergangen,
			count(*) filter (where status in ('abgelehnt', 'storniert'))::int as abgesagt
		from bookings`;
	const asked = url.searchParams.get('f') as Filter | null;
	// open requests first, because those wait for Tom
	const filter: Filter = asked && asked in FILTERS ? asked : counts.offen ? 'offen' : 'kommend';
	const bookings = await sql<
		{ id: number; ref: string; status: string; name: string; city: string | null; checkIn: string; checkOut: string; people: number; totalRp: number | null; paidAt: Date | null; unread: number }[]
	>`
		select b.id, b.ref, b.status, b.name, b.city, b.check_in, b.check_out, b.adults + b.children + b.infants as people, b.total_rp, b.paid_at,
			(select count(*)::int from messages m where m.booking_id = b.id and m.author = 'gast' and m.read_at is null) as unread
		from bookings b where ${FILTERS[filter]()}
		order by b.check_in ${filter === 'vergangen' || filter === 'abgesagt' ? sql`desc` : sql`asc`} limit 200`;
	return { bookings, filter, counts };
};
