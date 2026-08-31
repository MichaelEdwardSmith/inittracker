// GET /api/spells2024 — returns the 2024 D&D spell list from the bundled JSON.
// Requires a valid dm_auth cookie (DM-only endpoint).
import type { RequestHandler } from './$types';
import { resolveActingSessionId } from '$lib/server/auth';
import type { Spell2024 } from '$lib/types';
import spells from '$lib/data/spells-2024.json';

const sorted = (spells as Spell2024[]).slice().sort((a, b) => a.name.localeCompare(b.name));

export const GET: RequestHandler = async ({ cookies }) => {
	if (!(await resolveActingSessionId(cookies))) {
		return new Response('Unauthorized', { status: 401 });
	}
	return Response.json({ spells: sorted });
};
