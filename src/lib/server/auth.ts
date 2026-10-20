import { createHash, randomBytes } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { ADMIN_EMAILS, SITE_URL } from '$app/env/private';
import { dev } from '$app/env';
import { sql } from './db.ts';
import { sendMail } from './mail.ts';

export const newToken = (bytes = 32) => randomBytes(bytes).toString('base64url');
export const hash = (token: string) => createHash('sha256').update(token).digest('hex');

const COOKIE = 'sid';
const DAYS = 30;

/** Mails a one-time login link if the address is an admin. Says nothing either way. */
export async function startLogin(email: string) {
	email = email.trim().toLowerCase();
	if (!ADMIN_EMAILS.includes(email)) return;
	const token = newToken();
	await sql`delete from login_tokens where expires_at < now()`;
	await sql`insert into login_tokens (token_hash, email, expires_at) values (${hash(token)}, ${email}, now() + interval '20 minutes')`;
	await sendMail({
		to: email,
		subject: 'Dein Login für die Alphütte',
		text: `Mit diesem Link meldest du dich an. Er gilt 20 Minuten und nur einmal.\n\n${SITE_URL}/admin/login/${token}\n\nWenn du das nicht warst, kannst du die Mail ignorieren.`
	});
}

export async function finishLogin(token: string, cookies: Cookies) {
	const [row] = await sql`delete from login_tokens where token_hash = ${hash(token)} and expires_at > now() returning email`;
	if (!row || !ADMIN_EMAILS.includes(row.email)) return false;
	const sid = newToken();
	await sql`delete from sessions where expires_at < now()`;
	await sql`insert into sessions (id_hash, email, expires_at) values (${hash(sid)}, ${row.email}, now() + ${DAYS + ' days'}::interval)`;
	cookies.set(COOKIE, sid, { httpOnly: true, sameSite: 'lax', secure: !dev, maxAge: DAYS * 86400 });
	return true;
}

export async function sessionEmail(cookies: Cookies) {
	const sid = cookies.get(COOKIE);
	if (!sid) return null;
	const [row] = await sql`select email from sessions where id_hash = ${hash(sid)} and expires_at > now()`;
	return row && ADMIN_EMAILS.includes(row.email) ? (row.email as string) : null;
}

export async function logout(cookies: Cookies) {
	const sid = cookies.get(COOKIE);
	if (sid) await sql`delete from sessions where id_hash = ${hash(sid)}`;
	cookies.delete(COOKIE, {});
}
