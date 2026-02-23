import type { PageLoad } from './$types';

// EventSource is browser-only — disable SSR for this page
export const ssr = false;

export const load: PageLoad = ({ params }) => {
	return { sessionId: params.sessionId };
};
