// Global dice overlay singleton — shared between all components that roll dice.
// Import triggerRoll() to show the 3D animation from anywhere.
import { browser } from '$app/environment';

/** Reactive state object. Access diceOverlay.diceReady, .virtualDiceDisabled, .pendingRoll. */
export const diceOverlay = $state({
	diceReady: false,
	virtualDiceDisabled: browser ? localStorage.getItem('dice-roller-disable-3d') === 'true' : false,
	pendingRoll: null as { notation: string; id: number } | null
});

// Non-reactive — stored alongside the pending roll for the onRollComplete callback.
let _onComplete: ((rolls: number[]) => void) | null = null;

/**
 * Trigger a 3D dice roll animation.
 * @param notation  Standard dice notation, e.g. "2d6", "1d20".
 * @param onComplete  Optional callback fired with individual die values when dice settle.
 *                    When virtualDiceDisabled is true the callback fires synchronously
 *                    with locally-generated values and no animation plays.
 */
export function triggerRoll(
	notation: string,
	onComplete: ((rolls: number[]) => void) | null = null
) {
	if (diceOverlay.virtualDiceDisabled) {
		if (onComplete) {
			const m = notation.match(/^(\d+)d(\d+)/);
			if (m) {
				const qty = parseInt(m[1]);
				const sides = parseInt(m[2]);
				onComplete(Array.from({ length: qty }, () => Math.floor(Math.random() * sides) + 1));
			}
		}
		return;
	}
	_onComplete = onComplete;
	diceOverlay.pendingRoll = { notation, id: Date.now() };
}

export function setVirtualDiceDisabled(v: boolean) {
	diceOverlay.virtualDiceDisabled = v;
	if (browser) localStorage.setItem('dice-roller-disable-3d', String(v));
}

// Called by DiceOverlay only
export function _setReady(v: boolean) {
	diceOverlay.diceReady = v;
}
export function _getRollCallback() {
	return _onComplete;
}
export function _clearCallback() {
	_onComplete = null;
}
