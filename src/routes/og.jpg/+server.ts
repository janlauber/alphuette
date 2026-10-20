import sharp from 'sharp';
import { error } from '@sveltejs/kit';
import { listPhotos, variantKey } from '#lib/server/images.ts';
import { get } from '#lib/server/storage.ts';

// The link preview for every page: the title photo as a 1200×630 JPEG. WhatsApp, iMessage and
// LinkedIn often skip WebP and large files.
let cached: { key: string; jpg: Buffer } | null = null;

export const GET = async () => {
	const [hero] = await listPhotos('de');
	if (!hero) error(404, 'Not found');
	if (cached?.key !== hero.key) {
		const file = await get(variantKey(hero.key, 1600));
		if (!file) error(404, 'Not found');
		cached = { key: hero.key, jpg: await sharp(file).resize(1200, 630).jpeg({ quality: 80, mozjpeg: true }).toBuffer() };
	}
	return new Response(cached.jpg as BodyInit, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=3600' } });
};
