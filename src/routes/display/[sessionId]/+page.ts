// Client-only load for /display/[sessionId].
// SSR is disabled because the page opens an EventSource (browser-only).
// Passes the sessionId URL param down to the page component.
import type { PageLoad } from './$types';

// EventSource is browser-only — disable SSR for this page
export const ssr = false;

export const load: PageLoad = ({ params }) => {
	return { sessionId: params.sessionId };
};
