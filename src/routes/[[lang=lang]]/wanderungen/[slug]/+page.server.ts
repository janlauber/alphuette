import { error } from '@sveltejs/kit';
import { hikeBySlug } from '#lib/server/hikes.ts';

export const load = async ({ params, parent }) => {
	const { lang } = await parent();
	const hike = await hikeBySlug(params.slug, lang);
	if (!hike) error(404, 'Not found');
	return { hike };
};
