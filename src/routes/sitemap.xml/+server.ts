import { SITE_URL } from '$app/env/private';
import { sql } from '#lib/server/db.ts';
import { LANGS, localize } from '#lib/i18n.ts';

const PAGES = ['/', '/wanderungen', '/umgebung', '/anfrage', '/impressum', '/datenschutz'];
const alternates = (p: string) => LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}${localize(l, p)}"/>`).join('');
const entry = (p: string) => LANGS.map((l) => `<url><loc>${SITE_URL}${localize(l, p)}</loc>${alternates(p)}</url>`).join('');

export const GET = async () => {
	const hikes = await sql`select slug from hikes order by sort, id`;
	const urls = [...PAGES, ...hikes.map((h) => `/wanderungen/${h.slug}`)].map(entry).join('');
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`,
		{ headers: { 'content-type': 'application/xml' } }
	);
};
