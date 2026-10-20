import { report } from '#lib/server/monitor.ts';
import { limited } from '#lib/server/limit.ts';

// Errors from visitors' browsers. Kept on the system page, never mailed: anyone can post here.
export const POST = async ({ request, getClientAddress }) => {
	if (limited('err:' + getClientAddress(), 10, 60 * 60_000)) return new Response(null, { status: 204 });
	const b = await request.json().catch(() => null);
	if (b && typeof b.message === 'string') {
		const e = new Error(b.message.slice(0, 500));
		e.stack = typeof b.stack === 'string' ? b.stack.slice(0, 3000) : '';
		await report(e, `Browser ${typeof b.path === 'string' ? b.path.slice(0, 200) : ''}`, { alert: false });
	}
	return new Response(null, { status: 204 });
};
