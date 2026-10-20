import { getSeasons, getSettings } from '#lib/server/settings.ts';
import { takenRanges } from '#lib/server/bookings.ts';
import { listPhotos } from '#lib/server/images.ts';

export const load = async ({ parent }) => {
	const { lang } = await parent();
	const [settings, seasons, taken, photos] = await Promise.all([getSettings(), getSeasons(), takenRanges(), listPhotos(lang)]);
	return {
		seasons: seasons.map(({ id: _, ...s }) => s),
		taken,
		photos,
		rates: settings.rates,
		content: settings.content[lang],
		tips: settings.tips.slice(0, 4),
		location: { lat: settings.host.lat, lon: settings.host.lon }
	};
};
