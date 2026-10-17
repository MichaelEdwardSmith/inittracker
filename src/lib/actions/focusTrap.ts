// Svelte action for modal dialogs: moves focus into the dialog when it becomes visible, keeps
// Tab / Shift+Tab cycling inside it, and restores focus to the previously focused element when
// it closes or is hidden. Only the top-most *visible* trapped dialog reacts, so nested dialogs
// work, and dialogs that stay mounted but hidden (display:none) never trap focus.
const stack: HTMLElement[] = [];

const FOCUSABLE =
	'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';

const isVisible = (el: HTMLElement) => el.getClientRects().length > 0;

function focusables(node: HTMLElement): HTMLElement[] {
	return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
		(el) => isVisible(el) && getComputedStyle(el).visibility !== 'hidden'
	);
}

function topVisible(): HTMLElement | undefined {
	for (let i = stack.length - 1; i >= 0; i--) if (isVisible(stack[i])) return stack[i];
	return undefined;
}

export function focusTrap(node: HTMLElement) {
	let active = false;
	let previous: HTMLElement | null = null;

	function activate() {
		active = true;
		previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		stack.push(node);
		queueMicrotask(() => {
			if (!active) return;
			if (node.contains(document.activeElement) && document.activeElement !== node) return;
			const target =
				node.querySelector<HTMLElement>('[data-autofocus]') ?? focusables(node)[0] ?? node;
			if (target === node && !node.hasAttribute('tabindex')) node.setAttribute('tabindex', '-1');
			target.focus({ preventScroll: true });
		});
	}

	function deactivate(restore: boolean) {
		active = false;
		const i = stack.indexOf(node);
		if (i !== -1) stack.splice(i, 1);
		if (restore && previous && previous.isConnected) previous.focus({ preventScroll: true });
		previous = null;
	}

	function sync() {
		const visible = isVisible(node);
		if (visible && !active) activate();
		else if (!visible && active) deactivate(true);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key !== 'Tab' || !active || topVisible() !== node) return;
		const items = focusables(node);
		if (items.length === 0) {
			e.preventDefault();
			node.focus({ preventScroll: true });
			return;
		}
		const first = items[0];
		const last = items[items.length - 1];
		const current = document.activeElement;
		if (!node.contains(current)) {
			e.preventDefault();
			first.focus();
		} else if (e.shiftKey && (current === first || current === node)) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && current === last) {
			e.preventDefault();
			first.focus();
		}
	}

	document.addEventListener('keydown', onKeydown);
	// Fires on mount and whenever the dialog is shown/hidden via display toggling.
	const observer = new ResizeObserver(sync);
	observer.observe(node);
	sync();

	return {
		destroy() {
			observer.disconnect();
			document.removeEventListener('keydown', onKeydown);
			deactivate(true);
		}
	};
}
