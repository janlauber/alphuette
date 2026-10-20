import { SITE_URL } from '$app/env/private';
import { sql } from '#lib/server/db.ts';

const PAGES = ['/', '/wanderungen', '/umgebung', '/anfrage', '/impressum', '/datenschutz'];
const en = (p: string) => '/en' + (p === '/' ? '' : p);
const entry = (p: string) =>
	[p, en(p)]
		.map(
			(loc) =>
				`<url><loc>${SITE_URL}${loc}</loc>` +
				`<xhtml:link rel="alternate" hreflang="de" href="${SITE_URL}${p}"/>` +
				`<xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}${en(p)}"/></url>`
		)
		.join('');

export const GET = async () => {
	const hikes = await sql`select slug from hikes order by sort, id`;
	const urls = [...PAGES, ...hikes.map((h) => `/wanderungen/${h.slug}`)].map(entry).join('');
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`,
		{ headers: { 'content-type': 'application/xml' } }
	);
};
