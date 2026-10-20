import { createHmac, timingSafeEqual } from 'node:crypto';
import { MAIL_FROM, REPLY_DOMAIN, RESEND_API_KEY, RESEND_WEBHOOK_SECRET, SITE_URL } from '$app/env/private';

export type Attachment = { filename: string; content: Uint8Array; type: string };
export type Mail = {
	to: string | string[];
	subject: string;
	/** The plain text version, and the body of the designed one. */
	text: string;
	replyTo?: string;
	/** Big title in the designed version. */
	heading?: string;
	/** Line shown next to the subject in the inbox. */
	preheader?: string;
	/** Label and value pairs in a box, e.g. dates and price. */
	facts?: [string, string][];
	/** The one thing to click. If its address stands alone on a line of the text, the button takes its place. */
	button?: { label: string; url: string };
	/** Smaller links under the button, e.g. "add to calendar". */
	links?: { label: string; url: string }[];
	attachments?: Attachment[];
};

const C = { ink: '#17251c', brand: '#2f5b3c', muted: '#56655b', wash: '#eef3e7', box: '#f4f7f0', line: '#dbe4d3', accent: '#a6d785' };
const FONT = `'Outfit','Segoe UI',Helvetica,Arial,sans-serif`;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const linkify = (s: string) => s.replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}" style="color:${C.brand}">${u}</a>`);
const para = (p: string) => `<p style="margin:0 0 14px;font:16px/1.55 ${FONT};color:${C.ink}">${linkify(esc(p)).replace(/\n/g, '<br>')}</p>`;

function factsBox(facts: [string, string][]) {
	const rows = facts
		.map(([k, v]) => `<tr><td style="padding:6px 16px;font:14px/1.4 ${FONT};color:${C.muted}">${esc(k)}</td><td style="padding:6px 16px;font:600 15px/1.4 ${FONT};color:${C.ink};text-align:right;white-space:nowrap">${esc(v)}</td></tr>`)
		.join('');
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 20px;background:${C.box};border-radius:14px"><tr><td style="padding:8px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr></table>`;
}

const buttonHtml = (b: { label: string; url: string }) =>
	`<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 22px"><tr><td style="background:${C.accent};border:2px solid ${C.brand};border-radius:999px">` +
	`<a href="${esc(b.url)}" style="display:inline-block;padding:13px 26px;font:700 16px/1.2 ${FONT};color:${C.ink};text-decoration:none">${esc(b.label)}</a></td></tr></table>`;

/** The designed version: logo, white card with title, text, facts and button, address underneath. Inline styles, tables: what mail apps understand. */
export function mailHtml(m: Mail) {
	const loose = new Set([m.button?.url, ...(m.links ?? []).map((l) => l.url)].filter(Boolean));
	let placed = false;
	const block = () => (m.facts?.length ? factsBox(m.facts) : '') + (m.button ? buttonHtml(m.button) : '');
	const body = m.text
		.split(/\n\s*\n/)
		.map((p) => {
			const lines = p.split('\n');
			const kept = lines.filter((l) => !loose.has(l.trim()));
			const text = kept.join('\n').trim();
			let out = text && text !== '---' ? para(text) : '';
			// the button goes where its link stood
			if (!placed && m.button && lines.some((l) => l.trim() === m.button!.url)) {
				out += block();
				placed = true;
			}
			return out;
		})
		.join('');
	const links = (m.links ?? []).map((l) => `<a href="${esc(l.url)}" style="color:${C.brand};font:600 15px/1.6 ${FONT}">${esc(l.label)}</a>`).join('<br>');
	return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(m.subject)}</title></head>
<body style="margin:0;padding:0;background:${C.wash}">
${m.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(m.preheader)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.wash}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 6px 14px"><a href="${SITE_URL}" style="text-decoration:none;font:700 20px/1 ${FONT};color:${C.brand}"><img src="${SITE_URL}/mail-logo.png" width="34" height="34" alt="" style="vertical-align:middle;border:0;margin-right:8px">Alphütte <span style="font-weight:600;color:#6c8a74">Blüemlisalpblick</span></a></td></tr>
<tr><td style="background:#ffffff;border:2px solid ${C.line};border-radius:20px;padding:30px 28px 14px">
${m.heading ? `<h1 style="margin:0 0 18px;font:700 26px/1.2 ${FONT};color:${C.brand}">${esc(m.heading)}</h1>` : ''}${body}${placed ? '' : block()}${links ? `<p style="margin:0 0 16px">${links}</p>` : ''}
</td></tr>
<tr><td style="padding:16px 6px;font:13px/1.6 ${FONT};color:${C.muted}">Alphütte Blüemlisalpblick, Lengschwendi, 3723 Kiental<br><a href="${SITE_URL}" style="color:${C.muted}">${SITE_URL.replace(/^https?:\/\//, '')}</a></td></tr>
</table></td></tr></table></body></html>`;
}

/** The plain text version: the text, then the facts and any link the text does not already show. */
export function mailText(m: Mail) {
	const extra = [m.button, ...(m.links ?? [])].filter((l) => l && !m.text.includes(l.url)).map((l) => `${l!.label}: ${l!.url}`);
	return [m.text, m.facts?.map(([k, v]) => `${k}: ${v}`).join('\n'), extra.join('\n')].filter(Boolean).join('\n\n');
}

/** Sends through Resend. Without an API key the mail is printed, so development works offline. */
export async function sendMail(m: Mail) {
	const text = mailText(m);
	if (!RESEND_API_KEY) {
		const files = m.attachments?.map((a) => `${a.filename} (${a.content.length} bytes)`).join(', ');
		console.log(`\n--- mail to ${m.to}${m.replyTo ? ` (reply-to ${m.replyTo})` : ''}\n${m.subject}${files ? `\n[Anhang: ${files}]` : ''}\n\n${text}\n---\n`);
		return;
	}
	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
		body: JSON.stringify({
			from: MAIL_FROM,
			to: m.to,
			subject: m.subject,
			text,
			html: mailHtml(m),
			reply_to: m.replyTo,
			attachments: m.attachments?.map((a) => ({ filename: a.filename, content: Buffer.from(a.content).toString('base64'), content_type: a.type }))
		})
	});
	// A failed mail must not undo the booking; the host still sees everything in the admin.
	// no alert mail about a broken mail service; it shows on the system page
	if (!res.ok) await import('./monitor.ts').then(async (m) => m.report(new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`), 'Mail senden', { alert: false }));
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
	if (res.status === 401 || res.status === 403)
		throw new Error(`Resend ${res.status}: Der API-Schlüssel darf empfangene Mails nicht lesen. In Resend einen Schlüssel mit «Full access» erstellen und als RESEND_API_KEY eintragen.`);
	if (!res.ok) throw new Error(`Resend ${res.status} beim Lesen einer empfangenen Mail`);
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
