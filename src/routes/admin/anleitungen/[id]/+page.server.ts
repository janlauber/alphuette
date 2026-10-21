import { error, redirect } from '@sveltejs/kit';
import { sql } from '#lib/server/db.ts';
import { cleanSteps } from '#lib/server/guides.ts';
import { changeRow, done } from '#lib/server/activity.ts';
import { syncTranslations } from '#lib/server/sitetexts.ts';
import type { Guide } from '#lib/guides.ts';

const AREA = 'Anleitungen';

async function guide(id: number) {
	const [g] = await sql<Guide[]>`select id, title, steps, sort from guides where id = ${id}`;
	if (!g) error(404, 'Not found');
	return g;
}

export const load = async ({ params }) => ({ guide: await guide(Number(params.id)) });

export const actions = {
	save: async ({ params, request, locals }) => {
		const g = await guide(Number(params.id));
		const f = await request.formData();
		const title = String(f.get('title') ?? '').trim().slice(0, 80) || g.title;
		const steps = cleanSteps(String(f.get('steps') ?? '[]'));
		if (title === g.title && JSON.stringify(steps) === JSON.stringify(g.steps)) return done('Nichts geändert');
		const a = await changeRow('guides', g.id, { actor: locals.admin!, area: AREA, title: `Anleitung «${title}» geändert`, link: `/admin/anleitungen/${g.id}` }, () =>
			sql`update guides set title = ${title}, steps = ${sql.json(steps)} where id = ${g.id}`
		);
		void syncTranslations();
		return done('Gespeichert. Bestätigte Gäste sehen die Anleitung auf ihrer Buchungsseite.', a);
	},
	delete: async ({ params, locals }) => {
		const g = await guide(Number(params.id));
		await changeRow('guides', g.id, { actor: locals.admin!, area: AREA, title: `Anleitung «${g.title}» gelöscht`, link: '/admin/anleitungen' }, () => sql`delete from guides where id = ${g.id}`);
		redirect(303, '/admin/anleitungen');
	}
};
