import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { sql } from './db.ts';
import { put, del } from './storage.ts';

const WIDTHS = [480, 960, 1600, 2400];

export const variantKey = (key: string, w: number) => `photos/${key}-${w}.webp`;

/** Re-encodes an upload: applies EXIF rotation, drops all metadata (GPS!), writes WebP variants. */
export async function addPhoto(file: Uint8Array, alt = { de: '', en: '' }) {
	const base = await sharp(file, { failOn: 'error', limitInputPixels: 80_000_000 }).rotate().toBuffer();
	const { width = 0, height = 0 } = await sharp(base).metadata();
	const widths = WIDTHS.filter((w, i) => i === 0 || w <= width);
	const key = randomUUID();
	for (const w of widths) {
		const out = await sharp(base).resize({ width: w, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
		await put(variantKey(key, w), out, 'image/webp');
	}
	const lqip = await sharp(base).resize(24).webp({ quality: 30 }).toBuffer();
	const [{ max }] = await sql`select coalesce(max(sort), 0) + 1 as max from photos`;
	const [photo] = await sql`
		insert into photos (key, width, height, widths, lqip, alt_de, alt_en, sort)
		values (${key}, ${width}, ${height}, ${widths}, ${'data:image/webp;base64,' + lqip.toString('base64')},
			${alt.de}, ${alt.en}, ${max})
		returning id`;
	return photo.id as number;
}

export async function deletePhoto(id: number) {
	const [photo] = await sql`delete from photos where id = ${id} returning key, widths`;
	if (photo) for (const w of photo.widths) await del(variantKey(photo.key, w));
}

/** Photos for the public site; the hero comes first, then the admin's order. */
export const listPhotos = (lang: 'de' | 'en') =>
	sql<{ id: number; key: string; width: number; height: number; widths: number[]; lqip: string; alt: string }[]>`
		select id, key, width, height, widths, lqip,
			case when ${lang} = 'en' and alt_en <> '' then alt_en else alt_de end as alt
		from photos order by hero desc, sort, id`;
