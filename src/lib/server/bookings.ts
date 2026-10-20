import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { ADMIN_EMAILS, APP_SECRET, SITE_URL } from '$app/env/private';
import { quote, chf, type Guests, type Range } from '#lib/booking.ts';
import { fmtDate, type Lang } from '#lib/i18n.ts';
import { sql } from './db.ts';
import { sendMail, threadAddress } from './mail.ts';
import { getSeasons, getSettings } from './settings.ts';

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

// Guest links and reply addresses are signed, so no tokens are stored.
let signingKey = APP_SECRET ?? '';

/** Key from APP_SECRET, else one generated once and kept in the database. Called at startup. */
export async function loadSigningKey() {
	if (signingKey) return;
	await sql`insert into settings (key, value) values ('signing_key', ${sql.json(randomBytes(32).toString('base64url'))})
		on conflict (key) do nothing`;
	const [row] = await sql`select value from settings where key = 'signing_key'`;
	signingKey = row.value;
}

const sign = (purpose: string, ref: string) => {
	if (!signingKey) throw new Error('signing key not loaded');
	return createHmac('sha256', signingKey).update(`${purpose}:${ref}`).digest();
};
const safeEqual = (a: Buffer, b: Buffer) => a.length === b.length && timingSafeEqual(a, b);

export const guestToken = (ref: string) => `${ref}-${sign('guest', ref).subarray(0, 18).toString('base64url')}`;
export const guestUrl = (b: Pick<Booking, 'ref' | 'lang'>) =>
	`${SITE_URL}${b.lang === 'en' ? '/en' : ''}/buchung/${guestToken(b.ref)}`;

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
		where status in ('angefragt', 'bestaetigt', 'gesperrt') and check_out > current_date
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
		[booking] = await sql<Booking[]>`
			insert into bookings (ref, status, check_in, check_out, name, email, phone, city, lang,
				adults, children, infants, linen, arrival, note, quote, total_rp)
			values (${newRef()}, 'angefragt', ${r.checkIn}, ${r.checkOut}, ${r.name}, ${r.email}, ${r.phone || null},
				${r.city}, ${r.lang}, ${r.guests.adults}, ${r.guests.children}, ${r.guests.infants}, ${r.guests.linen},
				${r.arrival}, ${r.note || null}, ${sql.json({ nights: q.nights, lines: q.lines })}, ${q.total})
			returning *`;
	} catch (e) {
		if (isExclusionViolation(e)) return { error: 'taken' as const };
		throw e;
	}
	if (r.note) await sql`insert into messages (booking_id, author, body) values (${booking.id}, 'gast', ${r.note})`;

	const when = `${fmtDate(r.checkIn, r.lang)} bis ${fmtDate(r.checkOut, r.lang)}`;
	const people = r.guests.adults + r.guests.children + r.guests.infants;
	await sendMail({
		to: r.email,
		replyTo: replyTo(booking.ref),
		subject:
			r.lang === 'en' ? `Your request for the Alphütte (${booking.ref})` : `Deine Anfrage für die Alphütte (${booking.ref})`,
		text:
			r.lang === 'en'
				? `Hello ${r.name}\n\nThank you for your request from ${fmtDate(r.checkIn, 'en')} to ${fmtDate(r.checkOut, 'en')} for ${people} ${people === 1 ? 'person' : 'people'}. Tom will reply as soon as possible. The dates are held for you until then.\n\nYour request, messages and later the bill are here:\n${guestUrl(booking)}${replyTo(booking.ref) ? '\n\nYou can reply to this email directly.' : ''}`
				: `Hoi ${r.name}\n\nDanke für deine Anfrage vom ${when} für ${people} ${people === 1 ? 'Person' : 'Personen'}. Tom meldet sich so bald wie möglich. Bis dahin sind die Daten für dich reserviert.\n\nDeine Anfrage, die Nachrichten und später die Rechnung findest du hier:\n${guestUrl(booking)}${replyTo(booking.ref) ? '\n\nDu kannst direkt auf diese Mail antworten.' : ''}`
	});
	await sendMail({
		to: ADMIN_EMAILS,
		replyTo: replyTo(booking.ref),
		subject: `Neue Anfrage: ${r.name}, ${fmtDate(r.checkIn, 'de', { year: undefined })} bis ${fmtDate(r.checkOut, 'de', { year: undefined })}`,
		text: `${r.name} aus ${r.city} fragt an:\n\n${when}\n${r.guests.adults} Erwachsene, ${r.guests.children} Kinder, ${r.guests.infants} Kleinkinder\nTotal ${chf(q.total)}\n${r.note ? `\nNachricht:\n${r.note}\n` : ''}\nBestätigen oder ablehnen:\n${SITE_URL}/admin/buchungen/${booking.id}${replyTo(booking.ref) ? '\n\nWenn du auf diese Mail antwortest, geht die Antwort an den Gast.' : ''}`
	});
	return { booking };
}

