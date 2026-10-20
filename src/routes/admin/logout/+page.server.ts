import { redirect } from '@sveltejs/kit';
import { logout } from '#lib/server/auth.ts';

export const load = () => redirect(303, '/admin');

export const actions = {
	default: async ({ cookies }) => {
		await logout(cookies);
		redirect(303, '/admin/login');
	}
};
