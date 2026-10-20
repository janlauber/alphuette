import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit/hooks';
import { dev } from '$app/env';
import { migrate } from '#lib/server/db.ts';
import { sessionEmail } from '#lib/server/auth.ts';
import { loadSigningKey } from '#lib/server/signing.ts';
import { record } from '#lib/server/analytics.ts';
import { maintenance } from '#lib/server/maintenance.ts';
import { seedEnglish } from '#lib/server/sitetexts.ts';
import { listBackups } from '#lib/server/backup.ts';
import { report } from '#lib/server/monitor.ts';

export const init: ServerInit = async () => {
	process.on('unhandledRejection', (e) => report(e, 'unhandled promise'));
	await migrate();
	await loadSigningKey();
	await seedEnglish();
	listBackups()
		.then((b) => console.log(`backups: ${b.length} Sicherungen, neueste ${b[0]?.name ?? 'keine'}`))
		.catch((e) => report(e, 'Sicherungen auflisten'));
	maintenance();
	setInterval(maintenance, 3600_000);
};

const isPrivate = (path: string) => /^\/((en|fr|it)\/)?(admin|buchung)(\/|$)/.test(path);

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	event.locals.admin = path.startsWith('/admin') ? await sessionEmail(event.cookies) : null;
	if (path.startsWith('/admin') && !path.startsWith('/admin/login') && !event.locals.admin) {
		return event.request.method === 'GET'
			? new Response(null, { status: 303, headers: { location: '/admin/login' } })
			: new Response('Forbidden', { status: 403 });
	}
	const lang = path.match(/^\/(en|fr|it)(?=\/|$)/)?.[1] ?? 'de';

	const res = await resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', lang) });
	// Full page loads count as views on the server, so no ad blocker can hide them.
	const html = res.headers.get('content-type')?.startsWith('text/html');
	if (html && res.status === 200 && event.request.method === 'GET' && !isPrivate(path) && !path.startsWith('/admin')) {
		record(
			{ kind: 'view', path, referrer: event.request.headers.get('referer'), url: event.url },
			event.getClientAddress(),
			event.request.headers.get('user-agent') ?? '',
			event.url.hostname,
			lang
		);
	}
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

// Unexpected errors in pages, actions and endpoints: logged, grouped, and mailed to Jan.
// Only real bugs ('unknown'); 404s and error(...) thrown on purpose are not.
export const handleError: HandleServerError = async ({ kind, error, event }) => {
	if (kind === 'unknown') await report(error, `${event.request.method} ${event.url.pathname}`);
};
