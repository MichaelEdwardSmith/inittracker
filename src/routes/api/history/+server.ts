import type { RequestHandler } from '@sveltejs/kit';
import {
	saveCombatRecord,
	getCombatHistory,
	deleteCombatRecord,
	clearCombatHistory,
	getActiveGameSessionPublicId
} from '$lib/server/dmModel';
import { authToGameSession } from '$lib/server/sessionCache';
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
	if (!authSessionId) return new Response('Unauthorized', { status: 401 });

	const gameSessionId = await resolveGameSessionId(authSessionId);
	if (!gameSessionId) return new Response('No active session', { status: 400 });

	let record: CombatRecord;
	try {
		record = await request.json();
	} catch {
		return new Response('Invalid JSON', { status: 400 });
	}

	if (!record?.id || !record?.startedAt || !Array.isArray(record?.participants)) {
		return new Response('Invalid record', { status: 400 });
	}

	await saveCombatRecord(gameSessionId, record);
	return new Response(null, { status: 204 });
};

export const DELETE: RequestHandler = async ({ url, cookies }) => {
	const authSessionId = cookies.get('dm_auth');
	if (!authSessionId) return new Response('Unauthorized', { status: 401 });

	const gameSessionId = await resolveGameSessionId(authSessionId);
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
	if (!authSessionId) return new Response('Unauthorized', { status: 401 });

	const gameSessionId = await resolveGameSessionId(authSessionId);
	if (!gameSessionId) return Response.json([]);

	const history = await getCombatHistory(gameSessionId);
	return Response.json(history);
};
