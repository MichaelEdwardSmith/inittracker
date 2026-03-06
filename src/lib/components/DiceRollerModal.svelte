<!-- DM dice roller modal — pick die type, quantity, and modifier, then roll.
     Keeps the last 5 rolls in a compact history list. -->
<script lang="ts">
	interface Props {
		onclose: () => void;
	}

	let { onclose }: Props = $props();

	const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100] as const;
	type DieType = (typeof DICE_TYPES)[number];

	let selectedDie = $state<DieType>(20);
	let quantity = $state(1);
	let modifier = $state(0);

	interface RollResult {
		dieType: DieType;
		quantity: number;
		modifier: number;
		rolls: number[];
		total: number;
	}

	let result = $state<RollResult | null>(null);
	let history = $state<RollResult[]>([]);

	const expr = $derived(
		`${quantity}d${selectedDie}${modifier > 0 ? ` + ${modifier}` : modifier < 0 ? ` − ${Math.abs(modifier)}` : ''}`
	);

	function roll() {
		const rolls = Array.from({ length: quantity }, () => Math.floor(Math.random() * selectedDie) + 1);
		const total = rolls.reduce((s, r) => s + r, 0) + modifier;
		const newResult: RollResult = { dieType: selectedDie, quantity, modifier, rolls, total };
		result = newResult;
		history = [newResult, ...history].slice(0, 5);
	}

	function rollAgain() {
		if (!result) return;
		const rolls = Array.from({ length: result.quantity }, () => Math.floor(Math.random() * result!.dieType) + 1);
		const total = rolls.reduce((s, r) => s + r, 0) + result.modifier;
		const newResult: RollResult = { ...result, rolls, total };
		result = newResult;
		history = [newResult, ...history].slice(0, 5);
	}

	function adjustQuantity(delta: number) {
		quantity = Math.max(1, Math.min(99, quantity + delta));
	}

	function adjustModifier(delta: number) {
		modifier = Math.max(-99, Math.min(99, modifier + delta));
	}

	function handleQuantityInput(e: Event) {
		const v = parseInt((e.target as HTMLInputElement).value);
		if (!isNaN(v)) quantity = Math.max(1, Math.min(99, v));
	}

	function handleModifierInput(e: Event) {
		const v = parseInt((e.target as HTMLInputElement).value);
		if (!isNaN(v)) modifier = Math.max(-99, Math.min(99, v));
	}

	function historyExpr(r: RollResult): string {
		return `${r.quantity}d${r.dieType}${r.modifier > 0 ? `+${r.modifier}` : r.modifier < 0 ? `${r.modifier}` : ''}`;
	}
</script>

<div
	role="dialog"
	aria-modal="true"
	aria-label="Dice roller"
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
	tabindex="-1"
	onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}
	onkeydown={(e) => { if (e.key === 'Escape') onclose(); }}
