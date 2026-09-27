// POST /api/battlemap/ruler — DM sets or clears the live measurement line; broadcasts so players
//                              briefly see it too. Fire-and-forget, throttled client-side the same
//                              way DocShare's annotation live-drawing is.
import type { RequestHandler } from './$types';
import type { Cookies } from '@sveltejs/kit';
import { resolveActingSessionId } from '$lib/server/auth';
import { isValidSessionId } from '$lib/server/validate';
import { authToGameSession } from '$lib/server/sessionCache';
import { getActiveGameSessionPublicId } from '$lib/server/dmModel';
import { sessionBattleMapViewStates, sessionBattleMapRulers } from '$lib/server/battleMapState';
import type { BattleMapRuler } from '$lib/server/battleMapState';
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

function isValidPoint(v: unknown): v is [number, number] {
	return (
		Array.isArray(v) &&
		v.length === 2 &&
		v.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1)
	);
}

function isValidRuler(v: unknown): v is BattleMapRuler {
	if (!v || typeof v !== 'object') return false;
	const r = v as Record<string, unknown>;
	return isValidPoint(r.from) && isValidPoint(r.to);
}

// ---------------------------------------------------------------------------
// POST /api/battlemap/ruler — set (body: {from,to}) or clear (body: null) the live ruler line
// ---------------------------------------------------------------------------
export const POST: RequestHandler = async ({ request, cookies }) => {
	const resolved = await resolveDmGameSession(cookies);
	if ('error' in resolved) return resolved.error;
	const { gameSessionId } = resolved;

	if (!sessionBattleMapViewStates.get(gameSessionId)) {
		return new Response('No map prepared', { status: 400 });
	}

	const body = await request.json().catch(() => undefined);
	const ruler = body === null ? null : isValidRuler(body) ? body : undefined;
	if (ruler === undefined) return new Response('Invalid ruler', { status: 400 });

	sessionBattleMapRulers.set(gameSessionId, ruler);
	broadcastEventToSession(gameSessionId, 'battleMapRuler', ruler);

	return new Response(null, { status: 204 });
};
