import { fail } from '@sveltejs/kit';
import { sql } from '#lib/server/db.ts';
import { hostCalendarUrl, newRef } from '#lib/server/bookings.ts';
import { getSeasons } from '#lib/server/settings.ts';
import { changeRow, done, log } from '#lib/server/activity.ts';
import { fmtDate } from '#lib/i18n.ts';

const span = (from: string, to: string) => `${fmtDate(from, 'de', { month: 'short' })} bis ${fmtDate(to, 'de', { month: 'short' })}`;

export const load = async () => {
	const [bookings, seasons] = await Promise.all([
		sql<{ id: number; status: string; name: string | null; hostNote: string | null; checkIn: string; checkOut: string }[]>`
			select id, status, name, host_note, check_in, check_out from bookings
			where status in ('angefragt', 'bestaetigt', 'gesperrt') and check_out >= current_date order by check_in`,
		getSeasons()
	]);
	return { bookings, seasons, feed: hostCalendarUrl() };
};

const iso = (v: FormDataEntryValue | null) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

export const actions = {
	block: async ({ request, locals }) => {
		const f = await request.formData();
		const [from, to] = [iso(f.get('from')), iso(f.get('to'))];
		if (!from || !to || to <= from) return fail(400, { error: 'Bitte wähle ein gültiges Von und Bis.' });
		try {
			const [row] = await sql`insert into bookings (ref, status, check_in, check_out, host_note)
				values (${newRef()}, 'gesperrt', ${from}, ${to}, ${String(f.get('note') ?? '').slice(0, 200) || null}) returning id`;
			const a = await log({ actor: locals.admin!, area: 'Kalender', title: `Gesperrt: ${span(from, to)}`, link: '/admin/kalender', target: `bookings:${row.id}`, undo: { table: 'bookings', id: row.id, before: null } });
			return done('Die Zeit ist gesperrt', a);
		} catch (e) {
			if ((e as { code?: string }).code === '23P01') return fail(409, { error: 'In dieser Zeit gibt es schon eine Buchung oder Sperre.' });
			throw e;
		}
	},
	unblock: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		const [b] = await sql`select check_in, check_out from bookings where id = ${id} and status = 'gesperrt'`;
		if (!b) return;
		const a = await changeRow('bookings', id, { actor: locals.admin!, area: 'Kalender', title: `Sperre aufgehoben: ${span(b.checkIn, b.checkOut)}`, link: '/admin/kalender' }, () =>
			sql`delete from bookings where id = ${id} and status = 'gesperrt'`
		);
		return done('Die Sperre ist aufgehoben', a);
	}
};
