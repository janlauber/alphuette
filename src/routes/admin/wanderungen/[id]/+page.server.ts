import { error, fail, redirect } from '@sveltejs/kit';
import { sql } from '#lib/server/db.ts';
import { fillProfiles, parseGpx } from '#lib/server/hikes.ts';
import { changeRow, done, log } from '#lib/server/activity.ts';
import { syncTranslations } from '#lib/server/sitetexts.ts';

const AREA = 'Wanderungen';
type Waypoint = { name: string; elev: number; min: number | null; distM?: number | null; e?: number; n?: number };
export type Hike = {
	id: number | null; slug: string; name: string; de: string; url: string; source: string; wanderland: string | null;
	geometry: [number, number][] | null; profile: [number, number][] | null; distanceM: number | null; ascentM: number | null; descentM: number | null;
	category: string; sac: string; durationMin: number | null; seasonDe: string; startName: string; endName: string; transitDe: string;
	waypoints: Waypoint[] | null; stops: string[] | null; highlightsDe: string; tipsDe: string; family: boolean; loop: boolean; fromHut: boolean;
};
const BLANK: Hike = {
	id: null, slug: '', name: '', de: '', url: '', source: '', wanderland: null, geometry: null, profile: null, distanceM: null, ascentM: null, descentM: null,
	category: 'wanderweg', sac: '', durationMin: null, seasonDe: '', startName: '', endName: '', transitDe: '',
	waypoints: [], stops: [], highlightsDe: '', tipsDe: '', family: false, loop: false, fromHut: false
};

const fetchHike = async (id: number) =>
	(await sql<Hike[]>`select id, slug, name, de, url, source, wanderland, geometry, profile, distance_m, ascent_m, descent_m, category, sac, duration_min,
		season_de, start_name, end_name, transit_de, waypoints, stops, highlights_de, tips_de, family, loop, from_hut from hikes where id = ${id}`)[0];

// ponytail: every n-th vertex is plenty for the 600 px preview map
const thin = (g: [number, number][] | null, max = 400) => (!g || g.length <= max ? g : g.filter((_, i) => i % Math.ceil(g.length / max) === 0 || i === g.length - 1));

export const load = async ({ params }) => {
	if (params.id === 'neu') return { hike: BLANK, pending: false };
	const id = Number(params.id);
	if (!Number.isInteger(id)) error(404, 'Not found');
	let h = await fetchHike(id);
	if (!h) error(404, 'Not found');
	// a new route gets its profile here, so Tom sees it right after loading
	if (!h.profile && (h.geometry || h.wanderland)) {
		await fillProfiles();
		h = await fetchHike(id);
	}
	return { hike: { ...h, geometry: thin(h.geometry) }, pending: !h.profile && !!(h.geometry || h.wanderland) };
};

const slugify = (s: string) =>
	s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'wanderung';
const str = (f: FormData, k: string, max = 500) => String(f.get(k) ?? '').trim().slice(0, max);
const rows = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 40);
const hikeId = (params: { id: string }) => Number(params.id) || null;
const link = (id: number) => `/admin/wanderungen/${id}`;

/** Rows from the table editor; a point keeps its place on the route (distM, e, n) by its name. */
function waypoints(f: FormData, old: Waypoint[]): Waypoint[] {
	const [names, elevs, mins] = ['wp_name', 'wp_elev', 'wp_min'].map((k) => f.getAll(k).map((v) => String(v).trim()));
	return names
		.map((name, i) => {
			const prev = old.find((w) => w.name === name);
			const min = mins[i] === '' ? NaN : Number(mins[i]);
			return { ...prev, name: name.slice(0, 60), elev: Number(elevs[i]) || prev?.elev || 0, min: Number.isFinite(min) && min >= 0 ? Math.round(min) : null };
		})
		.filter((w) => w.name)
		.slice(0, 40);
}

