import { fail } from '@sveltejs/kit';
import { sql } from '#lib/server/db.ts';
import { fillProfiles, parseGpx } from '#lib/server/hikes.ts';

export const load = async () => {
	await fillProfiles();
	return {
		hikes: await sql`select id, slug, name, time, alpine, de, en, url, source, profile, distance_m, ascent_m, sort,
			category, sac, duration_min, season_de, season_en, start_name, end_name, transit_de, transit_en,
			waypoints, stops, highlights_de, highlights_en, tips_de, tips_en, family, loop, from_hut
			from hikes order by sort, id`
	};
};

const slugify = (s: string) =>
	s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'wanderung';
const str = (f: FormData, k: string, max = 500) => String(f.get(k) ?? '').trim().slice(0, max);
const rows = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 40);
type Waypoint = { name: string; elev: number; min: number | null; distM?: number | null; e?: number; n?: number };

/** "Bundalp | 1840 | 90" per line; keeps the position on the route from the stored point of the same name. */
function waypoints(text: string, old: Waypoint[]): Waypoint[] {
	return rows(text).map((l) => {
		const [name, elev, min] = l.split('|').map((x) => x.trim());
		const prev = old.find((w) => w.name === name);
		return { ...prev, name: name.slice(0, 60), elev: Number(elev) || prev?.elev || 0, min: min ? Number(min) || null : null };
	});
}

export const actions = {
	save: async ({ request }) => {
		const f = await request.formData();
		const id = Number(f.get('id')) || null;
		const name = str(f, 'name', 80);
		if (!name) return fail(400, { error: 'Bitte gib einen Namen ein.', id });
		const category = ['wanderweg', 'bergwanderweg', 'alpinwanderweg'].includes(str(f, 'category')) ? str(f, 'category') : 'wanderweg';
		const [old] = id ? await sql<{ waypoints: Waypoint[] | null }[]>`select waypoints from hikes where id = ${id}` : [];
		const h = {
			name,
			slug: slugify(str(f, 'slug', 60) || name),
			alpine: category !== 'wanderweg',
			category,
			sac: /^T[1-6]\+?(–T[1-6]\+?)?$/.test(str(f, 'sac').replace('-', '–')) ? str(f, 'sac').replace('-', '–') : '',
			durationMin: Number(f.get('duration_min')) || null,
			seasonDe: str(f, 'season_de', 120),
			seasonEn: str(f, 'season_en', 120),
			startName: str(f, 'start_name', 80),
			endName: str(f, 'end_name', 80),
			transitDe: str(f, 'transit_de', 1000),
			transitEn: str(f, 'transit_en', 1000),
			waypoints: sql.json(waypoints(str(f, 'waypoints', 3000), old?.waypoints ?? [])),
			stops: sql.json(rows(str(f, 'stops', 2000))),
			highlightsDe: str(f, 'highlights_de', 2000),
			highlightsEn: str(f, 'highlights_en', 2000),
			tipsDe: str(f, 'tips_de', 2000),
			tipsEn: str(f, 'tips_en', 2000),
			family: f.get('family') === 'on',
			loop: f.get('loop') === 'on',
			fromHut: f.get('from_hut') === 'on',
			de: str(f, 'de', 2000),
			en: str(f, 'en', 2000),
			url: /^https?:\/\//.test(str(f, 'url')) ? str(f, 'url') : '',
			sort: Number(f.get('sort')) || 0
		};
		try {
			if (id) await sql`update hikes set ${sql(h)} where id = ${id}`;
			else await sql`insert into hikes ${sql(h)}`;
		} catch (e) {
			if ((e as { code?: string }).code === '23505') return fail(409, { error: 'Diese Adresse (Slug) gibt es schon.', id });
			throw e;
		}
		return { saved: id ?? 'new' };
	},
	gpx: async ({ request }) => {
		const f = await request.formData();
		const file = f.get('gpx');
		if (!(file instanceof File) || file.size === 0 || file.size > 5_000_000) return fail(400, { error: 'Bitte wähle eine GPX-Datei bis 5 MB.', id: Number(f.get('id')) });
		const points = parseGpx(await file.text());
		if (points.length < 2) return fail(400, { error: 'In der Datei habe ich keine Route gefunden.', id: Number(f.get('id')) });
		await sql`update hikes set geometry = ${sql.json(points)}, source = 'gpx', profile = null where id = ${Number(f.get('id'))}`;
		return { saved: Number(f.get('id')) };
	},
	wanderland: async ({ request }) => {
		const f = await request.formData();
		const nr = str(f, 'nr', 12);
		if (!/^\d{1,3}(\.\d{1,3})?$/.test(nr)) return fail(400, { error: 'Die Routennummer sieht so aus: 1.13', id: Number(f.get('id')) });
		await sql`update hikes set wanderland = ${nr}, geometry = null, profile = null, source = 'wanderland' where id = ${Number(f.get('id'))}`;
		return { saved: Number(f.get('id')) };
	},
	delete: async ({ request }) => {
		await sql`delete from hikes where id = ${Number((await request.formData()).get('id'))}`;
	}
};
