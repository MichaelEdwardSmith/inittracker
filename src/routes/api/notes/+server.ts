// GET  /api/notes  — returns { notes: NoteEntry[] } for the active game session (newest first).
// POST /api/notes  — handles create / update / delete actions on note entries.
import type { RequestHandler } from '@sveltejs/kit';
import {
	listNotes,
	createNote,
	updateNote,
	deleteNote,
	getActiveGameSessionPublicId
} from '$lib/server/dmModel';
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
	if (!gameSessionId) return Response.json({ notes: [] });

	const notes = await listNotes(gameSessionId);
	return Response.json({ notes });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const authSessionId = cookies.get('dm_auth');
	if (!authSessionId) return new Response('Unauthorized', { status: 401 });

	const gameSessionId = await resolveGameSessionId(authSessionId);
	if (!gameSessionId) return new Response('No active session', { status: 400 });

	let body: { action: string; id?: string; content?: string };
	try {
		body = await request.json();
	} catch {
		return new Response('Invalid JSON', { status: 400 });
	}

	if (body.action === 'create') {
		const content = typeof body.content === 'string' ? body.content : '';
		if (content.length > 100_000) return new Response('Notes too large', { status: 413 });
		const note = await createNote(gameSessionId, content);
		return Response.json({ ok: true, note });
	}

	if (body.action === 'update') {
		if (typeof body.id !== 'string') return new Response('Missing id', { status: 400 });
		const content = typeof body.content === 'string' ? body.content : '';
		if (content.length > 100_000) return new Response('Notes too large', { status: 413 });
		await updateNote(gameSessionId, body.id, content);
		return Response.json({ ok: true });
	}

	if (body.action === 'delete') {
		if (typeof body.id !== 'string') return new Response('Missing id', { status: 400 });
		await deleteNote(gameSessionId, body.id);
		return Response.json({ ok: true });
	}

	return new Response('Invalid action', { status: 400 });
};
