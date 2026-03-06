// GET  /api/notes  — returns { notes: string } for the active game session.
// POST /api/notes  — saves notes (max 100k chars); returns { ok: true }.
import type { RequestHandler } from '@sveltejs/kit';
import { getSessionNotes, saveSessionNotes, getActiveGameSessionPublicId } from '$lib/server/dmModel';
import { authToGameSession } from '$lib/server/sessionCache';

async function resolveGameSessionId(authSessionId: string): Promise<string | null> {
	let gameSessionId = authToGameSession.get(authSessionId) ?? null;
	if (!gameSessionId) {
		gameSessionId = await getActiveGameSessionPublicId(authSessionId);
		if (gameSessionId) authToGameSession.set(authSessionId, gameSessionId);
	}
	return gameSessionId;
}

export const GET: RequestHandler = async ({ cookies }) => {
	const authSessionId = cookies.get('dm_auth');
	if (!authSessionId) return new Response('Unauthorized', { status: 401 });

	const gameSessionId = await resolveGameSessionId(authSessionId);
	if (!gameSessionId) return Response.json({ notes: '' });

	const notes = await getSessionNotes(gameSessionId);
	return Response.json({ notes });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const authSessionId = cookies.get('dm_auth');
	if (!authSessionId) return new Response('Unauthorized', { status: 401 });

	const gameSessionId = await resolveGameSessionId(authSessionId);
	if (!gameSessionId) return new Response('No active session', { status: 400 });

	let body: { notes: unknown };
	try {
		body = await request.json();
	} catch {
		return new Response('Invalid JSON', { status: 400 });
	}

	if (typeof body.notes !== 'string') {
		return new Response('Invalid notes', { status: 400 });
	}
	if (body.notes.length > 100_000) {
		return new Response('Notes too large', { status: 413 });
	}

	await saveSessionNotes(gameSessionId, body.notes);
	return Response.json({ ok: true });
};
