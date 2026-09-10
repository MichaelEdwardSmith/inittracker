// Server logic for /unsubscribe/[token] — the link at the bottom of every admin broadcast email.
// Unsubscribing happens on the POST action, not on page load — see the verify-email route's
// comment for why (mail providers' link-scanners prefetch GETs and would silently unsubscribe
// people who never clicked anything). load() only does a read-only lookup to show whose address
// this is before they confirm.
import type { Actions, PageServerLoad } from './$types';
import { getEmailByUnsubscribeToken, unsubscribeByToken } from '$lib/server/dmModel';

export const load: PageServerLoad = async ({ params }) => {
	const email = await getEmailByUnsubscribeToken(params.token);
	return { email };
};

export const actions: Actions = {
	default: async ({ params }) => {
		return await unsubscribeByToken(params.token);
	}
};
