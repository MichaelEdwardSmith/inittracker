// Client-only load for /overlay/[sessionId].
// SSR is disabled because the page opens an EventSource (browser-only).
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = ({ params }) => {
	return { sessionId: params.sessionId };
};
