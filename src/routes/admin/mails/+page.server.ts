import { sql } from '#lib/server/db.ts';
import { getSettings, setSetting, stored } from '#lib/server/settings.ts';
import { compose, KINDS, type Kind } from '#lib/server/reminders.ts';
import { changeSettings, done } from '#lib/server/activity.ts';
import type { Booking } from '#lib/server/bookings.ts';

// a made-up stay three weeks from now, only for the preview
const example = (): Booking => {
	const inDays = (n: number) => new Date(Date.now() + n * 86400_000).toISOString().slice(0, 10);
	return {
		id: 0, ref: 'BEISPL', status: 'bestaetigt', checkIn: inDays(21), checkOut: inDays(28), name: 'Anna Muster', email: 'anna@example.ch',
		phone: '079 123 45 67', city: 'Bern', country: 'CH', lang: 'de', adults: 2, children: 2, infants: 0, linen: 4, arrival: 'oev', note: null, hostNote: null,
		quote: null, totalRp: 74000, paidAt: null, createdAt: new Date(), updatedAt: new Date()
	};
};

export const load = async () => {
	const [s, sent] = await Promise.all([
		getSettings(),
		sql<{ kind: Kind; at: Date; id: number; name: string }[]>`select m.kind, m.at, b.id, b.name from booking_mails m join bookings b on b.id = m.booking_id order by m.at desc limit 20`
	]);
	const b = example();
	return {
		kinds: (Object.keys(KINDS) as Kind[]).map((k) => ({ key: k, ...KINDS[k], on: s.reminders[k], preview: compose(k, b, s) })),
		sent: sent.map((r) => ({ ...r, label: KINDS[r.kind]?.label ?? r.kind }))
	};
};

export const actions = {
	save: async ({ request, locals }) => {
		const f = await request.formData();
		const next = Object.fromEntries((Object.keys(KINDS) as Kind[]).map((k) => [k, f.get(k) === 'on'])) as Record<Kind, boolean>;
		const off = (Object.keys(KINDS) as Kind[]).filter((k) => !next[k]).map((k) => KINDS[k].label);
		const a = await changeSettings(['reminders'], { actor: locals.admin!, area: 'Mails', title: off.length ? `Automatische Mails: aus sind ${off.join(', ')}` : 'Automatische Mails: alle an', link: '/admin/mails' }, async () =>
			setSetting('reminders', { ...(await stored()).reminders, ...next })
		);
		return done('Gespeichert', a);
	}
};
