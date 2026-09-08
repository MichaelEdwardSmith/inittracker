<!-- A labeled row of clickable pip dots for tracking a spendable/leveled resource on a
     combatant card — used for Legendary Actions, Legendary Resistance, and Exhaustion. Each
     dot is "filled" when its index is below `filledCount`. Clicking a dot doesn't have one
     universal meaning across all three trackers (spend-down-from-here vs raise-to-here differ
     slightly), so this component only owns rendering; the caller supplies `onDotClick` and
     decides what the new count should be. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type DotColor = 'amber' | 'sky' | 'orange';

	const DOT_CLASSES: Record<DotColor, { filled: string; hollow: string }> = {
		amber: {
			filled: 'border-amber-400 bg-amber-400 hover:bg-amber-300',
			hollow: 'border-amber-600 bg-transparent hover:bg-amber-900/30'
		},
		sky: {
			filled: 'border-sky-400 bg-sky-400 hover:bg-sky-300',
			hollow: 'border-sky-600 bg-transparent hover:bg-sky-900/30'
		},
		orange: {
			filled: 'border-orange-500 bg-orange-500 hover:bg-orange-400',
			hollow: 'border-orange-800 bg-transparent hover:bg-orange-900/30'
		}
	};

	const LABEL_CLASSES: Record<DotColor, string> = {
		amber: 'text-amber-200/70',
		sky: 'text-sky-200/70',
		orange: 'text-orange-300/70'
	};

	interface Props {
		label: string;
		color: DotColor;
		count: number;
		filledCount: number;
		onDotClick: (dotIdx: number, filled: boolean) => void;
		dotTitle: (dotIdx: number, filled: boolean) => string;
		infoTitle?: string;
		onInfoClick?: () => void;
		/** Extra content rendered between the dots and the info button — e.g. Exhaustion's
		 *  "Lvl N" readout and clear button, which the other two trackers don't have. */
		extra?: Snippet;
	}

	let {
		label,
		color,
		count,
		filledCount,
		onDotClick,
		dotTitle,
		infoTitle,
		onInfoClick,
		extra
	}: Props = $props();
</script>

<div class="flex items-center gap-2">
	<span class="shrink-0 text-xs font-semibold {LABEL_CLASSES[color]}">{label}:</span>
	<div class="flex items-center gap-1">
		{#each Array(count) as _, dotIdx}
			{@const filled = dotIdx < filledCount}
			<button
				onclick={() => onDotClick(dotIdx, filled)}
				title={dotTitle(dotIdx, filled)}
				class="h-4 w-4 rounded-full border-2 transition {filled
					? DOT_CLASSES[color].filled
					: DOT_CLASSES[color].hollow}"
			></button>
		{/each}
	</div>
	{@render extra?.()}
	{#if onInfoClick}
		<button
			onclick={onInfoClick}
			title={infoTitle ?? 'View details'}
			class="rounded p-1 text-gray-600 transition hover:text-blue-400"
		>
			<i class="fa-duotone fa-light fa-circle-info text-sm" aria-hidden="true"></i>
		</button>
	{/if}
</div>
