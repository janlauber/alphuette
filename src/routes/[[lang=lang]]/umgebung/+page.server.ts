import { getSettings } from '#lib/server/settings.ts';

export const load = async ({ parent }) => {
	const { lang } = await parent();
	const s = await getSettings();
	return { tips: s.tips, area: s.content[lang].area };
};
