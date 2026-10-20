import { invoices } from '../finance.ts';

// All invoices of a year for the bookkeeping, as a CSV file Excel opens directly (semicolons, BOM).
export const GET = async ({ url }) => {
	const year = Number(url.searchParams.get('jahr')) || new Date().getFullYear();
	const rows = await invoices(year);
	const chf = (rp: number) => (rp / 100).toFixed(2);
	const head = ['Buchung', 'Gast', 'Anreise', 'Abreise', 'Nächte', 'Erwachsene', 'Kinder', 'Kleinkinder', 'Miete', 'Reinigung', 'Bettwäsche', 'Kurtaxe', 'Beherbergungsabgabe', 'Total', 'Fällig', 'Status', 'Bezahlt am'];
	const cell = (v: string | number | null) => `"${String(v ?? '').replace(/"/g, '""')}"`;
	const lines = rows.map((r) =>
		[r.ref, r.name, r.checkIn, r.checkOut, r.nights, r.adults, r.children, r.infants, chf(r.rent), chf(r.cleaning), chf(r.linen), chf(r.tax), chf(r.levy), chf(r.total), r.due, r.state === 'ueberfaellig' ? 'überfällig' : r.state, r.paidAt].map(cell).join(';')
	);
	return new Response('﻿' + [head.map(cell).join(';'), ...lines].join('\r\n'), {
		headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="alphuette-rechnungen-${year}.csv"` }
	});
};
