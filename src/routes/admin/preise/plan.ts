// Copies the seasons of the latest year into the year after: the same weekday (Saturday stays
// Saturday), the same prices, "2027" in the name becomes "2028". Seasons that would overlap an
// existing one are left out.
export type SeasonRow = { id: number; name: string; start: string; end: string; nightly: number; weekly: number | null; minNights: number; changeover: number | null };
export type Planned = Omit<SeasonRow, 'id'> & { from: string };

/** The same weekday about one year later (at most 3 days off the calendar date). */
export function nextYear(iso: string) {
	const d = new Date(iso + 'T00:00:00Z');
	const t = new Date(Date.UTC(d.getUTCFullYear() + 1, d.getUTCMonth(), d.getUTCDate()));
	const diff = (d.getUTCDay() - t.getUTCDay() + 7) % 7;
	t.setUTCDate(t.getUTCDate() + (diff > 3 ? diff - 7 : diff));
	return t.toISOString().slice(0, 10);
}

const overlaps = (a: { start: string; end: string }, b: { start: string; end: string }) => a.start < b.end && b.start < a.end;

export function planNextYear(seasons: SeasonRow[]) {
	if (!seasons.length) return null;
	const year = Math.max(...seasons.map((s) => Number(s.start.slice(0, 4))));
	const source = seasons.filter((s) => Number(s.start.slice(0, 4)) === year);
	const create: Planned[] = [];
	const skip: Planned[] = [];
	for (const s of source) {
		const p: Planned = {
			name: s.name.replace(/\b(20\d\d)\b/g, (y) => String(Number(y) + 1)),
			start: nextYear(s.start),
			end: nextYear(s.end),
			nightly: s.nightly,
			weekly: s.weekly,
			minNights: s.minNights,
			changeover: s.changeover,
			from: s.name
		};
		(seasons.some((e) => overlaps(e, p)) || create.some((c) => overlaps(c, p)) ? skip : create).push(p);
	}
	return { year: year + 1, create, skip };
}
