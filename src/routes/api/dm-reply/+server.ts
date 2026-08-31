// POST /api/dm-reply — DM sends a message to a specific player (or all players).
// Requires dm_auth cookie. Broadcasts a 'dmMessage' SSE event to all viewers
// in the session so the targeted player(s) can receive it in real time.
import type { RequestHandler } from './$types';
import { resolveActingSessionId } from '$lib/server/auth';
import { getActiveGameSessionPublicId } from '$lib/server/dmModel';
import { authToGameSession } from '$lib/server/sessionCache';
import { broadcastEventToSession } from '$lib/server/sseState';
import { addReply, getReplies } from '$lib/server/dmReplyStore';
import { isValidSessionId } from '$lib/server/validate';

async function resolveGameSessionId(authSessionId: string): Promise<string | null> {
	let id = authToGameSession.get(authSessionId) ?? null;
	if (!id) {
		id = await getActiveGameSessionPublicId(authSessionId);
		if (id) authToGameSession.set(authSessionId, id);
	}
	return id;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	const authSessionId = await resolveActingSessionId(cookies);
	if (!authSessionId) return new Response('Unauthorized', { status: 401 });

	const gameSessionId = await resolveGameSessionId(authSessionId);
	if (!gameSessionId) return new Response('No active session', { status: 400 });

	let body: { to: string; text: string };
	try {
		body = await request.json();
	} catch {
		return new Response('Invalid JSON', { status: 400 });
	}

	const to = typeof body.to === 'string' ? body.to.trim() : '';
	const text = typeof body.text === 'string' ? body.text.trim() : '';

	if (!to || !text) return new Response('Missing to or text', { status: 400 });
	if (text.length > 2000) return new Response('Message too long', { status: 413 });

	const reply = addReply(gameSessionId, to, text);

	// Broadcast to all viewers — each viewer decides if the message is for them
	broadcastEventToSession(gameSessionId, 'dmMessage', {
		id: reply.id,
		to: reply.to,
		text: reply.text,
		timestamp: reply.timestamp
	});

	return Response.json({ ok: true });
};

export const GET: RequestHandler = async ({ cookies }) => {
	const authSessionId = await resolveActingSessionId(cookies);
	if (!authSessionId) return new Response('Unauthorized', { status: 401 });

	const gameSessionId = await resolveGameSessionId(authSessionId);
	if (!gameSessionId) return Response.json([]);

	return Response.json(getReplies(gameSessionId));
};
