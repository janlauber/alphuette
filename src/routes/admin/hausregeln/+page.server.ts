import { setSetting, stored } from '#lib/server/settings.ts';
import { syncTranslations } from '#lib/server/sitetexts.ts';
import { changeSettings, done } from '#lib/server/activity.ts';

// The house rules are the "rules" text of the site; here they are edited as a list, one rule per row.
export const load = async () => {
	const rules = (await stored()).content.de.rules;
	return {
		rules: rules
			.split('\n')
			.map((l) => l.replace(/^\s*[-•]\s*/, '').trim())
			.filter(Boolean)
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		const rows = (await request.formData())
			.getAll('rule')
			.map((r) => String(r).replace(/\s+/g, ' ').trim().slice(0, 300))
			.filter(Boolean)
			.slice(0, 40);
		const s = await stored();
		const rules = rows.map((r) => `- ${r}`).join('\n');
		if (rules === s.content.de.rules) return done('Nichts geändert');
		const a = await changeSettings(['content'], { actor: locals.admin!, area: 'Texte', title: 'Hausregeln geändert', link: '/admin/hausregeln' }, () =>
			setSetting('content', { ...s.content, de: { ...s.content.de, rules } })
		);
		void syncTranslations();
		return done('Gespeichert. Gäste sehen die Regeln in ihrer Sprache.', a);
	}
};
