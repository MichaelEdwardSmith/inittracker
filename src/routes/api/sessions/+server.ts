// GET  /api/sessions         — returns all game sessions for the authenticated DM plus the active one.
// POST /api/sessions         — session management; body must include { action } where action is one of:
//   'create'  — creates a new game session with a fresh 6-char public ID.
//   'rename'  — renames an existing session by its internal UUID (id).
//   'delete'  — deletes a session; refuses if it would be the last one.
//   'switch'  — makes a session active and updates the shared auth→session cache.
import type { RequestHandler } from '@sveltejs/kit';
import {
	listGameSessions,
	createGameSession,
	renameGameSession,
	deleteGameSession,
	switchActiveGameSession,
	getActiveGameSessionPublicId
} from '$lib/server/dmModel';
import { authToGameSession } from '$lib/server/sessionCache';

// ---------------------------------------------------------------------------
// GET /api/sessions — list all game sessions for the authenticated DM
// ---------------------------------------------------------------------------
export const GET: RequestHandler = async ({ cookies }) => {
	const authSessionId = cookies.get('dm_auth');
	if (!authSessionId) return new Response('Unauthorized', { status: 401 });

	const sessions = await listGameSessions(authSessionId);
	const activeId = authToGameSession.get(authSessionId) ?? (await getActiveGameSessionPublicId(authSessionId));
	const activeSession = sessions.find((s) => s.sessionId === activeId) ?? sessions[0] ?? null;

	return Response.json({ sessions, activeGameSessionId: activeSession?.id ?? null });
};

// ---------------------------------------------------------------------------
// POST /api/sessions — session management actions
// Body: { action: 'create' | 'rename' | 'delete' | 'switch', id?, name? }
// ---------------------------------------------------------------------------
export const POST: RequestHandler = async ({ request, cookies }) => {
	const authSessionId = cookies.get('dm_auth');
	if (!authSessionId) return new Response('Unauthorized', { status: 401 });

	let body: { action: string; id?: string; name?: string };
	try {
		body = await request.json();
	} catch {
		return new Response('Invalid JSON', { status: 400 });
	}

	const { action, id, name } = body;

	switch (action) {
		case 'create': {
			const result = await createGameSession(authSessionId, name ?? '');
			if (!result) return new Response('Failed to create session', { status: 500 });
			return Response.json(result, { status: 201 });
		}

		case 'rename': {
			if (!id) return new Response('Missing id', { status: 400 });
			const ok = await renameGameSession(authSessionId, id, name ?? '');
			return ok ? new Response(null, { status: 200 }) : new Response('Not found', { status: 404 });
		}

		case 'delete': {
			if (!id) return new Response('Missing id', { status: 400 });
			const result = await deleteGameSession(authSessionId, id);
			if (!result.ok) {
				return new Response(result.error ?? 'Delete failed', {
					status: result.error === 'Cannot delete the last session' ? 400 : 404
				});
			}
			// If the deleted session was the cached active one, clear the cache entry
			// so the next request re-resolves from DB.
			authToGameSession.delete(authSessionId);
			return new Response(null, { status: 200 });
		}

		case 'switch': {
			if (!id) return new Response('Missing id', { status: 400 });
			const newPublicId = await switchActiveGameSession(authSessionId, id);
			if (!newPublicId) return new Response('Session not found', { status: 404 });
			// Update the shared cache so POST /api/state immediately uses the new session
			authToGameSession.set(authSessionId, newPublicId);
			return Response.json({ sessionId: newPublicId });
		}

		default:
			return new Response('Unknown action', { status: 400 });
	}
};
