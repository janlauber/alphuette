// ponytail: in-memory rate limit, fine for one replica; move to Postgres if the app ever scales out.
const hits = new Map<string, { n: number; reset: number }>();

/** Returns true when `key` used up `max` attempts within `windowMs`. */
export function limited(key: string, max: number, windowMs: number) {
	const now = Date.now();
	const hit = hits.get(key);
	if (!hit || hit.reset < now) {
		if (hits.size > 10_000) hits.clear();
		hits.set(key, { n: 1, reset: now + windowMs });
		return false;
	}
	return ++hit.n > max;
}
