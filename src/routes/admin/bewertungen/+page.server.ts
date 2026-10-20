import { sql } from '#lib/server/db.ts';
import { changeRow, done } from '#lib/server/activity.ts';

export const load = async () => ({
	reviews: await sql`
		select r.id, r.name, r.rating, r.body, r.reply, r.approved, r.created_at, r.stay::text as stay, b.id as booking_id, b.name as guest
		from reviews r left join bookings b on b.id = r.booking_id order by r.approved, r.created_at desc`
});

const id = (f: FormData) => Number(f.get('id'));
const name = async (rid: number) => (await sql`select name from reviews where id = ${rid}`)[0]?.name ?? '';
const entry = async (rid: number, actor: string, what: string) => ({ actor, area: 'Gästebuch', title: `Bewertung von ${await name(rid)} ${what}`, link: '/admin/bewertungen' });

export const actions = {
	approve: async ({ request, locals }) => {
		const f = await request.formData();
		const on = f.get('approved') === '1';
		const a = await changeRow('reviews', id(f), await entry(id(f), locals.admin!, on ? 'freigeschaltet' : 'versteckt'), () =>
			sql`update reviews set approved = ${on} where id = ${id(f)}`
		);
		return done(on ? 'Die Bewertung steht jetzt auf der Website' : 'Die Bewertung ist versteckt', a);
	},
	reply: async ({ request, locals }) => {
		const f = await request.formData();
		const a = await changeRow('reviews', id(f), await entry(id(f), locals.admin!, 'beantwortet'), () =>
			sql`update reviews set reply = ${String(f.get('reply') ?? '').trim().slice(0, 2000) || null} where id = ${id(f)}`
		);
		return { saved: id(f), ...done('Antwort gespeichert', a) };
	},
	delete: async ({ request, locals }) => {
		const rid = id(await request.formData());
		const a = await changeRow('reviews', rid, await entry(rid, locals.admin!, 'gelöscht'), () => sql`delete from reviews where id = ${rid}`);
		return done('Bewertung gelöscht', a);
	}
};
