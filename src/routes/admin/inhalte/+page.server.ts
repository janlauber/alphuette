import { fail } from '@sveltejs/kit';
import { formatIBAN, isIBANValid } from 'swissqrbill/utils';
import { DEFAULTS, getSettings, setSetting, type Content, type Tip } from '#lib/server/settings.ts';

export const load = async () => {
	const s = await getSettings();
	return { name: s.name, host: s.host, content: s.content, tips: s.tips, fields: Object.keys(DEFAULTS.content.de) as (keyof Content)[] };
};

/** Swiss or Liechtenstein IBAN (the only ones a QR bill accepts), formatted, or null. */
const validIban = (raw: string) => {
	const iban = raw.replace(/\s/g, '').toUpperCase();
	return /^(CH|LI)/.test(iban) && isIBANValid(iban) ? formatIBAN(iban) : null;
};

const str = (f: FormData, k: string, max = 200) => String(f.get(k) ?? '').trim().slice(0, max);

export const actions = {
	content: async ({ request }) => {
		const f = await request.formData();
		const lang = f.get('lang') === 'en' ? 'en' : 'de';
		const { content } = await getSettings();
		const next = { ...content[lang] };
		for (const key of Object.keys(DEFAULTS.content.de) as (keyof Content)[]) {
			if (f.has(key)) next[key] = String(f.get(key)).replace(/\r/g, '').trim().slice(0, 10_000);
		}
		await setSetting('content', { ...content, [lang]: next });
		return { saved: 'content-' + lang };
	},
	host: async ({ request }) => {
		const f = await request.formData();
		const ibanRaw = str(f, 'iban', 40);
		const iban = ibanRaw ? validIban(ibanRaw) : '';
		if (iban === null) return fail(400, { error: 'Die IBAN stimmt nicht. Bitte prüfe sie.' });
		const lat = Number(str(f, 'lat'));
		const lon = Number(str(f, 'lon'));
		await setSetting('name', str(f, 'name', 100) || DEFAULTS.name);
		await setSetting('host', {
			name: str(f, 'hostName', 100),
			street: str(f, 'street', 100),
			zip: str(f, 'zip', 10),
			city: str(f, 'city', 100),
			email: str(f, 'email', 200),
			whatsapp: str(f, 'whatsapp', 30),
			iban,
			lat: Number.isFinite(lat) && lat ? lat : DEFAULTS.host.lat,
			lon: Number.isFinite(lon) && lon ? lon : DEFAULTS.host.lon
		});
		return { saved: 'host' };
	},
	tips: async ({ request }) => {
		const f = await request.formData();
		const col = (k: string) => f.getAll(k).map((v) => String(v).trim().slice(0, 500));
		const [names, times, de, en, urls] = [col('name'), col('time'), col('de'), col('en'), col('url')];
		const alpine = new Set(col('alpine'));
		const tips: Tip[] = names
			.map((name, i) => ({
				name,
				time: times[i],
				alpine: alpine.has(String(i)),
				de: de[i],
				en: en[i],
				url: /^https?:\/\//.test(urls[i]) ? urls[i] : ''
			}))
			.filter((t) => t.name);
		await setSetting('tips', tips);
		return { saved: 'tips' };
	}
};
