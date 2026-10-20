import { randomBytes } from 'node:crypto';
import { SITE_URL } from '$app/env/private';
import { mac, safeEqual } from './signing.ts';
import { quote, chf, type Guests, type Range } from '#lib/booking.ts';
import { dict, fmtDate, localize, type Lang } from '#lib/i18n.ts';
import { sql } from './db.ts';
import { sendMail, threadAddress, type Attachment, type Mail } from './mail.ts';
import { getSeasons, getSettings, hostInbox } from './settings.ts';
import { translateMessage } from './translate.ts';
import { calendar, zurich } from './ics.ts';
import { invoicePdf } from './invoicePdf.ts';

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
	confirmedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

const sign = (purpose: string, ref: string) => mac(purpose, ref);
const adminUrl = (b: Pick<Booking, 'id'>) => `${SITE_URL}/admin/buchungen/${b.id}`;

export const guestToken = (ref: string) => `${ref}-${sign('guest', ref).subarray(0, 18).toString('base64url')}`;
export const guestUrl = (b: Pick<Booking, 'ref' | 'lang'>) =>
	`${SITE_URL}${localize(b.lang, `/buchung/${guestToken(b.ref)}`)}`;

/** Dates, people, price and booking number: the box in the designed mails. */
export function mailFacts(b: Booking, lang: Lang = b.lang): [string, string][] {
	const t = dict[lang];
	return [
		[t.card.checkIn, fmtDate(b.checkIn, lang)],
		[t.card.checkOut, fmtDate(b.checkOut, lang)],
		[t.mail.guests, String(b.adults + b.children + b.infants)],
		[t.card.total, chf(b.totalRp ?? 0)],
		[t.booking.ref, b.ref]
	];
}

export const calendarUrl = (b: Pick<Booking, 'ref' | 'lang'>) => `${guestUrl(b)}/kalender.ics`;

/** The stay as a calendar entry, with a reminder the day before. */
export async function stayCalendar(b: Booking) {
	const { name, rates } = await getSettings();
	return calendar(name, [
		{ uid: `${b.ref}@alphuette-kiental.ch`, start: zurich(b.checkIn, rates.checkIn), end: zurich(b.checkOut, rates.checkOut), title: name, location: 'Lengschwendi, 3723 Kiental', description: guestUrl(b), url: guestUrl(b), alarm: true }
	]);
}

/** Secret part of the address of Tom's calendar subscription. */
export const hostCalendarKey = () => mac('calendar', 'host').subarray(0, 18).toString('base64url');
export const hostCalendarUrl = () => `${SITE_URL}/kalender/${hostCalendarKey()}.ics`;

/** All bookings from three months back, for Tom's phone: confirmed stays, open requests, blocked weeks. */
export async function hostCalendar() {
	const { name, rates } = await getSettings();
	const rows = await sql<Booking[]>`
		select * from bookings where status in ('angefragt', 'bestaetigt', 'gesperrt') and check_out >= current_date - 90 order by check_in`;
	return calendar(
		name,
		rows.map((b) => {
			const people = b.adults + b.children + b.infants;
			const title = b.status === 'gesperrt' ? `Gesperrt${b.hostNote ? `: ${b.hostNote}` : ''}` : `${b.status === 'angefragt' ? 'Anfrage: ' : ''}${b.name}, ${people} ${people === 1 ? 'Person' : 'Personen'}`;
			const details = b.status === 'gesperrt' ? [] : [b.phone && `Telefon ${b.phone}`, `Total ${chf(b.totalRp ?? 0)}, ${b.paidAt ? 'bezahlt' : 'noch nicht bezahlt'}`, adminUrl(b)];
			return { uid: `${b.ref}@alphuette-kiental.ch`, start: zurich(b.checkIn, rates.checkIn), end: zurich(b.checkOut, rates.checkOut), title, description: details.filter(Boolean).join('\n'), url: b.status === 'gesperrt' ? undefined : adminUrl(b) };
		})
	);
}

/** Calendar entry, and the bill as PDF once Tom's payment details are complete. */
export async function bookingFiles(b: Booking, invoice = true): Promise<Attachment[]> {
	const files: Attachment[] = [{ filename: `alphuette-${b.ref}.ics`, content: new TextEncoder().encode(await stayCalendar(b)), type: 'text/calendar' }];
	if (invoice) {
		const { host, name } = await getSettings();
		const pdf = await invoicePdf(b, host, name).catch(async (e) => {
			await import('./monitor.ts').then((m) => m.report(e, 'Rechnung als PDF'));
			return null;
		});
		if (pdf) files.push({ filename: `${dict[b.lang].invoice.title}-${b.ref}.pdf`, content: pdf, type: 'application/pdf' });
	}
	return files;
}

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
	await sendMail(await flowMail('confirm', booking));
	return { booking };
}

/** The guest opened the link from the mail and confirmed: now Tom gets the request. */
export async function confirmEmail(id: number) {
	const [b] = await sql<Booking[]>`
		update bookings set status = 'angefragt', updated_at = now()
		where id = ${id} and status = 'unbestaetigt' returning *`;
	if (!b) return false;
	await sendMail(await flowMail('request', b));
	await sendMail(await flowMail('host', b));
	return true;
}


const FROM = { bestaetigt: ['angefragt'], abgelehnt: ['angefragt'], storniert: ['unbestaetigt', 'angefragt', 'bestaetigt'] };

export const FLOW_MAILS = {
	confirm: 'E-Mail-Adresse bestätigen (an den Gast)',
	request: 'Anfrage ist bei Tom (an den Gast)',
	host: 'Neue Anfrage (an dich)',
	bestaetigt: 'Buchung bestätigt (an den Gast)',
	abgelehnt: 'Anfrage abgelehnt (an den Gast)',
	storniert: 'Buchung storniert (an den Gast)'
} as const;
export type FlowMail = keyof typeof FLOW_MAILS;

