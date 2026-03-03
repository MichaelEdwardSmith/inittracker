// Server load for /history (Combat Chronicles).
// Fetches the active game session's combat history from MongoDB and returns it newest-first.
import type { PageServerLoad } from './$types';
import { getCombatHistory } from '$lib/server/dmModel';

export const load: PageServerLoad = async ({ locals }) => {
	const gameSessionId = locals.gameSessionId ?? '';
	const history = await getCombatHistory(gameSessionId);
	// Return newest first
	return { records: [...history].reverse() };
};
