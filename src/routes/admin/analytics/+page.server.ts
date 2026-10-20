import { sql } from '#lib/server/db.ts';

const RANGES = { '1': 1, '7': 7, '30': 30, '365': 365 } as const;

export const load = async ({ url }) => {
	const r = (url.searchParams.get('r') ?? '30') as keyof typeof RANGES;
	const days = RANGES[r] ?? 30;
	const since = sql`now() - ${days + ' days'}::interval`;
	const top = (col: string) => sql`
		select coalesce(${sql(col)}, 'Unbekannt') as label, count(distinct visitor)::int as n
		from events where kind = 'view' and ts > ${since} group by 1 order by 2 desc limit 8`;

	const [[kpi], [live], [req], series, [funnel], sources, places, countries, devices, browsers, pages, vitals] = await Promise.all([
		sql`select count(distinct visitor) filter (where kind = 'view')::int as visitors,
				count(*) filter (where kind = 'view')::int as views,
				round(avg(value) filter (where kind = 'leave' and value between 1000 and 3600000) / 1000)::int as seconds
			from events where ts > ${since}`,
		sql`select count(distinct visitor)::int as n from events where ts > now() - interval '5 minutes'`,
		sql`select count(*) filter (where status <> 'unbestaetigt')::int as requests,
				count(*) filter (where status = 'bestaetigt')::int as confirmed
			from bookings where status <> 'gesperrt' and created_at > ${since}`,
		sql`select d::date::text as day, count(distinct e.visitor)::int as n,
				(select count(*)::int from bookings b where b.created_at::date = d::date and b.status not in ('gesperrt', 'unbestaetigt')) as requests
			from generate_series(current_date - ${days - 1}::int, current_date, interval '1 day') d
			left join events e on e.kind = 'view' and e.ts::date = d::date
			group by d order by d`,
		sql`select
				count(distinct visitor) filter (where kind = 'view' and path in ('/', '/en'))::int as home,
				count(distinct visitor) filter (where kind = 'event' and name = 'week_selected')::int as week,
				count(distinct visitor) filter (where kind = 'view' and path like '%/anfrage')::int as form,
				count(distinct visitor) filter (where kind = 'event' and name = 'request_sent')::int as sent
			from events where ts > ${since}`,
		sql`select coalesce(utm_source, ref, 'Direkt') as label, count(distinct visitor)::int as n
			from events where kind = 'view' and ts > ${since} group by 1 order by 2 desc limit 8`,
		sql`select coalesce(city || ', ' || region, region, country, 'Unbekannt') as label, count(distinct visitor)::int as n
			from events where kind = 'view' and ts > ${since} group by 1 order by 2 desc limit 8`,
		top('country'),
		top('device'),
		top('browser'),
		sql`select path as label, count(*)::int as n from events where kind = 'view' and ts > ${since} group by 1 order by 2 desc limit 10`,
		sql`select name, round(percentile_cont(0.75) within group (order by value)::numeric, 3)::float as p75, count(*)::int as n
			from events where kind = 'vital' and ts > ${since} group by name`
	]);

	const f = funnel as { home: number; week: number; form: number; sent: number };
	return { r, days, kpi, live: live.n, req, series, funnel: { ...f, confirmed: req.confirmed as number }, sources, places, countries, devices, browsers, pages, vitals };
};
