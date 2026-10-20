import { fail } from '@sveltejs/kit';
import { sql } from '#lib/server/db.ts';
import { getSettings } from '#lib/server/settings.ts';
import { missing } from '#lib/server/invoice.ts';
import { compose, type Template } from '#lib/server/reminders.ts';
import { sendMail } from '#lib/server/mail.ts';
import type { Booking } from '#lib/server/bookings.ts';
import { changeRow, done, log } from '#lib/server/activity.ts';
import { invoices, years } from './finance.ts';

export const load = async ({ url }) => {
	const all = await years();
	const now = new Date().getFullYear();
	const asked = Number(url.searchParams.get('jahr'));
	const year = all.includes(asked) ? asked : (all.find((y) => y >= now) ?? all.at(-1) ?? now);
	const [rows, s] = await Promise.all([invoices(year), getSettings()]);
	const sum = (f: (r: (typeof rows)[number]) => number, only?: (r: (typeof rows)[number]) => boolean) => rows.filter(only ?? (() => true)).reduce((a, r) => a + f(r), 0);
	const months = [...Map.groupBy(rows, (r) => r.checkIn.slice(0, 7)).entries()].map(([month, rs]) => ({
		month,
		stays: rs.length,
		nights: rs.reduce((a, r) => a + r.nights, 0),
		adults: rs.reduce((a, r) => a + r.adults, 0),
		children: rs.reduce((a, r) => a + r.children, 0),
		tax: rs.reduce((a, r) => a + r.tax, 0),
		levy: rs.reduce((a, r) => a + r.levy, 0)
	}));
	return {
		year,
		years: all.includes(now) ? all : [...all, now].sort(),
		rows,
		months,
		totals: {
			total: sum((r) => r.total),
			paid: sum((r) => r.total, (r) => r.state === 'bezahlt'),
			open: sum((r) => r.total, (r) => r.state === 'offen'),
			overdue: sum((r) => r.total, (r) => r.state === 'ueberfaellig'),
			overdueCount: rows.filter((r) => r.state === 'ueberfaellig').length,
			rent: sum((r) => r.rent + r.cleaning + r.linen),
			taxes: sum((r) => r.tax + r.levy)
		},
		missing: missing(s.host)
	};
};

const id = (f: FormData) => Number(f.get('id'));

export const actions = {
	paid: async ({ request, locals }) => {
		const f = await request.formData();
		const date = /^\d{4}-\d{2}-\d{2}$/.test(String(f.get('date'))) ? String(f.get('date')) : new Date().toISOString().slice(0, 10);
		const [b] = await sql`select name from bookings where id = ${id(f)} and status = 'bestaetigt'`;
		if (!b) return fail(404);
		const a = await changeRow('bookings', id(f), { actor: locals.admin!, area: 'Finanzen', title: `${b.name}: bezahlt am ${date.split('-').reverse().join('.')}`, link: '/admin/finanzen' }, () =>
			sql`update bookings set paid_at = ${date}::date, updated_at = now() where id = ${id(f)}`
		);
		return done('Als bezahlt eingetragen', a);
	},
	unpaid: async ({ request, locals }) => {
		const f = await request.formData();
		const [b] = await sql`select name from bookings where id = ${id(f)}`;
		if (!b) return fail(404);
		const a = await changeRow('bookings', id(f), { actor: locals.admin!, area: 'Finanzen', title: `${b.name}: wieder offen`, link: '/admin/finanzen' }, () =>
			sql`update bookings set paid_at = null, updated_at = now() where id = ${id(f)}`
		);
		return done('Wieder als offen markiert', a);
	},
	remind: async ({ request, locals }) => {
		const f = await request.formData();
		const [[b], [t]] = await Promise.all([
			sql<Booking[]>`select * from bookings where id = ${id(f)} and status = 'bestaetigt' and paid_at is null`,
			sql<Template[]>`select * from mail_templates where key = 'payment'`
		]);
		if (!b || !t) return fail(400);
		await sendMail(await compose(t, b, await getSettings()));
		await sql`insert into booking_mails (booking_id, kind) values (${b.id}, ${'payment:' + Date.now()})`;
		await log({ actor: locals.admin!, area: 'Finanzen', title: `Zahlungserinnerung an ${b.name} geschickt`, link: `/admin/buchungen/${b.id}` });
		return done(`Erinnerung an ${b.name} geschickt`);
	}
};
