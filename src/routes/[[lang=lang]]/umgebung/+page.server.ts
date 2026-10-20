import { getSettings } from '#lib/server/settings.ts';
import { forecast } from '#lib/server/weather.ts';
import { departures } from '#lib/server/transit.ts';

export const load = async ({ parent }) => {
	const { lang } = await parent();
	const s = await getSettings();
	return {
		area: s.content[lang].area,
		weather: forecast().catch(() => null),
		toHut: departures('toHut').catch(() => null),
		fromHut: departures('fromHut').catch(() => null)
	};
};
