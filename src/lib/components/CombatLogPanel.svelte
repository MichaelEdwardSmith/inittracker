<!-- Live combat log — a running plain-language feed of everything that's happened so far
     this combat (damage, healing, conditions, turns, rounds). Shares its event formatting
     with the post-combat Chronicle via combatEventFormat.ts. DM-only, not persisted beyond
     the current combat (it becomes part of the CombatRecord once combat ends). -->
<script lang="ts">
	import type { CombatEvent } from '$lib/types';
	import { eventIcon, eventColor, eventDesc } from '$lib/combatEventFormat';

	interface Props {
		events: CombatEvent[];
		onclose: () => void;
	}

	let { events, onclose }: Props = $props();

	// Newest first — this is meant for a quick glance at "what just happened", not reading
	// top-to-bottom like the Chronicle.
	const reversed = $derived([...events].reverse());
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	role="dialog"
	aria-modal="true"
	aria-label="Combat Log"
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
	tabindex="-1"
	onclick={(e) => {
		if (e.target === e.currentTarget) onclose();
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape') onclose();
	}}
>
	<div
		class="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl"
		style="max-height: calc(100vh - 5rem);"
	>
		<!-- Header -->
		<div class="flex shrink-0 items-center justify-between border-b border-gray-700 px-5 py-3">
			<h3 class="text-base font-black tracking-wide text-gray-200">
				<i class="fa-duotone fa-light fa-scroll" aria-hidden="true"></i> Combat Log
			</h3>
			<button
				onclick={onclose}
				class="text-gray-500 transition hover:text-white"
				aria-label="Close"
			>
				<i class="fa-duotone fa-light fa-xmark text-lg" aria-hidden="true"></i>
			</button>
		</div>

		<!-- Events -->
		<div class="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
			{#if reversed.length === 0}
				<p class="px-2 py-6 text-center text-sm text-gray-600">
					Nothing has happened yet — actions will appear here as combat unfolds.
				</p>
			{:else}
				{#each reversed as e, i (i)}
					{#if e.type === 'round_advance'}
						<div class="my-2 flex items-center gap-2 px-2">
							<div class="h-px flex-1 bg-gray-700"></div>
							<span class="text-[10px] font-bold tracking-widest text-amber-500 uppercase"
								>Round {e.round}</span
							>
							<div class="h-px flex-1 bg-gray-700"></div>
						</div>
					{:else}
						<div class="flex items-start gap-2 rounded px-2 py-1 text-sm hover:bg-gray-800/60">
							<span class="mt-0.5 w-4 shrink-0 text-center {eventColor(e)}"
								>{@html eventIcon(e)}</span
							>
							<span class="leading-snug {eventColor(e)}">{eventDesc(e)}</span>
						</div>
					{/if}
				{/each}
			{/if}
		</div>
	</div>
</div>
