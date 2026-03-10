<!-- Persistent full-screen 3D dice canvas. Always mounted in the root layout.
     Watches diceOverlay.pendingRoll and fires the 3D animation on every triggerRoll() call. -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import {
		diceOverlay,
		_setReady,
		_getRollCallback,
		_clearCallback
	} from '$lib/diceOverlay.svelte';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let diceBox: any = null;
	let clearTimer: ReturnType<typeof setTimeout> | null = null;

	onMount(async () => {
		if (!browser) return;

		const DiceBox = (await import('@3d-dice/dice-box-threejs')).default;

		diceBox = new DiceBox('#global-dice-canvas', {
			assetPath: '/assets/dice-box-threejs/',
			baseScale: 150,
			gravity_multiplier: 400,
			strength: 2,
			shadows: true,
			sounds: true,
			volume: 85,
			sound_dieMaterial: 'metal',
			theme_colorset: 'fire',
			theme_material: 'glass',
			theme_surface: 'default',
			onRollComplete: (results: { sets: { rolls: { value: number }[] }[] }) => {
				const rolls = results.sets.flatMap((s) => s.rolls.map((r) => r.value));
				const cb = _getRollCallback();
				_clearCallback();
				if (cb) cb(rolls);
				clearTimer = setTimeout(() => diceBox?.clearDice(), 3000);
			}
		});

		await diceBox.initialize();
		_setReady(true);
	});

	onDestroy(() => {
		if (clearTimer) clearTimeout(clearTimer);
		diceBox?.clearDice();
		_setReady(false);
	});

	$effect(() => {
		const roll = diceOverlay.pendingRoll;
		if (!roll || !diceBox) return;
		if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }
		diceBox.clearDice();
		diceBox.roll(roll.notation);
	});
</script>

<div id="global-dice-canvas" class="pointer-events-none fixed inset-0 z-[200]" aria-hidden="true"></div>
