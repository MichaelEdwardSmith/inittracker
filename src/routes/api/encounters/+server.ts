// GET  /api/encounters        — returns all saved encounters for the authenticated DM.
// POST /api/encounters        — creates a new encounter; validates name and enemies array.
// DELETE /api/encounters?id=  — deletes an encounter by id.
import type { RequestEvent } from '@sveltejs/kit';
import type { Encounter, EncounterEnemy } from '$lib/types';
import { getEncounters, saveEncounter, deleteEncounter } from '$lib/server/dmModel';

export async function GET({ cookies }: RequestEvent) {
	const sessionId = cookies.get('dm_auth');
	if (!sessionId) return new Response('Unauthorized', { status: 401 });

	const encounters = await getEncounters(sessionId);
	return Response.json(encounters);
}

export async function POST({ request, cookies }: RequestEvent) {
	const sessionId = cookies.get('dm_auth');
	if (!sessionId) return new Response('Unauthorized', { status: 401 });

	const body = await request.json().catch(() => null);
	if (!body || typeof body.name !== 'string' || !body.name.trim()) {
		return Response.json({ error: 'Name is required.' }, { status: 400 });
	}
	if (!Array.isArray(body.enemies) || body.enemies.length === 0) {
		return Response.json({ error: 'At least one enemy is required.' }, { status: 400 });
	}

	const enemies: EncounterEnemy[] = body.enemies.map((e: EncounterEnemy) => ({
		templateName: String(e.templateName).slice(0, 200),
		quantity: Math.max(1, Math.round(Number(e.quantity) || 1))
	}));

	const encounter: Encounter = {
		id: crypto.randomUUID(),
		name: body.name.trim().slice(0, 100),
		enemies,
		createdAt: new Date().toISOString()
	};

	await saveEncounter(sessionId, encounter);
	return Response.json(encounter, { status: 201 });
}

export async function DELETE({ url, cookies }: RequestEvent) {
	const sessionId = cookies.get('dm_auth');
	if (!sessionId) return new Response('Unauthorized', { status: 401 });

	const id = url.searchParams.get('id');
	if (!id) return Response.json({ error: 'id is required.' }, { status: 400 });

	await deleteEncounter(sessionId, id);
	return new Response(null, { status: 204 });
}
