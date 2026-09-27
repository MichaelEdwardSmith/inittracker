// GET  /api/battlemap/state?session=<id> — current map's view state (viewers call on join; the
//                                           DM's own modal calls it on mount to resync).
// POST /api/battlemap/state              — DM pushes grid-config/show-hide updates; broadcasts.
import type { RequestHandler } from './$types';
import type { Cookies } from '@sveltejs/kit';
import { resolveActingSessionId } from '$lib/server/auth';
import { isValidSessionId } from '$lib/server/validate';
import { authToGameSession } from '$lib/server/sessionCache';
import { getActiveGameSessionPublicId } from '$lib/server/dmModel';
import { sessionBattleMapViewStates } from '$lib/server/battleMapState';
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
// GET /api/battlemap/state?session=<id> — current view state, or null if no map prepared
// ---------------------------------------------------------------------------
export const GET: RequestHandler = async ({ url }) => {
	const sessionId = url.searchParams.get('session');

	if (!sessionId) return new Response('Missing ?session= parameter', { status: 400 });
	if (!isValidSessionId(sessionId)) return new Response('Invalid session ID', { status: 400 });

	return Response.json(sessionBattleMapViewStates.get(sessionId) ?? null);
};

// ---------------------------------------------------------------------------
// POST /api/battlemap/state — DM pushes grid-config/show-hide updates
// ---------------------------------------------------------------------------
export const POST: RequestHandler = async ({ request, cookies }) => {
	const resolved = await resolveDmGameSession(cookies);
	if ('error' in resolved) return resolved.error;
	const { gameSessionId } = resolved;

	const existing = sessionBattleMapViewStates.get(gameSessionId);
	if (!existing) return new Response('No map prepared', { status: 400 });

	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object') return new Response('Invalid payload', { status: 400 });

	const visible = typeof body.visible === 'boolean' ? body.visible : existing.visible;
	const showGrid = typeof body.showGrid === 'boolean' ? body.showGrid : existing.showGrid;
	const gridSquaresAcross =
		typeof body.gridSquaresAcross === 'number' &&
		Number.isFinite(body.gridSquaresAcross) &&
		body.gridSquaresAcross >= 1 &&
		body.gridSquaresAcross <= 200
			? body.gridSquaresAcross
			: existing.gridSquaresAcross;
	const gridSquaresDown =
		typeof body.gridSquaresDown === 'number' &&
		Number.isFinite(body.gridSquaresDown) &&
		body.gridSquaresDown >= 1 &&
		body.gridSquaresDown <= 200
			? body.gridSquaresDown
			: existing.gridSquaresDown;
	const feetPerSquare =
		typeof body.feetPerSquare === 'number' &&
		Number.isFinite(body.feetPerSquare) &&
		body.feetPerSquare > 0 &&
		body.feetPerSquare <= 100
			? body.feetPerSquare
			: existing.feetPerSquare;

	const next = {
		...existing,
		visible,
		showGrid,
		gridSquaresAcross,
		gridSquaresDown,
		feetPerSquare
	};
	sessionBattleMapViewStates.set(gameSessionId, next);
	broadcastEventToSession(gameSessionId, 'battleMapState', next);

	return new Response(null, { status: 204 });
};
