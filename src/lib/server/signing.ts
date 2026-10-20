import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { APP_SECRET } from '$app/env/private';
import { sql } from './db.ts';

// Signs guest links, reply addresses, form tokens and challenges, so no tokens are stored.
let key = APP_SECRET ?? '';

/** Key from APP_SECRET, else one generated once and kept in the database. Called at startup. */
export async function loadSigningKey() {
	if (key) return;
	await sql`insert into settings (key, value) values ('signing_key', ${sql.json(randomBytes(32).toString('base64url'))})
		on conflict (key) do nothing`;
	const [row] = await sql`select value from settings where key = 'signing_key'`;
	key = row.value;
}

export function mac(purpose: string, data: string) {
	if (!key) throw new Error('signing key not loaded');
	return createHmac('sha256', key).update(`${purpose}:${data}`).digest();
}

export const safeEqual = (a: Buffer, b: Buffer) => a.length === b.length && timingSafeEqual(a, b);
