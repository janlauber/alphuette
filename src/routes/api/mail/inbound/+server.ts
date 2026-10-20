import { ADMIN_EMAILS } from '$app/env/private';
import { addMessage, bookingByReplyAddress } from '#lib/server/bookings.ts';
import { receivedText, verifyWebhook } from '#lib/server/mail.ts';

const done = () => new Response(null, { status: 204 });
const bare = (address: string) => address.toLowerCase().replace(/^.*</, '').replace(/>.*$/, '').trim();

/** Resend inbound: a reply to a booking's thread address becomes a message in that thread. */
export const POST = async ({ request }) => {
	const raw = await request.text();
	if (!verifyWebhook(raw, request.headers)) return new Response('invalid signature', { status: 401 });
	const event = JSON.parse(raw);
	if (event.type !== 'email.received') return done();

	const d = event.data ?? {};
	let booking = null;
	for (const address of [...(d.to ?? []), ...(d.cc ?? []), ...(d.received_for ?? [])]) {
		booking = await bookingByReplyAddress(String(address));
		if (booking) break;
	}
	if (!booking) return done();

	const from = bare(String(d.from ?? ''));
	const author = ADMIN_EMAILS.includes(from) ? 'host' : from === booking.email.toLowerCase() ? 'gast' : null;
	if (!author) return done();

	const mail = await receivedText(String(d.email_id));
	if (mail.dmarc === 'fail') return done(); // forged sender
	if (mail.text) await addMessage(booking, author, mail.text.slice(0, 5000), 'mail');
	return done();
};
