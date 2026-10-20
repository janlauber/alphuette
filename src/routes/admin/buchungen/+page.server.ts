import { sql } from '#lib/server/db.ts';

const FILTERS = {
	aktiv: () => sql`status in ('angefragt', 'bestaetigt') and check_out >= current_date`,
	angefragt: () => sql`status = 'angefragt'`,
	vergangen: () => sql`status = 'bestaetigt' and check_out < current_date`,
	abgesagt: () => sql`status in ('abgelehnt', 'storniert')`
};

export const load = async ({ url }) => {
	const filter = (url.searchParams.get('f') ?? 'aktiv') as keyof typeof FILTERS;
	const where = (FILTERS[filter] ?? FILTERS.aktiv)();
	const bookings = await sql`
		select id, ref, status, name, city, check_in, check_out, adults + children + infants as people, total_rp, paid_at
		from bookings where status <> 'gesperrt' and ${where}
		order by check_in ${filter === 'aktiv' || filter === 'angefragt' ? sql`asc` : sql`desc`} limit 200`;
	return { bookings, filter };
};
