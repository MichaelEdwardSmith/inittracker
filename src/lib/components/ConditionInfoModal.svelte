<script lang="ts">
	import { conditionColors, conditionDescriptions } from '$lib/utils';

	interface Props {
		condition: string | null;
		onclose: () => void;
	}

	let { condition, onclose }: Props = $props();
</script>

{#if condition}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
		onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}
	>
		<div class="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-700 px-5 py-4">
				<div class="flex items-center gap-3">
					<span class="rounded-full px-3 py-1 text-sm font-bold {conditionColors[condition] ?? 'bg-gray-700 text-gray-200'}">
						{condition}
					</span>
					<span class="text-xs tracking-widest text-gray-500 uppercase">Condition</span>
				</div>
				<button onclick={onclose} class="text-gray-500 transition hover:text-white" aria-label="Close">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<!-- Body -->
			<div class="px-5 py-4">
				<p class="text-sm leading-relaxed text-gray-300">
					{conditionDescriptions[condition] ?? 'No description available.'}
				</p>
			</div>
		</div>
	</div>
{/if}
