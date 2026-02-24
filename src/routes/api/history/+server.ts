import type { RequestHandler } from '@sveltejs/kit';
import { saveCombatRecord, getCombatHistory, deleteCombatRecord, clearCombatHistory } from '$lib/server/dmModel';
import type { CombatRecord } from '$lib/types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const sessionId = cookies.get('dm_auth');
	if (!sessionId) return new Response('Unauthorized', { status: 401 });

	let record: CombatRecord;
	try {
		record = await request.json();
	} catch {
		return new Response('Invalid JSON', { status: 400 });
	}

	if (!record?.id || !record?.startedAt || !Array.isArray(record?.participants)) {
		return new Response('Invalid record', { status: 400 });
	}

	await saveCombatRecord(sessionId, record);
	return new Response(null, { status: 204 });
};

export const DELETE: RequestHandler = async ({ url, cookies }) => {
	const sessionId = cookies.get('dm_auth');
	if (!sessionId) return new Response('Unauthorized', { status: 401 });

	const id = url.searchParams.get('id');
	if (id) {
		await deleteCombatRecord(sessionId, id);
	} else {
		await clearCombatHistory(sessionId);
	}
	return new Response(null, { status: 204 });
};

export const GET: RequestHandler = async ({ cookies }) => {
	const sessionId = cookies.get('dm_auth');
	if (!sessionId) return new Response('Unauthorized', { status: 401 });

	const history = await getCombatHistory(sessionId);
	return Response.json(history);
};
