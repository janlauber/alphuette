import { error } from '@sveltejs/kit';
import { guidePhoto } from '#lib/server/guides.ts';

export const GET = async ({ params }) => {
	const body = await guidePhoto(params.key);
	if (!body) error(404, 'Not found');
	return new Response(body as BodyInit, { headers: { 'content-type': 'image/webp', 'cache-control': 'private, max-age=31536000, immutable' } });
};
