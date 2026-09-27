// POST /api/battlemap/library/load — makes a saved library map the active map for the DM's
// active game session. Mirrors POST /api/battlemap/image (same viewState shape, same reset of
// tokens/ruler) but sources image bytes from the library instead of the request body, and
// restores that map's saved strokes instead of clearing them.
import type { RequestHandler } from './$types';
import { resolveActingSessionId } from '$lib/server/auth';
import { resolveGameSessionId } from '$lib/server/sessionCache';
import { getSavedBattleMapForLoad } from '$lib/server/dmModel';
import {
	sessionBattleMaps,
	sessionBattleMapViewStates,
	sessionBattleMapStrokes,
	clearBattleMapSession
} from '$lib/server/battleMapState';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const authSessionId = await resolveActingSessionId(cookies);
	if (!authSessionId) return new Response('Unauthorized', { status: 401 });

	const gameSessionId = await resolveGameSessionId(authSessionId);
	if (!gameSessionId) return new Response('No active session', { status: 400 });

	const body = await request.json().catch(() => null);
	const id = body && typeof body.id === 'string' ? body.id : null;
	if (!id) return Response.json({ error: 'id is required.' }, { status: 400 });

	const saved = await getSavedBattleMapForLoad(authSessionId, id);
	if (!saved) return new Response('Saved map not found', { status: 404 });

	const mapId = crypto.randomUUID();
	clearBattleMapSession(gameSessionId);
	sessionBattleMaps.set(gameSessionId, {
		id: mapId,
		name: saved.name,
		mimeType: saved.mimeType,
		data: new Uint8Array(saved.data.buffer)
	});
	const viewState = {
		id: mapId,
		name: saved.name,
		naturalWidth: saved.naturalWidth,
		naturalHeight: saved.naturalHeight,
		gridSquaresAcross: saved.gridSquaresAcross,
		gridSquaresDown: saved.gridSquaresDown,
		feetPerSquare: saved.feetPerSquare,
		showGrid: true,
		// Starts hidden — same as a fresh upload — so loading from the library never flashes
		// onto the player display before the DM is ready.
		visible: false
	};
	sessionBattleMapViewStates.set(gameSessionId, viewState);
	const strokes = saved.strokes ?? [];
	sessionBattleMapStrokes.set(gameSessionId, strokes);

	// Not broadcast here — the map starts hidden, and a previous map may still be visible to
	// players at this exact moment. Broadcasting these strokes now would flash them onto the
	// still-showing old map. The DM's client re-sends them (via POST /api/battlemap/draw) once
	// this map is actually revealed with "Show to Players".
	return Response.json({ ...viewState, strokes });
};
