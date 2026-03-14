<!-- Core combat tracker component. Renders the turn-order list with HP bars,
     conditions, initiative values, and per-combatant controls (damage/heal, AC toggle,
     conditions, notes, monster stat block). Manages round/turn advancement and
     end-combat flow that writes a CombatRecord to history. DM-only. -->
<script lang="ts">
	import { combat } from '$lib/store.svelte';
	import { CONDITIONS, ADV_CONDITIONS, getMonsterDetail } from '$lib/enemies';
	import { conditionColors, hpPercent, hpBarColor, hpTextColor } from '$lib/utils';
	import type { Combatant, MonsterDetail } from '$lib/types';
	import MonsterInfoModal from '$lib/components/MonsterInfoModal.svelte';
	import CombatantNoteModal from '$lib/components/CombatantNoteModal.svelte';
	import ConditionInfoModal from '$lib/components/ConditionInfoModal.svelte';
	import { tick } from 'svelte';
	import ConcentrationCheckModal from '$lib/components/ConcentrationCheckModal.svelte';
	import ConditionTimingModal from '$lib/components/ConditionTimingModal.svelte';
	import LegendaryActionsModal from '$lib/components/LegendaryActionsModal.svelte';
	import LootModal from '$lib/components/LootModal.svelte';

	async function scrollToActive() {
		await tick();
		document
			.getElementById(`combatant-${combat.currentTurnId}`)
			?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}

	let openStatusId = $state<string | null>(null);
	let infoMonster = $state<MonsterDetail | null>(null);
	let conditionInfo = $state<string | null>(null);
	let noteTarget = $state<import('$lib/types').Combatant | null>(null);
	let lootTarget = $state<import('$lib/types').Combatant | null>(null);
	let concentrationCheck = $state<{ id: string; name: string; damage: number; dc: number } | null>(
		null
	);
	let pendingInitChange = $state<{
		id: string;
		name: string;
		value: string;
		oldValue: number | null;
	} | null>(null);
	// Detail map for imported custom monsters — keyed by monster name
	let customDetailMap = $state<Map<string, MonsterDetail>>(new Map());
	// Re-fetch whenever the set of sourced enemy names in combat changes so that
	// monsters imported during the current session are picked up immediately.
	const sourcedEnemyKey = $derived(
		combat.sorted
			.filter((ci) => ci.type === 'enemy' && ci.source && ci.templateName)
			.map((ci) => ci.templateName!)
			.sort()
			.join(' ')
	);
	$effect(() => {
		void sourcedEnemyKey; // reactive trigger: re-run when sourced enemies change
		fetch('/api/monsters')
			.then((r) => (r.ok ? r.json() : []))
			.then((monsters: Array<{ name: string; detail?: MonsterDetail }>) => {
				const m = new Map<string, MonsterDetail>();
				for (const mon of monsters) {
					if (mon.detail) m.set(mon.name, mon.detail);
				}
				customDetailMap = m;
			})
			.catch(() => {});
	});

	function getDetailForCombatant(c: Combatant): MonsterDetail | null {
		if (!c.templateName) return null;
		return getMonsterDetail(c.templateName) ?? customDetailMap.get(c.templateName) ?? null;
	}

	function showMonsterInfo(c: Combatant) {
		infoMonster = getDetailForCombatant(c);
	}
	let damageInputs = $state<Record<string, string>>({});
	let tempHpInputs = $state<Record<string, string>>({});
	let chronicleSaved = $state(false);
	let initiativeTimers: Record<string, ReturnType<typeof setTimeout>> = {};

	function handleSaveToChronicle() {
		combat.saveToChronicle();
		chronicleSaved = true;
		setTimeout(() => (chronicleSaved = false), 2000);
	}

	function handleInitiativeInput(id: string, raw: string, name: string, oldValue: number | null) {
		clearTimeout(initiativeTimers[id]);
		if (combat.isInCombat) {
			initiativeTimers[id] = setTimeout(() => {
				pendingInitChange = { id, name, value: raw, oldValue };
			}, 600);
		} else {
			initiativeTimers[id] = setTimeout(() => {
				const val = parseInt(raw);
				combat.update(id, { initiative: isNaN(val) ? null : val });
			}, 1000);
		}
	}

	function confirmInitChange() {
		if (!pendingInitChange) return;
		const val = parseInt(pendingInitChange.value);
		combat.update(pendingInitChange.id, { initiative: isNaN(val) ? null : val });
		pendingInitChange = null;
	}

	function cancelInitChange() {
		if (!pendingInitChange) return;
		const card = document.getElementById(`combatant-${pendingInitChange.id}`);
		const input = card?.querySelector('[data-init-input]') as HTMLInputElement | null;
		if (input)
			input.value = pendingInitChange.oldValue !== null ? String(pendingInitChange.oldValue) : '';
		pendingInitChange = null;
	}

	let legendaryInfoModal = $state<{ name: string; text: string } | null>(null);

	let pendingCondition = $state<{ id: string; combatantName: string; condition: string } | null>(
		null
	);

	function requestAddCondition(id: string, combatantName: string, condition: string) {
		pendingCondition = { id, combatantName, condition };
		openStatusId = null;
	}

	function commitDamage(c: Combatant, sign: 1 | -1) {
		const val = parseInt(damageInputs[c.id] ?? '');
		if (isNaN(val) || val <= 0) return;
		const wasConcentrating = sign === -1 && c.statuses.includes('Concentrating');
		combat.adjustHp(c.id, sign * val);
		damageInputs[c.id] = '';
		if (wasConcentrating) {
			concentrationCheck = {
				id: c.id,
				name: c.name,
				damage: val,
				dc: Math.max(10, Math.floor(val / 2))
			};
		}
	}

	function commitTempHp(id: string) {
		const val = parseInt(tempHpInputs[id] ?? '');
		if (isNaN(val) || val < 0) return;
		combat.setTempHp(id, val);
		tempHpInputs[id] = '';
	}
