// Server logic for /reset-password/[token] (DM).
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { resetPasswordWithToken } from '$lib/server/dmModel';

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

		const result = await resetPasswordWithToken(params.token, password);
		if (!result.ok) {
			return fail(400, { error: result.error });
		}

		redirect(303, '/login?reset=1');
	}
};
