import type { HandleClientError } from '@sveltejs/kit/hooks';

// Older iPads and iPhones lack these (Safari before 15.4 and 17.4); the pages use them.
if (!Array.prototype.at)
	Object.defineProperty(Array.prototype, 'at', {
		configurable: true,
		writable: true,
		value(this: unknown[], i: number) {
			i = Math.trunc(i) || 0;
			return this[i < 0 ? this.length + i : i];
		}
	});
Object.groupBy ??= (<T, K extends PropertyKey>(items: Iterable<T>, key: (item: T, i: number) => K) => {
	const out = Object.create(null) as Partial<Record<K, T[]>>;
	let i = 0;
	for (const item of items) (out[key(item, i++)] ??= []).push(item);
	return out;
}) as typeof Object.groupBy;

// Errors while a page loads or renders in the browser go to the system page in the admin.
export const handleError: HandleClientError = ({ kind, error, event }) => {
	if (kind !== 'unknown') return;
	const e = error instanceof Error ? error : new Error(String(error));
	navigator.sendBeacon?.('/api/errors', new Blob([JSON.stringify({ message: e.message, stack: e.stack, path: event.url.pathname })], { type: 'application/json' }));
};
