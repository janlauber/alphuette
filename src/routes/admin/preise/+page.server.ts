import { fail } from '@sveltejs/kit';
import { sql } from '#lib/server/db.ts';
import { getSettings, setSetting } from '#lib/server/settings.ts';
import { changeRow, changeSettings, done, log } from '#lib/server/activity.ts';
import { chf } from '#lib/booking.ts';
import { fmtDate } from '#lib/i18n.ts';
import { planNextYear, type SeasonRow } from './plan.ts';

const AREA = 'Preise';
const link = '/admin/preise';

// all seasons that still matter: from a year ago on (for the timeline) plus every future one
const seasons = () =>
	sql<SeasonRow[]>`select id, name, start_date as start, end_date as end, nightly_rp as nightly, weekly_rp as weekly, min_nights, changeover
		from seasons where end_date >= current_date - 365 order by start_date`;

export const load = async () => {
	const [list, settings] = await Promise.all([seasons(), getSettings()]);
	// offered for at most two years ahead, not ever further
	const plan = planNextYear(list);
	return { seasons: list, rates: settings.rates, plan: plan && plan.year <= new Date().getFullYear() + 2 ? plan : null };
};

/** "650", "650.50" or "650,5" in CHF to Rappen; null if empty. */
const rp = (v: FormDataEntryValue | null) => {
	const s = String(v ?? '').replace(',', '.').replace(/[^\d.]/g, '');
	return s ? Math.round(Number(s) * 100) : null;
};
const iso = (v: FormDataEntryValue | null) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const day = (d: string) => fmtDate(d, 'de', { weekday: undefined });

export const actions = {
	season: async ({ request, locals }) => {
		const f = await request.formData();
		const id = Number(f.get('id')) || null;
		const weekly = rp(f.get('weekly'));
		const s = {
			name: String(f.get('name') ?? '').trim().slice(0, 80) || 'Saison',
			start: iso(f.get('start')),
			end: iso(f.get('end')),
			weekly,
			// without its own night price, a night costs a seventh of the week
			nightly: rp(f.get('nightly')) ?? (weekly !== null ? Math.round(weekly / 7) : null),
			minNights: Math.max(1, Math.min(60, Number(f.get('minNights')) || 1)),
			changeover: f.get('changeover') === '' || f.get('changeover') === null ? null : Number(f.get('changeover'))
		};
		const no = (error: string) => fail(400, { error, id });
		if (!s.start || !s.end) return no('Bitte wähle bei «Von» und «Bis» ein Datum.');
		if (s.end <= s.start) return no('«Bis» muss nach «Von» liegen.');
		if (s.nightly === null) return no('Bitte gib einen Preis pro Woche ein.');
		const clash = await sql`select name, start_date as start, end_date as end from seasons
			where daterange(start_date, end_date) && daterange(${s.start}::date, ${s.end}::date) and id <> ${id ?? 0} limit 1`;
		if (clash.length)
			return fail(409, { error: `Diese Zeit gehört schon zur Saison «${clash[0].name}» (${day(clash[0].start)} bis ${day(clash[0].end)}). Verschieb die Daten oder ändere zuerst die andere Saison.`, id });

		let a: number;
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
		return { saved: id ?? 'new', ...done('Saison gespeichert', a) };
	},
	deleteSeason: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		const [s] = await sql`select name from seasons where id = ${id}`;
		if (!s) return;
		const a = await changeRow('seasons', id, { actor: locals.admin!, area: AREA, title: `Saison «${s.name}» gelöscht`, link }, () => sql`delete from seasons where id = ${id}`);
		return done('Saison gelöscht', a);
	},
	// Same plan as shown on the page, worked out again here so nothing from the browser is trusted.
	copyYear: async ({ locals }) => {
		const plan = planNextYear(await seasons());
		if (!plan?.create.length) return fail(400, { copyError: 'Es gibt nichts zu übernehmen. Die Saisons fürs nächste Jahr sind schon da.' });
		await sql.begin(async (tx) => {
			for (const p of plan.create)
				await tx`insert into seasons (name, start_date, end_date, nightly_rp, weekly_rp, min_nights, changeover)
					values (${p.name}, ${p.start}, ${p.end}, ${p.nightly}, ${p.weekly}, ${p.minNights}, ${p.changeover})`;
		});
		const names = plan.create.map((p) => `«${p.name}» (${day(p.start)} bis ${day(p.end)}, ${p.weekly !== null ? chf(p.weekly) + ' pro Woche' : chf(p.nightly) + ' pro Nacht'})`);
		await log({ actor: locals.admin!, area: AREA, title: `Saisons für ${plan.year} übernommen: ${names.join(', ')}`, link });
		return done(plan.create.length === 1 ? `Saison für ${plan.year} angelegt` : `${plan.create.length} Saisons für ${plan.year} angelegt`);
	},
	rates: async ({ request, locals }) => {
		const f = await request.formData();
		const time = (v: FormDataEntryValue | null, d: string) => (/^\d{1,2}:\d{2}$/.test(String(v)) ? String(v) : d);
		const { rates } = await getSettings();
		const a = await changeSettings(['rates'], { actor: locals.admin!, area: AREA, title: 'Zuschläge, Kurtaxe und Zeiten geändert', link }, () =>
			setSetting('rates', {
				cleaning: rp(f.get('cleaning')) ?? 0,
				linen: rp(f.get('linen')) ?? 0,
				taxAdult: rp(f.get('taxAdult')) ?? 0,
				taxChild: rp(f.get('taxChild')) ?? 0,
				levyAdult: rp(f.get('levyAdult')) ?? 0,
				maxGuests: Math.max(1, Math.min(20, Number(f.get('maxGuests')) || rates.maxGuests)),
				checkIn: time(f.get('checkIn'), rates.checkIn),
				checkOut: time(f.get('checkOut'), rates.checkOut)
			})
		);
		return { ratesSaved: true, ...done('Gespeichert', a) };
	}
};
