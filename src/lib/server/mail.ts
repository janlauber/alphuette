import { createHmac, timingSafeEqual } from 'node:crypto';
import { MAIL_FROM, REPLY_DOMAIN, RESEND_API_KEY, RESEND_WEBHOOK_SECRET } from '$app/env/private';

type Mail = { to: string | string[]; subject: string; text: string; replyTo?: string };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const linkify = (s: string) => s.replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}">${u}</a>`);
const html = (text: string) =>
	`<div style="font:16px/1.5 -apple-system,Segoe UI,sans-serif;color:#1e2b26;max-width:560px">` +
	text
		.split(/\n\s*\n/)
		.map((p) => `<p>${linkify(esc(p)).replace(/\n/g, '<br>')}</p>`)
		.join('') +
	'</div>';

/** Sends through Resend. Without an API key the mail is printed, so development works offline. */
export async function sendMail(m: Mail) {
	if (!RESEND_API_KEY) {
		console.log(`\n--- mail to ${m.to}${m.replyTo ? ` (reply-to ${m.replyTo})` : ''}\n${m.subject}\n\n${m.text}\n---\n`);
		return;
	}
	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
		body: JSON.stringify({ from: MAIL_FROM, to: m.to, subject: m.subject, text: m.text, html: html(m.text), reply_to: m.replyTo })
	});
	// A failed mail must not undo the booking; the host still sees everything in the admin.
	if (!res.ok) console.error('mail failed', res.status, await res.text());
}

/** Address whose replies land in the booking's message thread, if inbound mail is set up. */
export const threadAddress = (replyKey: string) => (REPLY_DOMAIN ? `${replyKey}@${REPLY_DOMAIN}` : undefined);

/** Verifies a Resend (Svix) webhook signature over the raw body. */
export function verifyWebhook(body: string, headers: Headers) {
	if (!RESEND_WEBHOOK_SECRET) return false;
	const id = headers.get('svix-id');
	const ts = headers.get('svix-timestamp');
	const sigs = headers.get('svix-signature');
	if (!id || !ts || !sigs || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
	const key = Buffer.from(RESEND_WEBHOOK_SECRET.replace(/^whsec_/, ''), 'base64');
	const expected = createHmac('sha256', key).update(`${id}.${ts}.${body}`).digest();
	return sigs.split(' ').some((s) => {
		const sig = Buffer.from(s.split(',')[1] ?? '', 'base64');
		return sig.length === expected.length && timingSafeEqual(sig, expected);
	});
}

/** Fetches the text of a received mail. */
export async function receivedText(emailId: string) {
	const res = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, {
		headers: { authorization: `Bearer ${RESEND_API_KEY}` }
	});
	if (!res.ok) throw new Error(`resend receiving ${res.status}`);
	const mail = await res.json();
	const text: string =
		mail.text ??
		String(mail.html ?? '')
			.replace(/<br\s*\/?>|<\/p>|<\/div>/gi, '\n')
			.replace(/<[^>]+>/g, '')
			.replace(/&nbsp;/g, ' ')
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>');
	return {
		from: String(mail.from ?? ''),
		to: ([] as string[]).concat(mail.to ?? []).join(', '),
		subject: String(mail.subject ?? ''),
		text: stripQuote(text),
		full: text.trim(),
		attachments: Array.isArray(mail.attachments) ? mail.attachments.length : 0,
		dmarc: mail.authentication?.dmarc as string | undefined
	};
}

// ponytail: cuts the quoted history at common reply markers; mail clients vary, the full text stays in Resend.
export function stripQuote(text: string) {
	const lines = text.replace(/\r/g, '').split('\n');
	const cut = lines.findIndex(
		(l) =>
			/^(On|Am) .+(wrote|schrieb)/.test(l.trim()) ||
			/^-{2,}\s*(Original|Ursprüngliche)/i.test(l.trim()) ||
			/^(From|Von):\s/.test(l.trim()) ||
			l.startsWith('>')
	);
	return (cut === -1 ? lines : lines.slice(0, cut)).join('\n').trim();
}
