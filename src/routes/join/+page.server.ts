import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getDMByGameSessionId } from '$lib/server/dmModel';
import { isValidSessionId } from '$lib/server/validate';

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const raw = (data.get('sessionId') as string) ?? '';
		const sessionId = raw.trim().toUpperCase();

		if (!sessionId) {
			return fail(400, { error: 'Please enter a session ID.' });
		}

		if (!isValidSessionId(sessionId)) {
			return fail(404, { error: 'Session not found. Double-check your session ID.' });
		}

		const dm = await getDMByGameSessionId(sessionId);
		if (!dm) {
			return fail(404, { error: 'Session not found. Double-check your session ID.' });
		}

		redirect(303, `/display/${sessionId}`);
	}
};
