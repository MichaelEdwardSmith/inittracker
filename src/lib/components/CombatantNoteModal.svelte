<script lang="ts">
	import type { Combatant } from '$lib/types';

	interface Props {
		combatant: Combatant | null;
		onclose: () => void;
		onsave: (id: string, note: string) => void;
	}

	let { combatant, onclose, onsave }: Props = $props();

	let noteValue = $state('');

	$effect(() => {
		if (combatant) noteValue = combatant.note ?? '';
	});

	function save() {
		if (combatant) onsave(combatant.id, noteValue);
		onclose();
	}
</script>

{#if combatant}
	<div
		role="dialog"
		aria-modal="true"
		aria-label="Combatant notes"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) save();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') save();
		}}
	>
		<div class="flex w-full max-w-md flex-col rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-700 px-5 py-4">
				<div>
					<h3 class="font-bold tracking-wide text-gray-200">Notes</h3>
					<p class="text-xs text-gray-500 italic">{combatant.name}</p>
				</div>
				<button onclick={save} class="text-gray-500 transition hover:text-white" aria-label="Close">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Body -->
			<div class="p-5">
				<!-- svelte-ignore a11y_autofocus -->
				<textarea
					autofocus
					bind:value={noteValue}
					placeholder="Enter notes for this combatant…"
					rows={6}
					class="w-full resize-none rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-gray-500 focus:outline-none"
				></textarea>
			</div>

			<!-- Footer -->
			<div class="flex justify-end gap-2 border-t border-gray-700 px-5 py-3">
				<button
					onclick={save}
					class="rounded bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-500"
				>
					Save
				</button>
			</div>
		</div>
	</div>
{/if}
