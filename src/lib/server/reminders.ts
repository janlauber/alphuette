import { SITE_URL } from '$app/env/private';
import { chf } from '#lib/booking.ts';
import { dict, fmtDate, type Lang } from '#lib/i18n.ts';
import { sql } from './db.ts';
import { bookingFiles, guestUrl, type Booking } from './bookings.ts';
import { sendMail, type Mail } from './mail.ts';
import { getSettings, inbox, type Settings } from './settings.ts';
import { lookup } from './translate.ts';
import { log } from './activity.ts';

// Mails the website sends by itself, from templates Tom writes in German (table mail_templates).
// Guests get them in their language via the translations table; each goes out once per booking.
export const TRIGGERS = {
	before_arrival: 'Tage vor der Anreise',
	unpaid_before_arrival: 'Tage vor der Anreise, wenn noch nicht bezahlt',
	after_departure: 'Tage nach der Abreise',
	unregistered_before_arrival: 'Tage vor der Anreise, wenn noch nicht in Deskline erfasst',
	unregistered_after_departure: 'Tage nach der Abreise, wenn noch nicht in Deskline erfasst'
} as const;
export type Trigger = keyof typeof TRIGGERS;

/** What Tom can write in curly braces, and what it becomes. */
export const PLACEHOLDERS: Record<string, string> = {
	vorname: 'Vorname des Gasts',
	name: 'ganzer Name',
	anreise: 'Anreisedatum',
	abreise: 'Abreisedatum',
	anreisezeit: 'Anreise ab (Uhrzeit)',
	abreisezeit: 'Abreise bis (Uhrzeit)',
	personen: 'Anzahl Personen',
	betrag: 'Rechnungsbetrag',
	faellig: 'Zahlbar bis (14 Tage vor der Anreise)',
	nummer: 'Buchungsnummer',
	link: 'Link zur Buchungsseite des Gasts',
	rechnung: 'Link zur QR-Rechnung',
	bewertung: 'Link zum Schreiben einer Bewertung',
	anreiseinfos: 'Texte «Anreise» und «Infos nur für bestätigte Gäste»',
	ort: 'Wohnort',
	telefon: 'Telefon',
	gaeste: 'Gäste nach Alter und Bettwäsche',
	zahlung: 'bezahlt oder offen',
	verwaltung: 'Link zur Buchung in der Verwaltung',
	voranmeldung: 'Link zur Gästemeldung in Deskline (Pre-Check-in), unter Gastgeber hinterlegt'
};

export type Template = { id: number; key: string | null; label: string; audience: 'gast' | 'host'; trigger: Trigger; days: number; subject: string; body: string; active: boolean };

export const render = (text: string, v: Record<string, string>) => text.replace(/\{(\w+)\}/g, (m, k: string) => v[k] ?? m);

/** The values for one booking, formatted in the reader's language. */
export function values(b: Booking, lang: Lang, s: Settings): Record<string, string> {
	const due = new Date(new Date(b.checkIn + 'T00:00:00Z').getTime() - 14 * 86400_000).toISOString().slice(0, 10);
	const c = s.content[lang];
	const url = guestUrl(b);
	return {
		vorname: b.name.split(' ')[0],
		name: b.name,
		anreise: fmtDate(b.checkIn, lang),
		abreise: fmtDate(b.checkOut, lang),
		anreisezeit: s.rates.checkIn,
		abreisezeit: s.rates.checkOut,
		personen: String(b.adults + b.children + b.infants),
		betrag: chf(b.totalRp ?? 0),
		faellig: fmtDate(due, lang),
		nummer: b.ref,
		link: url,
		rechnung: `${url}/rechnung`,
		bewertung: `${url}#bewertung`,
		anreiseinfos: [c.arrival, c.guest_info].filter((x) => x.trim()).join('\n\n'),
		ort: b.city ?? '',
		telefon: b.phone ?? 'nicht angegeben',
		gaeste: `Erwachsene: ${b.adults}, Kinder: ${b.children}, Kleinkinder: ${b.infants}, Bettwäsche: ${b.linen}`,
		zahlung: b.paidAt ? 'bezahlt' : `noch offen, ${chf(b.totalRp ?? 0)}`,
		verwaltung: `${SITE_URL}/admin/buchungen/${b.id}`,
		voranmeldung: s.host.precheckin
	};
}

