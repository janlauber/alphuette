import { fail } from '@sveltejs/kit';
import { sql } from '#lib/server/db.ts';
import { done, undo } from '#lib/server/activity.ts';

export const load = async ({ url }) => {
	const area = url.searchParams.get('bereich') ?? '';
	const entries = await sql<{ id: number; at: Date; actor: string; area: string; title: string; link: string | null; undoable: boolean; undoneAt: Date | null }[]>`
		select id, at, actor, area, title, link, undo is not null as undoable, undone_at from activity
		${area ? sql`where area = ${area}` : sql``}
		order by at desc limit 300`;
	const areas = (await sql`select distinct area from activity order by area`).map((r) => r.area as string);
	return { entries, areas, area };
};

export const actions = {
	undo: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		const err = await undo(id, locals.admin!);
		if (err) return fail(409, { error: err });
		return done('Rückgängig gemacht');
	}
};
