// POST /api/messages  — player sends a message to the DM (name + text); stored in memory, max 50.
// GET  /api/messages  — DM polls for messages for their active game session.
// DELETE /api/messages — DM clears all messages for their active game session.
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { addMessage, getMessages, clearMessages } from '$lib/server/messageStore';
import { authToGameSession } from '$lib/server/sessionCache';
import { getActiveGameSessionPublicId } from '$lib/server/dmModel';

async function resolveGameSessionId(authSessionId: string): Promise<string | null> {
	let id = authToGameSession.get(authSessionId) ?? null;
	if (!id) {
		id = await getActiveGameSessionPublicId(authSessionId);
		if (id) authToGameSession.set(authSessionId, id);
	}
	return id;
}

// POST — player sends a message (no auth; uses the public game session ID)
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const { sessionId, from, text } = body ?? {};
	if (!sessionId || !from?.trim() || !text?.trim()) {
		return new Response('Missing fields', { status: 400 });
	}
	addMessage(sessionId, from.trim(), text.trim());
	return json({ ok: true });
};

// GET — DM fetches their messages (auth via dm_auth cookie)
export const GET: RequestHandler = async ({ cookies }) => {
	const authSessionId = cookies.get('dm_auth');
	if (!authSessionId) return new Response('Unauthorized', { status: 401 });
	const gameSessionId = await resolveGameSessionId(authSessionId);
	if (!gameSessionId) return new Response('No active session', { status: 400 });
	return json(getMessages(gameSessionId));
};

// DELETE — DM clears all messages
export const DELETE: RequestHandler = async ({ cookies }) => {
	const authSessionId = cookies.get('dm_auth');
	if (!authSessionId) return new Response('Unauthorized', { status: 401 });
	const gameSessionId = await resolveGameSessionId(authSessionId);
	if (!gameSessionId) return new Response('No active session', { status: 400 });
	clearMessages(gameSessionId);
	return json({ ok: true });
};
