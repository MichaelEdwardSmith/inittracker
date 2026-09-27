// GET  /api/battlemap/tokens?session=<id> — current token positions (viewer join / DM resync).
// POST /api/battlemap/tokens              — DM replaces the full token list; broadcasts. The same
//                                            call serves both throttled live-drag updates and the
//                                            final committed position — no delta/merge logic.
import type { RequestHandler } from './$types';
import type { Cookies } from '@sveltejs/kit';
import { resolveActingSessionId } from '$lib/server/auth';
import { isValidSessionId } from '$lib/server/validate';
import { authToGameSession } from '$lib/server/sessionCache';
import { getActiveGameSessionPublicId } from '$lib/server/dmModel';
import { sessionBattleMapViewStates, sessionBattleMapTokens } from '$lib/server/battleMapState';
import type { BattleMapToken } from '$lib/server/battleMapState';
import { broadcastEventToSession } from '$lib/server/sseState';

const MAX_TOKENS = 100;

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

function isValidTokens(v: unknown): v is BattleMapToken[] {
	if (!Array.isArray(v) || v.length > MAX_TOKENS) return false;
	for (const t of v) {
		if (!t || typeof t !== 'object') return false;
		const tok = t as Record<string, unknown>;
		if (typeof tok.combatantId !== 'string' || tok.combatantId.length > 100) return false;
		if (typeof tok.x !== 'number' || !Number.isFinite(tok.x) || tok.x < 0 || tok.x > 1) {
			return false;
		}
		if (typeof tok.y !== 'number' || !Number.isFinite(tok.y) || tok.y < 0 || tok.y > 1) {
			return false;
		}
	}
	return true;
}

// ---------------------------------------------------------------------------
// GET /api/battlemap/tokens?session=<id> — current token positions
// ---------------------------------------------------------------------------
export const GET: RequestHandler = async ({ url }) => {
	const sessionId = url.searchParams.get('session');

	if (!sessionId) return new Response('Missing ?session= parameter', { status: 400 });
	if (!isValidSessionId(sessionId)) return new Response('Invalid session ID', { status: 400 });

	return Response.json(sessionBattleMapTokens.get(sessionId) ?? []);
};

// ---------------------------------------------------------------------------
// POST /api/battlemap/tokens — DM replaces the full token list
// ---------------------------------------------------------------------------
export const POST: RequestHandler = async ({ request, cookies }) => {
	const resolved = await resolveDmGameSession(cookies);
	if ('error' in resolved) return resolved.error;
	const { gameSessionId } = resolved;

	if (!sessionBattleMapViewStates.get(gameSessionId)) {
		return new Response('No map prepared', { status: 400 });
	}

	const body = await request.json().catch(() => null);
	if (!isValidTokens(body)) return new Response('Invalid tokens', { status: 400 });

	sessionBattleMapTokens.set(gameSessionId, body);
	broadcastEventToSession(gameSessionId, 'battleMapTokens', body);

	return new Response(null, { status: 204 });
};
