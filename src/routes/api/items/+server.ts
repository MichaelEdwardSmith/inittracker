// GET /api/items — returns the item reference list (weapons, armor, gear, tools,
// mounts/vehicles, equipment packs, and magic items) from the bundled JSON.
// Requires a valid dm_auth cookie (DM-only endpoint).
import type { RequestHandler } from './$types';
import { resolveActingSessionId } from '$lib/server/auth';
import type { Item } from '$lib/types';
import items from '$lib/data/items.json';

const sorted = (items as Item[]).slice().sort((a, b) => a.name.localeCompare(b.name));

export const GET: RequestHandler = async ({ cookies }) => {
	if (!(await resolveActingSessionId(cookies))) {
		return new Response('Unauthorized', { status: 401 });
	}
	return Response.json({ items: sorted });
};
