import { ADMIN_EMAILS, MAIL_FROM, SITE_URL } from '$app/env/private';
import { addMessage, bookingByReplyAddress } from '#lib/server/bookings.ts';
import { receivedText, sendMail, verifyWebhook } from '#lib/server/mail.ts';
import { hostInbox } from '#lib/server/settings.ts';
import { report } from '#lib/server/monitor.ts';

const done = () => new Response(null, { status: 204 });
const bare = (address: string) => address.toLowerCase().replace(/^.*</, '').replace(/>.*$/, '').trim();

/**
 * Resend inbound. A reply to a booking's thread address becomes a message in that thread;
 * anything else sent to the domain (hallo@ and so on) is forwarded to the addresses set in the admin.
 */
export const POST = async ({ request }) => {
	const raw = await request.text();
	if (!verifyWebhook(raw, request.headers)) return new Response('invalid signature', { status: 401 });
	const event = JSON.parse(raw);
	if (event.type !== 'email.received') return done();

	const d = event.data ?? {};
	const from = bare(String(d.from ?? ''));
	if (from === bare(MAIL_FROM)) return done(); // our own mail coming back, never loop
	const inbox = await hostInbox();

	let booking = null;
	for (const address of [...(d.to ?? []), ...(d.cc ?? []), ...(d.received_for ?? [])]) {
		booking = await bookingByReplyAddress(String(address));
		if (booking) break;
	}

	let mail: Awaited<ReturnType<typeof receivedText>>;
	try {
		mail = await receivedText(String(d.email_id));
	} catch (e) {
		// the text could not be loaded: Jan gets the alert, Tom at least learns that a mail came in
		await report(e, 'Mail empfangen');
		await sendMail({
			to: inbox,
			replyTo: from,
			subject: String(d.subject ?? '') || '(ohne Betreff)',
			text: `Eine Mail von ${d.from ?? from}${booking ? ` zur Buchung von ${booking.name}` : ''} ist angekommen, aber die Website konnte den Inhalt nicht laden. Du kannst direkt auf diese Mail antworten. Den Inhalt sieht Jan im Resend-Konto.`
		});
		return done();
	}
	if (mail.dmarc === 'fail') return done(); // forged sender

	if (booking) {
		const isHost = ADMIN_EMAILS.includes(from) || inbox.map((a) => a.toLowerCase()).includes(from);
		const author = isHost ? 'host' : from === booking.email.toLowerCase() ? 'gast' : null;
		if (author && mail.text) await addMessage(booking, author, mail.text.slice(0, 5000), 'mail');
		return done();
	}

	await sendMail({
		to: inbox,
		replyTo: from,
		subject: mail.subject || '(ohne Betreff)',
		text: `Weitergeleitet von ${new URL(SITE_URL).host}\nVon: ${mail.from}\nAn: ${mail.to}${mail.attachments ? `\nAnhänge: ${mail.attachments} (nicht mitgeschickt, im Resend-Konto)` : ''}\n\n${mail.full.slice(0, 50_000)}`
	});
	return done();
};
