import { addDays, isTaken, nightsBetween, weekday, weekPrice, type Range, type Season } from './booking.ts';

// Price suggestions for single weeks. Simple rules with a reason Tom can follow; nothing changes until he
// takes one. One suggestion per week; weeks with their own price already are left alone.
export type HintKind = 'kurz' | 'luecke' | 'hoch' | 'gefragt' | 'liegen';
export type Hint = { key: string; kind: HintKind; start: string; current: number; suggested: number; reason: string };

export const HINT_LABEL: Record<HintKind, string> = {
	kurz: 'Kurzfristig günstiger',
	luecke: 'Lücke füllen',
	hoch: 'Hochsaison',
	gefragt: 'Gefragte Saison',
	liegen: 'Oft angeschaut, nicht angefragt'
};

/** Rappen rounded to whole 10 francs. */
const round10 = (rp: number) => Math.round(rp / 1000) * 1000;

type Week = { start: string; season: Season; price: number; free: boolean; own: boolean };

/** Every bookable week from tomorrow on, in seasons with a weekly price and a changeover day. */
export function weeksAhead(seasons: Season[], taken: Range[], today: string): Week[] {
	const out: Week[] = [];
	for (const s of seasons) {
		if (s.weekly === null || s.changeover === null) continue;
		let d = s.start > today ? s.start : addDays(today, 1);
		while (weekday(d) !== s.changeover) d = addDays(d, 1);
		for (; addDays(d, 7) <= s.end; d = addDays(d, 7)) {
			const free = Array.from({ length: 7 }, (_, i) => addDays(d, i)).every((n) => !isTaken(n, taken));
			out.push({ start: d, season: s, price: weekPrice(s, d), free, own: s.weeks?.[d] !== undefined });
		}
	}
	return out;
}

/**
 * views: how often each week (by first night) was picked in the booking calendar in the last 30 days.
 * dismissed: keys Tom said no to.
 */
export function priceHints(seasons: Season[], taken: Range[], today: string, views: Record<string, number> = {}, dismissed: string[] = []): Hint[] {
	const weeks = weeksAhead(seasons, taken, today);
	const takenStart = new Set(weeks.filter((w) => !w.free).map((w) => w.start));
	const hints: Hint[] = [];
	const add = (kind: HintKind, w: Week, factor: number, reason: string) => {
		const key = `${kind}:${w.start}`;
		const suggested = round10(w.price * factor);
		if (!dismissed.includes(key) && suggested !== w.price) hints.push({ key, kind, start: w.start, current: w.price, suggested, reason });
	};
	for (const w of weeks) {
		if (!w.free || w.own) continue;
		const days = nightsBetween(today, w.start);
		const [month, day] = [+w.start.slice(5, 7), +w.start.slice(8, 10)];
		const inSeason = weeks.filter((x) => x.season === w.season);
		const booked = inSeason.filter((x) => !x.free).length;
		const before = takenStart.has(addDays(w.start, -7)) || isTaken(addDays(w.start, -1), taken);
		const after = takenStart.has(addDays(w.start, 7)) || isTaken(addDays(w.start, 7), taken);
		if (days <= 21) add('kurz', w, 0.85, `Beginnt in ${days} Tagen und ist noch frei. Mit 15 % weniger findet sich eher noch jemand.`);
		else if (before && after) add('luecke', w, 0.9, 'Die einzige freie Woche zwischen zwei Buchungen. Mit 10 % weniger wird sie eher gebucht.');
		else if ((views[w.start] ?? 0) >= 8) add('liegen', w, 0.95, `In den letzten 30 Tagen ${views[w.start]}-mal angeschaut, aber nicht angefragt. Vielleicht hilft ein etwas tieferer Preis.`);
		else if ((month === 7 || (month === 8 && day <= 14)) && days > 30) add('hoch', w, 1.1, 'Sommerferien in den meisten Kantonen: diese Wochen sind am gefragtesten.');
		else if (inSeason.length >= 4 && booked / inSeason.length >= 0.6 && days > 30) add('gefragt', w, 1.1, `Schon ${booked} von ${inSeason.length} Wochen dieser Saison sind gebucht. Die übrigen vertragen etwas mehr.`);
	}
	return hints;
}
