import { fail } from '@sveltejs/kit';
import { formatIBAN, isIBANValid } from 'swissqrbill/utils';
import { DEFAULTS, setSetting, stored } from '#lib/server/settings.ts';
import { changeSettings, done } from '#lib/server/activity.ts';
import { missing } from '#lib/server/invoice.ts';

export const load = async () => {
	const s = await stored();
	return { name: s.name, host: s.host, missing: missing(s.host) };
};

/** Swiss or Liechtenstein IBAN (the only ones a QR bill accepts), formatted, or null. */
const validIban = (raw: string) => {
	const iban = raw.replace(/\s/g, '').toUpperCase();
	return /^(CH|LI)/.test(iban) && isIBANValid(iban) ? formatIBAN(iban) : null;
};

const str = (f: FormData, k: string, max = 200) => String(f.get(k) ?? '').trim().slice(0, max);

export const actions = {
	default: async ({ request, locals }) => {
		const f = await request.formData();
		const ibanRaw = str(f, 'iban', 40);
		const iban = ibanRaw ? validIban(ibanRaw) : '';
		if (iban === null) return fail(400, { error: 'Die IBAN stimmt nicht. Bitte prüfe sie.' });
		const lat = Number(str(f, 'lat'));
		const lon = Number(str(f, 'lon'));
		const a = await changeSettings(['name', 'host'], { actor: locals.admin!, area: 'Gastgeber', title: 'Gastgeber, Adresse oder IBAN geändert', link: '/admin/gastgeber' }, async () => {
			await setSetting('name', str(f, 'name', 100) || DEFAULTS.name);
			await setSetting('host', {
				name: str(f, 'hostName', 100),
				street: str(f, 'street', 100),
				zip: str(f, 'zip', 10),
				city: str(f, 'city', 100),
				email: str(f, 'email', 200),
				whatsapp: str(f, 'whatsapp', 30),
				iban,
				precheckin: /^https:\/\//.test(str(f, 'precheckin', 500)) ? str(f, 'precheckin', 500) : '',
				lat: Number.isFinite(lat) && lat ? lat : DEFAULTS.host.lat,
				lon: Number.isFinite(lon) && lon ? lon : DEFAULTS.host.lon
			});
		});
		return { saved: ['host'], ...done('Gespeichert', a) };
	},
};
