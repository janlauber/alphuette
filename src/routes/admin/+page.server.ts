import { sql } from '#lib/server/db.ts';

export const load = async () => {
	const [open, upcoming, unread] = await Promise.all([
		sql`select id, ref, name, city, check_in, check_out, adults + children + infants as people, total_rp, created_at
			from bookings where status = 'angefragt' order by created_at`,
		sql`select id, ref, name, check_in, check_out, adults + children + infants as people, paid_at
			from bookings where status = 'bestaetigt' and check_out >= current_date order by check_in limit 8`,
		sql`select b.id, b.ref, b.name, count(*)::int as n, max(m.created_at) as last
			from messages m join bookings b on b.id = m.booking_id
			where m.author = 'gast' and m.read_at is null group by b.id order by last desc`
	]);
	return { open, upcoming, unread };
};
