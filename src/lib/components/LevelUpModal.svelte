<!-- Level Up wizard — steps the DM through every player in the roster (as it stood when
     the wizard opened), one at a time. Each step shows that player's current stats and
     lets the DM enter their new Level/AC/Max HP/DEX mod/Passive Perception. Changes for
     a step are saved when moving on to the next one (or on Finish/close), so progress
     isn't lost if the DM stops partway through. -->
<script lang="ts">
	import { combat } from '$lib/store.svelte';

	interface Props {
		onclose: () => void;
	}
	let { onclose }: Props = $props();

	// Snapshot which players were in the roster when the wizard opened, so the step order
	// stays stable even if the roster changes mid-flow (e.g. from another tab).
	const rosterIds = combat.players.map((p) => p.id);

	let index = $state(0);
	let level = $state(1);
	let ac = $state(10);
	let maxHp = $state(10);
	let dexMod = $state(0);
	let passivePerception = $state(10);
	let voiceAliases = $state('');

	function playerAt(i: number) {
		return combat.players.find((p) => p.id === rosterIds[i]) ?? null;
	}

	function loadStep(i: number) {
		const p = playerAt(i);
		if (!p) return;
		level = (p.level ?? 1) + 1;
		ac = p.ac;
		maxHp = p.maxHp;
		dexMod = p.dexMod ?? 0;
		passivePerception = p.passivePerception ?? 10;
		voiceAliases = (p.voiceAliases ?? []).join(', ');
	}
	loadStep(0);

	let current = $derived(playerAt(index));
	let isLast = $derived(index === rosterIds.length - 1);

	/** Saves the fields for whichever player the wizard is currently on. HP gained from a
	 *  higher max carries over to current HP (rather than fully healing); a lower max just
	 *  clamps current HP down to it. */
	function commitStep() {
		const p = playerAt(index);
		if (!p) return;
		const hpGain = Math.max(0, maxHp - p.maxHp);
		const aliases = voiceAliases
			.split(',')
			.map((a) => a.trim())
			.filter(Boolean);
		combat.update(p.id, {
			level,
			ac,
			maxHp,
			currentHp: Math.min(maxHp, p.currentHp + hpGain),
			dexMod: dexMod || undefined,
			passivePerception: passivePerception || undefined,
			voiceAliases: aliases.length > 0 ? aliases : undefined
		});
	}

	function next() {
		commitStep();
		if (isLast) {
			onclose();
		} else {
			index += 1;
			loadStep(index);
		}
	}

	function back() {
		if (index === 0) return;
		commitStep();
		index -= 1;
		loadStep(index);
	}

	function finishNow() {
		commitStep();
		onclose();
	}
</script>

{#if current}
	<div
		role="dialog"
		aria-modal="true"
		aria-label="Level Up"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) finishNow();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') finishNow();
		}}
	>
		<div
			class="flex w-full max-w-md flex-col rounded-xl border border-violet-700/60 bg-gray-900 shadow-2xl"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-700 px-5 py-4">
				<div>
					<h3 class="font-bold tracking-wide text-violet-300">Level Up</h3>
					<p class="text-xs text-gray-500">
						{current.name} &bull; Player {index + 1} of {rosterIds.length}
					</p>
				</div>
				<button
					onclick={finishNow}
					class="text-gray-500 transition hover:text-white"
					aria-label="Close"
				>
					<i class="fa-solid fa-xmark text-lg" aria-hidden="true"></i>
				</button>
			</div>

			<!-- Body -->
			<div class="flex flex-col gap-3 p-5">
				<div class="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 p-2.5">
					<div
						class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-gray-600 bg-gray-700"
					>
						{#if current.avatarUrl}
							<img src={current.avatarUrl} alt={current.name} class="h-full w-full object-cover" />
						{:else}
							<span class="text-base leading-none">🛡️</span>
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<div class="truncate text-sm font-medium text-white">{current.name}</div>
						<div class="text-xs text-gray-400">
							Was: Level {current.level ?? 1} &bull; AC {current.ac} &bull; {current.maxHp} HP
						</div>
					</div>
				</div>

				<label class="flex flex-col gap-1">
					<span class="text-xs text-gray-400">Level</span>
					<input
						type="number"
						bind:value={level}
						min="1"
						max="20"
						class="w-full rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-violet-500 focus:outline-none"
					/>
				</label>

				<div class="flex gap-2">
					<label class="flex flex-1 flex-col gap-1">
						<span class="text-xs text-gray-400">AC</span>
						<input
							type="number"
							bind:value={ac}
							min="1"
							max="30"
							class="w-full rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-violet-500 focus:outline-none"
						/>
					</label>
					<label class="flex flex-1 flex-col gap-1">
						<span class="text-xs text-gray-400">Max HP</span>
						<input
							type="number"
							bind:value={maxHp}
							min="1"
							class="w-full rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-violet-500 focus:outline-none"
						/>
					</label>
				</div>

				<div class="flex gap-2">
					<label class="flex flex-1 flex-col gap-1">
						<span class="text-xs text-gray-400">DEX</span>
						<input
							type="number"
							bind:value={dexMod}
							min="-10"
							max="10"
							class="w-full rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-violet-500 focus:outline-none"
						/>
					</label>
					<label class="flex flex-1 flex-col gap-1">
						<span class="text-xs text-gray-400">Passive</span>
						<input
							type="number"
							bind:value={passivePerception}
							min="1"
							max="30"
							class="w-full rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-violet-500 focus:outline-none"
						/>
					</label>
				</div>

				<label class="flex flex-col gap-1">
					<span class="flex items-center gap-1 text-xs text-gray-400">
						Voice Nicknames (optional)
						<i
							class="fa-solid fa-circle-question shrink-0 cursor-help text-sm text-gray-500"
							aria-hidden="true"
							title="Alternate spellings/pronunciations for Voice Commands to also match against this player's name (e.g. Kalstag -&gt; Call Stag). Comma-separated, optional."
						></i>
					</span>
					<input
						bind:value={voiceAliases}
						placeholder="e.g. Call Stag, Kal Stag"
						class="w-full rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
					/>
				</label>
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-between gap-2 border-t border-gray-700 px-5 py-3">
				<button
					onclick={back}
					disabled={index === 0}
					class="rounded bg-gray-700 px-3 py-1.5 text-sm text-gray-300 transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
				>
					<i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Back
				</button>
				<button
					onclick={next}
					class="rounded bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-violet-500 active:bg-violet-700"
				>
					{#if isLast}
						Finish
					{:else}
						Save & Next <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
