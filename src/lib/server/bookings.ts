import { randomBytes } from 'node:crypto';
import { ADMIN_EMAILS, SITE_URL } from '$app/env/private';
import { mac, safeEqual } from './signing.ts';
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

const sign = (purpose: string, ref: string) => mac(purpose, ref);

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
				insert into bookings (ref, status, check_in, check_out, name, email, phone, city, lang,
					adults, children, infants, linen, arrival, note, quote, total_rp)
				values (${newRef()}, 'unbestaetigt', ${r.checkIn}, ${r.checkOut}, ${r.name}, ${r.email}, ${r.phone || null},
					${r.city}, ${r.lang}, ${r.guests.adults}, ${r.guests.children}, ${r.guests.infants}, ${r.guests.linen},
					${r.arrival}, ${r.note || null}, ${sql.json({ nights: q.nights, lines: q.lines })}, ${q.total})
				returning *`;
		});
	} catch (e) {
		if (isExclusionViolation(e)) return { error: 'taken' as const };
		throw e;
	}
	if (r.note) await sql`insert into messages (booking_id, author, body) values (${booking.id}, 'gast', ${r.note})`;

	// Only the guest gets mail now; Tom hears about it once the address is confirmed.
	await sendMail({
		to: r.email,
		subject: r.lang === 'en' ? `Please confirm your request (${booking.ref})` : `Bitte bestätige deine Anfrage (${booking.ref})`,
		text:
			r.lang === 'en'
				? `Hello ${r.name}\n\nPlease confirm your request for the Alphütte from ${fmtDate(r.checkIn, 'en')} to ${fmtDate(r.checkOut, 'en')} with this link. The week is held for you for 30 minutes.\n\n${guestUrl(booking)}\n\nIf you did not send a request, ignore this email.`
				: `Hoi ${r.name}\n\nBitte bestätige deine Anfrage für die Alphütte vom ${fmtDate(r.checkIn, 'de')} bis ${fmtDate(r.checkOut, 'de')} mit diesem Link. Die Woche ist 30 Minuten für dich reserviert.\n\n${guestUrl(booking)}\n\nWenn du keine Anfrage geschickt hast, kannst du diese Mail ignorieren.`
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
	await sendMail({
		to: b.email,
		replyTo: replyTo(b.ref),
		subject: b.lang === 'en' ? `Your request for the Alphütte (${b.ref})` : `Deine Anfrage für die Alphütte (${b.ref})`,
		text:
			b.lang === 'en'
				? `Hello ${b.name}\n\nThank you, your request from ${fmtDate(b.checkIn, 'en')} to ${fmtDate(b.checkOut, 'en')} for ${people} ${people === 1 ? 'person' : 'people'} is with Tom now. He will reply by email. The dates are held for you until then.\n\nYour request, messages and later the bill:\n${guestUrl(b)}${replyTo(b.ref) ? '\n\nYou can reply to this email directly.' : ''}`
				: `Hoi ${b.name}\n\nDanke, deine Anfrage vom ${when} für ${people} ${people === 1 ? 'Person' : 'Personen'} ist jetzt bei Tom. Er meldet sich per Mail. Bis dahin sind die Daten für dich reserviert.\n\nDeine Anfrage, die Nachrichten und später die Rechnung:\n${guestUrl(b)}${replyTo(b.ref) ? '\n\nDu kannst direkt auf diese Mail antworten.' : ''}`
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

const FROM = { bestaetigt: ['angefragt'], abgelehnt: ['angefragt'], storniert: ['unbestaetigt', 'angefragt', 'bestaetigt'] };

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
