<!-- Per-turn countdown display. Purely presentational — computes its own remaining time
     locally from a shared start timestamp + duration rather than syncing a live ticking
     number, so it works the same on the DM dashboard and the player display. -->
<script lang="ts">
	interface Props {
		/** Turn duration in seconds, or null if the timer is disabled. */
		seconds: number | null;
		/** Date.now() timestamp (ms) when the current turn began. */
		startedAt: number | null;
		/** Called once, the instant the countdown crosses zero. */
		onExpire?: () => void;
		/** Compact = small inline badge (dashboard header); default = larger (player display). */
		compact?: boolean;
	}

	let { seconds, startedAt, onExpire, compact = false }: Props = $props();

	let remaining = $state<number | null>(null);
	let hasFired = false;

	$effect(() => {
		if (seconds === null || startedAt === null) {
			remaining = null;
			hasFired = false;
			return;
		}
		hasFired = false;
		function tick() {
			const elapsed = (Date.now() - (startedAt as number)) / 1000;
			const left = Math.max(0, Math.ceil((seconds as number) - elapsed));
			remaining = left;
			if (left === 0 && !hasFired) {
				hasFired = true;
				onExpire?.();
			}
		}
		tick();
		const interval = setInterval(tick, 250);
		return () => clearInterval(interval);
	});

	const isLow = $derived(remaining !== null && seconds !== null && remaining <= seconds * 0.2);
</script>

{#if remaining !== null}
	<div
		class="flex items-center gap-1.5 rounded-full {compact
			? 'px-2 py-0.5 text-xs'
			: 'px-3 py-1 text-lg'} font-black tabular-nums transition-colors {remaining === 0
			? 'bg-red-900/60 text-red-300'
			: isLow
				? 'bg-red-950/40 text-red-400'
				: 'bg-gray-800 text-gray-300'}"
		title="Time left on this turn"
	>
		<i class="fa-duotone fa-light fa-hourglass-half {compact ? 'text-xs' : ''}" aria-hidden="true"
		></i>
		{remaining}s
	</div>
{/if}
