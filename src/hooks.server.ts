import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { isValidCookie } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	// Protect the DM screen. /display, /login, and /api/state are intentionally open.
	if (event.url.pathname === '/') {
		if (!isValidCookie(event.cookies.get('dm_auth'))) {
			redirect(303, '/login');
		}
	}
	return resolve(event);
};
