import { sql } from '#lib/server/db.ts';

export const load = async () => ({
	reviews: await sql`
		select r.id, r.name, r.rating, r.body, r.reply, r.approved, r.created_at, r.stay::text as stay, b.id as booking_id, b.name as guest
		from reviews r left join bookings b on b.id = r.booking_id order by r.approved, r.created_at desc`
});

const id = (f: FormData) => Number(f.get('id'));

export const actions = {
	approve: async ({ request }) => {
		const f = await request.formData();
		await sql`update reviews set approved = ${f.get('approved') === '1'} where id = ${id(f)}`;
	},
	reply: async ({ request }) => {
		const f = await request.formData();
		await sql`update reviews set reply = ${String(f.get('reply') ?? '').trim().slice(0, 2000) || null} where id = ${id(f)}`;
		return { saved: id(f) };
	},
	delete: async ({ request }) => {
		await sql`delete from reviews where id = ${id(await request.formData())}`;
	}
};
