import { sql } from '#lib/server/db.ts';
import { guestUrl, type Booking } from '#lib/server/bookings.ts';
import { dueDate } from '#lib/server/invoice.ts';

// Money per year: every confirmed stay is one invoice. Year = year of arrival.
export type Row = {
	id: number; ref: string; name: string; checkIn: string; checkOut: string; nights: number;
	adults: number; children: number; infants: number;
	rent: number; cleaning: number; linen: number; tax: number; levy: number; total: number;
	due: string; paidAt: string | null; state: 'bezahlt' | 'offen' | 'ueberfaellig'; reminded: string | null; invoice: string;
};

export async function years() {
	const rows = await sql`select distinct extract(year from check_in)::int as y from bookings where status = 'bestaetigt' order by y`;
	return rows.map((r) => r.y as number);
}

export async function invoices(year: number): Promise<Row[]> {
	const rows = await sql<(Booking & { reminded: Date | null })[]>`
		select b.*, (select max(at) from booking_mails m where m.booking_id = b.id and m.kind like 'payment%') as reminded
		from bookings b where status = 'bestaetigt' and extract(year from check_in) = ${year} order by check_in`;
	const today = new Date().toISOString().slice(0, 10);
	return rows.map((b) => {
		const amount = (k: string) => (b.quote?.lines ?? []).filter((l) => l.key === k).reduce((s, l) => s + l.amount, 0);
		const due = dueDate({ checkIn: b.checkIn, confirmedAt: (b.confirmedAt ?? b.updatedAt).toISOString().slice(0, 10) });
		return {
			id: b.id, ref: b.ref, name: b.name, checkIn: b.checkIn, checkOut: b.checkOut, nights: b.quote?.nights ?? 0,
			adults: b.adults, children: b.children, infants: b.infants,
			rent: amount('stay'), cleaning: amount('cleaning'), linen: amount('linen'), tax: amount('tax'), levy: amount('levy'), total: b.totalRp ?? 0,
			due,
			paidAt: b.paidAt ? b.paidAt.toISOString().slice(0, 10) : null,
			state: b.paidAt ? 'bezahlt' : due < today ? 'ueberfaellig' : 'offen',
			reminded: b.reminded ? b.reminded.toISOString().slice(0, 10) : null,
			invoice: `${guestUrl(b)}/rechnung`
		};
	});
}

export const quarterOf = (iso: string) => `${iso.slice(0, 4)}-Q${Math.ceil(Number(iso.slice(5, 7)) / 3)}`;

/** Kurtaxe and Beherbergungsabgabe per quarter of arrival, the way the tourism office bills them: nights per age group and the amounts. */
export function quarters(rows: Row[]) {
	const sum = (rs: Row[], f: (r: Row) => number) => rs.reduce((a, r) => a + f(r), 0);
	return [...Map.groupBy(rows, (r) => quarterOf(r.checkIn)).entries()].map(([quarter, rs]) => ({
		quarter,
		stays: rs.length,
		adultNights: sum(rs, (r) => r.nights * r.adults),
		childNights: sum(rs, (r) => r.nights * r.children),
		infantNights: sum(rs, (r) => r.nights * r.infants),
		tax: sum(rs, (r) => r.tax),
		levy: sum(rs, (r) => r.levy)
	}));
}
