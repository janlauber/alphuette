import { error } from '@sveltejs/kit';
import { bookingByToken } from '#lib/server/bookings.ts';
import { getSettings } from '#lib/server/settings.ts';
import { dueDate, missing, qrBill, reference, type QrLang } from '#lib/server/invoice.ts';
import { report } from '#lib/server/monitor.ts';

export const load = async ({ params, parent }) => {
	const { lang } = await parent();
	const b = await bookingByToken(params.token);
	if (!b || b.status !== 'bestaetigt') error(404, 'Not found');
	const { host } = await getSettings();
	const inv = { id: b.id, ref: b.ref, totalRp: b.totalRp, checkIn: b.checkIn, confirmedAt: (b.confirmedAt ?? b.updatedAt).toISOString().slice(0, 10) };

	// no QR code once paid, so nobody pays twice
	let svg = '';
	if (!b.paidAt && !missing(host).length) {
		try {
			svg = qrBill(host, inv, lang.toUpperCase() as QrLang);
		} catch (e) {
			await report(e, 'QR-Rechnung');
		}
	}

	return {
		svg,
		host: { name: host.name, street: host.street, zip: host.zip, city: host.city, email: host.email },
		booking: {
			ref: b.ref,
			name: b.name,
			city: b.city,
			checkIn: b.checkIn,
			checkOut: b.checkOut,
			lines: b.quote?.lines ?? [],
			total: b.totalRp ?? 0,
			date: inv.confirmedAt,
			due: dueDate(inv),
			reference: host.iban ? reference(host.iban, inv) : '',
			paidAt: b.paidAt ? b.paidAt.toISOString().slice(0, 10) : null
		}
	};
};
