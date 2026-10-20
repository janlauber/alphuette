import { randomBytes } from 'node:crypto';
import { ADMIN_EMAILS, SITE_URL } from '$app/env/private';
import { mac, safeEqual } from './signing.ts';
import { quote, chf, type Guests, type Range } from '#lib/booking.ts';
import { dict, fmtDate, localize, type Lang } from '#lib/i18n.ts';
import { sql } from './db.ts';
import { sendMail, threadAddress } from './mail.ts';
import { getSeasons, getSettings } from './settings.ts';
import { translateMessage } from './translate.ts';

export type Booking = {
	id: number;
	ref: string;
	status: string;
	checkIn: string;
	checkOut: string;
	name: string;
	email: string;
	phone: string | null;
	city: string | null;
	country: string | null;
	lang: Lang;
	adults: number;
	children: number;
	infants: number;
	linen: number;
	arrival: string | null;
	note: string | null;
	hostNote: string | null;
	quote: { lines: { key: string; qty: number; amount: number }[]; nights: number } | null;
	totalRp: number | null;
	paidAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

const sign = (purpose: string, ref: string) => mac(purpose, ref);

export const guestToken = (ref: string) => `${ref}-${sign('guest', ref).subarray(0, 18).toString('base64url')}`;
export const guestUrl = (b: Pick<Booking, 'ref' | 'lang'>) =>
	`${SITE_URL}${localize(b.lang, `/buchung/${guestToken(b.ref)}`)}`;

export async function bookingByToken(token: string) {
	const [ref, sig] = [token.slice(0, token.indexOf('-')), token.slice(token.indexOf('-') + 1)];
	if (!ref || !safeEqual(Buffer.from(sig, 'base64url'), sign('guest', ref).subarray(0, 18))) return null;
	const [b] = await sql<Booking[]>`select * from bookings where ref = ${ref} and status <> 'gesperrt'`;
	return b ?? null;
}

const replyKey = (ref: string) => `${ref.toLowerCase()}-${sign('reply', ref).subarray(0, 8).toString('hex')}`;
const replyTo = (ref: string) => threadAddress(replyKey(ref));

/** Finds the booking a reply address belongs to, e.g. "k7m2qx-1a2b3c4d5e6f7a8b@antwort.example.ch". */
export async function bookingByReplyAddress(address: string) {
	const local = address.toLowerCase().replace(/^.*</, '').split('@')[0];
	const ref = local.split('-')[0].toUpperCase();
	if (!ref || local !== replyKey(ref)) return null;
	const [b] = await sql<Booking[]>`select * from bookings where ref = ${ref}`;
	return b ?? null;
}

export async function takenRanges(): Promise<Range[]> {
	return sql<Range[]>`
		select check_in as start, check_out as end from bookings
		where status in ('unbestaetigt', 'angefragt', 'bestaetigt', 'gesperrt') and check_out > current_date
		order by check_in`;
}

const REF_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const newRef = () => Array.from(randomBytes(6), (b) => REF_CHARS[b % REF_CHARS.length]).join('');

export type Request = {
	checkIn: string;
	checkOut: string;
	guests: Guests;
	name: string;
	email: string;
	phone: string;
	city: string;
	country: string | null;
	arrival: 'auto' | 'oev' | null;
	note: string;
	lang: Lang;
};

const isExclusionViolation = (e: unknown) => (e as { code?: string })?.code === '23P01';

export async function createRequest(r: Request) {
	const [settings, seasons, taken] = await Promise.all([getSettings(), getSeasons(), takenRanges()]);
	const q = quote(r.checkIn, r.checkOut, r.guests, seasons, settings.rates, taken);
	if (!q.ok) return { error: q.error };

	let booking: Booking;
	try {
		[booking] = await sql.begin(async (tx) => {
			await tx`delete from bookings where status = 'unbestaetigt' and created_at < now() - interval '30 minutes'`;
			return tx<Booking[]>`
				insert into bookings (ref, status, check_in, check_out, name, email, phone, city, country, lang,
					adults, children, infants, linen, arrival, note, quote, total_rp)
				values (${newRef()}, 'unbestaetigt', ${r.checkIn}, ${r.checkOut}, ${r.name}, ${r.email}, ${r.phone || null},
					${r.city}, ${r.country}, ${r.lang}, ${r.guests.adults}, ${r.guests.children}, ${r.guests.infants}, ${r.guests.linen},
					${r.arrival}, ${r.note || null}, ${sql.json({ nights: q.nights, lines: q.lines })}, ${q.total})
				returning *`;
		});
	} catch (e) {
		if (isExclusionViolation(e)) return { error: 'taken' as const };
		throw e;
	}
	if (r.note) await sql`insert into messages (booking_id, author, body, translation) values (${booking.id}, 'gast', ${r.note}, ${await translateMessage(r.note, 'de')})`;

	// Only the guest gets mail now; Tom hears about it once the address is confirmed.
	const m = dict[r.lang].mail;
	await sendMail({
		to: r.email,
		subject: m.confirmSubject(booking.ref),
		text: `${m.hello(r.name)}\n\n${m.confirmText(fmtDate(r.checkIn, r.lang), fmtDate(r.checkOut, r.lang), guestUrl(booking))}`
	});
	return { booking };
}

/** The guest opened the link from the mail and confirmed: now Tom gets the request. */
export async function confirmEmail(id: number) {
	const [b] = await sql<Booking[]>`
		update bookings set status = 'angefragt', updated_at = now()
		where id = ${id} and status = 'unbestaetigt' returning *`;
	if (!b) return false;
	const people = b.adults + b.children + b.infants;
	const when = `${fmtDate(b.checkIn, 'de')} bis ${fmtDate(b.checkOut, 'de')}`;
	const m = dict[b.lang].mail;
	await sendMail({
		to: b.email,
		replyTo: replyTo(b.ref),
		subject: m.requestSubject(b.ref),
		text: `${m.hello(b.name)}\n\n${m.requestText(fmtDate(b.checkIn, b.lang), fmtDate(b.checkOut, b.lang), people, guestUrl(b))}${replyTo(b.ref) ? `\n\n${m.canReply}` : ''}`
	});
	await sendMail({
		to: ADMIN_EMAILS,
		replyTo: replyTo(b.ref),
		subject: `Neue Anfrage: ${b.name}, ${fmtDate(b.checkIn, 'de', { year: undefined })} bis ${fmtDate(b.checkOut, 'de', { year: undefined })}`,
		text: `${b.name} aus ${b.city} fragt an:\n\n${when}\nErwachsene: ${b.adults}, Kinder: ${b.children}, Kleinkinder: ${b.infants}\nTotal ${chf(b.totalRp ?? 0)}\n${b.note ? `\nNachricht:\n${b.note}\n` : ''}\nBestätigen oder ablehnen:\n${SITE_URL}/admin/buchungen/${b.id}${replyTo(b.ref) ? '\n\nWenn du auf diese Mail antwortest, geht die Antwort an den Gast.' : ''}`
	});
	return true;
}

const STATUS_MAIL = {
	bestaetigt: (b: Booking, m: Mail, from: string, to: string) => ({ subject: m.confirmedSubject(b.ref), text: m.confirmedText(from, to, chf(b.totalRp ?? 0), guestUrl(b)) }),
	abgelehnt: (b: Booking, m: Mail, from: string, to: string) => ({ subject: m.declinedSubject(b.ref), text: m.declinedText(from, to, SITE_URL + localize(b.lang, '/')) }),
	storniert: (b: Booking, m: Mail, from: string, to: string) => ({ subject: m.cancelledSubject(b.ref), text: m.cancelledText(from, to, guestUrl(b)) })
};
type Mail = (typeof dict)['de']['mail'];

const FROM = { bestaetigt: ['angefragt'], abgelehnt: ['angefragt'], storniert: ['unbestaetigt', 'angefragt', 'bestaetigt'] };

/** Host changes the status. Returns false if the transition is not allowed. */
export async function setStatus(id: number, status: keyof typeof STATUS_MAIL, notify = true) {
	const [b] = await sql<Booking[]>`
		update bookings set status = ${status}, updated_at = now()
		where id = ${id} and status in ${sql(FROM[status])} returning *`;
	if (!b) return false;
	if (notify) {
		const m = dict[b.lang].mail;
		const { subject, text } = STATUS_MAIL[status](b, m, fmtDate(b.checkIn, b.lang), fmtDate(b.checkOut, b.lang));
		await sendMail({ to: b.email, replyTo: replyTo(b.ref), subject, text: `${m.hello(b.name)}\n\n${text}` });
	}
	return true;
}

/** Guest withdraws their own pending request. */
export async function withdraw(id: number) {
	const [prev] = await sql`select status from bookings where id = ${id}`;
	const [b] = await sql<Booking[]>`
		update bookings set status = 'storniert', updated_at = now()
		where id = ${id} and status in ('unbestaetigt', 'angefragt') returning *`;
	if (b && prev?.status === 'angefragt')
		await sendMail({
			to: ADMIN_EMAILS,
			subject: `Anfrage zurückgezogen: ${b.name} (${b.ref})`,
			text: `${b.name} hat die Anfrage vom ${fmtDate(b.checkIn, 'de')} bis ${fmtDate(b.checkOut, 'de')} zurückgezogen. Die Daten sind wieder frei.`
		});
	return !!b;
}

/**
 * Stores a message and mails it to the other side. Guest messages get a German translation for Tom,
 * Tom's messages one in the guest's language.
 */
export async function addMessage(b: Booking, author: 'gast' | 'host', body: string, via: 'web' | 'mail' = 'web') {
	const translation = await translateMessage(body, author === 'gast' ? 'de' : b.lang);
	await sql`insert into messages (booking_id, author, body, via, translation) values (${b.id}, ${author}, ${body}, ${via}, ${translation})`;
	if (author === 'gast') {
		await sendMail({
			to: ADMIN_EMAILS,
			replyTo: replyTo(b.ref),
			subject: `Nachricht von ${b.name} (${b.ref})`,
			text: `${translation ? `${translation}\n\n(automatisch übersetzt, Original:)\n${body}` : body}\n\n---\n${SITE_URL}/admin/buchungen/${b.id}${replyTo(b.ref) ? '\nAntworte direkt auf diese Mail oder im Admin. Schreib ruhig auf Deutsch, der Gast bekommt es übersetzt.' : ''}`
		});
	} else {
		const m = dict[b.lang].mail;
		await sendMail({
			to: b.email,
			replyTo: replyTo(b.ref),
			subject: m.messageSubject(b.ref),
			text: `${translation ? `${translation}\n\n${m.messageOriginal}\n${body}` : body}\n\n---\n${guestUrl(b)}`
		});
	}
}

export const messagesOf = (bookingId: number) =>
	sql<{ id: number; author: 'gast' | 'host'; body: string; translation: string | null; via: string; createdAt: Date }[]>`
		select id, author, body, translation, via, created_at from messages where booking_id = ${bookingId} order by created_at`;
