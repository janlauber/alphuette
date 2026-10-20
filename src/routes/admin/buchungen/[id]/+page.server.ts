import { error, fail } from '@sveltejs/kit';
import { sql } from '#lib/server/db.ts';
import { addMessage, guestUrl, messagesOf, setStatus, type Booking } from '#lib/server/bookings.ts';

async function booking(id: string) {
	const [b] = await sql<Booking[]>`select * from bookings where id = ${Number(id)} and status <> 'gesperrt'`;
	if (!b) error(404, 'Not found');
	return b;
}

export const load = async ({ params }) => {
	const b = await booking(params.id);
	await sql`update messages set read_at = now() where booking_id = ${b.id} and author = 'gast' and read_at is null`;
	const [messages, [{ stays }]] = await Promise.all([
		messagesOf(b.id),
		sql`select count(*)::int as stays from bookings where lower(email) = lower(${b.email}) and status = 'bestaetigt'`
	]);
	return { b, messages, stays, guestLink: guestUrl(b) };
};

export const actions = {
	confirm: async ({ params }) => {
		if (!(await setStatus(Number(params.id), 'bestaetigt'))) return fail(409, { error: 'Die Daten sind nicht mehr frei oder die Anfrage ist nicht mehr offen.' });
	},
	decline: async ({ params }) => {
		await setStatus(Number(params.id), 'abgelehnt');
	},
	cancel: async ({ params, request }) => {
		const notify = (await request.formData()).get('notify') === 'on';
		await setStatus(Number(params.id), 'storniert', notify);
	},
	paid: async ({ params, request }) => {
		const paid = (await request.formData()).get('paid') === '1';
		await sql`update bookings set paid_at = ${paid ? sql`now()` : null}, updated_at = now() where id = ${Number(params.id)}`;
	},
	note: async ({ params, request }) => {
		const note = String((await request.formData()).get('note') ?? '').slice(0, 5000);
		await sql`update bookings set host_note = ${note || null} where id = ${Number(params.id)}`;
		return { noteSaved: true };
	},
	message: async ({ params, request }) => {
		const body = String((await request.formData()).get('body') ?? '').trim().slice(0, 5000);
		if (!body) return fail(400, { empty: true });
		await addMessage(await booking(params.id), 'host', body);
	}
};