/** The mails of the booking flow, built in one place so the admin can preview them. */
export async function flowMail(kind: FlowMail, b: Booking, files = true): Promise<Mail> {
	const m = dict[b.lang].mail;
	const [from, to] = [fmtDate(b.checkIn, b.lang), fmtDate(b.checkOut, b.lang)];
	const people = b.adults + b.children + b.infants;
	const reply = replyTo(b.ref);
	const hello = `${m.hello(b.name)}\n\n`;
	const toBooking = { label: m.bookingButton, url: guestUrl(b) };
	switch (kind) {
		case 'confirm':
			return { to: b.email, subject: m.confirmSubject(b.ref), heading: m.confirmHeading, text: hello + m.confirmText(from, to, guestUrl(b)), button: { label: m.confirmButton, url: guestUrl(b) }, facts: mailFacts(b) };
		case 'request':
			return { to: b.email, replyTo: reply, subject: m.requestSubject(b.ref), heading: m.requestHeading, text: hello + m.requestText(from, to, people, guestUrl(b)) + (reply ? `\n\n${m.canReply}` : ''), button: toBooking, facts: mailFacts(b) };
		case 'host':
			return {
				to: await hostInbox(),
				replyTo: reply,
				subject: `Neue Anfrage: ${b.name}, ${fmtDate(b.checkIn, 'de', { year: undefined })} bis ${fmtDate(b.checkOut, 'de', { year: undefined })}`,
				heading: `Neue Anfrage von ${b.name}`,
				text: `${b.name}${b.city ? ` aus ${b.city}` : ''} möchte das Hüttli mieten.${b.note ? `\n\nNachricht:\n${b.note}` : ''}\n\nBestätigen oder ablehnen:\n${adminUrl(b)}${reply ? '\n\nWenn du auf diese Mail antwortest, geht die Antwort an den Gast.' : ''}`,
				button: { label: 'Bestätigen oder ablehnen', url: adminUrl(b) },
				facts: [...mailFacts(b, 'de').slice(0, 2), ['Erwachsene, Kinder, Kleinkinder', `${b.adults}, ${b.children}, ${b.infants}`], ['Bettwäsche', String(b.linen)], ...mailFacts(b, 'de').slice(3)]
			};
		case 'bestaetigt': {
			const attachments = files ? await bookingFiles(b) : [];
			const bill = attachments.some((f) => f.type === 'application/pdf');
			return {
				to: b.email,
				replyTo: reply,
				subject: m.confirmedSubject(b.ref),
				heading: m.confirmedHeading,
				text: hello + m.confirmedText(from, to, chf(b.totalRp ?? 0), guestUrl(b)) + (bill ? `\n\n${m.invoiceAttached}` : ''),
				button: toBooking,
				facts: mailFacts(b),
				links: [{ label: m.calendar, url: calendarUrl(b) }],
				attachments
			};
		}
		case 'abgelehnt':
			return { to: b.email, replyTo: reply, subject: m.declinedSubject(b.ref), heading: m.declinedHeading, text: hello + m.declinedText(from, to, SITE_URL + localize(b.lang, '/')), button: { label: m.againButton, url: SITE_URL + localize(b.lang, '/') } };
		case 'storniert':
			return { to: b.email, replyTo: reply, subject: m.cancelledSubject(b.ref), heading: m.cancelledHeading, text: hello + m.cancelledText(from, to, guestUrl(b)), button: toBooking };
	}
}

/** Host changes the status. Returns false if the transition is not allowed. */
export async function setStatus(id: number, status: 'bestaetigt' | 'abgelehnt' | 'storniert', notify = true) {
	const [b] = await sql<Booking[]>`
		update bookings set status = ${status}, updated_at = now(), confirmed_at = ${status === 'bestaetigt' ? sql`now()` : sql`confirmed_at`}
		where id = ${id} and status in ${sql(FROM[status])} returning *`;
	if (!b) return false;
	if (notify) await sendMail(await flowMail(status, b));
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
			to: await hostInbox(),
			subject: `Anfrage zurückgezogen: ${b.name} (${b.ref})`,
			heading: 'Anfrage zurückgezogen',
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
			to: await hostInbox(),
			replyTo: replyTo(b.ref),
			subject: `Nachricht von ${b.name} (${b.ref})`,
			heading: `Nachricht von ${b.name}`,
			button: { label: 'Im Admin ansehen', url: adminUrl(b) },
			text: `${translation ? `${translation}\n\n(automatisch übersetzt, Original:)\n${body}` : body}\n\n---\n${adminUrl(b)}${replyTo(b.ref) ? '\nAntworte direkt auf diese Mail oder im Admin. Schreib ruhig auf Deutsch, der Gast bekommt es übersetzt.' : ''}`
		});
	} else {
		const m = dict[b.lang].mail;
		await sendMail({
			to: b.email,
			replyTo: replyTo(b.ref),
			subject: m.messageSubject(b.ref),
			heading: m.messageHeading,
			button: { label: m.bookingButton, url: guestUrl(b) },
			text: `${translation ? `${translation}\n\n${m.messageOriginal}\n${body}` : body}\n\n---\n${guestUrl(b)}`
		});
	}
}

export const messagesOf = (bookingId: number) =>
	sql<{ id: number; author: 'gast' | 'host'; body: string; translation: string | null; via: string; createdAt: Date }[]>`
		select id, author, body, translation, via, created_at from messages where booking_id = ${bookingId} order by created_at`;
