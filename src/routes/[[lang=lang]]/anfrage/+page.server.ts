import { fail, redirect } from '@sveltejs/kit';
import { createRequest, guestToken, takenRanges } from '#lib/server/bookings.ts';
import { getSeasons, getSettings } from '#lib/server/settings.ts';
import { limited } from '#lib/server/limit.ts';
import { localize } from '#lib/i18n.ts';

const isoDate = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '');
const int = (v: unknown, max = 20) => Math.max(0, Math.min(max, Math.trunc(Number(v) || 0)));

export const load = async ({ url, parent }) => {
	const { lang } = await parent();
	const [settings, seasons, taken] = await Promise.all([getSettings(), getSeasons(), takenRanges()]);
	const q = url.searchParams;
	return {
		seasons: seasons.map(({ id: _, ...s }) => s),
		taken,
		rates: settings.rates,
		rules: settings.content[lang].rules,
		initial: {
			checkIn: isoDate(q.get('in')),
			checkOut: isoDate(q.get('out')),
			adults: int(q.get('a') ?? 2) || 1,
			children: int(q.get('c')),
			infants: int(q.get('i')),
			linen: int(q.get('l'))
		}
	};
};

export const actions = {
	default: async ({ request, params, getClientAddress }) => {
		const lang = params.lang ?? 'de';
		const f = await request.formData();
		const values = Object.fromEntries([...f].filter(([, v]) => typeof v === 'string')) as Record<string, string>;
		if (values.website) return fail(400, { values, error: 'invalid' }); // honeypot
		if (limited('request:' + getClientAddress(), 10, 60 * 60_000)) return fail(429, { values, error: 'tooMany' });

		const r = {
			checkIn: isoDate(values.checkIn),
			checkOut: isoDate(values.checkOut),
			guests: { adults: int(values.adults), children: int(values.children), infants: int(values.infants), linen: int(values.linen) },
			name: (values.name ?? '').trim().slice(0, 100),
			email: (values.email ?? '').trim().toLowerCase().slice(0, 200),
			phone: (values.phone ?? '').trim().slice(0, 40),
			city: (values.city ?? '').trim().slice(0, 100),
			arrival: values.arrival === 'auto' || values.arrival === 'oev' ? values.arrival : null,
			note: (values.note ?? '').trim().slice(0, 3000),
			lang
		} as const;

		const invalid = [
			r.name.length < 2 && 'name',
			!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(r.email) && 'email',
			r.city.length < 2 && 'city'
		].filter(Boolean) as string[];
		if (invalid.length) return fail(400, { values, invalid, error: 'invalid' });

		const res = await createRequest(r);
		if ('error' in res) return fail(409, { values, error: res.error });
		redirect(303, localize(lang, `/buchung/${guestToken(res.booking.ref)}?neu`));
	}
};
