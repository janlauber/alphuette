import { sql } from '#lib/server/db.ts';
import { fillProfiles } from '#lib/server/hikes.ts';

export const load = async () => {
	await fillProfiles();
	return {
		hikes: await sql<
			{ id: number; slug: string; name: string; source: string; profile: [number, number][] | null; distanceM: number | null; ascentM: number | null; category: string; sac: string; durationMin: number | null; family: boolean; loop: boolean; fromHut: boolean; waypoints: unknown[] | null }[]
		>`select id, slug, name, source, profile, distance_m, ascent_m, category, sac, duration_min, family, loop, from_hut, waypoints
			from hikes order by sort, id`
	};
};

export const actions = {
	// one step up or down in the list; renumbers all, so equal sort values sort themselves out
	move: async ({ request }) => {
		const f = await request.formData();
		const ids = (await sql`select id from hikes order by sort, id`).map((r) => r.id as number);
		const i = ids.indexOf(Number(f.get('id')));
		const j = i + (f.get('dir') === 'up' ? -1 : 1);
		if (i < 0 || j < 0 || j >= ids.length) return;
		[ids[i], ids[j]] = [ids[j], ids[i]];
		await sql`update hikes set sort = x.sort from (select unnest(${ids}::int[]) as id, generate_series(1, ${ids.length}) as sort) x where hikes.id = x.id`;
	}
};
