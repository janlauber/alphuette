import { error, fail } from '@sveltejs/kit';
import { sql } from '#lib/server/db.ts';
import { addMessage, guestUrl, messagesOf, setStatus, type Booking } from '#lib/server/bookings.ts';
import { done, log } from '#lib/server/activity.ts';
import { getSettings } from '#lib/server/settings.ts';

// Status changes send mails to the guest, so they are logged but have no undo.
const note = async (id: string, actor: string, title: (name: string) => string) => {
	const b = await booking(id);
	return log({ actor, area: 'Buchungen', title: title(b.name), link: `/admin/buchungen/${b.id}` });
};

async function booking(id: string) {
	const [b] = await sql<Booking[]>`select * from bookings where id = ${Number(id)} and status <> 'gesperrt'`;
	if (!b) error(404, 'Not found');
	return b;
}

export const load = async ({ params }) => {
	const b = await booking(params.id);
	await sql`update messages set read_at = now() where booking_id = ${b.id} and author = 'gast' and read_at is null`;
	const [messages, [{ stays }], settings] = await Promise.all([
		messagesOf(b.id),
		sql`select count(*)::int as stays from bookings where lower(email) = lower(${b.email}) and status = 'bestaetigt'`,
		getSettings()
	]);
	return { b, messages, stays, guestLink: guestUrl(b), ibanMissing: !settings.host.iban };
};

export const actions = {
	confirm: async ({ params, locals }) => {
		if (!(await setStatus(Number(params.id), 'bestaetigt'))) return fail(409, { error: 'Die Daten sind nicht mehr frei oder die Anfrage ist nicht mehr offen.' });
		await note(params.id, locals.admin!, (n) => `Anfrage von ${n} bestätigt`);
		return done('Bestätigt. Der Gast bekommt jetzt eine Mail mit der Rechnung.');
	},
	decline: async ({ params, locals }) => {
		await setStatus(Number(params.id), 'abgelehnt');
		await note(params.id, locals.admin!, (n) => `Anfrage von ${n} abgelehnt`);
		return done('Abgelehnt. Der Gast bekommt eine Mail.');
	},
	cancel: async ({ params, request, locals }) => {
		const notify = (await request.formData()).get('notify') === 'on';
		await setStatus(Number(params.id), 'storniert', notify);
		await note(params.id, locals.admin!, (n) => `Buchung von ${n} storniert${notify ? ', Gast informiert' : ''}`);
		return done(notify ? 'Storniert. Der Gast bekommt eine Mail.' : 'Storniert');
	},
	paid: async ({ params, request, locals }) => {
		const paid = (await request.formData()).get('paid') === '1';
		await sql`update bookings set paid_at = ${paid ? sql`now()` : null}, updated_at = now() where id = ${Number(params.id)}`;
		await note(params.id, locals.admin!, (n) => `${n}: ${paid ? 'als bezahlt markiert' : 'wieder als offen markiert'}`);
		return done(paid ? 'Als bezahlt markiert' : 'Wieder als offen markiert');
	},
	note: async ({ params, request, locals }) => {
		const text = String((await request.formData()).get('note') ?? '').slice(0, 5000);
		await sql`update bookings set host_note = ${text || null} where id = ${Number(params.id)}`;
		await note(params.id, locals.admin!, (n) => `Notiz zu ${n} geändert`);
		return { noteSaved: true, ...done('Notiz gespeichert') };
	},
	message: async ({ params, request, locals }) => {
		const body = String((await request.formData()).get('body') ?? '').trim().slice(0, 5000);
		if (!body) return fail(400, { empty: true });
		await addMessage(await booking(params.id), 'host', body);
		await note(params.id, locals.admin!, (n) => `Nachricht an ${n} geschickt`);
		return done('Nachricht geschickt');
	}
};
