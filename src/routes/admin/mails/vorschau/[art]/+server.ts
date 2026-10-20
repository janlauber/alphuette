import { error } from '@sveltejs/kit';
import { sql } from '#lib/server/db.ts';
import { FLOW_MAILS, flowMail, type FlowMail } from '#lib/server/bookings.ts';
import { mailHtml } from '#lib/server/mail.ts';
import { compose, exampleBooking, type Template } from '#lib/server/reminders.ts';
import { getSettings } from '#lib/server/settings.ts';

// A mail as the guest sees it, with a made-up guest: the booking flow by name, Tom's templates as t<id>.
export const GET = async ({ params }) => {
	const b = exampleBooking();
	let mail;
	if (params.art in FLOW_MAILS) mail = await flowMail(params.art as FlowMail, b, false);
	else {
		const [t] = await sql<Template[]>`select * from mail_templates where id = ${Number(params.art.slice(1)) || 0}`;
		if (!t || !params.art.startsWith('t')) error(404, 'Not found');
		mail = await compose(t, b, await getSettings(), false);
	}
	return new Response(mailHtml(mail), { headers: { 'content-type': 'text/html; charset=utf-8' } });
};
