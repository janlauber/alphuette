import { fail } from '@sveltejs/kit';
import { createRequest, takenRanges } from '#lib/server/bookings.ts';
import { getSeasons, getSettings } from '#lib/server/settings.ts';
import { listPhotos } from '#lib/server/images.ts';
import { limited } from '#lib/server/limit.ts';
import { formTimeOk, formToken, mailboxPlausible, powChallenge, powValid } from '#lib/server/spam.ts';

const isoDate = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '');
const int = (v: unknown, max = 20) => Math.max(0, Math.min(max, Math.trunc(Number(v) || 0)));

export const load = async ({ url, parent }) => {
	const { lang } = await parent();
	const [settings, seasons, taken, photos] = await Promise.all([getSettings(), getSeasons(), takenRanges(), listPhotos(lang)]);
	const q = url.searchParams;
	return {
		seasons: seasons.map(({ id: _, ...s }) => s),
		taken,
		rates: settings.rates,
		rules: settings.content[lang].rules,
		payment: settings.content[lang].payment,
		photo: photos[0] ?? null,
		pow: powChallenge(),
		ft: formToken(),
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
		const keep = { ...values, pow: undefined, nonce: undefined, ft: undefined };
		if (values.website) return fail(400, { values: keep, error: 'spam' }); // honeypot
		if (limited('request:' + getClientAddress(), 10, 60 * 60_000)) return fail(429, { values: keep, error: 'tooMany' });
		if (!formTimeOk(values.ft ?? '') || !powValid(values.pow ?? '', values.nonce ?? '')) return fail(400, { values: keep, error: 'spam' });

		const r = {
			checkIn: isoDate(values.checkIn),
			checkOut: isoDate(values.checkOut),
			guests: { adults: int(values.adults), children: int(values.children), infants: int(values.infants), linen: int(values.linen) },
			name: (values.name ?? '').trim().slice(0, 100),
			email: (values.email ?? '').trim().toLowerCase().slice(0, 200),
			phone: (values.phone ?? '').trim().slice(0, 40),
			city: (values.city ?? '').trim().slice(0, 100),
			country: /^[A-Z]{2}$/.test(values.country ?? '') ? values.country! : null,
			arrival: values.arrival === 'auto' || values.arrival === 'oev' ? values.arrival : null,
			note: (values.note ?? '').trim().slice(0, 3000),
			lang
		} as const;

		const invalid = [
			r.name.length < 2 && 'name',
			!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(r.email) && 'email',
			r.city.length < 2 && 'city'
		].filter(Boolean) as string[];
		if (invalid.length) return fail(400, { values: keep, invalid, error: 'invalid' });
		if (!(await mailboxPlausible(r.email))) return fail(400, { values: keep, invalid: ['email'], error: 'mailbox' });
		// The form can send mail to any address; cap it so nobody uses it to flood a stranger's inbox.
		if (limited('mailto:' + r.email, 3, 24 * 3600_000)) return fail(429, { values: keep, error: 'mailLimit' });

		const res = await createRequest(r);
		if ('error' in res) return fail(409, { values: keep, error: res.error });
		return { sent: true, email: r.email };
	}
};
