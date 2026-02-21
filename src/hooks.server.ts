import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { getDMBySessionId } from '$lib/server/dmModel';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('dm_auth') ?? null;
	event.locals.sessionId = sessionId;
	event.locals.dmFirstName = null;

	// Protect the DM dashboard. /display/*, /login, /register, /join, /api/state are open.
	if (event.url.pathname === '/') {
		if (!sessionId) redirect(303, '/login');
		const dm = await getDMBySessionId(sessionId);
		if (!dm) {
			event.cookies.delete('dm_auth', { path: '/' });
			redirect(303, '/login');
		}
		event.locals.dmFirstName = dm.firstName;
	}

	return resolve(event);
};
