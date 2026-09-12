<!-- Simple lightbox-style modal for viewing a combatant's avatar/token image at full size.
     Receives the image to show (or null to stay closed) and an onclose callback. Works for
     either a player's avatar or an enemy's monster image — callers just pass whichever URL
     applies. -->
<script lang="ts">
	interface Props {
		imageUrl: string | null;
		name: string;
		onclose: () => void;
	}

	let { imageUrl, name, onclose }: Props = $props();
</script>

{#if imageUrl}
	<div
		role="dialog"
		aria-modal="true"
		aria-label="{name} image"
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
					src={imageUrl}
					alt={name}
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
			<p class="text-sm font-semibold text-gray-200">{name}</p>
		</div>
	</div>
{/if}
