import { sql } from './db.ts';
import { DEFAULTS, stored, type Content } from './settings.ts';
import { hikeTexts } from './hikes.ts';
import { weatherTexts } from './weather.ts';
import { fill, hash } from './translate.ts';

/** Every German text the site shows in other languages. */
export async function siteTexts() {
	const s = await stored();
	const [hikes, photos] = await Promise.all([
		sql`select de, season_de, transit_de, highlights_de, tips_de from hikes`,
		sql`select alt_de from photos where deleted_at is null`
	]);
	return [
		...Object.values(s.content.de),
		...s.amenities.map((a) => a.de),
		...hikes.flatMap((h) => hikeTexts(h as never)),
		...photos.map((p) => p.altDe as string),
		...weatherTexts()
	];
}

/** Translates what is new. Runs after every change in the admin and once an hour. */
export const syncTranslations = async () => fill(await siteTexts());

/**
 * The English texts written by hand before the translations table existed become its first rows.
 * ponytail: runs at every start and inserts nothing once done; delete together with the *_en columns.
 */
export async function seedEnglish() {
	const s = await stored();
	const pairs: [string, string | undefined][] = [
		...Object.entries(DEFAULTS.content.de).map(([k, de]) => [de, DEFAULTS.content.en[k as keyof Content]] as [string, string]),
		...Object.entries(s.content.de).map(([k, de]) => [de, s.content.en?.[k as keyof Content]] as [string, string | undefined]),
		...[...DEFAULTS.amenities, ...s.amenities].map((a) => [a.de, a.en] as [string, string | undefined])
	];
	const hikes = await sql`select de, en, season_de, season_en, transit_de, transit_en, highlights_de, highlights_en, tips_de, tips_en from hikes`;
	for (const h of hikes) pairs.push([h.de, h.en], [h.seasonDe, h.seasonEn], [h.transitDe, h.transitEn], [h.highlightsDe, h.highlightsEn], [h.tipsDe, h.tipsEn]);
	for (const p of await sql`select alt_de, alt_en from photos`) pairs.push([p.altDe, p.altEn]);
	const rows = pairs.filter(([de, en]) => de?.trim() && en?.trim()).map(([de, en]) => ({ hash: hash(de), lang: 'en', text: en!, manual: true }));
	if (rows.length) await sql`insert into translations ${sql(rows)} on conflict do nothing`;
}
