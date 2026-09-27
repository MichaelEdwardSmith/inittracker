// GET    /api/battlemap/library     — lists the authenticated DM's saved battle maps (metadata
//                                      only; image bytes are fetched separately, on demand).
// POST   /api/battlemap/library     — saves the currently active map (for the DM's active game
//                                      session) into the library under a given name.
// DELETE /api/battlemap/library?id= — deletes a saved map by id.
//
// Library-only feature: unlike the other /api/battlemap/* routes, there's no guest-DM fallback
// here — a reusable library is tied to a persistent Mongo-backed account.
import type { RequestHandler } from './$types';
import { resolveActingSessionId } from '$lib/server/auth';
import { resolveGameSessionId } from '$lib/server/sessionCache';
import {
	getSavedBattleMaps,
	saveBattleMapToLibrary,
	deleteSavedBattleMap
} from '$lib/server/dmModel';
import {
	sessionBattleMaps,
	sessionBattleMapViewStates,
	sessionBattleMapStrokes
} from '$lib/server/battleMapState';

export const GET: RequestHandler = async ({ cookies }) => {
	const authSessionId = await resolveActingSessionId(cookies);
	if (!authSessionId) return new Response('Unauthorized', { status: 401 });

	const maps = await getSavedBattleMaps(authSessionId);
	return Response.json(maps);
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const authSessionId = await resolveActingSessionId(cookies);
	if (!authSessionId) return new Response('Unauthorized', { status: 401 });

	const gameSessionId = await resolveGameSessionId(authSessionId);
	if (!gameSessionId) return new Response('No active session', { status: 400 });

	const image = sessionBattleMaps.get(gameSessionId);
	const viewState = sessionBattleMapViewStates.get(gameSessionId);
	if (!image || !viewState) return new Response('No map prepared', { status: 400 });

	const body = await request.json().catch(() => null);
	if (!body || typeof body.name !== 'string' || !body.name.trim()) {
		return Response.json({ error: 'Name is required.' }, { status: 400 });
	}

	const saved = await saveBattleMapToLibrary(authSessionId, {
		name: body.name.trim().slice(0, 100),
		mimeType: image.mimeType,
		data: image.data,
		naturalWidth: viewState.naturalWidth,
		naturalHeight: viewState.naturalHeight,
		gridSquaresAcross: viewState.gridSquaresAcross,
		gridSquaresDown: viewState.gridSquaresDown,
		feetPerSquare: viewState.feetPerSquare,
		strokes: sessionBattleMapStrokes.get(gameSessionId) ?? []
	});
	if (!saved) {
		return Response.json(
			{ error: 'Library is full — delete a saved map before saving another.' },
			{ status: 400 }
		);
	}

	return Response.json(saved, { status: 201 });
};

export const DELETE: RequestHandler = async ({ url, cookies }) => {
	const authSessionId = await resolveActingSessionId(cookies);
	if (!authSessionId) return new Response('Unauthorized', { status: 401 });

	const id = url.searchParams.get('id');
	if (!id) return Response.json({ error: 'id is required.' }, { status: 400 });

	await deleteSavedBattleMap(authSessionId, id);
	return new Response(null, { status: 204 });
};
