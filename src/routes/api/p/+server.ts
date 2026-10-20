import { record } from '#lib/server/analytics.ts';
import { limited } from '#lib/server/limit.ts';

const KINDS = new Set(['view', 'leave', 'event', 'vital']);

// Beacon from the browser: client-side page views, time on page, events and web vitals.
export const POST = async ({ request, getClientAddress, url }) => {
	const ip = getClientAddress();
	const raw = await request.text();
	if (raw.length > 2000 || limited('beacon:' + ip, 120, 60_000)) return new Response(null, { status: 204 });
	try {
		const b = JSON.parse(raw);
		if (KINDS.has(b.k) && typeof b.p === 'string' && b.p.startsWith('/') && !b.p.startsWith('/admin')) {
			const value = Number.isFinite(b.v) ? Number(b.v) : null;
			await record(
				{ kind: b.k, path: b.p, name: typeof b.n === 'string' ? b.n : null, value, referrer: b.r ?? null },
				ip,
				request.headers.get('user-agent') ?? '',
				url.hostname,
				b.p.match(/^\/(en|fr|it)(?=\/|$)/)?.[1] ?? 'de'
			);
		}
	} catch {
		// malformed beacon, ignore
	}
	return new Response(null, { status: 204 });
};
