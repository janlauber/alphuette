import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fromFileName } from '#lib/photoName.ts';
import { sql } from './db.ts';
import { put, del } from './storage.ts';
import { lookup } from './translate.ts';
import type { Lang } from '#lib/i18n.ts';

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

/**
 * One-off import of the drone photos shipped in seed/photos: they go to the front of the gallery
 * and the first becomes the title image. A settings row claims the run, so it happens once even
 * if Tom later edits or deletes the photos.
 * ponytail: delete this and seed/ once production has run it.
 */
export async function importSeedPhotos(dir = 'seed/photos') {
	const files = (await readdir(dir).catch(() => [] as string[])).filter((f) => f.endsWith('.jpg')).sort();
	if (!files.length) return;
	const claimed = await sql`insert into settings (key, value) values ('seed_photos', ${sql.json({ at: new Date().toISOString() })}) on conflict do nothing returning 1`;
	if (!claimed.length) return;
	const ids: number[] = [];
	for (const f of files) {
		const { alt, category } = fromFileName(f);
		const pid = await addPhoto(new Uint8Array(await readFile(`${dir}/${f}`)), { de: alt, en: '' });
		if (category) await sql`update photos set category = ${category} where id = ${pid}`;
		ids.push(pid);
	}
	await sql`update photos set sort = sort + ${ids.length} where not (id = any(${ids}))`;
	await sql`update photos set sort = x.sort from (select unnest(${ids}::int[]) as id, generate_series(1, ${ids.length}) as sort) x where photos.id = x.id`;
	await sql`update photos set hero = (id = ${ids[0]})`;
	return ids.length;
}

/** Removes the row and its files for good. The admin only moves photos to the trash (deleted_at). */
export async function deletePhoto(id: number) {
	const [photo] = await sql`delete from photos where id = ${id} returning key, widths`;
	if (photo) for (const w of photo.widths) await del(variantKey(photo.key, w));
}

/** Empties the trash: photos deleted more than 30 days ago. */
export async function purgePhotos() {
	for (const { id } of await sql`select id from photos where deleted_at < now() - interval '30 days'`) await deletePhoto(id);
}

/** Photos for the public site; the hero comes first, then the admin's order. */
export async function listPhotos(lang: Lang) {
	const rows = await sql<{ id: number; key: string; width: number; height: number; widths: number[]; lqip: string; alt: string; category: string }[]>`
		select id, key, width, height, widths, lqip, category, alt_de as alt
		from photos where deleted_at is null order by hero desc, sort, id`;
	if (lang === 'de') return rows;
	const tr = await lookup(rows.map((p) => p.alt), [lang, 'en']);
	return rows.map((p) => ({ ...p, alt: tr.get(lang)?.get(p.alt) ?? tr.get('en')?.get(p.alt) ?? p.alt }));
}
