// Server logic for /verify-email/[token] (DM). Verification happens on the POST action, not on
// page load — a GET here must have no side effects, since mail providers' link-scanners/security
// prefetchers fetch links in incoming email automatically and would otherwise burn the token
// before the user ever clicks it (observed in testing: IONOS did exactly this).
import type { Actions } from './$types';
import { verifyEmailToken } from '$lib/server/dmModel';

export const actions: Actions = {
	default: async ({ params }) => {
		return await verifyEmailToken(params.token);
	}
};
