import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { sql } from './db.ts';
import { get, put } from './storage.ts';
import { lookup } from './translate.ts';
import type { Lang } from '#lib/i18n.ts';
import type { Guide, Step } from '#lib/guides.ts';

// Guide photos show where the key is, so they are never served at a public address: the admin and
// the booking page of a confirmed guest each have their own route.
// ponytail: files of replaced photos stay in the bucket; a cleanup can come once there are many.
export const PHOTO = /^[0-9a-f-]{36}$/;
const photoKey = (key: string) => `guides/${key}.webp`;

/** Re-encodes an upload like the site photos (rotation applied, GPS and other metadata dropped). */
export async function addGuidePhoto(file: Uint8Array) {
	const key = randomUUID();
	const out = await sharp(file, { failOn: 'error', limitInputPixels: 80_000_000 })
		.rotate()
		.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
		.webp({ quality: 78 })
		.toBuffer();
	await put(photoKey(key), out);
	return key;
}

export const guidePhoto = (key: string) => (PHOTO.test(key) ? get(photoKey(key)) : Promise.resolve(null));

/** Whether a photo belongs to a guide right now; old and unsaved uploads are not shown to guests. */
export const photoInUse = async (key: string) => (await sql`select 1 from guides where steps @> ${sql.json([{ photo: key }])}`).length > 0;

export const listGuides = () => sql<Guide[]>`select id, title, steps, sort from guides order by sort, id`;

/** Everything a guest reads, for the translations table. */
export const guideTexts = (guides: Guide[]) => guides.flatMap((g) => [g.title, ...g.steps.flatMap((s) => [s.text, ...s.marks.map((m) => m.label)])]);

/** The guides in the guest's language; German where a translation is missing. */
export async function guidesFor(lang: Lang) {
	const guides = (await listGuides()).filter((g) => g.title.trim() && g.steps.length);
	if (lang === 'de') return guides;
	const tr = await lookup(guideTexts(guides), [lang, 'en']);
	const t = (de: string) => tr.get(lang)?.get(de) ?? tr.get('en')?.get(de) ?? de;
	return guides.map((g) => ({ ...g, title: t(g.title), steps: g.steps.map((s) => ({ ...s, text: t(s.text), marks: s.marks.map((m) => ({ ...m, label: t(m.label) })) })) }));
}

/** Steps from the admin form, cleaned: what does not fit is dropped or cut. */
export function cleanSteps(json: string): Step[] {
	let raw: unknown;
	try {
		raw = JSON.parse(json);
	} catch {
		return [];
	}
	if (!Array.isArray(raw)) return [];
	const share = (v: unknown) => Math.min(1, Math.max(0, Number(v) || 0));
	return raw.slice(0, 20).map((s) => ({
		// keys in the order Postgres keeps them in jsonb, so an unchanged guide compares equal
		text: String(s?.text ?? '').trim().slice(0, 2000),
		marks: (Array.isArray(s?.marks) ? s.marks : []).slice(0, 12).map((m: { x?: unknown; y?: unknown; label?: unknown }) => ({
			x: share(m?.x),
			y: share(m?.y),
			label: String(m?.label ?? '').trim().slice(0, 40)
		})),
		photo: typeof s?.photo === 'string' && PHOTO.test(s.photo) ? s.photo : null
	})).filter((s) => s.text || s.photo);
}
