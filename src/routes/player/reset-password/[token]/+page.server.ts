// Server logic for /player/reset-password/[token].
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { resetPlayerPasswordWithToken } from '$lib/server/playerModel';

export const actions: Actions = {
	default: async ({ request, params }) => {
		const data = await request.formData();
		const password = data.get('password') as string;
		const confirm = data.get('confirm') as string;

		if (!password || password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.' });
		}
		if (password !== confirm) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		const result = await resetPlayerPasswordWithToken(params.token, password);
		if (!result.ok) {
			return fail(400, { error: result.error });
		}

		redirect(303, '/player/login?reset=1');
	}
};
