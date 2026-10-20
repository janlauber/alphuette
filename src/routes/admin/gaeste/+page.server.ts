import { sql } from '#lib/server/db.ts';

export const load = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
	const like = `%${q.replace(/[%_\\]/g, '\\$&')}%`;
	const guests = await sql`
		select lower(email) as email, (array_agg(name order by created_at desc))[1] as name,
			(array_agg(phone order by created_at desc))[1] as phone, (array_agg(city order by created_at desc))[1] as city,
			count(*) filter (where status = 'bestaetigt')::int as stays,
			max(check_in) filter (where status = 'bestaetigt') as last_stay,
			coalesce(sum(total_rp) filter (where status = 'bestaetigt'), 0)::int as total,
			(array_agg(id order by created_at desc))[1] as last_id
		from bookings where status <> 'gesperrt' and email is not null
			${q ? sql`and (name ilike ${like} or email ilike ${like} or city ilike ${like})` : sql``}
		group by lower(email) order by max(created_at) desc limit 300`;
	return { guests, q };
};