export const actions = {
	save: async ({ request, locals, params }) => {
		const f = await request.formData();
		const id = hikeId(params);
		const name = str(f, 'name', 80);
		if (!name) return fail(400, { error: 'Bitte gib der Wanderung einen Namen.' });
		const category = ['wanderweg', 'bergwanderweg', 'alpinwanderweg'].includes(str(f, 'category')) ? str(f, 'category') : 'wanderweg';
		const sac = str(f, 'sac').toUpperCase().replace('-', '–');
		const old = id ? await fetchHike(id) : null;
		const h = {
			name,
			slug: slugify(str(f, 'slug', 60) || name),
			alpine: category !== 'wanderweg',
			category,
			sac: /^T[1-6]\+?(–T[1-6]\+?)?$/.test(sac) ? sac : '',
			durationMin: Number(f.get('duration_min')) || null,
			seasonDe: str(f, 'season_de', 120),
			startName: str(f, 'start_name', 80),
			endName: str(f, 'end_name', 80),
			transitDe: str(f, 'transit_de', 1000),
			waypoints: sql.json(waypoints(f, old?.waypoints ?? [])),
			stops: sql.json(rows(str(f, 'stops', 2000))),
			highlightsDe: str(f, 'highlights_de', 2000),
			tipsDe: str(f, 'tips_de', 2000),
			family: f.get('family') === 'on',
			loop: f.get('loop') === 'on',
			fromHut: f.get('from_hut') === 'on',
			de: str(f, 'de', 2000),
			url: /^https?:\/\//.test(str(f, 'url')) ? str(f, 'url') : ''
		};
		try {
			if (id) {
				const a = await changeRow('hikes', id, { actor: locals.admin!, area: AREA, title: `Wanderung «${name}» geändert`, link: link(id) }, () => sql`update hikes set ${sql(h)} where id = ${id}`);
				void syncTranslations();
				return done('Wanderung gespeichert', a);
			}
			const [{ next }] = await sql`select coalesce(max(sort), 0) + 1 as next from hikes`;
			const [row] = await sql`insert into hikes ${sql({ ...h, sort: next })} returning id`;
			await log({ actor: locals.admin!, area: AREA, title: `Wanderung «${name}» neu angelegt`, link: link(row.id), target: `hikes:${row.id}`, undo: { table: 'hikes', id: row.id, before: null } });
			void syncTranslations();
			redirect(303, link(row.id));
		} catch (e) {
			if ((e as { code?: string }).code === '23505') return fail(409, { error: 'Diese Webadresse gibt es schon. Ändere bitte den Namen oder die Webadresse.' });
			throw e;
		}
	},
	gpx: async ({ request, locals, params }) => {
		const id = hikeId(params)!;
		const file = (await request.formData()).get('gpx');
		if (!(file instanceof File) || file.size === 0 || file.size > 5_000_000) return fail(400, { routeError: 'Bitte wähle eine GPX-Datei bis 5 MB.' });
		const points = parseGpx(await file.text());
		if (points.length < 2) return fail(400, { routeError: 'In dieser Datei habe ich keine Route gefunden. Ist es wirklich eine GPX-Datei?' });
		const a = await changeRow('hikes', id, { actor: locals.admin!, area: AREA, title: `Neue Route (GPX) für «${(await fetchHike(id)).name}»`, link: link(id) }, () =>
			sql`update hikes set geometry = ${sql.json(points)}, source = 'gpx', wanderland = null, profile = null where id = ${id}`
		);
		await fillProfiles();
		return done('Route übernommen', a);
	},
	wanderland: async ({ request, locals, params }) => {
		const id = hikeId(params)!;
		const nr = str(await request.formData(), 'nr', 12);
		if (!/^\d{1,3}(\.\d{1,3})?$/.test(nr)) return fail(400, { routeError: 'Die Routennummer sieht so aus: 1.13' });
		const a = await changeRow('hikes', id, { actor: locals.admin!, area: AREA, title: `Route ${nr} von SchweizMobil für «${(await fetchHike(id)).name}»`, link: link(id) }, () =>
			sql`update hikes set wanderland = ${nr}, geometry = null, profile = null, source = 'wanderland' where id = ${id}`
		);
		await fillProfiles();
		return done('Route übernommen', a);
	},
	noroute: async ({ locals, params }) => {
		const id = hikeId(params)!;
		const a = await changeRow('hikes', id, { actor: locals.admin!, area: AREA, title: `Route von «${(await fetchHike(id)).name}» entfernt`, link: link(id) }, () =>
			sql`update hikes set geometry = null, profile = null, wanderland = null, source = '', distance_m = null, ascent_m = null, descent_m = null where id = ${id}`
		);
		return done('Route entfernt. Es erscheinen nur noch die Wegpunkte.', a);
	},
	delete: async ({ locals, params }) => {
		const id = hikeId(params)!;
		await changeRow('hikes', id, { actor: locals.admin!, area: AREA, title: `Wanderung «${(await fetchHike(id)).name}» gelöscht`, link: '/admin/wanderungen' }, () => sql`delete from hikes where id = ${id}`);
		redirect(303, '/admin/wanderungen');
	}
};
