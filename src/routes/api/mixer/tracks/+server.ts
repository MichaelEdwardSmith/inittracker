// GET  /api/mixer/tracks?session=<id> — list track metadata for a session (viewers call on join).
// POST /api/mixer/tracks              — DM pushes mixer play state; broadcasts to viewers.
import type { RequestHandler } from './$types';
import { resolveActingSessionId } from '$lib/server/auth';
import { isValidSessionId } from '$lib/server/validate';
import { authToGameSession } from '$lib/server/sessionCache';
import { getActiveGameSessionPublicId } from '$lib/server/dmModel';
import { sessionTracks, sessionMixerStates } from '$lib/server/mixerState';
import type { MixerState } from '$lib/server/mixerState';
import { broadcastEventToSession } from '$lib/server/sseState';

/** Resolves the active game session's public ID for a DM auth sessionId.
 *  Uses the shared in-memory cache; falls back to DB on cache miss. */
async function resolveGameSessionId(authSessionId: string): Promise<string | null> {
	let gameSessionId = authToGameSession.get(authSessionId) ?? null;
	if (!gameSessionId) {
		gameSessionId = await getActiveGameSessionPublicId(authSessionId);
		if (gameSessionId) authToGameSession.set(authSessionId, gameSessionId);
	}
	return gameSessionId;
}

// ---------------------------------------------------------------------------
// GET /api/mixer/tracks?session=<id> — list available tracks for a session
// ---------------------------------------------------------------------------
export const GET: RequestHandler = async ({ url }) => {
	const sessionId = url.searchParams.get('session');

	if (!sessionId) return new Response('Missing ?session= parameter', { status: 400 });
	if (!isValidSessionId(sessionId)) return new Response('Invalid session ID', { status: 400 });

	const tracks = sessionTracks.get(sessionId);
	if (!tracks) return Response.json([]);

	const list = Array.from(tracks.values()).map((t) => ({ id: t.id, name: t.name }));
	return Response.json(list);
};

// ---------------------------------------------------------------------------
// POST /api/mixer/tracks — DM pushes mixer play state
// ---------------------------------------------------------------------------
export const POST: RequestHandler = async ({ request, cookies }) => {
	const authSessionId = await resolveActingSessionId(cookies);
	const guestSessionId = cookies.get('dm_guest');

	if (!authSessionId && !guestSessionId) return new Response('Unauthorized', { status: 401 });

	let gameSessionId: string | null;
	const isGuest = !authSessionId && !!guestSessionId;

	if (isGuest) {
		if (!isValidSessionId(guestSessionId!))
			return new Response('Invalid guest session', { status: 400 });
		gameSessionId = guestSessionId!;
	} else {
		gameSessionId = await resolveGameSessionId(authSessionId!);
		if (!gameSessionId) return new Response('No active session', { status: 400 });
	}

	const body = await request.json().catch(() => null);
	if (!body || typeof body.masterVolume !== 'number' || !Array.isArray(body.channels)) {
		return new Response('Invalid mixer state payload', { status: 400 });
	}

	const mixerState: MixerState = {
		masterVolume: body.masterVolume,
		channels: body.channels
	};

	sessionMixerStates.set(gameSessionId, mixerState);
	broadcastEventToSession(gameSessionId, 'mixer', mixerState);

	return new Response(null, { status: 204 });
};
