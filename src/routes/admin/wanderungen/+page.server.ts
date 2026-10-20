import { fail } from '@sveltejs/kit';
import { sql } from '#lib/server/db.ts';
import { fillProfiles, parseGpx } from '#lib/server/hikes.ts';

export const load = async () => {
	await fillProfiles();
	return { hikes: await sql`select id, slug, name, time, alpine, de, en, url, source, profile, distance_m, ascent_m, sort from hikes order by sort, id` };
};

const slugify = (s: string) =>
	s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'wanderung';
const str = (f: FormData, k: string, max = 500) => String(f.get(k) ?? '').trim().slice(0, max);

export const actions = {
	save: async ({ request }) => {
		const f = await request.formData();
		const id = Number(f.get('id')) || null;
		const name = str(f, 'name', 80);
		if (!name) return fail(400, { error: 'Bitte gib einen Namen ein.', id });
		const h = {
			name,
			slug: slugify(str(f, 'slug', 60) || name),
			time: str(f, 'time', 30),
			alpine: f.get('alpine') === 'on',
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
