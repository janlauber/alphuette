import { ADMIN_EMAILS, SITE_URL } from '$app/env/private';
import { sql } from './db.ts';
import { sendMail } from './mail.ts';
import { spamCheck } from '#lib/mailfilter.ts';
import { domainAge } from './rdap.ts';

// Mail to hallo@ and other addresses of the domain. Known senders (Tom, guests with a booking,
// senders Tom let through) are forwarded as they are. Unknown ones are checked: spam stays in the
// admin, the rest goes out with "[Unbekannt]" so Tom can block the sender if it is advertising.
export type Received = { from: string; to: string; subject: string; full: string; attachments: number };

export async function senderKind(address: string, inbox: string[]): Promise<'known' | 'blocked' | 'unknown'> {
	if (ADMIN_EMAILS.includes(address) || inbox.some((a) => a.toLowerCase() === address)) return 'known';
	const [s] = await sql`select allowed from mail_senders where address = ${address}`;
	if (s) return s.allowed ? 'known' : 'blocked';
	const [b] = await sql`select 1 from bookings where lower(email) = ${address} limit 1`;
	return b ? 'known' : 'unknown';
}

export function forward(inbox: string[], sender: string, mail: Received, unknown = false) {
	const host = new URL(SITE_URL).host;
	return sendMail({
		to: inbox,
		replyTo: sender,
		subject: `${unknown ? '[Unbekannt] ' : ''}${mail.subject || '(ohne Betreff)'}`,
		text:
			`Weitergeleitet von ${host}\nVon: ${mail.from}\nAn: ${mail.to}${mail.attachments ? `\nAnhänge: ${mail.attachments} (nicht mitgeschickt, im Resend-Konto)` : ''}\n\n${mail.full.slice(0, 50_000)}` +
			(unknown ? `\n\n---\nDiese Adresse kennt die Website noch nicht. Ist es Werbung? Unter ${SITE_URL}/admin/mails#unbekannt sperrst du den Absender.` : '')
	});
}

/** Handles a mail that belongs to no booking. */
export async function receive(inbox: string[], sender: string, mail: Received) {
	const kind = await senderKind(sender, inbox);
	if (kind === 'known') return forward(inbox, sender, mail);
	const { spam, reasons } = kind === 'blocked' ? { spam: true, reasons: ['Absender gesperrt'] } : spamCheck({ subject: mail.subject, text: mail.full, domainAge: await domainAge(sender) });
	await sql`insert into unknown_mails (sender, from_full, recipient, subject, body, attachments, reasons, held, forwarded_at)
		values (${sender}, ${mail.from}, ${mail.to}, ${mail.subject}, ${mail.full.slice(0, 50_000)}, ${mail.attachments}, ${reasons}, ${spam}, ${spam ? null : sql`now()`})`;
	if (!spam) await forward(inbox, sender, mail, true);
}
