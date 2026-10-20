import { createHash } from 'node:crypto';
import { ADMIN_EMAILS, OWNER_EMAIL, SITE_URL } from '$app/env/private';
import { sql } from './db.ts';
import { sendMail } from './mail.ts';

// Errors are kept in the database, grouped by place and message, and Jan gets a mail about each
// new one; the same error mails again at most every 6 hours, or when it comes back after "erledigt".
export const owner = () => OWNER_EMAIL || ADMIN_EMAILS[0];

/** Paths without tokens, ids or dates, so guest links never end up in the log and one bug is one row. */
export const cleanPath = (place: string) => place.replace(/\/[^/?#]*(\d|[A-Za-z0-9_-]{20,})[^/?#]*/g, '/:x').replace(/\?.*$/, '');

export async function report(error: unknown, place: string, { alert = true } = {}) {
	const e = error instanceof Error ? error : new Error(String(error));
	console.error(place, e);
	try {
		const where = cleanPath(place).slice(0, 200);
		const message = e.message.slice(0, 1000) || e.name;
		const stack = (e.stack ?? '').split('\n').slice(0, 15).join('\n');
		const fingerprint = createHash('sha1').update(where + '|' + message.replace(/\d+/g, 'n')).digest('hex');
		const [row] = await sql`
			insert into app_errors (fingerprint, place, message, stack) values (${fingerprint}, ${where}, ${message}, ${stack})
			on conflict (fingerprint) do update set count = app_errors.count + 1, last_at = now(), stack = excluded.stack, resolved_at = null
			returning id, count, first_at, (alerted_at is null or alerted_at < now() - interval '6 hours' or app_errors.resolved_at is not null) as due`;
		if (!alert || !row.due || !owner()) return;
		await sql`update app_errors set alerted_at = now() where id = ${row.id}`;
		await sendMail({
			to: owner(),
			subject: `Alphütte: Fehler bei ${where}`,
			text: `Auf ${new URL(SITE_URL).host} ist ein Fehler aufgetreten.\n\nWo: ${where}\nFehler: ${message}\nBisher ${row.count} mal, zuerst am ${new Date(row.firstAt).toLocaleString('de-CH', { timeZone: 'Europe/Zurich' })}\n\n${stack}\n\nAlle Fehler und der Zustand der Website:\n${SITE_URL}/admin/system\n\nZum gleichen Fehler kommt frühestens in 6 Stunden wieder eine Mail.`
		});
	} catch (inner) {
		console.error('monitor', inner);
	}
}
