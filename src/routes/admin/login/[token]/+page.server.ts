import { fail, redirect } from '@sveltejs/kit';
import { finishLogin } from '#lib/server/auth.ts';

// The link only shows a button; mail scanners that open links must not use up the token.
export const actions = {
	default: async ({ params, cookies }) => {
		if (!(await finishLogin(params.token, cookies))) return fail(400, { error: true });
		redirect(303, '/admin');
	}
};
