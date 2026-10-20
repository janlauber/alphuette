import { sql } from '#lib/server/db.ts';
import { canAssist } from '#lib/server/assistant.ts';

export const load = async ({ locals }) => {
	if (!locals.admin) return { admin: null, open: 0, unread: 0, reviews: 0, errors: 0, overdue: 0, assistant: false };
	const [{ open, unread, reviews, errors, overdue }] = await sql`
		select (select count(*)::int from bookings where status = 'angefragt') as open,
			(select count(*)::int from messages where author = 'gast' and read_at is null) as unread,
			(select count(*)::int from reviews where not approved) as reviews,
			(select count(*)::int from app_errors where resolved_at is null) as errors,
			-- unpaid and past the latest due date (14 days before arrival); the exact due date is on the finance page
			(select count(*)::int from bookings where status = 'bestaetigt' and paid_at is null and check_in - 14 < current_date) as overdue`;
	return { admin: locals.admin, open, unread, reviews, errors, overdue, assistant: canAssist };
};
