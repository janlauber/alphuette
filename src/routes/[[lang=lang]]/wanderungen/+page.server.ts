import { listHikes } from '#lib/server/hikes.ts';

export const load = async ({ parent }) => {
	const { lang } = await parent();
	return { hikes: await listHikes(lang) };
};
