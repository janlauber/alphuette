import { error } from '@sveltejs/kit';
import { bookingByToken } from '#lib/server/bookings.ts';
import { guidePhoto, photoInUse } from '#lib/server/guides.ts';

// Guide photos only for confirmed guests, through their signed link; they may show where the key is.
export const GET = async ({ params }) => {
	const b = await bookingByToken(params.token);
	if (b?.status !== 'bestaetigt' || !(await photoInUse(params.key))) error(404, 'Not found');
	const body = await guidePhoto(params.key);
	if (!body) error(404, 'Not found');
	return new Response(body as BodyInit, { headers: { 'content-type': 'image/webp', 'cache-control': 'private, max-age=86400' } });
};
