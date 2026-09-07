<!-- Transform / revert modal — lets the DM temporarily swap a combatant's stat block for
     a form (Wild Shape, Polymorph, etc.) and revert them back later. Manual entry only;
     the store keeps the original stats stashed so reverting is exact. -->
<script lang="ts">
	import type { Combatant } from '$lib/types';

	interface Props {
		target: Combatant | null;
		onclose: () => void;
		ontransform: (form: { name: string; ac: number; maxHp: number }) => void;
	}

	let { target, onclose, ontransform }: Props = $props();

	let formName = $state('');
	let formAc = $state(10);
	let formMaxHp = $state(10);

	$effect(() => {
		if (target) {
			formName = '';
			formAc = target.ac;
			formMaxHp = target.maxHp;
		}
	});

	function submit() {
		if (!formName.trim()) return;
		ontransform({ name: formName.trim(), ac: formAc, maxHp: Math.max(1, formMaxHp) });
	}
</script>

{#if target}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		role="dialog"
		aria-modal="true"
		aria-label="Transform"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) onclose();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') onclose();
		}}
	>
		<div class="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
			<div class="flex items-center justify-between border-b border-gray-700 px-5 py-3">
				<h3 class="text-base font-black tracking-wide text-emerald-300">
					<i class="fa-duotone fa-light fa-paw-simple" aria-hidden="true"></i> Transform
				</h3>
				<button
					onclick={onclose}
					class="text-gray-500 transition hover:text-white"
					aria-label="Close"
				>
					<i class="fa-duotone fa-light fa-xmark text-lg" aria-hidden="true"></i>
				</button>
			</div>

			<div class="flex flex-col gap-3 p-5">
				{#if target.transformStash}
					<p class="text-sm text-gray-300">
						<strong class="text-white">{target.name}</strong> is currently transformed. Their true
						form
						<strong class="text-white">{target.transformStash.name}</strong>
						(AC {target.transformStash.ac}, {target.transformStash.maxHp} HP) is stashed and can be restored
						at any time.
					</p>
					<p class="text-xs text-gray-500">
						Use <strong class="text-gray-300">Revert to True Form</strong> on their card to switch back.
					</p>
				{:else}
					<p class="text-xs text-gray-400">
						Swap <strong class="text-white">{target.name}</strong>'s stats for a temporary form
						(Wild Shape, Polymorph, etc.). Their current stats are stashed and restored exactly when
						you revert.
					</p>
					<form
						onsubmit={(e) => {
							e.preventDefault();
							submit();
						}}
						class="flex flex-col gap-2"
					>
						<label class="flex flex-col gap-1">
							<span class="text-xs text-gray-400">Form name</span>
							<input
								bind:value={formName}
								placeholder="e.g. Brown Bear"
								class="rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
							/>
						</label>
						<div class="flex gap-2">
							<label class="flex flex-1 flex-col gap-1">
								<span class="text-xs text-gray-400">AC</span>
								<input
									type="number"
									bind:value={formAc}
									min="1"
									max="30"
									class="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
								/>
							</label>
							<label class="flex flex-1 flex-col gap-1">
								<span class="text-xs text-gray-400">Max HP</span>
								<input
									type="number"
									bind:value={formMaxHp}
									min="1"
									class="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
								/>
							</label>
						</div>
						<button
							type="submit"
							disabled={!formName.trim()}
							class="mt-1 rounded bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
						>
							Transform
						</button>
					</form>
				{/if}
			</div>
		</div>
	</div>
{/if}
