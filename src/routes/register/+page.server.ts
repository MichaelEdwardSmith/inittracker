import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createDM, getDMBySessionId } from '$lib/server/dmModel';

export const load: PageServerLoad = async ({ cookies }) => {
	const sessionId = cookies.get('dm_auth');
	if (sessionId) {
		const dm = await getDMBySessionId(sessionId);
		if (dm) redirect(303, '/');
	}
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const firstName = (data.get('firstName') as string)?.trim();
		const lastName = (data.get('lastName') as string)?.trim();
		const email = (data.get('email') as string)?.trim().toLowerCase();
		const password = data.get('password') as string;
		const confirm = data.get('confirm') as string;

		if (!firstName || !lastName || !email || !password) {
			return fail(400, { error: 'All fields are required.', firstName, lastName, email });
		}
		if (password.length < 8) {
			return fail(400, {
				error: 'Password must be at least 8 characters.',
				firstName,
				lastName,
				email
			});
		}
		if (password !== confirm) {
			return fail(400, { error: 'Passwords do not match.', firstName, lastName, email });
		}

		const result = await createDM(firstName, lastName, email, password);
		if ('error' in result) {
			return fail(409, { error: result.error, firstName, lastName, email });
		}

		// Registration successful — send them to login
		redirect(303, '/login?registered=1');
	}
};
