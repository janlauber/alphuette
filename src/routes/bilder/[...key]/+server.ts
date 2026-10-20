import { error } from '@sveltejs/kit';
import { get } from '#lib/server/storage.ts';

// Variant keys contain a random id, so a URL never changes its content: cache forever.
export const GET = async ({ params }) => {
	if (!/^photos\/[0-9a-f-]{36}-\d{3,4}\.webp$/.test(params.key)) error(404, 'Not found');
	const body = await get(params.key);
	if (!body) error(404, 'Not found');
	return new Response(body as BodyInit, {
		headers: { 'content-type': 'image/webp', 'cache-control': 'public, max-age=31536000, immutable' }
	});
};
