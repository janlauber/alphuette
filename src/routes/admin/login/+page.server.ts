import { fail } from '@sveltejs/kit';
import { startLogin } from '#lib/server/auth.ts';
import { limited } from '#lib/server/limit.ts';

export const actions = {
	default: async ({ request, getClientAddress }) => {
		if (limited('login:' + getClientAddress(), 5, 15 * 60_000)) return fail(429, { error: 'Zu viele Versuche. Warte 15 Minuten.' });
		const email = String((await request.formData()).get('email') ?? '');
		if (!/^\S+@\S+\.\S+$/.test(email)) return fail(400, { error: 'Bitte gib eine gültige E-Mail ein.' });
		await startLogin(email);
		return { sent: true };
	}
};
