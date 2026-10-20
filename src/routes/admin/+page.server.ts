import { sql } from '#lib/server/db.ts';

export const load = async () => {
	const [open, unread, unpaid, reviews, upcoming, recent] = await Promise.all([
		sql`select id, ref, name, city, check_in, check_out, adults + children + infants as people, total_rp, created_at
			from bookings where status = 'angefragt' order by created_at`,
		sql`select b.id, b.name, count(*)::int as n, max(m.created_at) as last
			from messages m join bookings b on b.id = m.booking_id
			where m.author = 'gast' and m.read_at is null group by b.id order by last desc`,
		// the bill is due 14 days before arrival
		sql`select id, name, check_in, total_rp, check_in - 14 < current_date as late
			from bookings where status = 'bestaetigt' and paid_at is null and check_in >= current_date order by check_in limit 10`,
		sql`select id, name, rating from reviews where not approved order by created_at`,
		sql`select id, name, check_in, check_out, adults + children + infants as people, paid_at, (check_in - current_date) as days
			from bookings where status = 'bestaetigt' and check_out >= current_date order by check_in limit 5`,
		sql`select id, at, title, link from activity order by at desc limit 5`
	]);
	return { open, unread, unpaid, reviews, upcoming, recent };
};
