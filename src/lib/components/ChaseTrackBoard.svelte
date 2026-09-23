<!-- Read-only "Gap Track" visualization for the chase tracker: one lane per distance band, with
     numbered participant badges sitting in their current band (full names don't fit the
     "ADJACENT"/"CLOSE" lanes — each caller shows its own name legend alongside, see
     ChaseTrackerModal / ChaseTrackerOverlay). Shared between the DM's control modal (small
     preview, size="sm") and the player display's full-screen takeover (size="xl"). Stacks the
     bands vertically on narrow screens (a horizontal scroller for 6 bands is unusable on a
     phone) and switches to the side-by-side lane layout at the `sm` breakpoint. -->
<script lang="ts">
	import type { ChaseParticipant } from '$lib/types';
	import { chaseBadgeClasses } from '$lib/utils';

	type Size = 'sm' | 'lg' | 'xl';

	interface Props {
		bands: string[];
		participants: ChaseParticipant[];
		size?: Size;
	}
	let { bands, participants, size = 'lg' }: Props = $props();

	const SIZE_CLASSES: Record<Size, { text: string; lane: string; header: string; badge: string }> =
		{
			sm: {
				text: 'text-[10px]',
				lane: 'sm:min-w-[5.5rem] p-1.5',
				header: 'mb-1',
				badge: 'h-6 w-6 text-[11px]'
			},
			lg: {
				text: 'text-xs',
				lane: 'sm:min-w-[6.5rem] p-2',
				header: 'mb-1.5',
				badge: 'h-7 w-7 text-xs'
			},
			xl: {
				text: 'text-sm sm:text-base',
				lane: 'p-3 sm:min-w-[9.5rem]',
				header: 'mb-2.5',
				badge: 'h-9 w-9 text-sm sm:h-11 sm:w-11 sm:text-base'
			}
		};

	function inBand(i: number): ChaseParticipant[] {
		return participants.filter((p) => p.band === i);
	}
</script>

<div
	class="mx-auto flex w-full max-w-5xl flex-col gap-1.5 sm:flex-row sm:overflow-x-auto {SIZE_CLASSES[
		size
	].text}"
>
	{#each bands as band, i (band + i)}
		<div
			class="flex flex-col rounded-lg border {SIZE_CLASSES[size].lane} sm:flex-1 {i ===
			bands.length - 1
				? 'border-purple-800/60 bg-purple-950/20'
				: 'border-gray-700 bg-gray-800/40'}"
		>
			<div
				class="{SIZE_CLASSES[size]
					.header} shrink-0 text-left font-bold tracking-wide uppercase sm:text-center {i ===
				bands.length - 1
					? 'text-purple-400'
					: 'text-gray-500'}"
			>
				{band}
			</div>
			<div class="flex flex-row flex-wrap items-start justify-center gap-1.5 sm:flex-1">
				{#each inBand(i) as p (p.id)}
					<div
						class="flex shrink-0 items-center justify-center rounded-full border-2 font-bold {SIZE_CLASSES[
							size
						].badge} {chaseBadgeClasses(p)} {p.dropped ? 'line-through opacity-50' : ''}"
						title={p.name}
					>
						{participants.indexOf(p) + 1}
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>
