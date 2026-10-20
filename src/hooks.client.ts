import type { HandleClientError } from '@sveltejs/kit/hooks';

// Errors while a page loads or renders in the browser go to the system page in the admin.
export const handleError: HandleClientError = ({ kind, error, event }) => {
	if (kind !== 'unknown') return;
	const e = error instanceof Error ? error : new Error(String(error));
	navigator.sendBeacon?.('/api/errors', new Blob([JSON.stringify({ message: e.message, stack: e.stack, path: event.url.pathname })], { type: 'application/json' }));
};
