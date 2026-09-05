<!-- Simple lightbox-style modal for viewing a combatant's avatar at full size.
     Receives the target combatant (or null to stay closed) and an onclose callback. -->
<script lang="ts">
	import type { Combatant } from '$lib/types';

	interface Props {
		combatant: Combatant | null;
		onclose: () => void;
	}

	let { combatant, onclose }: Props = $props();
</script>

{#if combatant?.avatarUrl}
	<div
		role="dialog"
		aria-modal="true"
		aria-label="{combatant.name} avatar"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) onclose();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') onclose();
		}}
	>
		<div class="flex max-w-sm flex-col items-center gap-3">
			<div class="relative">
				<img
					src={combatant.avatarUrl}
					alt={combatant.name}
					class="max-h-[70vh] max-w-full rounded-xl border border-gray-700 object-contain shadow-2xl"
				/>
				<button
					onclick={onclose}
					aria-label="Close"
					class="absolute -top-3 -right-3 rounded-full bg-gray-900 p-1.5 text-gray-400 shadow-lg ring-1 ring-gray-700 transition hover:text-white"
				>
					<i class="fa-duotone fa-light fa-xmark text-lg" aria-hidden="true"></i>
				</button>
			</div>
			<p class="text-sm font-semibold text-gray-200">{combatant.name}</p>
		</div>
	</div>
{/if}
