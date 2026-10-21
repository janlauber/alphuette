import { error, fail } from '@sveltejs/kit';
import { addMessage, bookingByToken, confirmEmail, messagesOf, withdraw } from '#lib/server/bookings.ts';
import { addReview, reviewOf } from '#lib/server/reviews.ts';
import { getSettings } from '#lib/server/settings.ts';
import { listPhotos } from '#lib/server/images.ts';
import { guidesFor } from '#lib/server/guides.ts';
import { limited } from '#lib/server/limit.ts';

async function booking(token: string) {
	const b = await bookingByToken(token);
	if (!b) error(404, 'Not found');
	return b;
}

const listItems = (text: string) =>
	text
		.split('\n')
		.map((l) => l.replace(/^\s*[-•]\s*/, '').trim())
		.filter(Boolean);

export const load = async ({ params, parent }) => {
	const { lang } = await parent();
	const b = await booking(params.token);
	const confirmed = b.status === 'bestaetigt';
	const [settings, messages, review, photos, guides] = await Promise.all([getSettings(), messagesOf(b.id), reviewOf(b.id), listPhotos(lang), confirmed ? guidesFor(lang) : []]);
	const content = settings.content[lang];
	const today = new Date().toISOString().slice(0, 10);
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
		photo: photos[0] ?? null,
		// the guest only needs Tom's messages in their language; their own stay as written
		messages: messages.map(({ id, author, body, translation, createdAt }) => ({ id, author, body, translation: author === 'host' ? translation : null, createdAt })),
		guestInfo: confirmed ? content.guest_info || settings.content.de.guest_info : '',
		guides,
		arrival: content.arrival,
		packing: confirmed || b.status === 'angefragt' ? listItems(content.packing) : [],
		rates: { checkIn: settings.rates.checkIn, checkOut: settings.rates.checkOut },
		invoiceReady: confirmed && !!settings.host.iban,
		canReview: confirmed && b.checkOut <= today && !review,
		reviewed: !!review
	};
};

export const actions = {
	confirm: async ({ params }) => {
		const b = await booking(params.token);
		await confirmEmail(b.id);
		return { confirmed: true };
	},
	message: async ({ params, request }) => {
		const b = await booking(params.token);
		if (b.status === 'unbestaetigt') return fail(400, { empty: true });
		if (limited('msg:' + b.id, 20, 60 * 60_000)) return fail(429, { tooMany: true });
		const body = String((await request.formData()).get('body') ?? '').trim().slice(0, 5000);
		if (!body) return fail(400, { empty: true });
		await addMessage(b, 'gast', body);
		return { sent: true };
	},
	withdraw: async ({ params }) => {
		const b = await booking(params.token);
		await withdraw(b.id);
	},
	review: async ({ params, request }) => {
		const b = await booking(params.token);
		const f = await request.formData();
		const rating = Math.trunc(Number(f.get('rating')));
		const body = String(f.get('body') ?? '').trim().slice(0, 3000);
		const name = String(f.get('name') ?? '').trim().slice(0, 80) || b.name.split(' ')[0];
		if (!(rating >= 1 && rating <= 5) || body.length < 10) return fail(400, { reviewInvalid: true });
		await addReview(b, rating, body, name);
		return { reviewed: true };
	}
};
