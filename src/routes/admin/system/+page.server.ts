import { ANTHROPIC_API_KEY, REPLY_DOMAIN, RESEND_API_KEY, RESEND_WEBHOOK_SECRET } from '$app/env/private';
import { sql } from '#lib/server/db.ts';
import { listBackups } from '#lib/server/backup.ts';
import { bucketCheck } from '#lib/server/storage.ts';
import { lastMaintenance } from '#lib/server/maintenance.ts';
import { owner, report } from '#lib/server/monitor.ts';
import { siteTexts } from '#lib/server/sitetexts.ts';
import { hash, TARGETS } from '#lib/server/translate.ts';
import { done } from '#lib/server/activity.ts';

type Check = { label: string; ok: boolean | null; text: string };

export const load = async () => {
	const t0 = Date.now();
	await sql`select 1`;
	const dbMs = Date.now() - t0;
	const [backups, errors, texts, bucket] = await Promise.all([
		listBackups(),
		sql<{ id: number; place: string; message: string; stack: string; count: number; firstAt: Date; lastAt: Date; resolvedAt: Date | null }[]>`
			select id, place, message, stack, count, first_at, last_at, resolved_at from app_errors
			order by resolved_at is not null, last_at desc limit 100`,
		siteTexts(),
		bucketCheck().catch((e) => ({ ok: false, text: `nicht erreichbar: ${e instanceof Error ? e.message : e}` }))
	]);
	const hashes = [...new Set(texts.filter((x) => x?.trim()).map((x) => hash(x.trim())))];
	const [{ have }] = await sql`select count(*)::int as have from translations where hash = any(${hashes}) and lang = any(${TARGETS as unknown as string[]})`;
	const missing = hashes.length * TARGETS.length - have;
	const hours = (d: Date | string) => (Date.now() - new Date(d).getTime()) / 3600_000;

	const checks: Check[] = [
		{ label: 'Datenbank', ok: dbMs < 500, text: `antwortet in ${dbMs} ms` },
		{ label: 'Letzte Sicherung', ok: backups[0] ? hours(backups[0].at) < 30 : false, text: backups[0] ? `vor ${Math.round(hours(backups[0].at))} Stunden, ${backups.length} Sicherungen da` : 'noch keine' },
		{ label: 'Wartung (stündlich)', ok: lastMaintenance ? hours(lastMaintenance) < 2 : null, text: lastMaintenance ? `zuletzt vor ${Math.round(hours(lastMaintenance) * 60)} Minuten` : 'seit dem Start noch nicht fertig' },
		{ label: 'Mails senden', ok: !!RESEND_API_KEY, text: RESEND_API_KEY ? 'Resend ist eingerichtet' : 'RESEND_API_KEY fehlt, Mails stehen nur im Log' },
		{ label: 'Mails empfangen', ok: !!(RESEND_WEBHOOK_SECRET && REPLY_DOMAIN), text: RESEND_WEBHOOK_SECRET && REPLY_DOMAIN ? `Antworten an @${REPLY_DOMAIN}` : 'RESEND_WEBHOOK_SECRET oder REPLY_DOMAIN fehlt' },
		{ label: 'Übersetzung', ok: !!ANTHROPIC_API_KEY && missing === 0, text: !ANTHROPIC_API_KEY ? 'ANTHROPIC_API_KEY fehlt' : missing ? `${missing} Übersetzungen stehen noch aus` : 'alle Texte übersetzt' },
		{ label: 'Speicher für Fotos und Sicherungen', ...bucket }
	];
	return { checks, errors, owner: owner() };
};

export const actions = {
	resolve: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		await sql`update app_errors set resolved_at = now() where id = ${id}`;
		return done('Als erledigt markiert. Kommt der Fehler wieder, gibt es eine neue Mail.');
	},
	test: async ({ locals }) => {
		await report(new Error(`Testalarm, ausgelöst von ${locals.admin} (${new Date().toISOString()})`), 'Systemseite: Testalarm');
		return done(`Testalarm geschickt an ${owner()}`);
	}
};
