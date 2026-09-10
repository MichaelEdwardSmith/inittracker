// Server logic for /player/verify-email/[token]. Verification happens on the POST action, not on
// page load — see the DM equivalent's comment for why (mail link-scanners prefetch GETs).
import type { Actions } from './$types';
import { verifyPlayerEmailToken } from '$lib/server/playerModel';

export const actions: Actions = {
	default: async ({ params }) => {
		return await verifyPlayerEmailToken(params.token);
	}
};
