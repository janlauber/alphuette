import { fail } from '@sveltejs/kit';
import { DEFAULTS, setSetting, stored, type Amenity, type Content } from '#lib/server/settings.ts';
import { lookup, setManual, TARGETS } from '#lib/server/translate.ts';
import { syncTranslations } from '#lib/server/sitetexts.ts';
import { ICONS } from '#lib/icons.ts';
import { changeSettings, done, log } from '#lib/server/activity.ts';
import type { Lang } from '#lib/i18n.ts';

const AREA = 'Texte';
const link = '/admin/inhalte';

// German names of the text fields, also used in the change log
const LABELS: Record<string, string> = {
	tagline: 'Kurzbeschreibung',
	intro: 'Einleitung',
	sleeping: 'Schlafen',
	good_to_know: 'Gut zu wissen',
	arrival: 'Anreise',
	rules: 'Hausregeln',
	payment: 'Zahlung und Absage',
	area: 'Umgebung',
	faq: 'Häufige Fragen',
	packing: 'Packliste',
	guest_info: 'Infos für bestätigte Gäste'
};

export const load = async () => {
	const s = await stored();
	const de = s.content.de;
	const tr = await lookup(Object.values(de));
	// per field: the translation in each language, or null while it is still missing
	const translations = Object.fromEntries(
		Object.entries(de).map(([k, v]) => [k, Object.fromEntries(TARGETS.map((l) => [l, v.trim() ? (tr.get(l)?.get(v) ?? null) : '']))])
	) as Record<keyof Content, Record<(typeof TARGETS)[number], string | null>>;
	return { content: de, translations, amenities: s.amenities.map(({ icon, de }) => ({ icon, de })), icons: Object.keys(ICONS), fields: Object.keys(DEFAULTS.content.de) as (keyof Content)[] };
};


const str = (f: FormData, k: string, max = 200) => String(f.get(k) ?? '').trim().slice(0, max);

export const actions = {
	content: async ({ request, locals }) => {
		const f = await request.formData();
		const s = await stored();
		const next = { ...s.content.de };
		for (const key of Object.keys(DEFAULTS.content.de) as (keyof Content)[]) {
			if (f.has(key)) next[key] = String(f.get(key)).replace(/\r/g, '').trim().slice(0, 10_000);
		}
		const changed = (Object.keys(next) as (keyof Content)[]).filter((k) => next[k] !== s.content.de[k]);
		if (!changed.length) return done('Nichts geändert');
		const a = await changeSettings(['content'], { actor: locals.admin!, area: AREA, title: `Text geändert: ${changed.map((k) => LABELS[k] ?? k).join(', ')}`, link }, () =>
			setSetting('content', { ...s.content, de: next })
		);
		void syncTranslations();
		return { saved: changed, ...done('Gespeichert. Die Website zeigt den neuen Text sofort.', a) };
	},
	translation: async ({ request, locals }) => {
		const f = await request.formData();
		const key = str(f, 'key', 40) as keyof Content;
		const lang = str(f, 'lang', 2) as Lang;
		const text = String(f.get('text') ?? '').replace(/\r/g, '').trim().slice(0, 10_000);
		const de = (await stored()).content.de[key];
		if (!de || !(TARGETS as readonly string[]).includes(lang) || !text) return fail(400, { error: 'Diese Übersetzung kann ich nicht speichern.' });
		await setManual(de, lang, text);
		await log({ actor: locals.admin!, area: AREA, title: `Übersetzung korrigiert: ${LABELS[key] ?? key} (${lang.toUpperCase()})`, link });
		return done('Übersetzung gespeichert');
	},
	amenities: async ({ request, locals }) => {
		const f = await request.formData();
		const col = (k: string) => f.getAll(k).map((v) => String(v).trim().slice(0, 80));
		const [icons, de] = [col('icon'), col('de')];
		const list: Amenity[] = de.map((label, i) => ({ icon: icons[i] in ICONS ? icons[i] : 'info', de: label })).filter((a) => a.de);
		const a = await changeSettings(['amenities'], { actor: locals.admin!, area: AREA, title: 'Ausstattung geändert', link }, () => setSetting('amenities', list));
		void syncTranslations();
		return { saved: ['amenities'], ...done('Gespeichert', a) };
	}
};
