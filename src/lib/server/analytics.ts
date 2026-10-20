import { createHash, randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import maxmind, { type CityResponse, type Reader } from 'maxmind';
import { GEOIP_DB } from '$app/env/private';
import { sql } from './db.ts';

// Anonymous, first-party analytics. No cookies; a visitor is sha256(daily salt + IP + user agent),
// so the same person counts once per day and cannot be followed across days.

const BOTS = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|uptime|curl|wget|python|go-http|node-fetch|axios/i;

let salt = { day: '', value: '' };
async function dailySalt() {
	const day = new Date().toISOString().slice(0, 10);
	if (salt.day === day) return salt.value;
	await sql`insert into settings (key, value) values ('analytics_salt', ${sql.json({ day, value: randomBytes(16).toString('hex') })})
		on conflict (key) do update set value = excluded.value where settings.value->>'day' <> ${day}`;
	const [row] = await sql`select value from settings where key = 'analytics_salt'`;
	salt = row.value;
	return salt.value;
}

let geo: Reader<CityResponse> | null | undefined;
async function lookup(ip: string) {
	if (geo === undefined) geo = GEOIP_DB && existsSync(GEOIP_DB) ? await maxmind.open<CityResponse>(GEOIP_DB) : null;
	const r = geo?.get(ip);
	return {
		country: r?.country?.iso_code ?? null,
		region: r?.subdivisions?.[0]?.names?.de ?? r?.subdivisions?.[0]?.names?.en ?? null,
		city: r?.city?.names?.de ?? r?.city?.names?.en ?? null
	};
}

export function client(ua: string) {
	const device = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua) ? 'Tablet' : /Mobi|iPhone|Android/i.test(ua) ? 'Handy' : 'Computer';
	const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox'
		: /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Andere';
	const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows'
		: /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Andere';
	return { device, browser, os };
}

export const isBot = (ua: string) => !ua || BOTS.test(ua);

export type Hit = {
	kind: 'view' | 'leave' | 'event' | 'vital';
	path: string;
	name?: string | null;
	value?: number | null;
	referrer?: string | null;
	url?: URL;
};

/** Stores one event. Never throws; analytics must not break a page. */
export async function record(hit: Hit, ip: string, ua: string, host: string, lang: string | null) {
	try {
		if (isBot(ua)) return;
		const visitor = createHash('sha256').update(`${await dailySalt()}|${ip}|${ua}`).digest('hex').slice(0, 20);
		let ref: string | null = null;
		try {
			const r = hit.referrer ? new URL(hit.referrer).hostname.replace(/^www\./, '') : null;
			ref = r && r !== host ? r : null;
		} catch {}
		const q = hit.url?.searchParams;
		const { country, region, city } = await lookup(ip);
		const c = client(ua);
		await sql`insert into events (kind, path, name, value, visitor, ref, utm_source, utm_medium, utm_campaign,
				country, region, city, device, browser, os, lang)
			values (${hit.kind}, ${hit.path.slice(0, 200)}, ${hit.name?.slice(0, 60) ?? null}, ${hit.value ?? null}, ${visitor}, ${ref},
				${q?.get('utm_source')?.slice(0, 60) ?? null}, ${q?.get('utm_medium')?.slice(0, 60) ?? null},
				${q?.get('utm_campaign')?.slice(0, 60) ?? null}, ${country}, ${region}, ${city},
				${c.device}, ${c.browser}, ${c.os}, ${lang?.slice(0, 2) ?? null})`;
	} catch (e) {
		console.error('analytics', e);
	}
}

/** Raw events older than 13 months go away. */
export const pruneEvents = () => sql`delete from events where ts < now() - interval '400 days'`;
