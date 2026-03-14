<!-- Condition timing modal — asks how long a condition should last before applying it. -->
<script lang="ts">
	interface Props {
		pending: { id: string; combatantName: string; condition: string } | null;
		onconfirmtimed: (rounds: number) => void;
		onconfirmindefinite: () => void;
		oncancel: () => void;
	}

	let { pending, onconfirmtimed, onconfirmindefinite, oncancel }: Props = $props();

	let rounds = $state(1);

	$effect(() => {
		if (pending) rounds = 1;
	});
</script>

{#if pending}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
		onmousedown={(e) => {
			if (e.target === e.currentTarget) oncancel();
		}}
	>
		<div class="mx-4 w-full max-w-sm rounded-xl border border-violet-700/60 bg-gray-900 shadow-2xl">
			<div class="flex items-center gap-2 border-b border-violet-900/40 px-5 py-3">
				<span class="text-violet-400">⏱</span>
				<span class="text-sm font-bold tracking-widest text-violet-300 uppercase"
					>Add Condition</span
				>
			</div>
			<div class="px-5 py-4">
				<p class="mb-1 text-sm text-gray-300">
					Adding <span class="font-bold text-white">{pending.condition}</span> to
					<span class="font-bold text-violet-300">{pending.combatantName}</span>
				</p>
				<p class="mb-4 text-xs text-gray-500">How long should this condition last?</p>
				<div class="flex items-center gap-3">
					<label
						for="condition-rounds-input"
						class="text-xs font-semibold tracking-wider text-gray-400 uppercase">Rounds</label
					>
					<input
						id="condition-rounds-input"
						type="number"
						min="1"
						max="99"
						bind:value={rounds}
						class="h-9 w-20 rounded border border-violet-700/60 bg-gray-800 px-2 text-center text-sm font-bold text-violet-200 focus:border-violet-500 focus:outline-none"
					/>
				</div>
			</div>
			<div class="flex gap-2 border-t border-gray-800 px-5 py-3">
				<button
					onclick={() => onconfirmtimed(rounds)}
					class="flex-1 rounded bg-violet-800/60 py-2 text-sm font-semibold text-violet-200 transition hover:bg-violet-700/70"
				>
					Add ({rounds}
					{rounds === 1 ? 'round' : 'rounds'})
				</button>
				<button
					onclick={onconfirmindefinite}
					class="flex-1 rounded bg-gray-700/50 py-2 text-sm font-semibold text-gray-300 transition hover:bg-gray-600/60"
					>No Limit</button
				>
				<button
					onclick={oncancel}
					class="rounded bg-gray-800/50 px-3 py-2 text-sm text-gray-500 transition hover:text-gray-300"
					>✕</button
				>
			</div>
		</div>
	</div>
{/if}
