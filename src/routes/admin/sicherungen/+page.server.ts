import { fail } from '@sveltejs/kit';
import { addBackup, AREAS, createBackup, isBackupName, listBackups, REASONS, restore, type Area } from '#lib/server/backup.ts';
import { done, log } from '#lib/server/activity.ts';
import { fmtDate } from '#lib/i18n.ts';

export const load = async () => ({
	backups: await listBackups(),
	reasons: REASONS,
	areas: Object.entries(AREAS).map(([key, a]) => ({ key, label: a.label }))
});

const when = (iso: string) => `${fmtDate(iso.slice(0, 10), 'de', { month: 'long' })}, ${new Date(iso).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' })} Uhr`;

export const actions = {
	create: async ({ locals }) => {
		await createBackup('manuell');
		await log({ actor: locals.admin!, area: 'Sicherungen', title: 'Sicherung von Hand gemacht', link: '/admin/sicherungen' });
		return done('Sicherung gemacht');
	},
	restore: async ({ request, locals }) => {
		const f = await request.formData();
		const name = String(f.get('name'));
		const areas = f.getAll('area').map(String).filter((a): a is Area => a in AREAS);
		if (!isBackupName(name)) return fail(400, { error: 'Diese Sicherung gibt es nicht.' });
		if (!areas.length) return fail(400, { error: 'Bitte wähle aus, was du zurückholen willst.', name });
		const at = await restore(name, areas);
		const what = areas.map((a) => AREAS[a].label).join(', ');
		await log({ actor: locals.admin!, area: 'Sicherungen', title: `Zurückgeholt vom ${when(at)}: ${what}`, link: '/admin/sicherungen' });
		return done(`Zurückgeholt: ${what}. Der Stand von vorher ist als Sicherung gespeichert.`);
	},
	upload: async ({ request, locals }) => {
		const file = (await request.formData()).get('file');
		if (!(file instanceof File) || !file.size || file.size > 50_000_000) return fail(400, { error: 'Bitte wähle eine Sicherungsdatei (.json.gz).' });
		try {
			await addBackup(new Uint8Array(await file.arrayBuffer()));
		} catch {
			return fail(400, { error: 'Das ist keine Sicherung von dieser Website.' });
		}
		await log({ actor: locals.admin!, area: 'Sicherungen', title: 'Sicherungsdatei hochgeladen', link: '/admin/sicherungen' });
		return done('Hochgeladen. Sie steht jetzt in der Liste.');
	}
};
