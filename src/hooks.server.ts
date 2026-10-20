import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import { dev } from '$app/env';
import { migrate } from '#lib/server/db.ts';
import { sessionEmail } from '#lib/server/auth.ts';

export const init: ServerInit = async () => {
	await migrate();
};

const isPrivate = (path: string) => /^\/(en\/)?(admin|buchung)(\/|$)/.test(path);

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	event.locals.admin = path.startsWith('/admin') ? await sessionEmail(event.cookies) : null;
	if (path.startsWith('/admin') && !path.startsWith('/admin/login') && !event.locals.admin) {
		return event.request.method === 'GET'
			? new Response(null, { status: 303, headers: { location: '/admin/login' } })
			: new Response('Forbidden', { status: 403 });
	}
	const lang = path === '/en' || path.startsWith('/en/') ? 'en' : 'de';

	const res = await resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', lang) });
	try {
		res.headers.set('x-content-type-options', 'nosniff');
		res.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
		res.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()');
		if (!dev) res.headers.set('strict-transport-security', 'max-age=63072000; includeSubDomains');
		if (isPrivate(path)) {
			res.headers.set('x-robots-tag', 'noindex, nofollow');
			res.headers.set('cache-control', 'private, no-store');
		}
	} catch {
		// some responses (e.g. proxied) have immutable headers
	}
	return res;
};
