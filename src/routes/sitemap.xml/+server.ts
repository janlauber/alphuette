import { SITE_URL } from '$app/env/private';

const PAGES = ['/', '/umgebung', '/anfrage', '/impressum', '/datenschutz'];
const en = (p: string) => '/en' + (p === '/' ? '' : p);

export const GET = () => {
	const urls = PAGES.map(
		(p) => `<url><loc>${SITE_URL}${p}</loc>` +
			`<xhtml:link rel="alternate" hreflang="de" href="${SITE_URL}${p}"/>` +
			`<xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}${en(p)}"/></url>` +
			`<url><loc>${SITE_URL}${en(p)}</loc>` +
			`<xhtml:link rel="alternate" hreflang="de" href="${SITE_URL}${p}"/>` +
			`<xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}${en(p)}"/></url>`
	).join('');
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`,
		{ headers: { 'content-type': 'application/xml' } }
	);
};
