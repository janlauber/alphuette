import { error, json } from '@sveltejs/kit';
import { SITE_URL } from '$app/env/private';
import { assist, canAssist, type Turn } from '#lib/server/assistant.ts';
import { owner, report } from '#lib/server/monitor.ts';
import { sendMail } from '#lib/server/mail.ts';
import { limited } from '#lib/server/limit.ts';
import { log } from '#lib/server/activity.ts';

// The help panel in the admin (the admin guard in hooks.server.ts covers this route).
// kind "ask": a question to the assistant; kind "jan": a message to Jan by mail.
export const POST = async ({ request, locals }) => {
	if (limited('help:' + locals.admin, 40, 60 * 60_000)) error(429, 'Zu viele Anfragen');
	const b = await request.json().catch(() => null);
	const page = String(b?.page ?? '').slice(0, 100);

	if (b?.kind === 'jan') {
		const text = String(b.text ?? '').trim().slice(0, 4000);
		if (!text) error(400, 'leer');
		await sendMail({
			to: owner(),
			replyTo: locals.admin!,
			subject: `Alphütte: ${locals.admin} braucht Hilfe`,
			text: `${text}\n\n---\nVon: ${locals.admin}\nSeite: ${SITE_URL}${page}\nBrowser: ${request.headers.get('user-agent') ?? ''}`
		});
		await log({ actor: locals.admin!, area: 'Hilfe', title: 'Jan um Hilfe gebeten' });
		return json({ ok: true });
	}

	if (!canAssist) error(503, 'Der Assistent ist nicht eingerichtet');
	const history: Turn[] = (Array.isArray(b?.messages) ? b.messages : [])
		.filter((m: Turn) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
		.map((m: Turn) => ({ role: m.role, content: m.content.slice(0, 2000) }));
	if (history.at(-1)?.role !== 'user') error(400, 'keine Frage');
	try {
		return json({ answer: await assist(history, page) });
	} catch (e) {
		await report(e, 'Hilfe-Assistent');
		error(502, 'Der Assistent antwortet gerade nicht');
	}
};
