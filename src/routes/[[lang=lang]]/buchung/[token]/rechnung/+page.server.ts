import { error } from '@sveltejs/kit';
import { SwissQRBill } from 'swissqrbill/svg';
import { calculateQRReferenceChecksum, isQRIBAN } from 'swissqrbill/utils';
import { bookingByToken } from '#lib/server/bookings.ts';
import { getSettings } from '#lib/server/settings.ts';

export const load = async ({ params, parent }) => {
	const { lang } = await parent();
	const b = await bookingByToken(params.token);
	if (!b || b.status !== 'bestaetigt') error(404, 'Not found');
	const { host } = await getSettings();

	// A QR-IBAN needs a QR reference; a normal IBAN works with a message only.
	const base = String(b.id).padStart(26, '0');
	const reference = host.iban && isQRIBAN(host.iban) ? base + calculateQRReferenceChecksum(base) : undefined;

	let svg = '';
	try {
		svg = new SwissQRBill(
			{
				currency: 'CHF',
				amount: (b.totalRp ?? 0) / 100,
				creditor: { name: host.name, address: host.street, zip: host.zip, city: host.city, country: 'CH', account: host.iban },
				reference,
				message: `Alphütte ${b.ref}`
			},
			{ language: lang === 'en' ? 'EN' : 'DE' }
		).toString();
	} catch (e) {
		console.error('QR bill', e);
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
			date: b.updatedAt.toISOString().slice(0, 10)
		}
	};
};
