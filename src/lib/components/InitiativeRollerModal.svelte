<!-- Initiative roller modal — players use this to roll and submit their initiative. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import type { Combatant } from '$lib/types';
	import { triggerRoll } from '$lib/diceOverlay.svelte';

	interface Props {
		players: Combatant[];
		sessionId: string;
		onclose: () => void;
	}

	let { players, sessionId, onclose }: Props = $props();

	let initCharId = $state(untrack(() => players.length === 1 ? players[0].id : ''));
	let initMode = $state<'normal' | 'advantage' | 'disadvantage'>('normal');
	let initRoll1 = $state<number | null>(null);
	let initRoll2 = $state<number | null>(null);
	let initSubmitting = $state(false);
	let initSubmitted = $state(false);

	const initSelectedPlayer = $derived(players.find((p) => p.id === initCharId) ?? null);

	const initResult = $derived.by(() => {
		if (initRoll1 === null) return null;
		const dex = initSelectedPlayer?.dexMod ?? 0;
		if (initMode === 'normal' || initRoll2 === null) return initRoll1 + dex;
		const chosen = initMode === 'advantage' ? Math.max(initRoll1, initRoll2) : Math.min(initRoll1, initRoll2);
		return chosen + dex;
	});

	function rollInitiative() {
		initRoll1 = null;
		initRoll2 = null;
		initSubmitted = false;
		const notation = initMode !== 'normal' ? '2d20' : '1d20';
		triggerRoll(notation, (rolls) => {
			initRoll1 = rolls[0];
			initRoll2 = rolls.length > 1 ? rolls[1] : null;
		});
	}

	async function submitInitiative() {
		if (!initCharId || initResult === null) return;
		initSubmitting = true;
		try {
			await fetch('/api/initiative', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId, playerId: initCharId, initiative: initResult }),
			});
			initSubmitted = true;
			setTimeout(() => { initSubmitted = false; onclose(); }, 1800);
		} catch {
			// silent
		} finally {
			initSubmitting = false;
		}
	}
</script>

<div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
	<div class="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
		<div class="flex items-center justify-between border-b border-gray-800 px-5 py-4">
			<h2 class="text-sm font-bold tracking-widest text-amber-400 uppercase">Roll Initiative</h2>
			<button onclick={onclose} aria-label="Close" class="text-gray-600 transition hover:text-gray-300">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
		{#if initSubmitted}
			<div class="flex flex-col items-center gap-3 px-5 py-10 text-center">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				<p class="text-sm font-semibold text-amber-400">Initiative submitted!</p>
			</div>
		{:else}
			<div class="flex flex-col gap-5 px-5 py-5">
				<div class="flex flex-col gap-1.5">
					<label for="init-char" class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Character</label>
					<select
						id="init-char"
						bind:value={initCharId}
						onchange={() => { initRoll1 = null; initRoll2 = null; }}
						class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-amber-500 focus:outline-none"
					>
						<option value="" disabled>Select your character…</option>
						{#each players as p}
							<option value={p.id}>{p.name}{#if p.dexMod} (DEX {p.dexMod > 0 ? '+' : ''}{p.dexMod}){/if}</option>
						{/each}
					</select>
				</div>
				<div class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Roll Mode</span>
					<div class="flex gap-2">
						{#each [{ value: 'normal', label: 'Normal' }, { value: 'advantage', label: 'Advantage' }, { value: 'disadvantage', label: 'Disadvantage' }] as opt}
							<label class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition
								{initMode === opt.value
									? opt.value === 'advantage' ? 'border-green-600 bg-green-900/30 text-green-300'
										: opt.value === 'disadvantage' ? 'border-red-600 bg-red-900/30 text-red-300'
										: 'border-amber-600 bg-amber-900/30 text-amber-300'
									: 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'}">
								<input type="radio" bind:group={initMode} value={opt.value} class="sr-only"
									onchange={() => { initRoll1 = null; initRoll2 = null; }} />
								{opt.label}
							</label>
						{/each}
					</div>
				</div>
				<div class="flex flex-col items-center gap-3">
					<button
						onclick={rollInitiative}
						disabled={!initCharId}
						class="w-full rounded-lg border border-amber-600/60 bg-amber-950/40 px-4 py-2.5 text-sm font-bold tracking-widest text-amber-300 uppercase transition hover:bg-amber-900/50 disabled:cursor-not-allowed disabled:opacity-40"
					>
						{initMode === 'normal' ? 'Roll d20' : 'Roll 2d20'}
					</button>
					{#if initRoll1 !== null}
						{@const dex = initSelectedPlayer?.dexMod ?? 0}
						<div class="flex flex-col items-center gap-1 text-center">
							{#if initMode !== 'normal' && initRoll2 !== null}
								<div class="flex items-center gap-3">
									{#each [initRoll1, initRoll2] as roll, i}
										{@const isChosen = initMode === 'advantage' ? roll === Math.max(initRoll1, initRoll2) : roll === Math.min(initRoll1, initRoll2)}
										<span class="text-3xl font-black {isChosen ? 'text-amber-400' : 'text-gray-600 line-through'}">{roll}</span>
										{#if i === 0}<span class="text-gray-600">/</span>{/if}
									{/each}
								</div>
							{:else}
								<span class="text-4xl font-black text-amber-400">{initRoll1}</span>
							{/if}
							{#if dex !== 0}
								<div class="text-sm text-gray-400">{dex > 0 ? '+' : ''}{dex} DEX → <span class="font-bold text-white">{initResult}</span></div>
							{/if}
						</div>
					{/if}
				</div>
				<button
					onclick={submitInitiative}
					disabled={initRoll1 === null || initSubmitting}
					class="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
				>
					{initSubmitting ? 'Submitting…' : 'Submit Initiative'}{#if initResult !== null} — {initResult}{/if}
				</button>
			</div>
		{/if}
	</div>
</div>
