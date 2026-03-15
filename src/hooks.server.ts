// SvelteKit server hook — runs on every request.
// Reads the dm_auth cookie and protects / and /history by redirecting unauthenticated
// requests to /login. Also resolves the active game session public ID and stores it in
// event.locals for downstream load functions.
import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { getDMBySessionId, getActiveGameSessionPublicId } from '$lib/server/dmModel';
import { authToGameSession } from '$lib/server/sessionCache';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('dm_auth') ?? null;
	const guestSessionId = event.cookies.get('dm_guest') ?? null;
	event.locals.sessionId = sessionId;
	event.locals.gameSessionId = null;
	event.locals.dmFirstName = null;
	event.locals.dmEmail = null;
	event.locals.isGuest = false;

	// Protect DM-only pages. /display/*, /login, /register, /join, /api/* are open.
	const { pathname } = event.url;
	if (pathname === '/dashboard' || pathname === '/history') {
		// Guest access — allowed on dashboard and history.
		if (!sessionId && guestSessionId) {
			event.locals.isGuest = true;
			event.locals.gameSessionId = guestSessionId;
			event.locals.dmFirstName = 'Guest';
			return resolve(event);
		}

		if (!sessionId) redirect(303, '/login');
		const dm = await getDMBySessionId(sessionId);
		if (!dm) {
			event.cookies.delete('dm_auth', { path: '/' });
			redirect(303, '/login');
		}
		event.locals.dmFirstName = dm.firstName;
		event.locals.dmEmail = dm.email;

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
