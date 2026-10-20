import { sql } from './db.ts';
import { toLv95 } from '#lib/geo.ts';

type Waypoint = { name: string; elev: number; min?: number | null; distM?: number | null; e?: number; n?: number };
type Row = {
	id: number;
	slug: string;
	name: string;
	time: string;
	alpine: boolean;
	de: string;
	en: string;
	url: string;
	geometry: [number, number][] | null;
	source: string;
	profile: [number, number][] | null;
	distanceM: number | null;
	ascentM: number | null;
	descentM: number | null;
	sort: number;
	category: string;
	sac: string;
	durationMin: number | null;
	seasonDe: string;
	seasonEn: string;
	startName: string;
	endName: string;
	transitDe: string;
	transitEn: string;
	waypoints: Waypoint[] | null;
	stops: string[] | null;
	highlightsDe: string;
	highlightsEn: string;
	tipsDe: string;
	tipsEn: string;
	family: boolean;
	loop: boolean;
	fromHut: boolean;
};

const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);
const pick = (lang: 'de' | 'en', de: string, en: string) => (lang === 'en' && en) || de;

const forLang = (h: Row, lang: 'de' | 'en') => ({
	slug: h.slug,
	name: h.name,
	time: h.time,
	durationMin: h.durationMin,
	alpine: h.alpine,
	category: h.category || (h.alpine ? 'bergwanderweg' : 'wanderweg'),
	sac: h.sac,
	text: pick(lang, h.de, h.en),
	url: h.url,
	source: h.source,
	profile: h.profile,
	// Waypoint routes cut corners, so only measured routes get numbers.
	distanceM: h.source === 'wegpunkte' ? null : h.distanceM,
	ascentM: h.source === 'wegpunkte' ? null : h.ascentM,
	descentM: h.source === 'wegpunkte' ? null : h.descentM,
	// the 200-point profile can miss a pass by a few metres, a named waypoint can't
	highest: h.profile?.length ? Math.round(Math.max(...h.profile.map((p) => p[1]), ...(h.waypoints ?? []).map((w) => w.elev ?? 0))) : null,
	season: pick(lang, h.seasonDe, h.seasonEn),
	start: h.startName,
	end: h.endName,
	transit: pick(lang, h.transitDe, h.transitEn),
	waypoints: h.waypoints ?? [],
	stops: h.stops ?? [],
	highlights: lines(pick(lang, h.highlightsDe, h.highlightsEn)),
	tips: pick(lang, h.tipsDe, h.tipsEn),
	family: h.family,
	loop: h.loop,
	fromHut: h.fromHut
});

// ponytail: every n-th vertex is plenty for a 600 px map
const thinMap = (g: [number, number][] | null, max = 400) => (!g || g.length <= max ? g : g.filter((_, i) => i % Math.ceil(g.length / max) === 0 || i === g.length - 1));

export async function listHikes(lang: 'de' | 'en' = 'de') {
	const rows = await sql<Row[]>`select * from hikes order by sort, id`;
	return rows.map((h) => forLang(h, lang));
}

export async function hikeBySlug(slug: string, lang: 'de' | 'en') {
	const [h] = await sql<Row[]>`select * from hikes where slug = ${slug}`;
	return h ? { ...forLang(h, lang), geometry: h.source === 'wegpunkte' ? null : thinMap(h.geometry) } : null;
}

/** GPX track or route points as LV95 coordinates. */
export function parseGpx(xml: string): [number, number][] {
	const pts: [number, number][] = [];
	for (const m of xml.matchAll(/<(?:trkpt|rtept)\b[^>]*?\blat="([-\d.]+)"[^>]*?\blon="([-\d.]+)"|<(?:trkpt|rtept)\b[^>]*?\blon="([-\d.]+)"[^>]*?\blat="([-\d.]+)"/g)) {
		const lat = Number(m[1] ?? m[4]);
		const lon = Number(m[2] ?? m[3]);
		const { e, n } = toLv95(lat, lon);
		pts.push([e, n]);
	}
	return pts;
}

// ponytail: keeps every n-th point so the request stays small; swisstopo resamples to 200 points anyway.
const thin = (pts: [number, number][], max = 4900) => (pts.length <= max ? pts : pts.filter((_, i) => i % Math.ceil(pts.length / max) === 0 || i === pts.length - 1));

/** Elevation profile along the route from swisstopo (DHM25 / swissALTI3D). */
export async function computeProfile(geometry: [number, number][]) {
	// POST the raw GeoJSON: long lines do not fit in a URL. The API takes at most 5000 points.
	const res = await fetch('https://api3.geo.admin.ch/rest/services/profile.json?sr=2056&nb_points=200&offset=1', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ type: 'LineString', coordinates: thin(geometry) }),
		signal: AbortSignal.timeout(15_000)
	});
	if (!res.ok) throw new Error(`profile ${res.status}`);
	const points: { dist: number; alts: { COMB?: number; DTM2?: number; DTM25?: number } }[] = await res.json();
	const profile = points.map((p) => [Math.round(p.dist), Math.round(p.alts.COMB ?? p.alts.DTM2 ?? p.alts.DTM25 ?? 0)] as [number, number]);
	let ascent = 0, descent = 0;
	for (let i = 1; i < profile.length; i++) {
		const d = profile[i][1] - profile[i - 1][1];
		if (d > 0) ascent += d;
		else descent -= d;
	}
	return { profile, distance: profile.at(-1)?.[0] ?? 0, ascent: Math.round(ascent), descent: Math.round(descent) };
}

/** Official route geometry from Wanderland Schweiz (ASTRA + cantons, open data), e.g. "1.13". */
export async function wanderlandRoute(nr: string): Promise<[number, number][]> {
	const res = await fetch(
		`https://api3.geo.admin.ch/rest/services/api/MapServer/ch.astra.wanderland/${encodeURIComponent(nr)}?geometryFormat=geojson&sr=2056`,
		{ signal: AbortSignal.timeout(10_000) }
	);
	if (!res.ok) throw new Error(`wanderland ${nr}: ${res.status}`);
	const g = (await res.json()).feature?.geometry;
	const lines: number[][][] = g?.type === 'LineString' ? [g.coordinates] : (g?.coordinates ?? []);
	return lines.flat().map((c) => [Math.round(c[0]), Math.round(c[1])] as [number, number]);
}

/** Hikes with a route but no profile yet get one. Runs in the background, failures retry next time. */
export async function fillProfiles() {
	const todo = await sql<(Row & { wanderland: string | null })[]>`
		select id, geometry, wanderland from hikes where profile is null and (geometry is not null or wanderland is not null) limit 10`;
	for (const h of todo) {
		try {
			if (!h.geometry && h.wanderland) {
				h.geometry = await wanderlandRoute(h.wanderland);
				await sql`update hikes set geometry = ${sql.json(h.geometry)}, source = 'wanderland' where id = ${h.id}`;
			}
			const p = await computeProfile(h.geometry!);
			await sql`update hikes set profile = ${sql.json(p.profile)}, distance_m = ${p.distance}, ascent_m = ${p.ascent}, descent_m = ${p.descent} where id = ${h.id}`;
		} catch (e) {
			console.error('hike profile', h.id, e);
		}
	}
}
