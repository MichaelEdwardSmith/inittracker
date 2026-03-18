<!-- AoE Damage modal — apply one damage/heal value to multiple combatants at once.
     Supports per-combatant "saved for half" checkbox. Fires onconcentrationchecks
     with any concentration saves that need to be resolved after applying damage. -->
<script lang="ts">
	import { combat } from '$lib/store.svelte';
	import { hpPercent, hpBarColor, hpTextColor } from '$lib/utils';

	interface ConcentrationCheck {
		id: string;
		name: string;
		damage: number;
		dc: number;
	}

	interface Props {
		onclose: () => void;
		onconcentrationchecks?: (checks: ConcentrationCheck[]) => void;
	}

	let { onclose, onconcentrationchecks }: Props = $props();

	// Active combatants only — exclude lair cards and benched players
	const combatants = $derived(
		combat.sorted.filter((c) => c.type !== 'lair' && c.inCombat !== false)
	);

	// Treat undefined as selected (true). Only false = explicitly deselected.
	let selected = $state<Record<string, boolean>>({});
	let saved = $state<Record<string, boolean>>({});
	let amount = $state('');

	const isSelected = (id: string) => selected[id] !== false;

	const allSelected = $derived(combatants.length > 0 && combatants.every((c) => isSelected(c.id)));

	function toggleAll() {
		const next = !allSelected;
		const s: Record<string, boolean> = {};
		for (const c of combatants) s[c.id] = next;
		selected = s;
	}

	function applyDamage() {
		const val = parseInt(amount);
		if (isNaN(val) || val <= 0) return;
		const targets: Array<{ id: string; delta: number }> = [];
		const checks: ConcentrationCheck[] = [];
		for (const c of combatants) {
			if (!isSelected(c.id)) continue;
			const dmg = saved[c.id] ? Math.floor(val / 2) : val;
			targets.push({ id: c.id, delta: -dmg });
			if (c.statuses.includes('Concentrating')) {
				checks.push({ id: c.id, name: c.name, damage: dmg, dc: Math.max(10, Math.floor(dmg / 2)) });
			}
		}
		combat.applyAoE(targets);
		if (checks.length > 0) onconcentrationchecks?.(checks);
		onclose();
	}

	function applyHeal() {
		const val = parseInt(amount);
		if (isNaN(val) || val <= 0) return;
		const targets: Array<{ id: string; delta: number }> = [];
		for (const c of combatants) {
			if (!isSelected(c.id)) continue;
			const heal = saved[c.id] ? Math.floor(val / 2) : val;
			targets.push({ id: c.id, delta: heal });
		}
		combat.applyAoE(targets);
		onclose();
	}

	const valid = $derived(parseInt(amount) > 0);
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') onclose(); }} />

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	role="dialog"
	aria-modal="true"
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
	onclick={(e) => {
		if (e.target === e.currentTarget) onclose();
	}}
>
	<div class="mx-4 flex w-full max-w-md flex-col rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-700 px-5 py-4">
			<h2 class="font-bold text-white">Area of Effect</h2>
			<button
				onclick={onclose}
				class="rounded p-1 text-gray-500 transition hover:text-white"
				aria-label="Close"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Column headers -->
		<div class="flex items-center gap-3 border-b border-gray-800 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
			<button
				onclick={toggleAll}
				title="Select all"
				class="flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] transition
				       {allSelected ? 'border-amber-500 bg-amber-500 text-black' : 'border-gray-600 text-transparent'}"
			>✓</button>
			<span class="flex-1">Combatant</span>
			<span class="w-20 text-right">HP</span>
			<span class="w-10 text-center">Half</span>
		</div>

		<!-- Combatant list -->
		<div class="max-h-72 overflow-y-auto">
			{#each combatants as c (c.id)}
				{@const pct = hpPercent(c)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="flex cursor-pointer items-center gap-3 border-b border-gray-800/50 px-4 py-2.5 last:border-0 transition
					       {isSelected(c.id) ? '' : 'opacity-50'}"
					onclick={() => (selected[c.id] = !isSelected(c.id))}
					onkeydown={(e) => { if (e.key === ' ' || e.key === 'Enter') selected[c.id] = !isSelected(c.id); }}
				>
					<!-- Include checkbox -->
					<div
						class="flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px]
						       {isSelected(c.id) ? 'border-amber-500 bg-amber-500 text-black' : 'border-gray-600 text-transparent'}"
					>✓</div>

					<!-- Name + mini HP bar -->
					<div class="flex min-w-0 flex-1 flex-col gap-0.5">
						<span class="truncate text-sm font-medium {c.type === 'player' ? 'text-blue-300' : 'text-red-300'}">
							{c.name}
						</span>
						<div class="h-1 w-full rounded-full bg-gray-700">
							<div class="h-1 rounded-full {hpBarColor(pct)}" style="width: {pct}%"></div>
						</div>
					</div>

					<!-- HP text -->
					<span class="w-20 shrink-0 text-right text-xs {hpTextColor(pct)}">{c.currentHp}/{c.maxHp}</span>

					<!-- Saved (half) checkbox -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						onclick={(e) => {
							e.stopPropagation();
							if (isSelected(c.id)) saved[c.id] = !saved[c.id];
						}}
						onkeydown={(e) => {
							if (e.key === ' ' || e.key === 'Enter') {
								e.stopPropagation();
								if (isSelected(c.id)) saved[c.id] = !saved[c.id];
							}
						}}
						title="Saved for half"
						class="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded border text-[9px] transition
						       {saved[c.id] && isSelected(c.id) ? 'border-blue-400 bg-blue-500 text-white' : 'border-gray-600 text-transparent'}"
					>✓</div>
				</div>
			{/each}

			{#if combatants.length === 0}
				<p class="py-8 text-center text-sm text-gray-600">No active combatants.</p>
			{/if}
		</div>

		<!-- Footer: amount input + action buttons -->
		<div class="flex items-center gap-2 border-t border-gray-700 px-4 py-3">
			<!-- svelte-ignore a11y_autofocus -->
			<input
				autofocus
				bind:value={amount}
				type="number"
				min="1"
				placeholder="Amount"
				onkeydown={(e) => { if (e.key === 'Enter') applyDamage(); }}
				class="w-24 rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-center text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
			/>
			<button
				onclick={applyDamage}
				disabled={!valid}
				class="flex-1 rounded bg-red-800 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
			>
				− Damage
			</button>
			<button
				onclick={applyHeal}
				disabled={!valid}
				class="flex-1 rounded bg-green-800 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
			>
				+ Heal
			</button>
			<button
				onclick={onclose}
				class="rounded border border-gray-700 px-3 py-1.5 text-sm text-gray-400 transition hover:border-gray-600 hover:text-white"
			>
				Cancel
			</button>
		</div>
	</div>
</div>
