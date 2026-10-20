import { error } from '@sveltejs/kit';
import { renderSVG } from 'uqr';
import { SITE_URL } from '$app/env/private';
import { getSeasons, getSettings } from '#lib/server/settings.ts';
import { listHikes } from '#lib/server/hikes.ts';
import { listPhotos } from '#lib/server/images.ts';
import { LANGS, localize, type Lang } from '#lib/i18n.ts';

const qr = (url: string) => renderSVG(url, { ecc: 'M', border: 0, blackColor: '#17251c', whiteColor: '#ffffff' });
const sbb = (lang: Lang) =>
	`https://www.sbb.ch/${{ de: 'de/kaufen', en: 'en/buying', fr: 'fr/acheter', it: 'it/acquistare' }[lang]}/pages/fahrplan/fahrplan.xhtml?von=${encodeURIComponent('Kiental, Abzw. Spiggengrund')}&nach=${encodeURIComponent('Reichenbach im Kandertal')}`;

export const load = async ({ params, url }) => {
	if (params.sheet !== 'infoblatt' && params.sheet !== 'flyer') error(404, 'Not found');
	const lang = (LANGS as readonly string[]).includes(url.searchParams.get('sprache') ?? '') ? (url.searchParams.get('sprache') as Lang) : 'de';
	const [s, seasons, hikes, photos] = await Promise.all([getSettings(), getSeasons(), listHikes(lang), listPhotos(lang)]);
	// the title photo, and one inside, one outside and one in winter if there are any
	const rest = photos.slice(1);
	const first = (c: string) => rest.find((p) => p.category === c);
	const picked = [first('drinnen'), first('draussen'), first('winter')].filter((p) => p !== undefined);
	const more = [...picked, ...rest.filter((p) => !picked.includes(p))].slice(0, 3);
	const c = s.content[lang];
	const site = SITE_URL.replace(/^https?:\/\//, '');
	// the campaign tag shows up in "Besucher", so Tom sees how many come from the paper
	const tag = (path: string, source: string) => `${SITE_URL}${localize(lang, path)}?utm_source=${source}&utm_medium=druck`;
	const weekly = seasons.map((x) => x.weekly).filter((w): w is number => !!w);
	return {
		sheet: params.sheet,
		lang,
		name: s.name,
		host: { name: s.host.name, email: s.host.email, phone: s.host.whatsapp },
		times: { in: s.rates.checkIn, out: s.rates.checkOut },
		maxGuests: s.rates.maxGuests,
		texts: { goodToKnow: c.good_to_know, rules: c.rules, area: c.area, tagline: c.tagline },
		amenities: s.amenities.slice(0, 6).map((a) => ({ icon: a.icon, label: a[lang] })),
		hikes: hikes.filter((h) => h.fromHut).slice(0, 5).map((h) => ({ name: h.name, durationMin: h.durationMin })),
		photos: { hero: photos[0] ? { key: photos[0].key, alt: photos[0].alt } : null, more: more.map((p) => ({ key: p.key, alt: p.alt })) },
		fromWeekly: weekly.length ? Math.min(...weekly) : null,
		months: seasons.length ? { from: seasons[0].start, to: seasons.at(-1)!.end } : null,
		site,
		qr: {
			site: qr(tag('/', params.sheet)),
			hikes: qr(tag('/wanderungen', params.sheet)),
			bus: qr(sbb(lang)),
			area: qr(tag('/umgebung', params.sheet))
		}
	};
};
