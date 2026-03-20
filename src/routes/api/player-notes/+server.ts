// GET  /api/player-notes — returns { notes: NoteEntry[] } for the logged-in player.
// POST /api/player-notes — handles create / update / delete actions.
import type { RequestHandler } from './$types';
import {
	listPlayerNotes,
	createPlayerNote,
	updatePlayerNote,
	deletePlayerNote
} from '$lib/server/playerModel';

export const GET: RequestHandler = async ({ cookies }) => {
	const playerSessionId = cookies.get('player_auth');
	if (!playerSessionId) return new Response('Unauthorized', { status: 401 });

	const notes = await listPlayerNotes(playerSessionId);
	return Response.json({ notes });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const playerSessionId = cookies.get('player_auth');
	if (!playerSessionId) return new Response('Unauthorized', { status: 401 });

	let body: { action: string; id?: string; content?: string };
	try {
		body = await request.json();
	} catch {
		return new Response('Invalid JSON', { status: 400 });
	}

	if (body.action === 'create') {
		const content = typeof body.content === 'string' ? body.content : '';
		if (content.length > 100_000) return new Response('Notes too large', { status: 413 });
		const note = await createPlayerNote(playerSessionId, content);
		return Response.json({ ok: true, note });
	}

	if (body.action === 'update') {
		if (typeof body.id !== 'string') return new Response('Missing id', { status: 400 });
		const content = typeof body.content === 'string' ? body.content : '';
		if (content.length > 100_000) return new Response('Notes too large', { status: 413 });
		await updatePlayerNote(playerSessionId, body.id, content);
		return Response.json({ ok: true });
	}

	if (body.action === 'delete') {
		if (typeof body.id !== 'string') return new Response('Missing id', { status: 400 });
		await deletePlayerNote(playerSessionId, body.id);
		return Response.json({ ok: true });
	}

	return new Response('Invalid action', { status: 400 });
};