/** The finished mail: in German for Tom, in the guest's language for guests, with a button for the link the template uses. */
export async function compose(t: Template, b: Booking, s: Settings, files = true): Promise<Mail> {
	const uses = (k: string) => t.body.includes(`{${k}}`);
	if (t.audience === 'host') {
		const v = values(b, 'de', s);
		const subject = render(t.subject, v);
		return { to: inbox(s), subject, heading: subject, text: render(t.body, v), button: uses('verwaltung') ? { label: 'Zur Buchung im Admin', url: v.verwaltung } : undefined };
	}
	let { subject, body } = t;
	if (b.lang !== 'de') {
		const tr = await lookup([subject, body], [b.lang, 'en']);
		const pick = (de: string) => tr.get(b.lang)?.get(de) ?? tr.get('en')?.get(de) ?? de;
		[subject, body] = [pick(subject), pick(body)];
	}
	const v = values(b, b.lang, s);
	const m = dict[b.lang].mail;
	const button = uses('rechnung') ? { label: m.invoiceButton, url: v.rechnung } : uses('bewertung') ? { label: m.reviewButton, url: v.bewertung } : uses('voranmeldung') ? { label: m.precheckinButton, url: v.voranmeldung } : uses('link') ? { label: m.bookingButton, url: v.link } : undefined;
	// the payment reminder carries the bill
	const bill = files && (t.trigger === 'unpaid_before_arrival' || uses('rechnung')) ? (await bookingFiles(b)).filter((f) => f.type === 'application/pdf') : [];
	const title = render(subject, v);
	return { to: b.email, subject: title, heading: title, text: render(body, v), button, attachments: bill };
}

const due = (t: Template) => {
	const confirmed = sql`status = 'bestaetigt'`;
	const unregistered = t.trigger.startsWith('unregistered') ? sql`and deskline_at is null` : sql``;
	if (t.trigger.endsWith('after_departure'))
		return sql<Booking[]>`select * from bookings where ${confirmed} and check_out + ${t.days}::int <= current_date and check_out + ${t.days}::int > current_date - 14 ${unregistered}`;
	return sql<Booking[]>`select * from bookings where ${confirmed} and check_in - ${t.days}::int <= current_date and check_in > current_date
		${t.trigger === 'unpaid_before_arrival' ? sql`and paid_at is null` : sql``} ${unregistered}`;
};

const kind = (t: Template) => t.key ?? `tpl:${t.id}`;

/** Marks the mail as sent; false if it went out before (so two runs never send twice). */
const claim = async (id: number, k: string) => (await sql`insert into booking_mails (booking_id, kind) values (${id}, ${k}) on conflict do nothing returning 1`).length > 0;

export const templates = () => sql<Template[]>`select * from mail_templates order by sort, id`;

export async function sendReminders() {
	const s = await getSettings();
	for (const t of await templates()) {
		// the Deskline link mail waits until Tom has put the link in
		if (!t.active || (t.body.includes('{voranmeldung}') && !s.host.precheckin)) continue;
		for (const b of await due(t)) {
			if (!(await claim(b.id, kind(t)))) continue;
			await sendMail(await compose(t, b, s));
			await log({ actor: 'website', area: 'Mails', title: `${t.label}: ${b.name}`, link: `/admin/buchungen/${b.id}` });
		}
	}
}

/** When which automatic mail went out for one booking, for the booking page. */
export const mailsOf = (id: number) => sql<{ kind: string; at: Date }[]>`select kind, at from booking_mails where booking_id = ${id} order by at`;

/** A made-up guest for previews and test mails. */
export const exampleBooking = (): Booking => {
	const inDays = (n: number) => new Date(Date.now() + n * 86400_000).toISOString().slice(0, 10);
	return {
		id: 0, ref: 'BEISPL', status: 'bestaetigt', checkIn: inDays(21), checkOut: inDays(28), name: 'Anna Muster', email: 'anna@example.ch',
		phone: '079 123 45 67', city: 'Bern', country: 'CH', lang: 'de', adults: 2, children: 2, infants: 0, linen: 4, arrival: 'oev', note: null, hostNote: null,
		quote: null, totalRp: 74000, paidAt: null, confirmedAt: new Date(), desklineAt: null, createdAt: new Date(), updatedAt: new Date()
	};
};
