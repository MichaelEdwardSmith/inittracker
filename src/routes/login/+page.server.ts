import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { validatePassword, getSessionToken, isValidCookie } from '$lib/server/auth';

export const load: PageServerLoad = ({ cookies }) => {
	// Already authenticated — skip the login page.
	if (isValidCookie(cookies.get('dm_auth'))) {
		redirect(303, '/');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const password = data.get('password') as string;

		if (!validatePassword(password)) {
			return fail(401, { error: 'Incorrect password.' });
		}

		cookies.set('dm_auth', getSessionToken(), {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 30, // 30 days
			secure: false // allow plain HTTP for local use
		});

		redirect(303, '/');
	}
};
