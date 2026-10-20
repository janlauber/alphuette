import { SwissQRBill } from 'swissqrbill/svg';
import { calculateQRReferenceChecksum, calculateSCORReferenceChecksum, isQRIBAN } from 'swissqrbill/utils';

// The Swiss QR bill for a booking. Kept free of app imports so it can be tested on its own.
export type InvoiceHost = { name: string; street: string; zip: string; city: string; iban: string };
export type InvoiceBooking = { id: number; ref: string; totalRp: number | null; checkIn: string; confirmedAt: string };
export type QrLang = 'DE' | 'EN' | 'FR' | 'IT';

/** "Musterweg 5a" becomes street and building number; the QR bill keeps them apart. */
export function splitStreet(street: string): { address: string; buildingNumber?: string } {
	const m = street.trim().match(/^(.*?)\s+(\d+\s?[a-zA-Z]?)$/);
	return m ? { address: m[1], buildingNumber: m[2].replace(/\s/g, '') } : { address: street.trim() };
}

/**
 * A QR-IBAN needs a 27-digit QR reference (from the booking id). A normal IBAN gets a creditor
 * reference (RF…) from the booking number, so the payment shows up with it in the bank statement.
 */
export function reference(iban: string, b: Pick<InvoiceBooking, 'id' | 'ref'>) {
	if (isQRIBAN(iban)) {
		const base = String(b.id).padStart(26, '0');
		return base + calculateQRReferenceChecksum(base);
	}
	return `RF${calculateSCORReferenceChecksum(b.ref)}${b.ref}`;
}

const day = 86400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Payable within 30 days, at the latest 14 days before arrival; never before the invoice date. */
export function dueDate(b: Pick<InvoiceBooking, 'checkIn' | 'confirmedAt'>) {
	const issued = Date.parse(b.confirmedAt + 'T00:00:00Z');
	const latest = Date.parse(b.checkIn + 'T00:00:00Z') - 14 * day;
	return iso(Math.max(issued, Math.min(issued + 30 * day, latest)));
}

/** What is missing for a valid QR bill, in plain German for the admin. */
export function missing(h: InvoiceHost) {
	return [!h.iban && 'IBAN', !h.name.trim() && 'Name', !h.street.trim() && 'Strasse', !h.zip.trim() && 'PLZ', !h.city.trim() && 'Ort'].filter((x): x is string => !!x);
}

/** What the QR code holds; the same for the bill page and the PDF. */
export const billData = (h: InvoiceHost, b: InvoiceBooking) => ({
	currency: 'CHF' as const,
	amount: (b.totalRp ?? 0) / 100,
	creditor: { name: h.name, ...splitStreet(h.street), zip: h.zip, city: h.city, country: 'CH', account: h.iban },
	reference: reference(h.iban, b),
	message: `Alphütte ${b.ref}`
});

export function qrBill(h: InvoiceHost, b: InvoiceBooking, lang: QrLang) {
	return new SwissQRBill(billData(h, b), { language: lang }).toString();
}
