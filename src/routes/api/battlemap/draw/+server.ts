// GET    /api/battlemap/draw?session=<id> — current strokes (viewer join / DM resync).
// POST   /api/battlemap/draw              — DM replaces the full stroke list; broadcasts. The
//                                            same call serves both throttled live-drawing updates
//                                            and the final committed stroke — no delta/merge logic.
// DELETE /api/battlemap/draw              — DM clears all strokes (keeps the map itself).
import type { RequestHandler } from './$types';
import type { Cookies } from '@sveltejs/kit';
import { resolveActingSessionId } from '$lib/server/auth';
import { isValidSessionId } from '$lib/server/validate';
import { authToGameSession } from '$lib/server/sessionCache';
import { getActiveGameSessionPublicId } from '$lib/server/dmModel';
import { sessionBattleMapViewStates, sessionBattleMapStrokes } from '$lib/server/battleMapState';
import type { BattleMapStroke } from '$lib/server/battleMapState';
import { broadcastEventToSession } from '$lib/server/sseState';

const MAX_STROKES = 300;
const MAX_POINTS_PER_STROKE = 2000;

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

function isValidStrokes(v: unknown): v is BattleMapStroke[] {
	if (!Array.isArray(v) || v.length > MAX_STROKES) return false;
	for (const s of v) {
		if (!s || typeof s !== 'object') return false;
		const stroke = s as Record<string, unknown>;
		if (!Array.isArray(stroke.points) || stroke.points.length > MAX_POINTS_PER_STROKE * 2) {
			return false;
		}
		if (stroke.points.some((n) => typeof n !== 'number' || !Number.isFinite(n))) return false;
		if (typeof stroke.color !== 'string' || stroke.color.length > 20) return false;
		if (typeof stroke.width !== 'number' || stroke.width < 0.0005 || stroke.width > 0.1) {
			return false;
		}
	}
	return true;
}

// ---------------------------------------------------------------------------
// GET /api/battlemap/draw?session=<id> — current strokes
// ---------------------------------------------------------------------------
export const GET: RequestHandler = async ({ url }) => {
	const sessionId = url.searchParams.get('session');

	if (!sessionId) return new Response('Missing ?session= parameter', { status: 400 });
	if (!isValidSessionId(sessionId)) return new Response('Invalid session ID', { status: 400 });

	return Response.json(sessionBattleMapStrokes.get(sessionId) ?? []);
};

// ---------------------------------------------------------------------------
// POST /api/battlemap/draw — DM replaces the full stroke list
// ---------------------------------------------------------------------------
export const POST: RequestHandler = async ({ request, cookies }) => {
	const resolved = await resolveDmGameSession(cookies);
	if ('error' in resolved) return resolved.error;
	const { gameSessionId } = resolved;

	if (!sessionBattleMapViewStates.get(gameSessionId)) {
		return new Response('No map prepared', { status: 400 });
	}

	const body = await request.json().catch(() => null);
	if (!isValidStrokes(body)) return new Response('Invalid strokes', { status: 400 });

	sessionBattleMapStrokes.set(gameSessionId, body);
	broadcastEventToSession(gameSessionId, 'battleMapDraw', body);

	return new Response(null, { status: 204 });
};

// ---------------------------------------------------------------------------
// DELETE /api/battlemap/draw — DM clears all strokes
// ---------------------------------------------------------------------------
export const DELETE: RequestHandler = async ({ cookies }) => {
	const resolved = await resolveDmGameSession(cookies);
	if ('error' in resolved) return resolved.error;
	const { gameSessionId } = resolved;

	sessionBattleMapStrokes.set(gameSessionId, []);
	broadcastEventToSession(gameSessionId, 'battleMapDraw', []);

	return new Response(null, { status: 204 });
};
