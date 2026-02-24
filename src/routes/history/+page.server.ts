import type { PageServerLoad } from './$types';
import { getCombatHistory } from '$lib/server/dmModel';

export const load: PageServerLoad = async ({ locals }) => {
	const sessionId = locals.sessionId ?? '';
	const history = await getCombatHistory(sessionId);
	// Return newest first
	return { records: [...history].reverse() };
};
