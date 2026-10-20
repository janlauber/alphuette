import { fail } from '@sveltejs/kit';
import { ADMIN_EMAILS, MAIL_FROM, REPLY_DOMAIN, SITE_URL } from '$app/env/private';
import { sql } from '#lib/server/db.ts';
import { getSettings, setSetting, stored } from '#lib/server/settings.ts';
import { compose, PLACEHOLDERS, templates, TRIGGERS, values, type Template, type Trigger } from '#lib/server/reminders.ts';
import { sendMail } from '#lib/server/mail.ts';
import { syncTranslations } from '#lib/server/sitetexts.ts';
import { changeRow, changeSettings, done, log } from '#lib/server/activity.ts';
import type { Booking } from '#lib/server/bookings.ts';

// the domain the site sends from, e.g. alphuette-kiental.ch
const mailDomain = MAIL_FROM.replace(/^.*@/, '').replace(/>.*$/, '').toLowerCase();
const AREA = 'Mails';
const link = '/admin/mails';

// a made-up stay three weeks from now, only for the preview and the test mail
const example = (): Booking => {
	const inDays = (n: number) => new Date(Date.now() + n * 86400_000).toISOString().slice(0, 10);
	return {
		id: 0, ref: 'BEISPL', status: 'bestaetigt', checkIn: inDays(21), checkOut: inDays(28), name: 'Anna Muster', email: 'anna@example.ch',
		phone: '079 123 45 67', city: 'Bern', country: 'CH', lang: 'de', adults: 2, children: 2, infants: 0, linen: 4, arrival: 'oev', note: null, hostNote: null,
		quote: null, totalRp: 74000, paidAt: null, confirmedAt: new Date(), createdAt: new Date(), updatedAt: new Date()
	};
};

export const load = async () => {
	const [s, list, sent] = await Promise.all([
		getSettings(),
		templates(),
		sql<{ kind: string; at: Date; id: number; name: string }[]>`select m.kind, m.at, b.id, b.name from booking_mails m join bookings b on b.id = m.booking_id order by m.at desc limit 20`
	]);
	const labels = new Map(list.map((t) => [t.key ?? `tpl:${t.id}`, t.label]));
	return {
		forward: s.mail.forward,
		fallback: ADMIN_EMAILS,
		domain: mailDomain,
		templates: list,
		triggers: TRIGGERS,
		placeholders: PLACEHOLDERS,
		example: values(example(), 'de', s),
		sent: sent.map((r) => ({ ...r, label: labels.get(r.kind) ?? r.kind }))
	};
};

// our own domains: forwarding there would send each mail around in a circle
const own = () => [mailDomain, new URL(SITE_URL).hostname.replace(/^www\./, ''), REPLY_DOMAIN].filter(Boolean).map((d) => '@' + d!.toLowerCase());
const str = (f: FormData, k: string, max: number) => String(f.get(k) ?? '').replace(/\r/g, '').trim().slice(0, max);

export const actions = {
	forward: async ({ request, locals }) => {
		const values = (await request.formData()).getAll('forward').map(String);
		const list = [...new Set(values.flatMap((v) => v.split(/[\s,;]+/)).map((a) => a.trim().toLowerCase()).filter(Boolean))].slice(0, 10);
		const bad = list.find((a) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a));
		if (bad) return fail(400, { forwardError: `«${bad}» ist keine gültige E-Mail-Adresse.`, forwardValue: values });
		const loop = list.find((a) => own().some((d) => a.endsWith(d)));
		if (loop) return fail(400, { forwardError: `«${loop}» gehört zur Website selbst. Bitte eine Adresse bei einem anderen Anbieter eintragen.`, forwardValue: values });
		const a = await changeSettings(['mail'], { actor: locals.admin!, area: AREA, title: list.length ? `Weiterleitung an ${list.join(', ')}` : 'Weiterleitung entfernt', link }, async () =>
			setSetting('mail', { ...(await stored()).mail, forward: list })
		);
		return done('Gespeichert', a);
	},
	save: async ({ request, locals }) => {
		const f = await request.formData();
		const id = Number(f.get('id')) || null;
		const t = {
			label: str(f, 'label', 80),
			audience: f.get('audience') === 'host' ? 'host' : 'gast',
			trigger: (str(f, 'trigger', 40) in TRIGGERS ? str(f, 'trigger', 40) : 'before_arrival') as Trigger,
			days: Math.max(0, Math.min(365, Math.round(Number(f.get('days')) || 0))),
			subject: str(f, 'subject', 200),
			body: str(f, 'body', 8000),
			active: f.get('active') === 'on'
		};
		if (!t.label || !t.subject || !t.body) return fail(400, { templateError: 'Bitte Name, Betreff und Text ausfüllen.', id });
		const unknown = [...`${t.subject} ${t.body}`.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).find((k) => !(k in PLACEHOLDERS));
		if (unknown) return fail(400, { templateError: `{${unknown}} kenne ich nicht. Tippe auf einen der grünen Platzhalter, dann stimmt die Schreibweise.`, id });
		let a: number;
		if (id) a = await changeRow('mail_templates', id, { actor: locals.admin!, area: AREA, title: `Mail «${t.label}» geändert`, link }, () => sql`update mail_templates set ${sql(t)} where id = ${id}`);
		else {
			const [row] = await sql`insert into mail_templates ${sql({ ...t, sort: 100 })} returning id`;
			a = await log({ actor: locals.admin!, area: AREA, title: `Neue Mail «${t.label}»`, link, target: `mail_templates:${row.id}`, undo: { table: 'mail_templates', id: row.id, before: null } });
		}
		void syncTranslations();
		return { saved: id ?? 'new', ...done('Gespeichert. Gäste bekommen die Mail in ihrer Sprache.', a) };
	},
	toggle: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		const [t] = await sql<Template[]>`select * from mail_templates where id = ${id}`;
		if (!t) return;
		const a = await changeRow('mail_templates', id, { actor: locals.admin!, area: AREA, title: `Mail «${t.label}» ${t.active ? 'ausgeschaltet' : 'eingeschaltet'}`, link }, () =>
			sql`update mail_templates set active = ${!t.active} where id = ${id}`
		);
		return done(t.active ? 'Ausgeschaltet. Diese Mail geht nicht mehr raus.' : 'Eingeschaltet', a);
	},
	delete: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		const [t] = await sql<Template[]>`select * from mail_templates where id = ${id} and key is null`;
		if (!t) return fail(400, { templateError: 'Die vier Standard-Mails kannst du nur ausschalten, nicht löschen.' });
		const a = await changeRow('mail_templates', id, { actor: locals.admin!, area: AREA, title: `Mail «${t.label}» gelöscht`, link }, () => sql`delete from mail_templates where id = ${id}`);
		return done('Gelöscht', a);
	},
	test: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		const [t] = await sql<Template[]>`select * from mail_templates where id = ${id}`;
		if (!t) return;
		const m = await compose(t, example(), await getSettings());
		await sendMail({ to: locals.admin!, subject: `[Test] ${m.subject}`, text: `So sieht die Mail «${t.label}» mit einem erfundenen Gast aus:\n\n${m.text}` });
		return done(`Testmail an ${locals.admin} geschickt`);
	}
};
