// POST   /api/history             — saves a CombatRecord to the active session's history (max 100 kept).
// GET    /api/history             — returns all combat records for the active session.
// DELETE /api/history             — deletes all records, or a single record when ?id= is provided.
import type { RequestHandler } from '@sveltejs/kit';
import {
	saveCombatRecord,
	getCombatHistory,
	deleteCombatRecord,
	clearCombatHistory,
	getActiveGameSessionPublicId
} from '$lib/server/dmModel';
import { authToGameSession } from '$lib/server/sessionCache';
import { guestHistory } from '$lib/server/sseState';
import { isValidSessionId } from '$lib/server/validate';
import type { CombatRecord } from '$lib/types';

async function resolveGameSessionId(authSessionId: string): Promise<string | null> {
	let gameSessionId = authToGameSession.get(authSessionId) ?? null;
	if (!gameSessionId) {
		gameSessionId = await getActiveGameSessionPublicId(authSessionId);
		if (gameSessionId) authToGameSession.set(authSessionId, gameSessionId);
	}
	return gameSessionId;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	const authSessionId = cookies.get('dm_auth');
	const guestSessionId = cookies.get('dm_guest');

	if (!authSessionId && !guestSessionId) return new Response('Unauthorized', { status: 401 });

	let record: CombatRecord;
	try {
		record = await request.json();
	} catch {
		return new Response('Invalid JSON', { status: 400 });
	}

	if (!record?.id || !record?.startedAt || !Array.isArray(record?.participants)) {
		return new Response('Invalid record', { status: 400 });
	}

	if (!authSessionId && guestSessionId && isValidSessionId(guestSessionId)) {
		const records = guestHistory.get(guestSessionId) ?? [];
		records.push(record);
		if (records.length > 100) records.splice(0, records.length - 100);
		guestHistory.set(guestSessionId, records);
		return new Response(null, { status: 204 });
	}

	const gameSessionId = await resolveGameSessionId(authSessionId!);
	if (!gameSessionId) return new Response('No active session', { status: 400 });

	await saveCombatRecord(gameSessionId, record);
	return new Response(null, { status: 204 });
};

export const DELETE: RequestHandler = async ({ url, cookies }) => {
	const authSessionId = cookies.get('dm_auth');
	const guestSessionId = cookies.get('dm_guest');

	if (!authSessionId && !guestSessionId) return new Response('Unauthorized', { status: 401 });

	if (!authSessionId && guestSessionId && isValidSessionId(guestSessionId)) {
		const id = url.searchParams.get('id');
		if (id) {
			const records = guestHistory.get(guestSessionId) ?? [];
			guestHistory.set(guestSessionId, records.filter((r) => r.id !== id));
		} else {
			guestHistory.delete(guestSessionId);
		}
		return new Response(null, { status: 204 });
	}

	const gameSessionId = await resolveGameSessionId(authSessionId!);
	if (!gameSessionId) return new Response('No active session', { status: 400 });

	const id = url.searchParams.get('id');
	if (id) {
		await deleteCombatRecord(gameSessionId, id);
	} else {
		await clearCombatHistory(gameSessionId);
	}
	return new Response(null, { status: 204 });
};

export const GET: RequestHandler = async ({ cookies }) => {
	const authSessionId = cookies.get('dm_auth');
	const guestSessionId = cookies.get('dm_guest');

	if (!authSessionId && guestSessionId && isValidSessionId(guestSessionId)) {
		return Response.json(guestHistory.get(guestSessionId) ?? []);
	}

	if (!authSessionId) return new Response('Unauthorized', { status: 401 });

	const gameSessionId = await resolveGameSessionId(authSessionId);
	if (!gameSessionId) return Response.json([]);

	const history = await getCombatHistory(gameSessionId);
	return Response.json(history);
};
