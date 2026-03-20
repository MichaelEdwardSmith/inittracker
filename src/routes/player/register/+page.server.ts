// Server actions for /player/register.
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createPlayer } from '$lib/server/playerModel';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const displayName = (data.get('displayName') as string)?.trim() ?? '';
		const email = (data.get('email') as string)?.trim() ?? '';
		const password = (data.get('password') as string) ?? '';
		const confirm = (data.get('confirm') as string) ?? '';

		if (!displayName || !email || !password) {
			return fail(400, { error: 'All fields are required.' });
		}
		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.' });
		}
		if (password !== confirm) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		const result = await createPlayer(displayName, email, password);
		if ('error' in result) {
			return fail(400, { error: result.error });
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
