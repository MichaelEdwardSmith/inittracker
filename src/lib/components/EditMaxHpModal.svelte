<!-- Modal for editing an enemy/NPC's max HP mid-combat. Receives the target combatant and an
     onsave callback; current HP is clamped down if the new max is lower. -->
<script lang="ts">
	import type { Combatant } from '$lib/types';
	import { tick } from 'svelte';

	interface Props {
		combatant: Combatant | null;
		onclose: () => void;
		onsave: (id: string, maxHp: number) => void;
	}

	let { combatant, onclose, onsave }: Props = $props();

	let value = $state(1);
	let inputEl = $state<HTMLInputElement>();

	$effect(() => {
		if (combatant) {
			value = combatant.maxHp;
			tick().then(() => inputEl?.select());
		}
	});

	function save() {
		if (combatant && value > 0) onsave(combatant.id, Math.floor(value));
		onclose();
	}
</script>

{#if combatant}
	<div
		role="dialog"
		aria-modal="true"
		aria-label="Edit max HP"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) onclose();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') onclose();
		}}
	>
		<div
			class="flex w-full max-w-xs flex-col rounded-xl border border-gray-700 bg-gray-900 shadow-2xl"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-700 px-5 py-4">
				<div>
					<h3 class="font-bold tracking-wide text-gray-200">Edit Max HP</h3>
					<p class="text-xs text-gray-500 italic">{combatant.name}</p>
				</div>
				<button
					onclick={onclose}
					class="text-gray-500 transition hover:text-white"
					aria-label="Close"
				>
					<i class="fa-duotone fa-light fa-xmark text-lg" aria-hidden="true"></i>
				</button>
			</div>

			<!-- Body -->
			<div class="p-5">
				<label for="edit-max-hp" class="mb-1 block text-xs tracking-wider text-gray-500 uppercase"
					>Max HP</label
				>
				<input
					id="edit-max-hp"
					bind:this={inputEl}
					bind:value
					type="number"
					min="1"
					onkeydown={(e) => {
						if (e.key === 'Enter') save();
					}}
					class="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-center text-lg font-bold text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 focus:outline-none"
				/>
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
