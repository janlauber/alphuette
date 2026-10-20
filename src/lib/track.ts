import { onCLS, onINP, onLCP } from 'web-vitals';

// Browser side of the self-hosted analytics. The first page view is counted on the server.
const send = (data: Record<string, unknown>) => {
	try {
		navigator.sendBeacon('/api/p', JSON.stringify(data));
	} catch {
		// analytics never breaks the page
	}
};

let path = '';
let since = 0;
let maxScroll = 0;

const leave = () => {
	if (!path) return;
	send({ k: 'leave', p: path, v: Math.round(performance.now() - since) });
	send({ k: 'event', p: path, n: 'scroll', v: maxScroll });
	path = '';
};

export function trackView(next: string, clientNav: boolean) {
	leave();
	path = next;
	since = performance.now();
	maxScroll = 0;
	if (clientNav) send({ k: 'view', p: next });
}

export function track(name: string, value?: number) {
	send({ k: 'event', p: location.pathname, n: name, v: value });
}

export function startTracking() {
	addEventListener(
		'scroll',
		() => {
			const h = document.documentElement;
			maxScroll = Math.max(maxScroll, Math.round(((scrollY + innerHeight) / h.scrollHeight) * 100));
		},
		{ passive: true }
	);
	addEventListener('pagehide', leave);
	const vital = (m: { name: string; value: number }) => send({ k: 'vital', p: location.pathname, n: m.name, v: m.value });
	onLCP(vital);
	onINP(vital);
	onCLS(vital);
}