</script>

<div class="flex h-full flex-col gap-3">
	<!-- Header: title + turn controls + util buttons -->
	<div class="flex flex-wrap items-center gap-2">
		<h2 class="mr-2 text-lg font-bold tracking-wide text-white">Initiative Order</h2>

		{#if combat.isInCombat}
			<span class="rounded bg-amber-900/50 px-2 py-0.5 text-xs font-semibold text-amber-300">
				Round {combat.round}
			</span>
		{/if}

		<div class="ml-auto flex items-center gap-2">
			<!-- Turn navigation -->
			{#if combat.sorted.length > 0}
				{#if !combat.isInCombat}
					<button
						onclick={() => combat.startCombat()}
						class="rounded bg-amber-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-amber-500"
					>
						▶ Start Combat
					</button>
				{:else}
					<button
						onclick={() => {
							combat.prevTurn();
							scrollToActive();
						}}
						class="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 transition hover:bg-gray-600 hover:text-white"
						title="Previous turn"
					>
						<span class="hidden md:inline">◀ Prev</span>
						<span class="flex flex-col items-center md:hidden">
							<span>◀</span>
							<span>Prev</span>
						</span>
					</button>
					<button
						onclick={() => {
							combat.nextTurn();
							scrollToActive();
						}}
						class="rounded bg-amber-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-amber-500"
					>
						<span class="hidden md:inline">Next ▶</span>
						<span class="flex flex-col items-center md:hidden">
							<span>▶</span>
							<span>Next</span>
						</span>
					</button>
					<button
						onclick={() => combat.endCombat()}
						class="rounded bg-gray-700 px-2 py-1 text-xs text-gray-500 transition hover:bg-gray-600 hover:text-gray-300"
						title="End combat"
					>
						<span class="hidden md:inline">■ End</span>
						<span class="flex flex-col items-center md:hidden">
							<span>■</span>
							<span>End</span>
						</span>
					</button>
				{/if}
			{/if}

			<!-- Utility buttons -->
			<div class="h-4 w-px bg-gray-700"></div>
			{#if combat.hasCombatHistory}
				<button
					onclick={handleSaveToChronicle}
					title="Save a snapshot of this combat to Chronicles"
					class="flex items-center gap-1 rounded border px-2 py-1 text-xs font-semibold transition
					       {chronicleSaved
						? 'border-green-700 bg-green-900/40 text-green-300'
						: 'border-amber-800/60 bg-amber-900/20 text-amber-500 hover:border-amber-600 hover:bg-amber-900/40 hover:text-amber-300'}"
				>
					{#if chronicleSaved}
						✓ Saved
					{:else}
						📜 Save
					{/if}
				</button>
				<div class="h-4 w-px bg-gray-700"></div>
			{/if}
			<button
				onclick={() => combat.resetInitiatives()}
				class="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 transition hover:bg-gray-600 hover:text-white"
			>
				Reset Init
			</button>
			<button
				onclick={() => combat.resetPlayers()}
				class="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 transition hover:bg-gray-600 hover:text-white"
			>
				Reset Players
			</button>
			<button
				onclick={() => combat.clearEnemies()}
				class="rounded bg-red-900/60 px-2 py-1 text-xs text-red-300 transition hover:bg-red-800 hover:text-white"
			>
				Clear Enemies
			</button>
		</div>
	</div>

	{#if combat.sorted.length === 0}
		<div class="flex flex-1 items-center justify-center">
			<p class="text-center text-sm text-gray-600">
				Add players and enemies, then enter initiative rolls to begin.
			</p>
		</div>
	{:else}
		<!-- Combatant rows -->
		<div class="flex flex-1 flex-col gap-5 overflow-y-auto pr-2">
			{#each combat.sorted as c, i (c.id)}
				{@const isDead = c.currentHp === 0}
				{@const isActive = c.id === combat.currentTurnId}
				{@const pct = hpPercent(c)}
				{@const prevSameInit = i > 0 && combat.sorted[i - 1].initiative === c.initiative}
				{@const nextSameInit =
					i < combat.sorted.length - 1 && combat.sorted[i + 1].initiative === c.initiative}
				<div
					id="combatant-{c.id}"
					class="relative flex flex-col gap-2 rounded-lg border px-3 py-2 transition-all
					       {isActive
						? 'border-amber-500 bg-amber-950/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
						: isDead
							? 'border-gray-800 bg-gray-900/50 opacity-60'
							: c.type === 'lair'
								? 'border-purple-700/50 bg-purple-950/20'
								: c.type === 'player'
									? 'border-blue-900/50 bg-gray-800'
									: 'border-red-900/50 bg-gray-800'}"
				>
					{#if c.type === 'lair'}
						<!-- Lair Actions card -->
						<div class="flex items-center gap-2">
							{#if prevSameInit || nextSameInit}
								<div class="flex shrink-0 flex-col">
									<button
										onclick={() => combat.swapOrder(c.id, combat.sorted[i - 1].id)}
										disabled={!prevSameInit}
										title="Move up"
										class="text-xs leading-none text-gray-600 transition hover:text-gray-300 disabled:cursor-default disabled:opacity-20"
										>▲</button
									>
									<button
										onclick={() => combat.swapOrder(c.id, combat.sorted[i + 1].id)}
										disabled={!nextSameInit}
										title="Move down"
										class="text-xs leading-none text-gray-600 transition hover:text-gray-300 disabled:cursor-default disabled:opacity-20"
										>▼</button
									>
								</div>
							{/if}
							{#if isActive}
								<span class="text-amber-400" title="Active turn">▶</span>
							{/if}
							<span
								class="shrink-0 rounded bg-purple-900/60 px-1.5 py-0.5 text-xs font-bold text-purple-300"
								>LAIR</span
							>
							<span
								class="flex-1 truncate text-sm font-semibold {isActive
									? 'text-amber-100'
									: 'text-purple-200'}"
							>
								Lair Actions
								{#if c.templateName}
									<span class="ml-1 text-xs font-normal text-purple-400/60">— {c.templateName}</span
									>
								{/if}
							</span>
							<button
								onclick={() => combat.removeFromCombat(c.id)}
								title="Remove lair actions"
								class="rounded p-2 text-gray-600 transition hover:bg-red-900/40 hover:text-red-400"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
						<div class="flex items-center gap-3 px-1">
							<div class="flex flex-col items-center gap-0.5">
								<span class="text-xs tracking-wide text-gray-500 uppercase">Init</span>
								<span
									class="flex h-11 w-14 items-center justify-center text-xl font-bold text-amber-300"
									>20</span
								>
							</div>
							<p class="text-xs text-purple-400/60 italic">
								On initiative count 20, the lair takes action.
							</p>
						</div>
					{:else}
						<!-- Header row (badge + name + remove) -->
						<div class="flex items-center gap-2">
							{#if prevSameInit || nextSameInit}
								<div class="flex shrink-0 flex-col">
									<button
										onclick={() => combat.swapOrder(c.id, combat.sorted[i - 1].id)}
										disabled={!prevSameInit}
										title="Move up"
										class="text-xs leading-none text-gray-600 transition hover:text-gray-300 disabled:cursor-default disabled:opacity-20"
										>▲</button
									>
									<button
										onclick={() => combat.swapOrder(c.id, combat.sorted[i + 1].id)}
										disabled={!nextSameInit}
										title="Move down"
										class="text-xs leading-none text-gray-600 transition hover:text-gray-300 disabled:cursor-default disabled:opacity-20"
										>▼</button
									>
								</div>
							{/if}
							{#if isActive}
								<span class="text-amber-400" title="Active turn">▶</span>
							{/if}
							{#if c.type === 'player' && c.avatarUrl}
								<div class="h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-blue-700">
									<img src={c.avatarUrl} alt={c.name} class="h-full w-full object-cover" />
								</div>
							{:else}
								<span
									class="shrink-0 rounded px-1.5 py-0.5 text-xs font-bold
							       {c.type === 'player' ? 'bg-blue-900/60 text-blue-300' : 'bg-red-900/60 text-red-300'}"
								>
									{c.type === 'player' ? 'PC' : 'NPC'}
								</span>
							{/if}
							<span
								class="flex-1 truncate text-sm font-semibold {isActive
									? 'text-amber-100'
									: 'text-white'}"
							>
								{c.name}
							</span>
							{#if c.source}
								<span
									class="shrink-0 rounded bg-indigo-900/60 px-1 py-0.5 text-[10px] leading-none font-semibold text-indigo-300"
								>
									{c.source}
								</span>
							{/if}
							{#if c.type === 'enemy' && getDetailForCombatant(c)}
								<button
									onclick={() => showMonsterInfo(c)}
									title="View stat block"
									class="rounded p-2 text-gray-600 transition hover:text-blue-400"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</button>
							{/if}
							{#if c.type === 'enemy' && !combat.sorted.some((x) => x.type === 'lair' && x.templateName === c.templateName)}
								<button
									onclick={() => combat.addLairCard(c.templateName ?? c.name)}
									title="Add Lair Actions to initiative"
									class="rounded p-2 text-gray-600 transition hover:text-purple-400"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
										/>
									</svg>
								</button>
							{/if}
							<button
								onclick={() => (noteTarget = c)}
								title="Notes"
								class="rounded p-2 transition {c.note?.replace(/<[^>]*>/g, '').trim()
									? 'text-amber-300 [filter:drop-shadow(0_0_5px_theme(colors.amber.400))] hover:text-amber-200'
									: 'text-gray-600 hover:text-gray-400'}"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
							</button>
							<button
								onclick={() => combat.removeFromCombat(c.id)}
								title={c.type === 'player'
									? 'Remove from combat (keeps in party)'
									: 'Remove from combat'}
								class="rounded p-2 text-gray-600 transition hover:bg-red-900/40 hover:text-red-400"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>

						<!-- Stats row (init | hp | ac) -->
						<div class="grid grid-cols-[auto_1fr_auto] items-start gap-3">
							<!-- Init -->
							<div class="flex flex-col items-center gap-0.5">
								<span class="text-xs tracking-wide text-gray-500 uppercase">Init</span>
								<input
									type="number"
									data-init-input
									value={c.initiative ?? ''}
									placeholder="—"
									oninput={(e) =>
										handleInitiativeInput(c.id, e.currentTarget.value, c.name, c.initiative)}
									class="h-11 w-14 rounded border border-gray-600 bg-gray-900 text-center text-xl font-bold text-amber-300 focus:border-amber-500 focus:outline-none"
								/>
							</div>
							<!-- HP display + bar -->
							<div class="flex flex-col gap-1.5 pt-5">
								<div class="flex items-center gap-1.5">
									<span class="text-base font-bold {hpTextColor(pct)}">{c.currentHp}</span>
									<span class="text-xs text-gray-600">/</span>
									<span class="text-sm text-gray-400">{c.maxHp}</span>
									{#if c.tempHp > 0}
										<span
											class="rounded bg-yellow-800/70 px-1.5 py-0.5 text-xs font-bold text-yellow-300"
										>
											+{c.tempHp} THP
										</span>
									{/if}
								</div>
								<div class="relative h-2 w-full rounded-full bg-gray-700">
									{#if c.tempHp > 0}
										{@const total = c.maxHp + c.tempHp}
										{@const hpW = (c.currentHp / total) * 100}
										{@const thpW = (c.tempHp / total) * 100}
										<div
											class="h-full rounded-full transition-all {hpBarColor(pct)}"
											style="width: {hpW}%"
										></div>
										<div
											class="absolute top-0 h-full rounded-full bg-yellow-400 transition-all"
											style="left: {hpW}%; width: {thpW}%"
										></div>
									{:else}
										<div
											class="h-full rounded-full transition-all {hpBarColor(pct)}"
											style="width: {pct}%"
										></div>
									{/if}
								</div>
							</div>
							<!-- AC -->
							<div class="flex flex-col items-center gap-0.5">
								<span class="text-xs tracking-wide text-gray-500 uppercase">AC</span>
								<div class="flex items-center gap-1">
									<span class="text-xl font-bold text-gray-200">{c.ac}</span>
								</div>
							</div>
						</div>

						<!-- Damage row -->
						<div class="flex items-center gap-2">
							<input
								type="number"
								placeholder="amt"
								min="1"
								bind:value={damageInputs[c.id]}
								class="h-11 w-16 rounded border border-gray-600 bg-gray-900 px-2 text-center text-sm text-white focus:border-amber-500 focus:outline-none"
							/>
							<button
								onclick={() => commitDamage(c, -1)}
								title="Deal damage"
								class="h-11 flex-1 rounded bg-red-900/60 text-sm font-bold text-red-300 hover:bg-red-800"
							>
								− Damage
							</button>
							<button
								onclick={() => commitDamage(c, 1)}
								title="Heal"
								class="h-11 flex-1 rounded bg-green-900/60 text-sm font-bold text-green-300 hover:bg-green-800"
							>
								+ Heal
							</button>
						</div>

						<!-- THP row (players only) -->
						{#if c.type === 'player'}
							<div class="flex items-center gap-2">
								<input
									type="number"
									placeholder="THP"
									min="0"
									bind:value={tempHpInputs[c.id]}
									onkeydown={(e) => e.key === 'Enter' && commitTempHp(c.id)}
									class="h-11 w-16 rounded border border-yellow-900/60 bg-gray-900 px-2 text-center text-sm text-yellow-300 placeholder-yellow-900 focus:border-yellow-600 focus:outline-none"
								/>
								<button
									onclick={() => commitTempHp(c.id)}
									class="h-11 flex-1 rounded bg-yellow-800/50 text-sm font-bold text-yellow-300 hover:bg-yellow-700/60"
								>
									Set Temp HP
								</button>
								{#if c.tempHp > 0}
									<button
										onclick={() => combat.setTempHp(c.id, 0)}
										class="h-11 w-11 rounded text-gray-600 hover:text-gray-400"
										title="Clear temp HP"
									>
										✕
									</button>
								{/if}
							</div>
						{/if}

						<!-- Death saves row (players at 0 HP) -->
						{#if c.type === 'player' && c.currentHp <= 0}
							{@const ds = c.deathSaves ?? { successes: 0, failures: 0, stable: false }}
							{@const isDead = ds.failures >= 3}
							{@const isStable = ds.stable || ds.successes >= 3}
							<div class="rounded border border-gray-700 bg-gray-900/60 px-2 py-2 text-xs">
								<div class="mb-1.5 flex items-center gap-2">
									<span class="font-bold tracking-widest text-gray-400 uppercase"
										>☠ Death Saves</span
									>
									<button
										onclick={() =>
											combat.setDeathSaves(c.id, { successes: 0, failures: 0, stable: false })}
										class="ml-auto text-[10px] text-gray-600 transition hover:text-gray-400"
										title="Reset death saves">reset</button
									>
								</div>
								{#if isDead}
									<div
										class="flex items-center gap-2 rounded bg-red-950/60 px-2 py-1.5 text-sm font-bold text-red-400"
									>
										<span>☠</span><span>Dead</span>
									</div>
								{:else if isStable}
									<div
										class="flex items-center gap-2 rounded bg-green-950/60 px-2 py-1.5 text-sm font-bold text-green-400"
									>
										<span>♥</span><span>Stable</span>
									</div>
								{:else}
									<div class="flex items-center gap-4">
										<div class="flex flex-col gap-1">
											<span class="text-[10px] font-semibold tracking-wider text-red-500 uppercase"
												>Failures</span
											>
											<div class="flex gap-1">
												{#each [0, 1, 2] as i}
													<button
														onclick={() => {
															const filled = ds.failures > i;
															combat.setDeathSaves(c.id, { ...ds, failures: filled ? i : i + 1 });
														}}
														class="h-5 w-5 rounded-full border text-xs transition {ds.failures > i
															? 'border-red-600 bg-red-700 text-red-200 hover:bg-red-800'
															: 'border-gray-600 bg-gray-800 text-gray-600 hover:border-red-700 hover:bg-red-950'}"
													>
														{ds.failures > i ? '☠' : '○'}
													</button>
												{/each}
											</div>
										</div>
										<div class="flex flex-col gap-1">
											<span
												class="text-[10px] font-semibold tracking-wider text-green-600 uppercase"
												>Successes</span
											>
											<div class="flex gap-1">
												{#each [0, 1, 2] as i}
													<button
														onclick={() => {
															const filled = ds.successes > i;
															combat.setDeathSaves(c.id, { ...ds, successes: filled ? i : i + 1 });
														}}
														class="h-5 w-5 rounded-full border text-xs transition {ds.successes > i
															? 'border-green-600 bg-green-700 text-green-200 hover:bg-green-800'
															: 'border-gray-600 bg-gray-800 text-gray-600 hover:border-green-700 hover:bg-green-950'}"
													>
														{ds.successes > i ? '♥' : '○'}
													</button>
												{/each}
											</div>
										</div>
										<button
											onclick={() => combat.setDeathSaves(c.id, { ...ds, stable: true })}
											class="ml-auto rounded border border-green-800/60 bg-green-950/40 px-2 py-1 text-[10px] font-semibold text-green-500 transition hover:bg-green-900/50 hover:text-green-300"
										>
											Stabilize
										</button>
									</div>
								{/if}
							</div>
						{/if}

						<!-- Conditions row -->
						<div class="relative flex flex-wrap items-start gap-1.5">
							{#each c.statuses as status}
								<div
									class="flex items-center rounded text-xs font-medium {conditionColors[status] ??
										'bg-gray-700 text-gray-300'}"
								>
									<button
										onclick={() => combat.toggleStatus(c.id, status)}
										title="Remove {status}"
										class="px-2 py-1.5 transition hover:opacity-70"
									>
										{status}{#if c.conditionRounds?.[status]}<span
												class="ml-1 text-[10px] font-normal opacity-75"
												>({c.conditionRounds[status]})</span
											>{/if}
									</button>
									<button
										onclick={() => (conditionInfo = status)}
										title="What is {status}?"
										class="border-l border-white/10 px-1.5 py-1.5 opacity-40 transition hover:opacity-100"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-3 w-3"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									</button>
								</div>
							{/each}
							<button
								onclick={() => (openStatusId = openStatusId === c.id ? null : c.id)}
								class="rounded border border-gray-600 px-2 py-1.5 text-xs text-gray-500 transition hover:border-gray-500 hover:text-gray-300"
							>
								+ Condition
							</button>
							{#if openStatusId === c.id}
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="absolute top-full left-0 z-20 mt-1 w-48 rounded-lg border border-gray-600 bg-gray-900 p-2 shadow-xl"
									onmouseleave={() => (openStatusId = null)}
								>
									<div class="grid grid-cols-2 gap-1">
										{#each CONDITIONS as cond}
											{@const active = c.statuses.includes(cond)}
											<button
												onclick={() =>
													active
														? combat.toggleStatus(c.id, cond)
														: requestAddCondition(c.id, c.name, cond)}
												class="rounded px-2 py-1 text-left text-xs transition
											       {active
													? (conditionColors[cond] ?? 'bg-gray-700 text-white') +
														' ring-1 ring-white/20'
													: 'text-gray-400 hover:bg-gray-800 hover:text-white'}"
											>
												{cond}
											</button>
										{/each}
									</div>
									<div class="my-1.5 flex items-center gap-1.5 border-t border-gray-700 pt-1.5">
										<span class="text-[10px] font-semibold tracking-wider text-gray-600 uppercase"
											>Adv / Disadv</span
										>
									</div>
									<div class="grid grid-cols-1 gap-1">
										{#each ADV_CONDITIONS as cond}
											{@const active = c.statuses.includes(cond)}
											<button
												onclick={() =>
													active
														? combat.toggleStatus(c.id, cond)
														: requestAddCondition(c.id, c.name, cond)}
												class="rounded px-2 py-1 text-left text-xs transition
											       {active
													? (conditionColors[cond] ?? 'bg-gray-700 text-white') +
														' ring-1 ring-white/20'
													: 'text-gray-400 hover:bg-gray-800 hover:text-white'}"
											>
												{cond}
											</button>
										{/each}
									</div>
								</div>
							{/if}
						</div>
						{#if c.type === 'enemy'}
							{@const legendaryDetail = getDetailForCombatant(c)}
							{#if legendaryDetail?.legendaryActions}
								{@const spent = c.legendaryActionsSpent ?? 0}
								<div class="flex items-center gap-2">
									<span class="shrink-0 text-xs font-semibold text-amber-200/70"
										>Legendary Actions:</span
									>
									<div class="flex items-center gap-1">
										{#each [0, 1, 2] as dotIdx}
											{@const isSpent = dotIdx >= 3 - spent}
											<button
												onclick={() =>
													combat.setLegendaryActionsSpent(c.id, isSpent ? 2 - dotIdx : 3 - dotIdx)}
												title={isSpent ? 'Mark as available' : 'Spend action'}
												class="h-4 w-4 rounded-full border-2 transition {isSpent
													? 'border-amber-600 bg-transparent hover:bg-amber-900/30'
													: 'border-amber-400 bg-amber-400 hover:bg-amber-300'}"
											></button>
										{/each}
									</div>
									<button
										onclick={() =>
											(legendaryInfoModal = {
												name: c.name,
												text: legendaryDetail.legendaryActions!
											})}
										title="View legendary actions"
										class="rounded p-1 text-gray-600 transition hover:text-blue-400"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-3.5 w-3.5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									</button>
								</div>
							{/if}
						{/if}
						{#if c.currentHp <= 0}
							<button
								onclick={() => (lootTarget = c)}
								title={c.loot?.length ? 'Edit loot' : 'Roll loot'}
								class="flex items-center gap-1.5 rounded border border-amber-800/50 bg-amber-950/30 px-2 py-1 text-xs text-amber-500 transition hover:border-amber-600 hover:text-amber-300"
							>
								⬡ {c.loot?.length ? `${c.loot.length} item${c.loot.length > 1 ? 's' : ''}` : 'Loot'}
							</button>
						{/if}
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<MonsterInfoModal monster={infoMonster} onclose={() => (infoMonster = null)} />
<ConditionInfoModal condition={conditionInfo} onclose={() => (conditionInfo = null)} />
<CombatantNoteModal
	combatant={noteTarget}
	onclose={() => (noteTarget = null)}
	onsave={(id, note) => combat.update(id, { note })}
/>

{#if lootTarget}
	<LootModal
		combatant={lootTarget}
		onclose={() => (lootTarget = null)}
		onsave={(id, loot) => {
			combat.setLoot(id, loot);
			lootTarget = null;
		}}
	/>
{/if}

<ConcentrationCheckModal
	check={concentrationCheck}
	onsuccess={() => (concentrationCheck = null)}
	onfail={(id) => {
		combat.toggleStatus(id, 'Concentrating');
		concentrationCheck = null;
	}}
/>

<ConditionTimingModal
	pending={pendingCondition}
	onconfirmtimed={(rounds) => {
		combat.toggleStatus(pendingCondition!.id, pendingCondition!.condition, Math.max(1, rounds));
		pendingCondition = null;
	}}
	onconfirmindefinite={() => {
		combat.toggleStatus(pendingCondition!.id, pendingCondition!.condition);
		pendingCondition = null;
	}}
	oncancel={() => (pendingCondition = null)}
/>

<LegendaryActionsModal modal={legendaryInfoModal} onclose={() => (legendaryInfoModal = null)} />

{#if pendingInitChange}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
		onmousedown={(e) => {
			if (e.target === e.currentTarget) cancelInitChange();
		}}
	>
		<div class="mx-4 w-full max-w-sm rounded-xl border border-amber-700/60 bg-gray-900 shadow-2xl">
			<div class="flex items-center gap-2 border-b border-amber-900/40 px-5 py-3">
				<span class="text-amber-400">⚠</span>
				<span class="text-sm font-bold tracking-widest text-amber-300 uppercase"
					>Change Initiative Mid-Combat?</span
				>
			</div>
			<div class="px-5 py-4">
				<p class="text-sm text-gray-300">
					You're changing <span class="font-bold text-white">{pendingInitChange.name}</span>'s
					initiative to <span class="font-bold text-amber-300">{pendingInitChange.value}</span> while
					combat is active.
				</p>
				<p class="mt-2 text-xs text-gray-500">This will re-sort the turn order immediately.</p>
			</div>
			<div class="flex gap-2 border-t border-gray-800 px-5 py-3">
				<button
					onclick={confirmInitChange}
					class="flex-1 rounded bg-amber-700/60 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-600/70"
				>
					Yes, change it
				</button>
				<button
					onclick={cancelInitChange}
					class="flex-1 rounded bg-gray-700/50 py-2 text-sm font-semibold text-gray-300 transition hover:bg-gray-600/60"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}
