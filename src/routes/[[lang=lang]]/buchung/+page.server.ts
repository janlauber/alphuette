import { fail } from '@sveltejs/kit';
import { SITE_URL } from '$app/env/private';
import { sql } from '#lib/server/db.ts';
import { guestUrl, type Booking } from '#lib/server/bookings.ts';
import { sendMail } from '#lib/server/mail.ts';
import { limited } from '#lib/server/limit.ts';
import { dict, fmtDate } from '#lib/i18n.ts';

export const actions = {
	// Sends the links to all current bookings of an address. Answers the same whether there are any or not.
	default: async ({ request, params, getClientAddress }) => {
		const lang = (params.lang ?? 'de') as Booking['lang'];
		const email = String((await request.formData()).get('email') ?? '').trim().toLowerCase().slice(0, 200);
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, { email, invalid: true });
		if (limited('find:' + getClientAddress(), 5, 60 * 60_000) || limited('find:' + email, 3, 60 * 60_000)) return { sent: true };
		const bookings = await sql<Booking[]>`
			select * from bookings where lower(email) = ${email} and status in ('angefragt', 'bestaetigt') and check_out >= current_date - 60
			order by check_in`;
		if (bookings.length) {
			const m = dict[lang].mail;
			const list = bookings.map((b) => `${fmtDate(b.checkIn, lang)} – ${fmtDate(b.checkOut, lang)}\n${guestUrl({ ...b, lang })}`).join('\n\n');
			await sendMail({ to: email, subject: m.linksSubject, text: `${m.linksText(list)}\n\n${SITE_URL}` });
		}
		return { sent: true };
	}
};
