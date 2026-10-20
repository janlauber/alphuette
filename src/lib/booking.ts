// Pure booking rules, shared by the calendar in the browser and the server.
// Dates are ISO strings (YYYY-MM-DD), money is in Rappen.

export type Season = {
	name: string;
	start: string; // first night that can be booked
	end: string; // last possible check-out day
	nightly: number;
	weekly: number | null; // price for 7 nights, applied per full week
	minNights: number;
	changeover: number | null; // 0 = Sunday … 6 = Saturday, null = any day
	weeks?: Record<string, number>; // own price for single weeks, by their first night
};

export type Rates = {
	cleaning: number;
	linen: number; // per set and stay
	taxAdult: number; // Kurtaxe per night, from 16
	taxChild: number; // Kurtaxe per night, 6 to 15
	levyAdult: number; // kantonale Beherbergungsabgabe per night, from 16
	maxGuests: number;
};

export type Guests = { adults: number; children: number; infants: number; linen: number };

export type Range = { start: string; end: string }; // nights start ≤ d < end are taken

export type QuoteLine = { key: 'stay' | 'cleaning' | 'linen' | 'tax' | 'levy'; qty: number; amount: number };

export type Quote =
	| { ok: true; nights: number; lines: QuoteLine[]; total: number }
	| { ok: false; error: 'dates' | 'closed' | 'taken' | 'min' | 'changeover' | 'guests' };

const DAY = 86_400_000;

export const toTime = (iso: string) => Date.parse(iso + 'T00:00:00Z');
export const toIso = (t: number) => new Date(t).toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => toIso(toTime(iso) + n * DAY);
export const weekday = (iso: string) => new Date(toTime(iso)).getUTCDay();
export const nightsBetween = (a: string, b: string) => Math.round((toTime(b) - toTime(a)) / DAY);

export const seasonOf = (night: string, seasons: Season[]) =>
	seasons.find((s) => s.start <= night && night < s.end);

/** What the 7 nights from start cost: the week's own price, else the season's weekly price. */
export const weekPrice = (s: Season, start: string) => s.weeks?.[start] ?? s.weekly ?? s.nightly * 7;

export const isTaken = (night: string, taken: Range[]) =>
	taken.some((r) => r.start <= night && night < r.end);

/** Why a stay from checkIn to checkOut is not possible, or null if it is. */
export function checkStay(checkIn: string, checkOut: string, seasons: Season[], taken: Range[]) {
	const nights = nightsBetween(checkIn, checkOut);
	if (!(nights >= 1) || nights > 60) return 'dates' as const;
	for (let i = 0; i < nights; i++) {
		const night = addDays(checkIn, i);
		if (!seasonOf(night, seasons)) return 'closed' as const;
		if (isTaken(night, taken)) return 'taken' as const;
	}
	const first = seasonOf(checkIn, seasons)!;
	const last = seasonOf(addDays(checkOut, -1), seasons)!;
	if (first.changeover !== null && weekday(checkIn) !== first.changeover) return 'changeover' as const;
	if (last.changeover !== null && weekday(checkOut) !== last.changeover) return 'changeover' as const;
	if (nights < first.minNights) return 'min' as const;
	return null;
}

export function quote(
	checkIn: string,
	checkOut: string,
	g: Guests,
	seasons: Season[],
	rates: Rates,
	taken: Range[] = []
): Quote {
	const error = checkStay(checkIn, checkOut, seasons, taken);
	if (error) return { ok: false, error };
	const people = g.adults + g.children + g.infants;
	if (g.adults < 1 || g.children < 0 || g.infants < 0 || people > rates.maxGuests) return { ok: false, error: 'guests' };
	if (g.linen < 0 || g.linen > people) return { ok: false, error: 'guests' };

	const nights = nightsBetween(checkIn, checkOut);
	// A full week inside one season costs its weekly price (or the week's own price); other nights the nightly price.
	let stay = 0;
	for (let i = 0; i < nights; ) {
		const night = addDays(checkIn, i);
		const s = seasonOf(night, seasons)!;
		if (s.weekly !== null && i + 7 <= nights && seasonOf(addDays(night, 6), seasons) === s) {
			stay += weekPrice(s, night);
			i += 7;
		} else {
			stay += s.nightly;
			i++;
		}
	}

	const lines: QuoteLine[] = [{ key: 'stay', qty: nights, amount: stay }];
	if (rates.cleaning) lines.push({ key: 'cleaning', qty: 1, amount: rates.cleaning });
	if (g.linen) lines.push({ key: 'linen', qty: g.linen, amount: g.linen * rates.linen });
	const tax = nights * (g.adults * rates.taxAdult + g.children * rates.taxChild);
	if (tax) lines.push({ key: 'tax', qty: nights, amount: tax });
	const levy = nights * g.adults * rates.levyAdult;
	if (levy) lines.push({ key: 'levy', qty: nights, amount: levy });

	return { ok: true, nights, lines, total: lines.reduce((sum, l) => sum + l.amount, 0) };
}

export const chf = (rp: number) =>
	'CHF ' + (rp / 100).toLocaleString('de-CH', { minimumFractionDigits: rp % 100 ? 2 : 0, maximumFractionDigits: 2 });
