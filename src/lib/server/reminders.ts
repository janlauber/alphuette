import { ADMIN_EMAILS, SITE_URL } from '$app/env/private';
import { chf } from '#lib/booking.ts';
import { dict, fmtDate } from '#lib/i18n.ts';
import { sql } from './db.ts';
import { guestUrl, type Booking } from './bookings.ts';
import { sendMail } from './mail.ts';
import { getSettings } from './settings.ts';
import { log } from './activity.ts';

// Mails the website sends by itself. Each kind goes out once per booking (booking_mails),
// and each one is written to the Verlauf so Tom sees what went out.
export const KINDS = {
	payment: { label: 'Zahlungserinnerung an den Gast', when: '21 Tage vor der Anreise, wenn noch nicht bezahlt' },
	arrival: { label: 'Infos zur Anreise an den Gast', when: '7 Tage vor der Anreise' },
	review: { label: 'Bitte um eine Bewertung', when: 'Am Tag nach der Abreise' },
	host: { label: 'Hinweis an dich', when: 'Am Tag vor der Anreise, mit Gästen und Zahlung' }
} as const;
export type Kind = keyof typeof KINDS;

/** Marks the mail as sent; false if it went out before (so two runs never send twice). */
const claim = async (id: number, kind: Kind) => (await sql`insert into booking_mails (booking_id, kind) values (${id}, ${kind}) on conflict do nothing returning 1`).length > 0;

/** The mail itself, also used for the preview in the admin. */
export function compose(kind: Kind, b: Booking, s: Awaited<ReturnType<typeof getSettings>>) {
	const m = dict[b.lang].mail;
	const from = fmtDate(b.checkIn, b.lang), to = fmtDate(b.checkOut, b.lang);
	const hello = `${m.hello(b.name)}\n\n`;
	if (kind === 'payment') {
		const due = new Date(new Date(b.checkIn).getTime() - 14 * 86400_000).toISOString().slice(0, 10);
		return { to: b.email, subject: m.paymentSubject(b.ref), text: hello + m.paymentText(chf(b.totalRp ?? 0), fmtDate(due, b.lang), `${guestUrl(b)}/rechnung`) };
	}
	if (kind === 'arrival') {
		const c = s.content[b.lang];
		const info = [c.arrival, c.guest_info].filter((x) => x.trim()).join('\n\n');
		return { to: b.email, subject: m.arrivalSubject(b.ref), text: hello + m.arrivalText(from, s.rates.checkIn, guestUrl(b)) + (info ? `\n\n${m.arrivalInfo}:\n\n${info}` : '') };
	}
	if (kind === 'review') return { to: b.email, subject: m.reviewSubject, text: hello + m.reviewText(`${guestUrl(b)}#bewertung`) };
	const de = (iso: string) => fmtDate(iso, 'de');
	return {
		to: ADMIN_EMAILS,
		subject: `Morgen kommt ${b.name}`,
		text: `Morgen, ${de(b.checkIn)}, kommt ${b.name}${b.city ? ` aus ${b.city}` : ''}. Abreise ${de(b.checkOut)}.\n\nErwachsene: ${b.adults}, Kinder: ${b.children}, Kleinkinder: ${b.infants}, Bettwäsche: ${b.linen}\nZahlung: ${b.paidAt ? 'bezahlt' : `noch offen, ${chf(b.totalRp ?? 0)}`}\nTelefon: ${b.phone ?? 'nicht angegeben'}\n${b.arrival === 'oev' ? 'Kommt mit dem Postauto.\n' : b.arrival === 'auto' ? 'Kommt mit dem Auto.\n' : ''}\nDenk an die Meldung in Deskline für die Gästekarte.\n\n${SITE_URL}/admin/buchungen/${b.id}`
	};
}

const DUE: Record<Kind, () => Promise<Booking[]>> = {
	payment: () => sql<Booking[]>`select * from bookings where status = 'bestaetigt' and paid_at is null and check_in - 21 <= current_date and check_in > current_date`,
	arrival: () => sql<Booking[]>`select * from bookings where status = 'bestaetigt' and check_in - 7 <= current_date and check_in > current_date`,
	review: () => sql<Booking[]>`select * from bookings where status = 'bestaetigt' and check_out <= current_date and check_out > current_date - 14`,
	host: () => sql<Booking[]>`select * from bookings where status = 'bestaetigt' and check_in = current_date + 1`
};

export async function sendReminders() {
	const s = await getSettings();
	for (const kind of Object.keys(KINDS) as Kind[]) {
		if (!s.reminders[kind]) continue;
		for (const b of await DUE[kind]()) {
			if (!(await claim(b.id, kind))) continue;
			await sendMail(compose(kind, b, s));
			await log({ actor: 'website', area: 'Mails', title: `${KINDS[kind].label}: ${b.name}`, link: `/admin/buchungen/${b.id}` });
		}
	}
}

/** When which automatic mail went out for one booking, for the booking page. */
export const mailsOf = (id: number) => sql<{ kind: Kind; at: Date }[]>`select kind, at from booking_mails where booking_id = ${id} order by at`;
