import { fail } from '@sveltejs/kit';
import { ADMIN_EMAILS, MAIL_FROM, REPLY_DOMAIN, SITE_URL } from '$app/env/private';

// the domain the site sends from, e.g. alphuette-kiental.ch
const mailDomain = MAIL_FROM.replace(/^.*@/, '').replace(/>.*$/, '').toLowerCase();
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
		forward: s.mail.forward,
		fallback: ADMIN_EMAILS,
		domain: mailDomain,
		kinds: (Object.keys(KINDS) as Kind[]).map((k) => ({ key: k, ...KINDS[k], on: s.reminders[k], preview: compose(k, b, s) })),
		sent: sent.map((r) => ({ ...r, label: KINDS[r.kind]?.label ?? r.kind }))
	};
};

// our own domains: forwarding there would send each mail around in a circle
const own = () => [mailDomain, new URL(SITE_URL).hostname.replace(/^www\./, ''), REPLY_DOMAIN].filter(Boolean).map((d) => '@' + d!.toLowerCase());

export const actions = {
	forward: async ({ request, locals }) => {
		const raw = String((await request.formData()).get('forward') ?? '');
		const list = [...new Set(raw.split(/[\s,;]+/).map((a) => a.trim().toLowerCase()).filter(Boolean))].slice(0, 5);
		const bad = list.find((a) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a));
		if (bad) return fail(400, { forwardError: `«${bad}» ist keine gültige E-Mail-Adresse.`, forwardValue: raw });
		const loop = list.find((a) => own().some((d) => a.endsWith(d)));
		if (loop) return fail(400, { forwardError: `«${loop}» gehört zur Website selbst. Bitte eine Adresse bei einem anderen Anbieter eintragen.`, forwardValue: raw });
		const a = await changeSettings(['mail'], { actor: locals.admin!, area: 'Mails', title: list.length ? `Weiterleitung an ${list.join(', ')}` : 'Weiterleitung entfernt', link: '/admin/mails' }, async () =>
			setSetting('mail', { ...(await stored()).mail, forward: list })
		);
		return done('Gespeichert', a);
	},
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
