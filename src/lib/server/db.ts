import postgres from 'postgres';
import { readdir, readFile } from 'node:fs/promises';
import { DATABASE_URL } from '$app/env/private';

export const sql = postgres(DATABASE_URL, {
	max: 5,
	onnotice: () => {},
	transform: postgres.camel,
	// keep dates as YYYY-MM-DD strings, the booking rules work on those
	types: { date: { to: 1082, from: [1082], serialize: (x: string) => x, parse: (x: string) => x } }
});

/** Applies migrations/*.sql in name order, each once. */
export async function migrate() {
	const files = (await readdir('migrations')).filter((f) => f.endsWith('.sql')).sort();
	await sql.begin(async (tx) => {
		await tx`select pg_advisory_xact_lock(7243)`;
		await tx`create table if not exists migrations (name text primary key, at timestamptz not null default now())`;
		const done = new Set((await tx`select name from migrations`).map((r) => r.name));
		for (const f of files.filter((f) => !done.has(f))) {
			await tx.unsafe(await readFile(`migrations/${f}`, 'utf8'));
			await tx`insert into migrations (name) values (${f})`;
			console.log('migrated', f);
		}
	});
}
