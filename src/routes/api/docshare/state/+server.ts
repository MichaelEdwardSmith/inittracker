// GET  /api/docshare/state?session=<id> — current doc's view state (viewers call on join; the
//                                          DM's own modal calls it on mount to resync).
// POST /api/docshare/state              — DM pushes show/hide/page-turn updates; broadcasts.
import type { RequestHandler } from './$types';
import type { Cookies } from '@sveltejs/kit';
import { resolveActingSessionId } from '$lib/server/auth';
import { isValidSessionId } from '$lib/server/validate';
import { authToGameSession } from '$lib/server/sessionCache';
import { getActiveGameSessionPublicId } from '$lib/server/dmModel';
import { sessionDocViewStates } from '$lib/server/docShareState';
import { broadcastEventToSession } from '$lib/server/sseState';

async function resolveGameSessionId(authSessionId: string): Promise<string | null> {
	let gameSessionId = authToGameSession.get(authSessionId) ?? null;
	if (!gameSessionId) {
		gameSessionId = await getActiveGameSessionPublicId(authSessionId);
		if (gameSessionId) authToGameSession.set(authSessionId, gameSessionId);
	}
	return gameSessionId;
}

async function resolveDmGameSession(
	cookies: Cookies
): Promise<{ gameSessionId: string } | { error: Response }> {
	const authSessionId = await resolveActingSessionId(cookies);
	const guestSessionId = cookies.get('dm_guest');

	if (!authSessionId && !guestSessionId) {
		return { error: new Response('Unauthorized', { status: 401 }) };
	}
	if (!authSessionId && guestSessionId) {
		if (!isValidSessionId(guestSessionId)) {
			return { error: new Response('Invalid guest session', { status: 400 }) };
		}
		return { gameSessionId: guestSessionId };
	}
	const gameSessionId = await resolveGameSessionId(authSessionId!);
	if (!gameSessionId) return { error: new Response('No active session', { status: 400 }) };
	return { gameSessionId };
}

// ---------------------------------------------------------------------------
// GET /api/docshare/state?session=<id> — current view state, or null if nothing prepared
// ---------------------------------------------------------------------------
export const GET: RequestHandler = async ({ url }) => {
	const sessionId = url.searchParams.get('session');

	if (!sessionId) return new Response('Missing ?session= parameter', { status: 400 });
	if (!isValidSessionId(sessionId)) return new Response('Invalid session ID', { status: 400 });

	return Response.json(sessionDocViewStates.get(sessionId) ?? null);
};

// ---------------------------------------------------------------------------
// POST /api/docshare/state — DM pushes show/hide/page-turn updates
// ---------------------------------------------------------------------------
export const POST: RequestHandler = async ({ request, cookies }) => {
	const resolved = await resolveDmGameSession(cookies);
	if ('error' in resolved) return resolved.error;
	const { gameSessionId } = resolved;

	const existing = sessionDocViewStates.get(gameSessionId);
	if (!existing) return new Response('No document prepared', { status: 400 });

	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object') return new Response('Invalid payload', { status: 400 });

	const visible = typeof body.visible === 'boolean' ? body.visible : existing.visible;
	const currentPage =
		typeof body.currentPage === 'number' &&
		Number.isInteger(body.currentPage) &&
		body.currentPage >= 0 &&
		body.currentPage < existing.pageCount
			? body.currentPage
			: existing.currentPage;

	const next = { ...existing, visible, currentPage };
	sessionDocViewStates.set(gameSessionId, next);
	broadcastEventToSession(gameSessionId, 'docshareState', next);

	return new Response(null, { status: 204 });
};
