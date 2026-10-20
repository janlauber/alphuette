import { getSeasons, getSettings, parseFaq } from '#lib/server/settings.ts';
import { takenRanges } from '#lib/server/bookings.ts';
import { listPhotos } from '#lib/server/images.ts';
import { listHikes } from '#lib/server/hikes.ts';
import { publicReviews } from '#lib/server/reviews.ts';
import { forecast } from '#lib/server/weather.ts';
import { departures } from '#lib/server/transit.ts';

export const load = async ({ parent }) => {
	const { lang } = await parent();
	const [settings, seasons, taken, photos, hikes, reviews] = await Promise.all([
		getSettings(),
		getSeasons(),
		takenRanges(),
		listPhotos(lang),
		listHikes(lang),
		publicReviews(lang)
	]);
	const content = settings.content[lang];
	return {
		seasons: seasons.map(({ id: _, ...s }) => s),
		taken,
		photos,
		rates: settings.rates,
		content,
		faq: parseFaq(content.faq),
		amenities: settings.amenities.map((a) => ({ icon: a.icon, label: a[lang] || a.de })),
		hikes: hikes.slice(0, 6),
		reviews,
		location: { lat: settings.host.lat, lon: settings.host.lon },
		// streamed: the page renders first, weather and buses fill in when they arrive
		weather: forecast().catch(() => null),
		buses: departures('toHut').catch(() => null)
	};
};
