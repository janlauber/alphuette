import { sql } from './db.ts';

// The admin's change log. Every change Tom makes is written here in plain words, and most of
// them carry a snapshot from before, so "Rückgängig" can put things back.
const TABLES = ['photos', 'hikes', 'seasons', 'week_prices', 'reviews', 'bookings', 'mail_templates'] as const;
export type Table = (typeof TABLES)[number];
export type Undo = { settings: Record<string, string | null> } | { table: Table; id: number; before: string | null };
export type Entry = { actor: string; area: string; title: string; link?: string; target?: string; undo?: Undo };

/** The row as JSON text, taken before a change. null if it does not exist (yet). */
export async function rowBefore(table: Table, id: number): Promise<string | null> {
	const [r] = await sql`select row_to_json(t)::text as row from ${sql(table)} t where id = ${id}`;
	return r?.row ?? null;
}

/** Setting values as JSON text, taken before a change. */
export async function settingsBefore(...keys: string[]): Promise<Record<string, string | null>> {
	const rows = await sql`select key, value::text as value from settings where key = any(${keys})`;
	return Object.fromEntries(keys.map((k) => [k, rows.find((r) => r.key === k)?.value ?? null]));
}

export async function log(e: Entry): Promise<number> {
	const [row] = await sql`
		insert into activity (actor, area, title, link, target, undo)
		values (${e.actor}, ${e.area}, ${e.title}, ${e.link ?? null}, ${e.target ?? null}, ${e.undo ? sql.json(e.undo) : null})
		returning id`;
	return row.id;
}

/** Runs a change to one row and logs it with what is needed to undo it. */
export async function changeRow(table: Table, id: number, e: Omit<Entry, 'target' | 'undo'>, change: () => Promise<unknown>) {
	const before = await rowBefore(table, id);
	await change();
	return log({ ...e, target: `${table}:${id}`, undo: { table, id, before } });
}

/** Same for settings. */
export async function changeSettings(keys: string[], e: Omit<Entry, 'target' | 'undo'>, change: () => Promise<unknown>) {
	const before = await settingsBefore(...keys);
	await change();
	return log({ ...e, target: `settings:${keys.join(',')}`, undo: { settings: before } });
}

/** Shape the admin pages return so the layout shows a message with an undo button. */
export const done = (title: string, activity?: number) => ({ done: { title, activity } });

/** Puts back what an entry changed. Returns an error text or null. */
export async function undo(id: number, actor: string): Promise<string | null> {
	const [a] = await sql`select * from activity where id = ${id}`;
	if (!a?.undo || a.undoneAt) return 'Das lässt sich nicht mehr rückgängig machen.';
	if (a.target) {
		const [later] = await sql`select title from activity where target = ${a.target} and id > ${id} and undone_at is null and undo is not null`;
		if (later) return `Danach wurde noch etwas geändert («${later.title}»). Mach zuerst das rückgängig.`;
	}
	const u = a.undo as Undo;
	await sql.begin(async (tx) => {
		if ('settings' in u) {
			for (const [key, value] of Object.entries(u.settings)) {
				if (value === null) await tx`delete from settings where key = ${key}`;
				else await tx`insert into settings (key, value) values (${key}, ${value}::text::jsonb) on conflict (key) do update set value = excluded.value`;
			}
		} else {
			if (!TABLES.includes(u.table)) throw new Error(`undo: unknown table ${u.table}`);
			// a new row goes away again (photos into the trash); a changed or deleted one comes back as it was
			if (u.before === null && u.table === 'photos') await tx`update photos set deleted_at = now() where id = ${u.id}`;
			else {
				await tx`delete from ${tx(u.table)} where id = ${u.id}`;
				if (u.before !== null) await tx`insert into ${tx(u.table)} select * from json_populate_record(null::${tx(u.table)}, ${u.before}::text::json)`;
			}
		}
		await tx`update activity set undone_at = now() where id = ${id}`;
		await tx`insert into activity (actor, area, title, link) values (${actor}, ${a.area}, ${'Rückgängig gemacht: ' + a.title}, ${a.link})`;
	});
	return null;
}
