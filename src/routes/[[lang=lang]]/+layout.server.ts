import { SITE_URL } from '$app/env/private';
import { getSettings } from '#lib/server/settings.ts';
import type { Lang } from '#lib/i18n.ts';

export const load = async ({ params }) => {
	const s = await getSettings();
	const { name, street, zip, city, email, whatsapp } = s.host;
	return {
		lang: (params.lang ?? 'de') as Lang,
		hutName: s.name,
		host: { name, street, zip, city, email, whatsapp },
		siteUrl: SITE_URL
	};
};
