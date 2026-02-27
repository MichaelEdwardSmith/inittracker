<script lang="ts">
	import { combat } from '$lib/store.svelte';
	import { CONDITIONS, getMonsterDetail } from '$lib/enemies';
	import { conditionColors, hpPercent, hpBarColor, hpTextColor } from '$lib/utils';
	import type { Combatant, MonsterDetail } from '$lib/types';
	import MonsterInfoModal from '$lib/components/MonsterInfoModal.svelte';
	import ConditionInfoModal from '$lib/components/ConditionInfoModal.svelte';

	let openStatusId = $state<string | null>(null);
	let infoMonster = $state<MonsterDetail | null>(null);
	let conditionInfo = $state<string | null>(null);

	function showMonsterInfo(c: Combatant) {
		if (c.templateName) infoMonster = getMonsterDetail(c.templateName) ?? null;
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

	function handleInitiativeInput(id: string, raw: string) {
		clearTimeout(initiativeTimers[id]);
		initiativeTimers[id] = setTimeout(() => {
			const val = parseInt(raw);
			combat.update(id, { initiative: isNaN(val) ? null : val });
		}, 1000);
	}

	function commitDamage(c: Combatant, sign: 1 | -1) {
		const val = parseInt(damageInputs[c.id] ?? '');
		if (isNaN(val) || val <= 0) return;
		combat.adjustHp(c.id, sign * val);
		damageInputs[c.id] = '';
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
						onclick={() => combat.prevTurn()}
						class="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 transition hover:bg-gray-600 hover:text-white"
						title="Previous turn"
					>
						◀ Prev
					</button>
					<button
						onclick={() => combat.nextTurn()}
						class="rounded bg-amber-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-amber-500"
					>
						Next ▶
					</button>
					<button
						onclick={() => combat.endCombat()}
						class="rounded bg-gray-700 px-2 py-1 text-xs text-gray-500 transition hover:bg-gray-600 hover:text-gray-300"
						title="End combat"
					>
						■ End
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
		<!-- Column headers (desktop only) -->
		<div
			class="hidden md:grid items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500"
			style="grid-template-columns: 3.5rem 1fr 3rem 10rem 1fr auto"
		>
			<div>Init</div>
			<div>Name</div>
			<div class="text-center">AC/Show</div>
			<div class="text-center">Hit Points</div>
			<div>Conditions</div>
			<div></div>
		</div>

		<!-- Combatant rows -->
		<div class="flex flex-1 flex-col gap-1.5 overflow-y-auto">
			{#each combat.sorted as c (c.id)}
				{@const isDead = c.currentHp === 0}
				{@const isActive = c.id === combat.currentTurnId}
				{@const pct = hpPercent(c)}
				<div
					class="flex flex-col gap-2 rounded-lg border px-3 py-2 transition-all md:grid md:items-center md:gap-2
					       {isActive
						? 'border-amber-500 bg-amber-950/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
						: isDead
							? 'border-gray-800 bg-gray-900/50 opacity-60'
							: c.type === 'player'
								? 'border-blue-900/50 bg-gray-800'
								: 'border-red-900/50 bg-gray-800'}"
					style="grid-template-columns: 3.5rem 1fr 3rem 10rem 1fr auto"
				>
					<!-- ─── MOBILE LAYOUT ───────────────────────────────── -->

					<!-- Mobile: header row (badge + name + remove) -->
					<div class="flex items-center gap-2 md:hidden">
						{#if isActive}
							<span class="text-amber-400" title="Active turn">▶</span>
						{/if}
						{#if c.type === 'player' && c.avatarUrl}
							<div class="h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-blue-700">
								<img src={c.avatarUrl} alt={c.name} class="h-full w-full object-cover" />
							</div>
						{:else}
							<span class="shrink-0 rounded px-1.5 py-0.5 text-xs font-bold
							       {c.type === 'player' ? 'bg-blue-900/60 text-blue-300' : 'bg-red-900/60 text-red-300'}">
								{c.type === 'player' ? 'PC' : 'NPC'}
							</span>
						{/if}
						<span class="flex-1 truncate text-sm font-semibold {isActive ? 'text-amber-100' : 'text-white'}">
							{c.name}
						</span>
						{#if c.type === 'enemy' && getMonsterDetail(c.templateName ?? '')}
							<button
								onclick={() => showMonsterInfo(c)}
								title="View stat block"
								class="rounded p-2 text-gray-600 transition hover:text-blue-400"
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</button>
						{/if}
						<button
							onclick={() => combat.removeFromCombat(c.id)}
							title={c.type === 'player' ? 'Remove from combat (keeps in party)' : 'Remove from combat'}
							class="rounded p-2 text-gray-600 transition hover:bg-red-900/40 hover:text-red-400"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					<!-- Mobile: stats row (init | hp | ac) -->
					<div class="grid grid-cols-[auto_1fr_auto] items-start gap-3 md:hidden">
						<!-- Init -->
						<div class="flex flex-col items-center gap-0.5">
							<span class="text-xs uppercase tracking-wide text-gray-500">Init</span>
							<input
								type="number"
								value={c.initiative ?? ''}
								placeholder="—"
								oninput={(e) => handleInitiativeInput(c.id, e.currentTarget.value)}
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
									<span class="rounded bg-yellow-800/70 px-1.5 py-0.5 text-xs font-bold text-yellow-300">
										+{c.tempHp} THP
									</span>
								{/if}
							</div>
							<div class="relative h-2 w-full rounded-full bg-gray-700">
								<div
									class="h-full rounded-full transition-all {hpBarColor(pct)}"
									style="width: {pct}%"
								></div>
								{#if c.tempHp > 0}
									{@const thpPct = Math.min((c.tempHp / c.maxHp) * 100, Math.max(0, 100 - pct))}
									<div
										class="absolute top-0 h-full rounded-full bg-yellow-400 transition-all"
										style="left: {pct}%; width: {thpPct}%"
									></div>
								{/if}
							</div>
						</div>
						<!-- AC -->
						<div class="flex flex-col items-center gap-0.5">
							<span class="text-xs uppercase tracking-wide text-gray-500">AC</span>
							<div class="flex items-center gap-1">
								{#if c.type === 'enemy'}
									<input
										type="checkbox"
										checked={c.showAc === true}
										title="Show AC to players"
										onchange={(e) => combat.update(c.id, { showAc: e.currentTarget.checked })}
										class="h-3.5 w-3.5 cursor-pointer accent-amber-500"
									/>
								{/if}
								<span class="text-xl font-bold text-gray-200">{c.ac}</span>
							</div>
						</div>
					</div>

					<!-- Mobile: damage row -->
					<div class="flex items-center gap-2 md:hidden">
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

					<!-- Mobile: THP row (players only) -->
					{#if c.type === 'player'}
						<div class="flex items-center gap-2 md:hidden">
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

					<!-- Mobile: conditions row -->
					<div class="relative flex flex-wrap items-start gap-1.5 md:hidden">
						{#each c.statuses as status}
							<div class="flex items-center rounded text-xs font-medium {conditionColors[status] ?? 'bg-gray-700 text-gray-300'}">
								<button
									onclick={() => combat.toggleStatus(c.id, status)}
									title="Remove {status}"
									class="px-2 py-1.5 transition hover:opacity-70"
								>
									{status}
								</button>
								<button
									onclick={() => (conditionInfo = status)}
									title="What is {status}?"
									class="border-l border-white/10 px-1.5 py-1.5 opacity-40 transition hover:opacity-100"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
								class="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-600 bg-gray-900 p-2 shadow-xl"
								onmouseleave={() => (openStatusId = null)}
							>
								<div class="grid grid-cols-2 gap-1">
									{#each CONDITIONS as cond}
										{@const active = c.statuses.includes(cond)}
										<button
											onclick={() => combat.toggleStatus(c.id, cond)}
											class="rounded px-2 py-1 text-left text-xs transition
											       {active
												? (conditionColors[cond] ?? 'bg-gray-700 text-white') + ' ring-1 ring-white/20'
												: 'text-gray-400 hover:bg-gray-800 hover:text-white'}"
										>
											{cond}
										</button>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<!-- ─── DESKTOP LAYOUT ──────────────────────────────── -->

					<!-- Initiative (desktop) -->
					<input
						type="number"
						value={c.initiative ?? ''}
						placeholder="—"
						oninput={(e) => handleInitiativeInput(c.id, e.currentTarget.value)}
						class="hidden w-full rounded border border-gray-600 bg-gray-900 px-1.5 py-1 text-center text-sm font-bold text-amber-300 focus:border-amber-500 focus:outline-none md:block"
					/>

					<!-- Name + type badge + active indicator (desktop) -->
					<div class="hidden md:block min-w-0">
						<div class="flex items-center gap-1.5">
							{#if isActive}
								<span class="text-amber-400" title="Active turn">▶</span>
							{/if}
							{#if c.type === 'player' && c.avatarUrl}
								<div class="h-6 w-6 shrink-0 overflow-hidden rounded-full ring-1 ring-blue-700">
									<img src={c.avatarUrl} alt={c.name} class="h-full w-full object-cover" />
								</div>
							{:else}
								<span
									class="shrink-0 rounded px-1 py-0.5 text-xs font-bold
									       {c.type === 'player' ? 'bg-blue-900/60 text-blue-300' : 'bg-red-900/60 text-red-300'}"
								>
									{c.type === 'player' ? 'PC' : 'NPC'}
								</span>
							{/if}
							<span
								class="truncate text-sm font-medium
								       {isActive ? 'text-amber-100' : 'text-white'}"
							>
								{c.name}
							</span>
						</div>
					</div>

					<!-- AC (desktop) -->
					<div class="hidden items-center justify-end gap-1 pr-3 md:flex">
						{#if c.type === 'enemy'}
							<input
								type="checkbox"
								checked={c.showAc === true}
								title="Show AC to players"
								onchange={(e) => combat.update(c.id, { showAc: e.currentTarget.checked })}
								class="h-3 w-3 cursor-pointer accent-amber-500"
							/>
						{/if}
						<span class="text-xl font-semibold text-gray-200">{c.ac}</span>
					</div>

					<!-- HP bar + controls (desktop) -->
					<div class="hidden flex-col gap-1 md:flex">
						<!-- HP numbers + THP badge -->
						<div class="flex items-center gap-1.5">
							<span class="text-sm font-bold {hpTextColor(pct)}">{c.currentHp}</span>
							<span class="text-xs text-gray-600">/</span>
							<span class="text-xs text-gray-400">{c.maxHp}</span>
							{#if c.tempHp > 0}
								<span class="rounded bg-yellow-800/70 px-1 py-0.5 text-xs font-bold text-yellow-300">
									+{c.tempHp}
								</span>
							{/if}
						</div>
						<!-- HP bar -->
						<div class="relative h-1.5 w-full rounded-full bg-gray-700">
							<div
								class="h-full rounded-full transition-all {hpBarColor(pct)}"
								style="width: {pct}%"
							></div>
							{#if c.tempHp > 0}
								{@const thpPct = Math.min((c.tempHp / c.maxHp) * 100, Math.max(0, 100 - pct))}
								<div
									class="absolute top-0 h-full rounded-full bg-yellow-400 transition-all"
									style="left: {pct}%; width: {thpPct}%"
								></div>
							{/if}
						</div>
						<!-- Damage / Heal row -->
						<div class="flex items-center gap-1">
							<input
								type="number"
								placeholder="amt"
								min="1"
								bind:value={damageInputs[c.id]}
								class="w-12 rounded border border-gray-600 bg-gray-900 px-1 py-0.5 text-center text-xs text-white focus:border-amber-500 focus:outline-none"
							/>
							<button
								onclick={() => commitDamage(c, -1)}
								title="Deal damage"
								class="rounded bg-red-900/60 px-1.5 py-0.5 text-xs font-bold text-red-300 hover:bg-red-800"
							>
								Dmg
							</button>
							<button
								onclick={() => commitDamage(c, 1)}
								title="Heal"
								class="rounded bg-green-900/60 px-1.5 py-0.5 text-xs font-bold text-green-300 hover:bg-green-800"
							>
								Heal
							</button>
						</div>
						<!-- Temp HP row (players only) -->
						{#if c.type === 'player'}
							<div class="flex items-center gap-1">
								<input
									type="number"
									placeholder="THP"
									min="0"
									bind:value={tempHpInputs[c.id]}
									onkeydown={(e) => e.key === 'Enter' && commitTempHp(c.id)}
									class="w-12 rounded border border-yellow-900/60 bg-gray-900 px-1 py-0.5 text-center text-xs text-yellow-300 placeholder-yellow-900 focus:border-yellow-600 focus:outline-none"
								/>
								<button
									onclick={() => commitTempHp(c.id)}
									class="rounded bg-yellow-800/50 px-1.5 py-0.5 text-xs font-bold text-yellow-300 hover:bg-yellow-700/60"
								>
									Set Temp HP
								</button>
								{#if c.tempHp > 0}
									<button
										onclick={() => combat.setTempHp(c.id, 0)}
										class="rounded px-1 py-0.5 text-xs text-gray-600 hover:text-gray-400"
										title="Clear temp HP"
									>
										✕
									</button>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Conditions (desktop) -->
					<div class="relative hidden flex-wrap items-start gap-1 md:flex">
						{#each c.statuses as status}
							<div class="flex items-center rounded text-xs font-medium {conditionColors[status] ?? 'bg-gray-700 text-gray-300'}">
								<button
									onclick={() => combat.toggleStatus(c.id, status)}
									title="Remove {status}"
									class="px-1.5 py-0.5 transition hover:opacity-70"
								>
									{status}
								</button>
								<button
									onclick={() => (conditionInfo = status)}
									title="What is {status}?"
									class="border-l border-white/10 px-1 py-0.5 opacity-40 transition hover:opacity-100"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</button>
							</div>
						{/each}
						<button
							onclick={() => (openStatusId = openStatusId === c.id ? null : c.id)}
							class="rounded border border-gray-600 px-1.5 py-0.5 text-xs text-gray-500 transition hover:border-gray-500 hover:text-gray-300"
						>
							+ Condition
						</button>
						{#if openStatusId === c.id}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-600 bg-gray-900 p-2 shadow-xl"
								onmouseleave={() => (openStatusId = null)}
							>
								<div class="grid grid-cols-2 gap-1">
									{#each CONDITIONS as cond}
										{@const active = c.statuses.includes(cond)}
										<button
											onclick={() => combat.toggleStatus(c.id, cond)}
											class="rounded px-2 py-1 text-left text-xs transition
											       {active
												? (conditionColors[cond] ?? 'bg-gray-700 text-white') + ' ring-1 ring-white/20'
												: 'text-gray-400 hover:bg-gray-800 hover:text-white'}"
										>
											{cond}
										</button>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<!-- Info + Remove (desktop) -->
					<div class="hidden items-center gap-1 md:flex">
						{#if c.type === 'enemy' && getMonsterDetail(c.templateName ?? '')}
							<button
								onclick={() => showMonsterInfo(c)}
								title="View stat block"
								class="rounded p-1 text-gray-600 transition hover:text-blue-400"
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</button>
						{/if}
						<button
							onclick={() => combat.removeFromCombat(c.id)}
							class="rounded p-1 text-gray-600 transition hover:bg-red-900/40 hover:text-red-400"
							title={c.type === 'player' ? 'Remove from combat (keeps in party)' : 'Remove from combat'}
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<MonsterInfoModal monster={infoMonster} onclose={() => infoMonster = null} />
<ConditionInfoModal condition={conditionInfo} onclose={() => (conditionInfo = null)} />