>
	<div class="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">

		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-700 px-5 py-4">
			<h3 class="font-black tracking-wide text-amber-400">🎲 Dice Roller</h3>
			<button
				onclick={onclose}
				class="text-gray-500 transition hover:text-white"
				aria-label="Close"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Body -->
		<div class="px-5 py-4">

			<!-- Die type selection -->
			<p class="mb-2 text-xs font-semibold tracking-widest text-gray-500 uppercase">Die Type</p>
			<div class="mb-4 flex flex-wrap gap-1.5">
				{#each DICE_TYPES as die}
					<button
						onclick={() => { selectedDie = die; result = null; }}
						class="rounded px-3 py-1.5 text-sm font-bold transition
						       {selectedDie === die
							? 'bg-amber-600 text-white'
							: 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}"
					>
						d{die}
					</button>
				{/each}
			</div>

			<!-- Quantity + Modifier -->
			<div class="mb-4 flex gap-4">
				<!-- Quantity -->
				<div class="flex-1">
					<p class="mb-1.5 text-xs font-semibold tracking-widest text-gray-500 uppercase">Quantity</p>
					<div class="flex items-center gap-1">
						<button
							onclick={() => adjustQuantity(-1)}
							class="flex h-7 w-7 items-center justify-center rounded bg-gray-800 text-gray-300 transition hover:bg-gray-700 hover:text-white"
							aria-label="Decrease quantity"
						>−</button>
						<input
							type="number"
							min="1"
							max="99"
							value={quantity}
							oninput={handleQuantityInput}
							class="w-14 rounded border border-gray-700 bg-gray-800 py-1 text-center text-sm font-bold text-gray-200 focus:border-gray-500 focus:outline-none"
						/>
						<button
							onclick={() => adjustQuantity(1)}
							class="flex h-7 w-7 items-center justify-center rounded bg-gray-800 text-gray-300 transition hover:bg-gray-700 hover:text-white"
							aria-label="Increase quantity"
						>+</button>
					</div>
				</div>

				<!-- Modifier -->
				<div class="flex-1">
					<p class="mb-1.5 text-xs font-semibold tracking-widest text-gray-500 uppercase">Modifier</p>
					<div class="flex items-center gap-1">
						<button
							onclick={() => adjustModifier(-1)}
							class="flex h-7 w-7 items-center justify-center rounded bg-gray-800 text-gray-300 transition hover:bg-gray-700 hover:text-white"
							aria-label="Decrease modifier"
						>−</button>
						<input
							type="number"
							min="-99"
							max="99"
							value={modifier}
							oninput={handleModifierInput}
							class="w-14 rounded border border-gray-700 bg-gray-800 py-1 text-center text-sm font-bold
							       {modifier > 0 ? 'text-green-400' : modifier < 0 ? 'text-red-400' : 'text-gray-200'}
							       focus:border-gray-500 focus:outline-none"
						/>
						<button
							onclick={() => adjustModifier(1)}
							class="flex h-7 w-7 items-center justify-center rounded bg-gray-800 text-gray-300 transition hover:bg-gray-700 hover:text-white"
							aria-label="Increase modifier"
						>+</button>
					</div>
				</div>
			</div>

			<!-- Expression preview + Roll button -->
			<div class="mb-4 flex items-center gap-3">
				<span class="flex-1 rounded border border-gray-700 bg-gray-800/60 px-3 py-1.5 font-mono text-sm text-amber-300">{expr}</span>
				<button
					onclick={roll}
					class="rounded bg-amber-600 px-5 py-1.5 text-sm font-black text-white transition hover:bg-amber-500 active:scale-95"
				>
					Roll
				</button>
			</div>

			<!-- Results -->
			{#if result}
				<div class="mb-4 rounded-lg border border-gray-700 bg-gray-800/60 p-4">
					<!-- Individual dice -->
					<div class="mb-3 flex flex-wrap gap-2">
						{#each result.rolls as roll, i}
							<div
								class="flex h-11 w-11 items-center justify-center rounded-lg border-2 font-black text-lg
								       {result.dieType === 20 && roll === 20
									? 'border-amber-400 bg-amber-900/40 text-amber-300'
									: result.dieType === 20 && roll === 1
									? 'border-red-600 bg-red-900/40 text-red-300'
									: 'border-gray-600 bg-gray-800 text-white'}"
								title="Die {i + 1}"
							>
								{roll}
							</div>
						{/each}
					</div>

					<!-- Modifier line -->
					{#if result.modifier !== 0}
						<p class="mb-1 text-sm text-gray-400">
							Dice sum: {result.rolls.reduce((s, r) => s + r, 0)}<span class={result.modifier > 0 ? 'text-green-400' : 'text-red-400'}> {result.modifier > 0 ? '+' : '−'} {Math.abs(result.modifier)}</span>
						</p>
					{/if}

					<!-- Total -->
					<p class="text-2xl font-black text-white">
						Total: <span class="text-amber-300">{result.total}</span>
					</p>

					<button
						onclick={rollAgain}
						class="mt-3 w-full rounded bg-amber-700 py-1.5 text-sm font-bold text-white transition hover:bg-amber-600"
					>
						Roll Again
					</button>
				</div>
			{/if}

			<!-- History -->
			{#if history.length > 0}
				<div>
					<p class="mb-1.5 text-xs font-semibold tracking-widest text-gray-500 uppercase">Recent Rolls</p>
					<div class="flex flex-col gap-1">
						{#each history as h, i}
							<div class="flex items-center justify-between rounded bg-gray-800/60 px-3 py-1.5 text-xs {i === 0 ? 'opacity-100' : 'opacity-60'}">
								<span class="font-mono text-gray-400">{historyExpr(h)}</span>
								<div class="flex items-center gap-2">
									<span class="text-gray-500">[{h.rolls.join(', ')}]</span>
									<span class="font-black text-amber-300">{h.total}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
