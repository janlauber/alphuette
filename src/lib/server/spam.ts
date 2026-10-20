import { createHash, randomBytes } from 'node:crypto';
import { resolve4, resolveMx } from 'node:dns/promises';
import { zeroBits } from '#lib/pow.ts';
import { mac, safeEqual } from './signing.ts';

// Four cheap layers against bots, all self-hosted:
// a proof-of-work the browser solves while the guest types, a minimum fill time,
// a mailbox check, and the honeypot field in the form itself.

const DIFFICULTY = 16; // leading zero bits, about 65'000 hashes in the browser
const sig = (purpose: string, data: string) => mac(purpose, data).toString('base64url');

export function powChallenge() {
	const payload = `${randomBytes(12).toString('hex')}.${Date.now() + 30 * 60_000}.${DIFFICULTY}`;
	return `${payload}.${sig('pow', payload)}`;
}

const used = new Map<string, number>();

export function powValid(challenge: string, nonce: string) {
	const [salt, expires, difficulty, s] = challenge.split('.');
	if (!s || !safeEqual(Buffer.from(s), Buffer.from(sig('pow', `${salt}.${expires}.${difficulty}`)))) return false;
	if (Number(expires) < Date.now() || used.has(salt) || !/^\d{1,12}$/.test(nonce)) return false;
	if (!zeroBits(createHash('sha256').update(`${challenge}:${nonce}`).digest(), Number(difficulty))) return false;
	for (const [k, exp] of used) if (exp < Date.now()) used.delete(k);
	used.set(salt, Number(expires));
	return true;
}

/** Signed render time; a person needs a few seconds to fill a form. */
export const formToken = () => {
	const t = String(Date.now());
	return `${t}.${sig('form', t)}`;
};

export function formTimeOk(token: string, minMs = 3000) {
	const [t, s] = token.split('.');
	if (!s || !safeEqual(Buffer.from(s), Buffer.from(sig('form', t)))) return false;
	const age = Date.now() - Number(t);
	return age >= minMs && age < 3 * 3600_000;
}

// ponytail: short list of the most common throwaway domains; extend when one slips through.
const DISPOSABLE = new Set([
	'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'sharklasers.com', '10minutemail.com',
	'temp-mail.org', 'tempmail.com', 'tempail.com', 'yopmail.com', 'trashmail.com', 'getnada.com',
	'dispostable.com', 'maildrop.cc', 'throwawaymail.com', 'fakeinbox.com', 'mintemail.com',
	'emailondeck.com', 'moakt.com', 'mohmal.com', 'burnermail.io', 'spamgourmet.com', 'mailnesia.com'
]);

const within = <T>(p: Promise<T>, ms: number) =>
	Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'ETIMEOUT' })), ms))]);

/** False for throwaway domains and domains that cannot receive mail. DNS trouble on our side lets it through. */
export async function mailboxPlausible(email: string) {
	const domain = email.split('@')[1]?.toLowerCase() ?? '';
	if (!domain || DISPOSABLE.has(domain)) return false;
	const missing = (e: unknown) => ['ENOTFOUND', 'ENODATA'].includes((e as { code?: string }).code ?? '');
	try {
		// A "null MX" (exchange "" or ".") means the domain accepts no mail at all.
		const mx = await within(resolveMx(domain), 3000);
		if (mx.some((r) => r.exchange && r.exchange !== '.')) return true;
		if (mx.length) return false;
	} catch (e) {
		if (!missing(e)) return true;
	}
	try {
		return (await within(resolve4(domain), 2000)).length > 0;
	} catch (e) {
		return !missing(e);
	}
}
