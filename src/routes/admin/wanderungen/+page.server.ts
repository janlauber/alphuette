import { fail } from '@sveltejs/kit';
import { sql } from '#lib/server/db.ts';
import { fillProfiles, parseGpx } from '#lib/server/hikes.ts';
import { changeRow, done, log } from '#lib/server/activity.ts';
import { syncTranslations } from '#lib/server/sitetexts.ts';

const AREA = 'Wanderungen';
const link = '/admin/wanderungen';
const hikeName = async (id: number) => (await sql`select name from hikes where id = ${id}`)[0]?.name ?? '';

export const load = async () => {
	await fillProfiles();
	return {
		hikes: await sql`select id, slug, name, alpine, de, url, source, wanderland, profile, distance_m, ascent_m, sort,
			category, sac, duration_min, season_de, start_name, end_name, transit_de,
			waypoints, stops, highlights_de, tips_de, family, loop, from_hut
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
	save: async ({ request, locals }) => {
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
			startName: str(f, 'start_name', 80),
			endName: str(f, 'end_name', 80),
			transitDe: str(f, 'transit_de', 1000),
			waypoints: sql.json(waypoints(str(f, 'waypoints', 3000), old?.waypoints ?? [])),
			stops: sql.json(rows(str(f, 'stops', 2000))),
			highlightsDe: str(f, 'highlights_de', 2000),
			tipsDe: str(f, 'tips_de', 2000),
			family: f.get('family') === 'on',
			loop: f.get('loop') === 'on',
			fromHut: f.get('from_hut') === 'on',
			de: str(f, 'de', 2000),
			url: /^https?:\/\//.test(str(f, 'url')) ? str(f, 'url') : '',
			sort: Number(f.get('sort')) || 0
		};
		let a: number;
		try {
			if (id) a = await changeRow('hikes', id, { actor: locals.admin!, area: AREA, title: `Wanderung «${name}» geändert`, link }, () => sql`update hikes set ${sql(h)} where id = ${id}`);
			else {
				const [row] = await sql`insert into hikes ${sql(h)} returning id`;
				a = await log({ actor: locals.admin!, area: AREA, title: `Wanderung «${name}» neu angelegt`, link, target: `hikes:${row.id}`, undo: { table: 'hikes', id: row.id, before: null } });
			}
		} catch (e) {
			if ((e as { code?: string }).code === '23505') return fail(409, { error: 'Diese Adresse (Slug) gibt es schon.', id });
			throw e;
		}
		void syncTranslations();
		return { saved: id ?? 'new', ...done('Wanderung gespeichert', a) };
	},
	gpx: async ({ request, locals }) => {
		const f = await request.formData();
		const file = f.get('gpx');
		if (!(file instanceof File) || file.size === 0 || file.size > 5_000_000) return fail(400, { error: 'Bitte wähle eine GPX-Datei bis 5 MB.', id: Number(f.get('id')) });
		const points = parseGpx(await file.text());
		if (points.length < 2) return fail(400, { error: 'In der Datei habe ich keine Route gefunden.', id: Number(f.get('id')) });
		const hid = Number(f.get('id'));
		const a = await changeRow('hikes', hid, { actor: locals.admin!, area: AREA, title: `Neue Route (GPX) für «${await hikeName(hid)}»`, link }, () =>
			sql`update hikes set geometry = ${sql.json(points)}, source = 'gpx', profile = null where id = ${hid}`
		);
		return { saved: hid, ...done('Route übernommen. Das Höhenprofil wird gerade berechnet.', a) };
	},
	wanderland: async ({ request, locals }) => {
		const f = await request.formData();
		const nr = str(f, 'nr', 12);
		if (!/^\d{1,3}(\.\d{1,3})?$/.test(nr)) return fail(400, { error: 'Die Routennummer sieht so aus: 1.13', id: Number(f.get('id')) });
		const hid = Number(f.get('id'));
		const a = await changeRow('hikes', hid, { actor: locals.admin!, area: AREA, title: `Route ${nr} von SchweizMobil für «${await hikeName(hid)}»`, link }, () =>
			sql`update hikes set wanderland = ${nr}, geometry = null, profile = null, source = 'wanderland' where id = ${hid}`
		);
		return { saved: hid, ...done('Route übernommen', a) };
	},
	delete: async ({ request, locals }) => {
		const hid = Number((await request.formData()).get('id'));
		const a = await changeRow('hikes', hid, { actor: locals.admin!, area: AREA, title: `Wanderung «${await hikeName(hid)}» gelöscht`, link }, () => sql`delete from hikes where id = ${hid}`);
		return done('Wanderung gelöscht', a);
	}
};
