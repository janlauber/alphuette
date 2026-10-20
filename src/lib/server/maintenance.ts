import { sql } from './db.ts';
import { pruneEvents } from './analytics.ts';
import { guestUrl, type Booking } from './bookings.ts';
import { sendMail } from './mail.ts';
import { fillProfiles } from './hikes.ts';

// Hourly housekeeping. ponytail: in-process timer, fine for one replica; a klickops cron job if it ever scales out.
export async function maintenance() {
	try {
		await sql`delete from bookings where status = 'unbestaetigt' and created_at < now() - interval '30 minutes'`;
		await pruneEvents();
		await fillProfiles();
		// Ask for a review the day after check-out, once.
		const due = await sql<Booking[]>`
			update bookings set review_requested_at = now()
			where status = 'bestaetigt' and review_requested_at is null
				and check_out <= current_date and check_out > current_date - 14
			returning *`;
		for (const b of due) {
			await sendMail({
				to: b.email,
				subject: b.lang === 'en' ? 'How was your week at the Alphütte?' : 'Wie war deine Woche im Hüttli?',
				text:
					b.lang === 'en'
						? `Hello ${b.name}\n\nThank you for staying at the Alphütte. Tom would be glad to hear how it was. Writing a few lines takes two minutes:\n\n${guestUrl(b)}#bewertung`
						: `Hoi ${b.name}\n\nDanke, dass du im Hüttli warst. Tom freut sich, wenn du ihm schreibst, wie es war. Ein paar Zeilen reichen:\n\n${guestUrl(b)}#bewertung`
			});
		}
	} catch (e) {
		console.error('maintenance', e);
	}
}
