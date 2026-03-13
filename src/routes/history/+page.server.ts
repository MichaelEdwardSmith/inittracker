// Server load for /history (Combat Chronicles).
// Fetches the active game session's combat history — from MongoDB for authenticated DMs,
// or from the in-memory guestHistory map for guest sessions.
import type { PageServerLoad } from './$types';
import { getCombatHistory } from '$lib/server/dmModel';
import { guestHistory } from '$lib/server/sseState';

export const load: PageServerLoad = async ({ locals }) => {
	const gameSessionId = locals.gameSessionId ?? '';

	const history = locals.isGuest
		? (guestHistory.get(gameSessionId) ?? [])
		: await getCombatHistory(gameSessionId);

	// Return newest first
	return { records: [...history].reverse() };
};
