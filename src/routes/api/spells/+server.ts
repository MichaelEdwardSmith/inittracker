// GET /api/spells — returns the combined PHB + XGE + TCE spell list from 5etools.
// Fetches on first request, caches in module-level memory for subsequent requests.
// Requires a valid dm_auth cookie (DM-only endpoint).
import type { RequestHandler } from './$types';
import type { Spell5e } from '$lib/types';

let cache: Spell5e[] | null = null;

const SOURCES = [
	'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data/spells/spells-phb.json',
	'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data/spells/spells-xge.json',
	'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data/spells/spells-tce.json'
];

export const GET: RequestHandler = async ({ cookies }) => {
	// Require DM auth
	const sessionId = cookies.get('dm_auth');
	if (!sessionId) {
		return new Response('Unauthorized', { status: 401 });
	}

	if (!cache) {
		const results = await Promise.all(
			SOURCES.map(async (url) => {
				const res = await fetch(url);
				if (!res.ok) return [] as Spell5e[];
				const data = (await res.json()) as { spell?: Spell5e[] };
				return data.spell ?? [];
			})
		);
		const all = results.flat();
		all.sort((a, b) => a.name.localeCompare(b.name));
		cache = all;
	}

	return Response.json({ spells: cache });
};
