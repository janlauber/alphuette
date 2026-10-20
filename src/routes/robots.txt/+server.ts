import { SITE_URL } from '$app/env/private';

export const GET = () =>
	new Response(`User-agent: *\nDisallow: /admin\nDisallow: /buchung\nDisallow: /en/buchung\n\nSitemap: ${SITE_URL}/sitemap.xml\n`, {
		headers: { 'content-type': 'text/plain' }
	});