const STATUS_MAIL = {
	bestaetigt: {
		de: (b: Booking) => ({
			subject: `Deine Buchung ist bestätigt (${b.ref})`,
			text: `Hoi ${b.name}\n\nTom hat deine Buchung vom ${fmtDate(b.checkIn, 'de')} bis ${fmtDate(b.checkOut, 'de')} bestätigt. Das Hüttli ist für dich reserviert.\n\nDie QR-Rechnung über ${chf(b.totalRp ?? 0)} und die Infos zur Anreise findest du hier:\n${guestUrl(b)}\n\nWir freuen uns auf dich.`
		}),
		en: (b: Booking) => ({
			subject: `Your booking is confirmed (${b.ref})`,
			text: `Hello ${b.name}\n\nTom has confirmed your booking from ${fmtDate(b.checkIn, 'en')} to ${fmtDate(b.checkOut, 'en')}. The hut is reserved for you.\n\nThe QR bill for ${chf(b.totalRp ?? 0)} and information on how to get there are here:\n${guestUrl(b)}\n\nWe look forward to your visit.`
		})
	},
	abgelehnt: {
		de: (b: Booking) => ({
			subject: `Deine Anfrage für die Alphütte (${b.ref})`,
			text: `Hoi ${b.name}\n\nTom kann deine Anfrage vom ${fmtDate(b.checkIn, 'de')} bis ${fmtDate(b.checkOut, 'de')} leider nicht annehmen. Vielleicht passt ein anderes Datum:\n${SITE_URL}/`
		}),
		en: (b: Booking) => ({
			subject: `Your request for the Alphütte (${b.ref})`,
			text: `Hello ${b.name}\n\nUnfortunately Tom cannot accept your request from ${fmtDate(b.checkIn, 'en')} to ${fmtDate(b.checkOut, 'en')}. Maybe another date works:\n${SITE_URL}/en`
		})
	},
	storniert: {
		de: (b: Booking) => ({
			subject: `Deine Buchung ist storniert (${b.ref})`,
			text: `Hoi ${b.name}\n\nDeine Buchung vom ${fmtDate(b.checkIn, 'de')} bis ${fmtDate(b.checkOut, 'de')} ist storniert.\n\n${guestUrl(b)}`
		}),
		en: (b: Booking) => ({
			subject: `Your booking has been cancelled (${b.ref})`,
			text: `Hello ${b.name}\n\nYour booking from ${fmtDate(b.checkIn, 'en')} to ${fmtDate(b.checkOut, 'en')} has been cancelled.\n\n${guestUrl(b)}`
		})
	}
};

const FROM = { bestaetigt: ['angefragt'], abgelehnt: ['angefragt'], storniert: ['angefragt', 'bestaetigt'] };

/** Host changes the status. Returns false if the transition is not allowed. */
export async function setStatus(id: number, status: keyof typeof STATUS_MAIL, notify = true) {
	const [b] = await sql<Booking[]>`
		update bookings set status = ${status}, updated_at = now()
		where id = ${id} and status in ${sql(FROM[status])} returning *`;
	if (!b) return false;
	if (notify) await sendMail({ to: b.email, replyTo: replyTo(b.ref), ...STATUS_MAIL[status][b.lang](b) });
	return true;
}

/** Guest withdraws their own pending request. */
export async function withdraw(id: number) {
	const [b] = await sql<Booking[]>`
		update bookings set status = 'storniert', updated_at = now()
		where id = ${id} and status = 'angefragt' returning *`;
	if (b)
		await sendMail({
			to: ADMIN_EMAILS,
			subject: `Anfrage zurückgezogen: ${b.name} (${b.ref})`,
			text: `${b.name} hat die Anfrage vom ${fmtDate(b.checkIn, 'de')} bis ${fmtDate(b.checkOut, 'de')} zurückgezogen. Die Daten sind wieder frei.`
		});
	return !!b;
}

export async function addMessage(b: Booking, author: 'gast' | 'host', body: string, via: 'web' | 'mail' = 'web') {
	await sql`insert into messages (booking_id, author, body, via) values (${b.id}, ${author}, ${body}, ${via})`;
	if (author === 'gast') {
		await sendMail({
			to: ADMIN_EMAILS,
			replyTo: replyTo(b.ref),
			subject: `Nachricht von ${b.name} (${b.ref})`,
			text: `${body}\n\n---\n${SITE_URL}/admin/buchungen/${b.id}${replyTo(b.ref) ? '\nAntworte direkt auf diese Mail oder im Admin.' : ''}`
		});
	} else {
		await sendMail({
			to: b.email,
			replyTo: replyTo(b.ref),
			subject: b.lang === 'en' ? `Message from Tom (${b.ref})` : `Nachricht von Tom (${b.ref})`,
			text: `${body}\n\n---\n${guestUrl(b)}`
		});
	}
}

export const messagesOf = (bookingId: number) =>
	sql<{ id: number; author: 'gast' | 'host'; body: string; via: string; createdAt: Date }[]>`
		select id, author, body, via, created_at from messages where booking_id = ${bookingId} order by created_at`;
