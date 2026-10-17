// Global screen-reader announcer. Rendered once in the root layout as aria-live regions.
// Call announce('...') from anywhere on the client; repeated identical messages are still
// re-announced because the text is briefly cleared first.
export const announcer = $state({ polite: '', assertive: '' });

const timers: Record<'polite' | 'assertive', ReturnType<typeof setTimeout> | undefined> = {
	polite: undefined,
	assertive: undefined
};

export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
	if (typeof window === 'undefined' || !message) return;
	clearTimeout(timers[priority]);
	announcer[priority] = '';
	timers[priority] = setTimeout(() => {
		announcer[priority] = message;
	}, 50);
}
