import { redirect } from '@sveltejs/kit';
import { sql } from '#lib/server/db.ts';
import { listGuides } from '#lib/server/guides.ts';
import { log } from '#lib/server/activity.ts';

export const load = async () => ({ guides: await listGuides() });

export const actions = {
	create: async ({ request, locals }) => {
		const title = String((await request.formData()).get('title') ?? '').trim().slice(0, 80) || 'Neue Anleitung';
		const [{ id }] = await sql`insert into guides (title, sort) values (${title}, (select coalesce(max(sort), 0) + 1 from guides)) returning id`;
		await log({ actor: locals.admin!, area: 'Anleitungen', title: `Anleitung «${title}» angelegt`, link: `/admin/anleitungen/${id}`, target: `guides:${id}`, undo: { table: 'guides', id, before: null } });
		redirect(303, `/admin/anleitungen/${id}`);
	},
	// one step up or down in the list; renumbers all, so equal sort values sort themselves out
	move: async ({ request }) => {
		const f = await request.formData();
		const ids = (await sql`select id from guides order by sort, id`).map((r) => r.id as number);
		const i = ids.indexOf(Number(f.get('id')));
		const j = i + (f.get('dir') === 'up' ? -1 : 1);
		if (i < 0 || j < 0 || j >= ids.length) return;
		[ids[i], ids[j]] = [ids[j], ids[i]];
		await sql`update guides set sort = x.sort from (select unnest(${ids}::int[]) as id, generate_series(1, ${ids.length}) as sort) x where guides.id = x.id`;
	}
};
