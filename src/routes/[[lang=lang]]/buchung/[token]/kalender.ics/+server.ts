import { error } from '@sveltejs/kit';
import { bookingByToken, stayCalendar } from '#lib/server/bookings.ts';

// The confirmed stay for the guest's calendar; linked from the confirmation mail and the booking page.
export const GET = async ({ params }) => {
	const b = await bookingByToken(params.token);
	if (!b || b.status !== 'bestaetigt') error(404, 'Not found');
	return new Response(await stayCalendar(b), {
		headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `attachment; filename="alphuette-${b.ref}.ics"` }
	});
};
