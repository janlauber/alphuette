import PDFDocument from 'pdfkit';
import { SwissQRBill } from 'swissqrbill/pdf';
import { chf } from '#lib/booking.ts';
import { dict, fmtDate } from '#lib/i18n.ts';
import type { Booking } from './bookings.ts';
import { billData, dueDate, missing, reference, type InvoiceHost, type QrLang } from './invoice.ts';

const BRAND = '#2f5b3c';
const LINE = '#dbe4d3';

/**
 * The bill as an A4 PDF for the mail: the same content as the bill page, with the QR payment part
 * at the bottom (none once paid, so nobody pays twice). Null while the host's payment details are missing.
 */
export async function invoicePdf(b: Booking, host: InvoiceHost & { email: string }, hutName: string): Promise<Uint8Array | null> {
	if (b.status !== 'bestaetigt' || missing(host).length) return null;
	const t = dict[b.lang];
	const day = (iso: string) => fmtDate(iso, b.lang, { weekday: undefined });
	const inv = { id: b.id, ref: b.ref, totalRp: b.totalRp, checkIn: b.checkIn, confirmedAt: (b.confirmedAt ?? b.updatedAt).toISOString().slice(0, 10) };

	const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `${t.invoice.title} ${b.ref}`, Author: hutName } });
	const chunks: Buffer[] = [];
	doc.on('data', (c: Buffer) => chunks.push(c));
	const ended = new Promise<void>((resolve) => doc.on('end', () => resolve()));

	doc.font('Helvetica-Bold').fontSize(18).fillColor(BRAND).text(hutName, 50, 50);
	doc.font('Helvetica').fontSize(10).fillColor('black').text([host.name, host.street, `${host.zip} ${host.city}`, host.email].join('\n'), 50, 78);
	doc.text([b.name, b.city ?? ''].join('\n'), 300, 78, { width: 245, align: 'right' });
	doc.text(`${host.city}, ${day(inv.confirmedAt)}`, 300, 132, { width: 245, align: 'right' });

	doc.font('Helvetica-Bold').fontSize(20).fillColor(BRAND).text(`${t.invoice.title} ${b.ref}`, 50, 190);
	doc.font('Helvetica').fontSize(11).fillColor('black').text(`${fmtDate(b.checkIn, b.lang)} – ${fmtDate(b.checkOut, b.lang)}`, 50, 218);

	let y = 252;
	for (const l of b.quote?.lines ?? []) {
		doc.text(t.lines[l.key as keyof typeof t.lines](l.qty), 50, y, { width: 340 });
		doc.text(chf(l.amount), 395, y, { width: 150, align: 'right' });
		y += 22;
		doc.moveTo(50, y - 6).lineTo(545, y - 6).lineWidth(0.7).strokeColor(LINE).stroke();
	}
	doc.font('Helvetica-Bold').text(t.card.total, 50, y + 2).text(chf(b.totalRp ?? 0), 395, y + 2, { width: 150, align: 'right' });

	y += 40;
	if (b.paidAt) {
		doc.text(t.invoice.paid(day(b.paidAt.toISOString().slice(0, 10))), 50, y);
	} else {
		doc.text(t.invoice.due(day(dueDate(inv))), 50, y);
		doc.font('Helvetica').text(t.invoice.pay, 50, y + 18, { width: 495 });
		doc.fontSize(9).text(`${t.invoice.reference}: ${reference(host.iban, inv)}`, 50, doc.y + 6);
		new SwissQRBill(billData(host, inv), { language: b.lang.toUpperCase() as QrLang }).attachTo(doc);
	}

	doc.end();
	await ended;
	return new Uint8Array(Buffer.concat(chunks));
}
