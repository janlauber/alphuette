import { defineParams } from '@sveltejs/kit/params';

export const params = defineParams({
	lang: (p) => (p === 'en' ? p : undefined)
});
