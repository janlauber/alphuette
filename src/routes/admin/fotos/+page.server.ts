import { fail } from '@sveltejs/kit';
import { sql } from '#lib/server/db.ts';
import { addPhoto } from '#lib/server/images.ts';
import { changeRow, done, log } from '#lib/server/activity.ts';
import { syncTranslations } from '#lib/server/sitetexts.ts';
import { fromFileName } from '#lib/photoName.ts';

type Photo = { id: number; key: string; width: number; height: number; widths: number[]; lqip: string; altDe: string; hero: boolean; category: string; deletedAt: Date | null };

export const load = async () => {
	const all = await sql<Photo[]>`select id, key, width, height, widths, lqip, alt_de, hero, category, deleted_at from photos order by hero desc, sort, id`;
	return { photos: all.filter((p) => !p.deletedAt), trash: all.filter((p) => p.deletedAt) };
};

const id = (f: FormData) => Number(f.get('id'));
const AREA = 'Fotos';
const link = '/admin/fotos';
const label = async (pid: number) => {
	const [p] = await sql`select alt_de from photos where id = ${pid}`;
	return p?.altDe ? `«${p.altDe}»` : 'ohne Beschreibung';
};

export const actions = {
	upload: async ({ request, locals }) => {
		const files = (await request.formData()).getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
		const failed: string[] = [];
		for (const file of files) {
			if (file.size > 40_000_000) {
				failed.push(file.name);
				continue;
			}
			try {
				// a descriptive file name fills in "Was sieht man?" and the group
				const { alt, category } = fromFileName(file.name);
				const pid = await addPhoto(new Uint8Array(await file.arrayBuffer()), { de: alt, en: '' });
				if (category) await sql`update photos set category = ${category} where id = ${pid}`;
			} catch (e) {
				console.error('photo upload failed', file.name, e);
				failed.push(file.name);
			}
		}
		const n = files.length - failed.length;
		if (n) await log({ actor: locals.admin!, area: AREA, title: n === 1 ? '1 Foto hochgeladen' : `${n} Fotos hochgeladen`, link });
		if (n) void syncTranslations();
		if (failed.length) return fail(400, { failed });
		return { uploaded: n, ...done(n === 1 ? 'Foto hochgeladen. Es steht jetzt zuunterst.' : `${n} Fotos hochgeladen. Sie stehen jetzt zuunterst.`) };
	},
	save: async ({ request, locals }) => {
		const f = await request.formData();
		const category = ['draussen', 'drinnen', 'winter'].includes(String(f.get('category'))) ? String(f.get('category')) : '';
		const a = await changeRow('photos', id(f), { actor: locals.admin!, area: AREA, title: `Foto ${await label(id(f))} geändert`, link }, () =>
			sql`update photos set alt_de = ${String(f.get('alt_de') ?? '').trim().slice(0, 300)}, category = ${category} where id = ${id(f)}`
		);
		void syncTranslations();
		return { saved: id(f), ...done('Foto gespeichert', a) };
	},
	move: async ({ request }) => {
		const f = await request.formData();
		const ids = (await sql`select id from photos where deleted_at is null order by hero desc, sort, id`).map((r) => r.id as number);
		const i = ids.indexOf(id(f));
		const j = i + (f.get('dir') === 'up' ? -1 : 1);
		if (i < 0 || j < 0 || j >= ids.length) return;
		[ids[i], ids[j]] = [ids[j], ids[i]];
		await sql`update photos set sort = x.sort from (select unnest(${ids}::int[]) as id, generate_series(1, ${ids.length}) as sort) x where photos.id = x.id`;
	},
	hero: async ({ request, locals }) => {
		const pid = id(await request.formData());
		await sql`update photos set hero = (id = ${pid})`;
		await log({ actor: locals.admin!, area: AREA, title: `Neues Titelbild: ${await label(pid)}`, link });
		return done('Neues Titelbild gewählt');
	},
	delete: async ({ request, locals }) => {
		const pid = id(await request.formData());
		const a = await changeRow('photos', pid, { actor: locals.admin!, area: AREA, title: `Foto ${await label(pid)} in den Papierkorb gelegt`, link }, () =>
			sql`update photos set deleted_at = now(), hero = false where id = ${pid}`
		);
		return done('Foto liegt im Papierkorb', a);
	},
	restore: async ({ request, locals }) => {
		const pid = id(await request.formData());
		const a = await changeRow('photos', pid, { actor: locals.admin!, area: AREA, title: `Foto ${await label(pid)} aus dem Papierkorb geholt`, link }, () =>
			sql`update photos set deleted_at = null, sort = (select coalesce(max(sort), 0) + 1 from photos) where id = ${pid}`
		);
		return done('Foto ist wieder auf der Website, ganz hinten', a);
	}
};
