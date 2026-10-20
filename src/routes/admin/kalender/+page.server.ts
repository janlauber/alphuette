import { fail } from '@sveltejs/kit';
import { sql } from '#lib/server/db.ts';
import { newRef } from '#lib/server/bookings.ts';
import { getSeasons } from '#lib/server/settings.ts';

export const load = async () => {
	const [bookings, seasons] = await Promise.all([
		sql<{ id: number; status: string; name: string | null; hostNote: string | null; checkIn: string; checkOut: string }[]>`
			select id, status, name, host_note, check_in, check_out from bookings
			where status in ('angefragt', 'bestaetigt', 'gesperrt') and check_out >= current_date order by check_in`,
		getSeasons()
	]);
	return { bookings, seasons };
};

const iso = (v: FormDataEntryValue | null) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

export const actions = {
	block: async ({ request }) => {
		const f = await request.formData();
		const [from, to] = [iso(f.get('from')), iso(f.get('to'))];
		if (!from || !to || to <= from) return fail(400, { error: 'Bitte wähle ein gültiges Von und Bis.' });
		try {
			await sql`insert into bookings (ref, status, check_in, check_out, host_note)
				values (${newRef()}, 'gesperrt', ${from}, ${to}, ${String(f.get('note') ?? '').slice(0, 200) || null})`;
		} catch (e) {
			if ((e as { code?: string }).code === '23P01') return fail(409, { error: 'In dieser Zeit gibt es schon eine Buchung oder Sperre.' });
			throw e;
		}
	},
	unblock: async ({ request }) => {
		await sql`delete from bookings where id = ${Number((await request.formData()).get('id'))} and status = 'gesperrt'`;
	}
};
