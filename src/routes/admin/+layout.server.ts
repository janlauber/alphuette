import { sql } from '#lib/server/db.ts';

export const load = async ({ locals }) => {
	if (!locals.admin) return { admin: null, open: 0, unread: 0 };
	const [{ open, unread }] = await sql`
		select (select count(*)::int from bookings where status = 'angefragt') as open,
			(select count(*)::int from messages where author = 'gast' and read_at is null) as unread`;
	return { admin: locals.admin, open, unread };
};
