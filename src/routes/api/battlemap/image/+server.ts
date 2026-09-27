// POST   /api/battlemap/image — DM uploads a map image (bytes held in memory only). Replaces any
//                                prior map for this session and clears its tokens/ruler.
// GET    /api/battlemap/image — viewer/DM downloads the current map image by session + map id.
// DELETE /api/battlemap/image — DM removes the current map entirely and broadcasts the removal.
import type { RequestHandler } from './$types';
import type { Cookies } from '@sveltejs/kit';
import { resolveActingSessionId } from '$lib/server/auth';
import { isValidSessionId } from '$lib/server/validate';
import { authToGameSession } from '$lib/server/sessionCache';
import { getActiveGameSessionPublicId } from '$lib/server/dmModel';
import {
	sessionBattleMaps,
	sessionBattleMapViewStates,
	clearBattleMapSession
} from '$lib/server/battleMapState';
import { broadcastEventToSession } from '$lib/server/sseState';

const MAX_IMAGE_BYTES = 15_000_000; // ~15 MB — a detailed battle map is bigger than a doc page

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
// POST /api/battlemap/image — DM uploads a map image
// ---------------------------------------------------------------------------
export const POST: RequestHandler = async ({ request, cookies }) => {
	const resolved = await resolveDmGameSession(cookies);
	if ('error' in resolved) return resolved.error;
	const { gameSessionId } = resolved;

	const rawName = request.headers.get('X-Map-Name');
	const name = rawName
		? (() => {
				try {
					return decodeURIComponent(rawName);
				} catch {
					return rawName;
				}
			})()
		: 'Battle Map';
	const naturalWidth = parseInt(request.headers.get('X-Map-Width') ?? '', 10);
	const naturalHeight = parseInt(request.headers.get('X-Map-Height') ?? '', 10);
	const mimeType = request.headers.get('Content-Type') ?? 'application/octet-stream';

	if (!Number.isInteger(naturalWidth) || naturalWidth < 1 || naturalWidth > 20000) {
		return new Response('Invalid map width', { status: 400 });
	}
	if (!Number.isInteger(naturalHeight) || naturalHeight < 1 || naturalHeight > 20000) {
		return new Response('Invalid map height', { status: 400 });
	}

	// A generated blank battlemat can request an exact starting grid (so it fills the mat with
	// no leftover space) instead of the aspect-ratio-derived default below — a real photo upload
	// never sends these, and falls back to the usual default.
	const requestedAcross = parseInt(request.headers.get('X-Grid-Across') ?? '', 10);
	const requestedDown = parseInt(request.headers.get('X-Grid-Down') ?? '', 10);
	const hasRequestedGrid =
		Number.isInteger(requestedAcross) &&
		requestedAcross >= 1 &&
		requestedAcross <= 200 &&
		Number.isInteger(requestedDown) &&
		requestedDown >= 1 &&
		requestedDown <= 200;

	const arrayBuffer = await request.arrayBuffer().catch(() => null);
	if (!arrayBuffer) return new Response('Failed to read body', { status: 400 });
	if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
		return new Response('Image too large', { status: 413 });
	}

	const id = crypto.randomUUID();
	const gridSquaresAcross = hasRequestedGrid ? requestedAcross : 20;
	// Starting rows match the image's own aspect ratio so cells default to square; the DM can
	// then adjust either dimension independently.
	const gridSquaresDown = hasRequestedGrid
		? requestedDown
		: Math.max(1, Math.round((gridSquaresAcross * naturalHeight) / naturalWidth));

	clearBattleMapSession(gameSessionId);
	sessionBattleMaps.set(gameSessionId, { id, name, mimeType, data: new Uint8Array(arrayBuffer) });
	const viewState = {
		id,
		name,
		naturalWidth,
		naturalHeight,
		gridSquaresAcross,
		gridSquaresDown,
		feetPerSquare: 5,
		showGrid: true,
		// Starts hidden so a fresh upload never flashes onto the player display mid-transfer.
		visible: false
	};
	sessionBattleMapViewStates.set(gameSessionId, viewState);

	return Response.json(viewState);
};

// ---------------------------------------------------------------------------
// GET /api/battlemap/image?session=<id>&id=<mapId> — download the map's image bytes
// ---------------------------------------------------------------------------
export const GET: RequestHandler = async ({ url }) => {
	const sessionId = url.searchParams.get('session');
	const mapId = url.searchParams.get('id');

	if (!sessionId) return new Response('Missing ?session= parameter', { status: 400 });
	if (!isValidSessionId(sessionId)) return new Response('Invalid session ID', { status: 400 });
	if (!mapId) return new Response('Missing ?id= parameter', { status: 400 });

	const map = sessionBattleMaps.get(sessionId);
	if (!map || map.id !== mapId) return new Response('Map not found', { status: 404 });

	return new Response(map.data.buffer as ArrayBuffer, {
		headers: {
			'Content-Type': map.mimeType,
			'Content-Disposition': 'inline',
			'Cache-Control': 'no-store'
		}
	});
};

// ---------------------------------------------------------------------------
// DELETE /api/battlemap/image — DM removes the current map entirely
// ---------------------------------------------------------------------------
export const DELETE: RequestHandler = async ({ cookies }) => {
	const resolved = await resolveDmGameSession(cookies);
	if ('error' in resolved) return resolved.error;
	const { gameSessionId } = resolved;

	clearBattleMapSession(gameSessionId);
	broadcastEventToSession(gameSessionId, 'battleMapRemoved', {});

	return new Response(null, { status: 204 });
};
