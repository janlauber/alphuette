import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
import { UPLOAD_DIR } from '$app/env/private';
import { sql } from './db.ts';

// Copies of the database as gzipped JSON on the volume, next to the photos: one a night, one before
// every restore, and any Tom makes by hand. Photo files are not in it; deleted photos sit 30 days in the trash.
// ponytail: same volume as the photos; the download button is the off-site copy. Push to the bucket once its writes work.
export const DIR = `${dirname(UPLOAD_DIR)}/backups`;
const TABLES = ['settings', 'seasons', 'hikes', 'photos', 'reviews', 'bookings', 'messages'] as const;
const NAME = /^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})_(automatisch|manuell|vorher|hochgeladen)\.json\.gz$/;

export const REASONS = { automatisch: 'Automatisch in der Nacht', manuell: 'Von Hand', vorher: 'Vor einer Wiederherstellung', hochgeladen: 'Hochgeladen' };
export type Reason = keyof typeof REASONS;

/** What can be put back, and from which tables and settings. Bookings and messages stay as they are. */
export const AREAS = {
	inhalte: { label: 'Texte und Infos', tables: [], settings: ['name', 'host', 'content', 'amenities'] },
	preise: { label: 'Preise und Saisons', tables: ['seasons'], settings: ['rates'] },
	wanderungen: { label: 'Wanderungen', tables: ['hikes'], settings: [] },
	fotos: { label: 'Fotos (Reihenfolge, Texte, Papierkorb)', tables: ['photos'], settings: [] },
	gaestebuch: { label: 'Gästebuch', tables: ['reviews'], settings: [] }
} as const;
export type Area = keyof typeof AREAS;

type Dump = { at: string; tables: Record<(typeof TABLES)[number], Record<string, unknown>[]> };

export async function createBackup(reason: Reason) {
	const tables = {} as Dump['tables'];
	for (const t of TABLES) {
		// as text, so the camelCase transform of the client leaves the column names alone
		const [r] = await sql`select coalesce(json_agg(t), '[]')::text as rows from ${sql(t)} t`;
		tables[t] = JSON.parse(r.rows);
	}
	const at = new Date().toISOString();
	const name = `${at.slice(0, 19).replace(/:/g, '-')}_${reason}.json.gz`;
	await mkdir(DIR, { recursive: true });
	await writeFile(`${DIR}/${name}`, gzipSync(JSON.stringify({ at, tables } satisfies Dump)));
	return name;
}

export async function listBackups() {
	const names = (await readdir(DIR).catch(() => [] as string[])).filter((n) => NAME.test(n)).sort().reverse();
	return Promise.all(
		names.map(async (name) => {
			const [, at, reason] = name.match(NAME)!;
			return { name, at: at.replace(/T(\d\d)-(\d\d)-(\d\d)$/, 'T$1:$2:$3Z'), reason: reason as Reason, size: (await stat(`${DIR}/${name}`)).size };
		})
	);
}

export const isBackupName = (name: string) => NAME.test(name);
export const readBackup = (name: string) => readFile(`${DIR}/${name}`);

const parse = (gz: Uint8Array) => {
	const dump = JSON.parse(gunzipSync(gz).toString('utf8')) as Dump;
	if (!dump?.tables || !TABLES.every((t) => Array.isArray(dump.tables[t]))) throw new Error('not a backup');
	return dump;
};

/** Stores an uploaded backup file after checking it is one. */
export async function addBackup(file: Uint8Array) {
	const dump = parse(file);
	const name = `${dump.at.slice(0, 19).replace(/:/g, '-')}_hochgeladen.json.gz`;
	await mkdir(DIR, { recursive: true });
	await writeFile(`${DIR}/${name}`, file);
	return name;
}

/** Puts the chosen areas back to the state of the backup. Makes a backup of today first. */
export async function restore(name: string, areas: Area[]) {
	const dump = parse(await readBackup(name));
	await createBackup('vorher');
	await sql.begin(async (tx) => {
		for (const area of areas) {
			const { tables, settings } = AREAS[area];
			if (settings.length) {
				await tx`delete from settings where key = any(${settings as unknown as string[]})`;
				const rows = dump.tables.settings.filter((r) => (settings as readonly unknown[]).includes(r.key));
				if (rows.length) await tx`insert into settings select * from json_populate_recordset(null::settings, ${JSON.stringify(rows)}::text::json)`;
			}
			for (const t of tables) {
				let rows = dump.tables[t];
				if (t === 'reviews') {
					// a review keeps its text even if its booking is gone
					const ids = new Set((await tx`select id from bookings`).map((r) => r.id));
					rows = rows.map((r) => (ids.has(r.booking_id) ? r : { ...r, booking_id: null }));
				}
				await tx`delete from ${tx(t)}`;
				if (rows.length) await tx`insert into ${tx(t)} select * from json_populate_recordset(null::${tx(t)}, ${JSON.stringify(rows)}::text::json)`;
				await tx`select setval(pg_get_serial_sequence(${t}, 'id'), coalesce((select max(id) from ${tx(t)}), 0) + 1, false)`;
			}
		}
	});
	return dump.at;
}

/** Nightly backup after 1 UTC (2 or 3 at night in Switzerland), and cleanup: keeps 30 days, and always the 10 newest. */
export async function nightlyBackup() {
	const now = new Date();
	const list = await listBackups();
	const today = now.toISOString().slice(0, 10);
	if (now.getUTCHours() >= 1 && !list.some((b) => b.reason === 'automatisch' && b.at.startsWith(today))) await createBackup('automatisch');
	const cutoff = new Date(now.getTime() - 30 * 86400_000).toISOString();
	for (const b of (await listBackups()).slice(10)) if (b.at < cutoff) await rm(`${DIR}/${b.name}`, { force: true });
}
