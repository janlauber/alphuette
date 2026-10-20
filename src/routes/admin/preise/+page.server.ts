import { fail } from '@sveltejs/kit';
import { sql } from '#lib/server/db.ts';
import { getSettings, setSetting } from '#lib/server/settings.ts';
import { changeRow, changeSettings, done, log } from '#lib/server/activity.ts';

const AREA = 'Preise';
const link = '/admin/preise';

export const load = async () => {
	const [seasons, settings] = await Promise.all([
		sql`select id, name, start_date as start, end_date as end, nightly_rp as nightly, weekly_rp as weekly, min_nights, changeover
			from seasons where end_date >= current_date - 365 order by start_date`,
		getSettings()
	]);
	return { seasons, rates: settings.rates };
};

/** "650", "650.50" or "650,5" in CHF to Rappen; null if empty. */
const rp = (v: FormDataEntryValue | null) => {
	const s = String(v ?? '').replace(',', '.').replace(/[^\d.]/g, '');
	return s ? Math.round(Number(s) * 100) : null;
};
const iso = (v: FormDataEntryValue | null) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

export const actions = {
	season: async ({ request, locals }) => {
		const f = await request.formData();
		const id = Number(f.get('id')) || null;
		const s = {
			name: String(f.get('name') ?? '').trim().slice(0, 80) || 'Saison',
			start: iso(f.get('start')),
			end: iso(f.get('end')),
			nightly: rp(f.get('nightly')) ?? 0,
			weekly: rp(f.get('weekly')),
			minNights: Math.max(1, Math.min(60, Number(f.get('minNights')) || 1)),
			changeover: f.get('changeover') === '' ? null : Number(f.get('changeover'))
		};
		if (!s.start || !s.end || s.end <= s.start) return fail(400, { error: 'Das Ende muss nach dem Beginn liegen.', id });
		let a: number;
		try {
			if (id)
				a = await changeRow('seasons', id, { actor: locals.admin!, area: AREA, title: `Saison «${s.name}» geändert`, link }, () =>
					sql`update seasons set name = ${s.name}, start_date = ${s.start}, end_date = ${s.end}, nightly_rp = ${s.nightly},
						weekly_rp = ${s.weekly}, min_nights = ${s.minNights}, changeover = ${s.changeover} where id = ${id}`
				);
			else {
				const [row] = await sql`insert into seasons (name, start_date, end_date, nightly_rp, weekly_rp, min_nights, changeover)
					values (${s.name}, ${s.start}, ${s.end}, ${s.nightly}, ${s.weekly}, ${s.minNights}, ${s.changeover}) returning id`;
				a = await log({ actor: locals.admin!, area: AREA, title: `Saison «${s.name}» neu angelegt`, link, target: `seasons:${row.id}`, undo: { table: 'seasons', id: row.id, before: null } });
			}
		} catch (e) {
			if ((e as { code?: string }).code === '23P01') return fail(409, { error: 'Diese Saison überschneidet sich mit einer anderen.', id });
			throw e;
		}
		return { saved: id ?? 'new', ...done('Saison gespeichert', a) };
	},
	deleteSeason: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		const [s] = await sql`select name from seasons where id = ${id}`;
		if (!s) return;
		const a = await changeRow('seasons', id, { actor: locals.admin!, area: AREA, title: `Saison «${s.name}» gelöscht`, link }, () => sql`delete from seasons where id = ${id}`);
		return done('Saison gelöscht', a);
	},
	rates: async ({ request, locals }) => {
		const f = await request.formData();
		const time = (v: FormDataEntryValue | null, d: string) => (/^\d{1,2}:\d{2}$/.test(String(v)) ? String(v) : d);
		const { rates } = await getSettings();
		const a = await changeSettings(['rates'], { actor: locals.admin!, area: AREA, title: 'Zuschläge, Kurtaxe und Zeiten geändert', link }, () => setSetting('rates', {
			cleaning: rp(f.get('cleaning')) ?? 0,
			linen: rp(f.get('linen')) ?? 0,
			taxAdult: rp(f.get('taxAdult')) ?? 0,
			taxChild: rp(f.get('taxChild')) ?? 0,
			levyAdult: rp(f.get('levyAdult')) ?? 0,
			maxGuests: Math.max(1, Math.min(20, Number(f.get('maxGuests')) || rates.maxGuests)),
			checkIn: time(f.get('checkIn'), rates.checkIn),
			checkOut: time(f.get('checkOut'), rates.checkOut)
		}));
		return { ratesSaved: true, ...done('Gespeichert', a) };
	}
};
