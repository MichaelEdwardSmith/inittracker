import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { getDMBySessionId, getActiveGameSessionPublicId } from '$lib/server/dmModel';
import { authToGameSession } from '$lib/server/sessionCache';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('dm_auth') ?? null;
	event.locals.sessionId = sessionId;
	event.locals.gameSessionId = null;
	event.locals.dmFirstName = null;

	// Protect DM-only pages. /display/*, /login, /register, /join, /api/* are open.
	const { pathname } = event.url;
	if (pathname === '/' || pathname === '/history') {
		if (!sessionId) redirect(303, '/login');
		const dm = await getDMBySessionId(sessionId);
		if (!dm) {
			event.cookies.delete('dm_auth', { path: '/' });
			redirect(303, '/login');
		}
		event.locals.dmFirstName = dm.firstName;

		// Resolve active game session (triggers migration for legacy documents).
		let gameSessionId = authToGameSession.get(sessionId) ?? null;
		if (!gameSessionId) {
			gameSessionId = await getActiveGameSessionPublicId(sessionId);
			if (gameSessionId) authToGameSession.set(sessionId, gameSessionId);
		}
		event.locals.gameSessionId = gameSessionId;
	}

	return resolve(event);
};
