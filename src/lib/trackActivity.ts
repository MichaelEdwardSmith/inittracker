// Client-side fire-and-forget hook for the admin usage log (see POST /api/activity). Never
// throws or blocks the UI — a failed log entry is not worth interrupting a DM mid-combat.
import { browser } from '$app/environment';
import type { ActivityFeature } from './activity';

export function trackActivity(feature: ActivityFeature, detail?: string): void {
	if (!browser) return;
	fetch('/api/activity', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ feature, detail }),
		keepalive: true
	}).catch(() => {
		/* silent */
	});
}
