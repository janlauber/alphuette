import { sql } from './db.ts';
import { pruneEvents } from './analytics.ts';
import { fillProfiles } from './hikes.ts';
import { purgePhotos } from './images.ts';
import { nightlyBackup } from './backup.ts';
import { syncTranslations } from './sitetexts.ts';
import { sendReminders } from './reminders.ts';

// Hourly housekeeping. ponytail: in-process timer, fine for one replica; a klickops cron job if it ever scales out.
export async function maintenance() {
	try {
		await sql`delete from bookings where status = 'unbestaetigt' and created_at < now() - interval '30 minutes'`;
		await pruneEvents();
		await fillProfiles();
		await purgePhotos();
		await nightlyBackup();
		await sendReminders();
		await syncTranslations();
	} catch (e) {
		console.error('maintenance', e);
	}
}
