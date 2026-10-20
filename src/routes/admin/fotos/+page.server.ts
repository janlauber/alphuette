import { fail } from '@sveltejs/kit';
import { sql } from '#lib/server/db.ts';
import { addPhoto, deletePhoto } from '#lib/server/images.ts';

export const load = async () => ({
	photos: await sql<{ id: number; key: string; width: number; height: number; widths: number[]; lqip: string; altDe: string; altEn: string; hero: boolean }[]>`
		select id, key, width, height, widths, lqip, alt_de, alt_en, hero from photos order by hero desc, sort, id`
});

const id = (f: FormData) => Number(f.get('id'));

export const actions = {
	upload: async ({ request }) => {
		const files = (await request.formData()).getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
		const failed: string[] = [];
		for (const file of files) {
			if (file.size > 40_000_000) {
				failed.push(file.name);
				continue;
			}
			try {
				await addPhoto(new Uint8Array(await file.arrayBuffer()));
			} catch {
				failed.push(file.name);
			}
		}
		if (failed.length) return fail(400, { failed });
		return { uploaded: files.length };
	},
	save: async ({ request }) => {
		const f = await request.formData();
		await sql`update photos set alt_de = ${String(f.get('alt_de')).slice(0, 300)}, alt_en = ${String(f.get('alt_en')).slice(0, 300)} where id = ${id(f)}`;
		return { saved: id(f) };
	},
	move: async ({ request }) => {
		const f = await request.formData();
		const ids = (await sql`select id from photos order by hero desc, sort, id`).map((r) => r.id as number);
		const i = ids.indexOf(id(f));
		const j = i + (f.get('dir') === 'up' ? -1 : 1);
		if (i < 0 || j < 0 || j >= ids.length) return;
		[ids[i], ids[j]] = [ids[j], ids[i]];
		await sql`update photos set sort = x.sort from (select unnest(${ids}::int[]) as id, generate_series(1, ${ids.length}) as sort) x where photos.id = x.id`;
	},
	hero: async ({ request }) => {
		await sql`update photos set hero = (id = ${id(await request.formData())})`;
	},
	delete: async ({ request }) => {
		await deletePhoto(id(await request.formData()));
	}
};
