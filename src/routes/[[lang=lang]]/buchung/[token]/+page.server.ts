import { error, fail } from '@sveltejs/kit';
import { addMessage, bookingByToken, messagesOf, withdraw } from '#lib/server/bookings.ts';
import { getSettings } from '#lib/server/settings.ts';
import { limited } from '#lib/server/limit.ts';

async function booking(token: string) {
	const b = await bookingByToken(token);
	if (!b) error(404, 'Not found');
	return b;
}

export const load = async ({ params, parent }) => {
	const { lang } = await parent();
	const b = await booking(params.token);
	const [settings, messages] = await Promise.all([getSettings(), messagesOf(b.id)]);
	const confirmed = b.status === 'bestaetigt';
	return {
		booking: {
			ref: b.ref,
			status: b.status,
			checkIn: b.checkIn,
			checkOut: b.checkOut,
			name: b.name,
			adults: b.adults,
			children: b.children,
			infants: b.infants,
			lines: b.quote?.lines ?? [],
			total: b.totalRp ?? 0,
			paidAt: b.paidAt
		},
		messages: messages.map(({ id, author, body, createdAt }) => ({ id, author, body, createdAt })),
		guestInfo: confirmed ? settings.content[lang].guest_info || settings.content.de.guest_info : '',
		arrival: settings.content[lang].arrival,
		rates: { checkIn: settings.rates.checkIn, checkOut: settings.rates.checkOut },
		invoiceReady: confirmed && !!settings.host.iban
	};
};

export const actions = {
	message: async ({ params, request }) => {
		const b = await booking(params.token);
		if (limited('msg:' + b.id, 20, 60 * 60_000)) return fail(429, { tooMany: true });
		const body = String((await request.formData()).get('body') ?? '').trim().slice(0, 5000);
		if (!body) return fail(400, { empty: true });
		await addMessage(b, 'gast', body);
		return { sent: true };
	},
	withdraw: async ({ params }) => {
		const b = await booking(params.token);
		await withdraw(b.id);
	}
};
