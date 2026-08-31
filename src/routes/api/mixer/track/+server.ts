// POST /api/mixer/track  — DM uploads a raw audio file for a channel (held in memory only).
// GET  /api/mixer/track  — Viewer downloads a track by session + track ID.
// DELETE /api/mixer/track — DM removes a track and broadcasts the removal to viewers.
import type { RequestHandler } from './$types';
import { resolveActingSessionId } from '$lib/server/auth';
import { isValidSessionId } from '$lib/server/validate';
import { authToGameSession } from '$lib/server/sessionCache';
import { getActiveGameSessionPublicId } from '$lib/server/dmModel';
import { sessionTracks } from '$lib/server/mixerState';
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
// POST /api/mixer/track — DM uploads a track binary
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

	const trackId = request.headers.get('X-Track-Id');
	const rawTrackName = request.headers.get('X-Track-Name');
	const trackName = rawTrackName
		? (() => {
				try {
					return decodeURIComponent(rawTrackName);
				} catch {
					return rawTrackName;
				}
			})()
		: null;
	const mimeType = request.headers.get('Content-Type') ?? 'audio/mpeg';

	if (!trackId || !trackName) return new Response('Missing track headers', { status: 400 });

	const arrayBuffer = await request.arrayBuffer().catch(() => null);
	if (!arrayBuffer) return new Response('Failed to read body', { status: 400 });

	if (!sessionTracks.has(gameSessionId)) {
		sessionTracks.set(gameSessionId, new Map());
	}
	sessionTracks.get(gameSessionId)!.set(trackId, {
		id: trackId,
		name: trackName,
		mimeType,
		data: new Uint8Array(arrayBuffer)
	});

	broadcastEventToSession(gameSessionId, 'track', { id: trackId, name: trackName });

	return new Response(null, { status: 204 });
};

// ---------------------------------------------------------------------------
// GET /api/mixer/track?session=<id>&id=<trackId> — viewer downloads a track
// ---------------------------------------------------------------------------
export const GET: RequestHandler = async ({ url }) => {
	const sessionId = url.searchParams.get('session');
	const trackId = url.searchParams.get('id');

	if (!sessionId) return new Response('Missing ?session= parameter', { status: 400 });
	if (!isValidSessionId(sessionId)) return new Response('Invalid session ID', { status: 400 });
	if (!trackId) return new Response('Missing ?id= parameter', { status: 400 });

	const track = sessionTracks.get(sessionId)?.get(trackId);
	if (!track) return new Response('Track not found', { status: 404 });

	return new Response(track.data.buffer as ArrayBuffer, {
		headers: {
			'Content-Type': track.mimeType,
			'Content-Disposition': 'inline',
			'Cache-Control': 'no-store'
		}
	});
};

// ---------------------------------------------------------------------------
// DELETE /api/mixer/track?id=<trackId> — DM removes a track
// ---------------------------------------------------------------------------
export const DELETE: RequestHandler = async ({ url, cookies }) => {
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

	const trackId = url.searchParams.get('id');
	if (!trackId) return new Response('Missing ?id= parameter', { status: 400 });

	sessionTracks.get(gameSessionId)?.delete(trackId);

	broadcastEventToSession(gameSessionId, 'trackRemoved', { id: trackId });

	return new Response(null, { status: 204 });
};
