// WCAG 2.1.1: a scrollable area with no focusable content can't be scrolled from the keyboard.
// This watches the DOM and makes such areas focusable (tabindex=0, labelled region) so arrow
// keys / Page Up / Page Down work. Returns a cleanup function; call from the root layout.
const FOCUSABLE =
	'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';

const CANDIDATES = '[class*="overflow-y-auto"],[class*="overflow-auto"],[class*="overflow-x-auto"]';

function scan() {
	for (const el of document.querySelectorAll<HTMLElement>(CANDIDATES)) {
		if (el.dataset.scrollRegion === 'managed') {
			const scrollable =
				el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
			if (!scrollable) {
				el.removeAttribute('tabindex');
				el.removeAttribute('role');
				el.removeAttribute('aria-label');
				delete el.dataset.scrollRegion;
			}
			continue;
		}
		if (el.hasAttribute('tabindex') || el.hasAttribute('contenteditable')) continue;
		if (el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1) continue;
		if (
			Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).some(
				(f) => f.getClientRects().length > 0
			)
		)
			continue;
		const label =
			el.closest('[role="dialog"]')?.getAttribute('aria-label') ??
			el.closest('[aria-label]')?.getAttribute('aria-label');
		el.setAttribute('tabindex', '0');
		if (!el.hasAttribute('role')) el.setAttribute('role', 'region');
		if (!el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby'))
			el.setAttribute('aria-label', label ? `${label} content` : 'Scrollable content');
		el.dataset.scrollRegion = 'managed';
	}
}

export function startScrollRegions(): () => void {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const schedule = () => {
		clearTimeout(timer);
		timer = setTimeout(scan, 400);
	};
	const observer = new MutationObserver(schedule);
	observer.observe(document.body, { childList: true, subtree: true });
	window.addEventListener('resize', schedule);
	schedule();
	return () => {
		clearTimeout(timer);
		observer.disconnect();
		window.removeEventListener('resize', schedule);
	};
}
