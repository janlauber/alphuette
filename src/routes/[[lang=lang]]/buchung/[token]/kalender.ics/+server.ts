import { error } from '@sveltejs/kit';
import { bookingByToken, guestUrl } from '#lib/server/bookings.ts';
import { getSettings } from '#lib/server/settings.ts';

// One all-day event for the stay, for any calendar app.
export const GET = async ({ params }) => {
	const b = await bookingByToken(params.token);
	if (!b || b.status !== 'bestaetigt') error(404, 'Not found');
	const { name } = await getSettings();
	const d = (iso: string) => iso.replace(/-/g, '');
	const ics = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Alphuette Kiental//Buchung//DE',
		'BEGIN:VEVENT',
		`UID:${b.ref}@alphuette-kiental.ch`,
		`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
		`DTSTART;VALUE=DATE:${d(b.checkIn)}`,
		`DTEND;VALUE=DATE:${d(b.checkOut)}`,
		`SUMMARY:${name}`,
		'LOCATION:Lengschwendi\\, 3723 Kiental',
		`URL:${guestUrl(b)}`,
		'END:VEVENT',
		'END:VCALENDAR',
		''
	].join('\r\n');
	return new Response(ics, {
		headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `attachment; filename="alphuette-${b.ref}.ics"` }
	});
};
