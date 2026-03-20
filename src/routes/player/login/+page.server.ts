// Server actions for /player/login.
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { loginPlayer } from '$lib/server/playerModel';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = (data.get('email') as string)?.trim() ?? '';
		const password = (data.get('password') as string) ?? '';

		if (!email || !password) {
			return fail(400, { error: 'Please enter your email and password.' });
		}

		const result = await loginPlayer(email, password);
		if (!result) {
			return fail(401, { error: 'Invalid email or password.' });
		}

		cookies.set('player_auth', result.sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 30,
			secure: false
		});

		redirect(303, '/join');
	}
};
