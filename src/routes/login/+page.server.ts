import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loginDM, getDMBySessionId } from '$lib/server/dmModel';

export const load: PageServerLoad = async ({ cookies }) => {
	const sessionId = cookies.get('dm_auth');
	if (sessionId) {
		const dm = await getDMBySessionId(sessionId);
		if (dm) redirect(303, '/');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = (data.get('email') as string)?.trim().toLowerCase();
		const password = data.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.' });
		}

		const dm = await loginDM(email, password);
		if (!dm) {
			return fail(401, { error: 'Incorrect email or password.' });
		}

		cookies.set('dm_auth', dm.sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 30, // 30 days
			secure: false // allow plain HTTP for local use
		});

		redirect(303, '/');
	}
};
