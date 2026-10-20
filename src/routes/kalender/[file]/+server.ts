import { error } from '@sveltejs/kit';
import { hostCalendar, hostCalendarKey } from '#lib/server/bookings.ts';
import { safeEqual } from '#lib/server/signing.ts';

// Tom's calendar subscription: all bookings, requests and blocked weeks. The secret in the address is the only lock.
export const GET = async ({ params }) => {
	if (!safeEqual(Buffer.from(params.file), Buffer.from(`${hostCalendarKey()}.ics`))) error(404, 'Not found');
	return new Response(await hostCalendar(), { headers: { 'content-type': 'text/calendar; charset=utf-8', 'cache-control': 'no-store' } });
};
