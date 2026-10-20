import { sql } from './db.ts';
import type { Booking } from './bookings.ts';
import { lookup } from './translate.ts';
import type { Lang } from '#lib/i18n.ts';

export type Review = { id: number; name: string; rating: number; body: string; reply: string | null; stay: string | null; lang: string };

/** Approved reviews, newest first, with the average for structured data. Guests' words stay as written; Tom's German replies are translated. */
export async function publicReviews(lang: Lang = 'de') {
	let reviews: Review[] = await sql<Review[]>`
		select id, name, rating, body, reply, stay::text as stay, lang from reviews
		where approved order by created_at desc limit 50`;
	if (lang !== 'de') {
		const tr = await lookup(reviews.flatMap((r) => (r.reply ? [r.reply] : [])), [lang, 'en']);
		reviews = reviews.map((r) => (r.reply ? { ...r, reply: tr.get(lang)?.get(r.reply) ?? tr.get('en')?.get(r.reply) ?? r.reply } : r));
	}
	const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
	return { reviews, avg: Math.round(avg * 10) / 10, count: reviews.length };
}

export const reviewOf = async (bookingId: number) =>
	(await sql`select id, rating, approved from reviews where booking_id = ${bookingId}`)[0] ?? null;

/** Only guests whose stay is over may write one review. Tom approves it before it shows. */
export async function addReview(b: Booking, rating: number, body: string, name: string) {
	if (b.status !== 'bestaetigt' || b.checkOut > new Date().toISOString().slice(0, 10)) return false;
	await sql`insert into reviews (booking_id, name, rating, body, lang, stay)
		values (${b.id}, ${name}, ${rating}, ${body}, ${b.lang}, ${b.checkIn})
		on conflict (booking_id) do nothing`;
	return true;
}
