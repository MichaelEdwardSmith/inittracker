import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	return {
		sessionId: locals.sessionId ?? '',
		dmFirstName: locals.dmFirstName ?? ''
	};
};
