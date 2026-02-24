<script lang="ts">
	import { combat } from '$lib/store.svelte';
	import { CONDITIONS } from '$lib/enemies';
	import { conditionColors, hpPercent, hpBarColor, hpTextColor } from '$lib/utils';
	import type { Combatant } from '$lib/types';

	let openStatusId = $state<string | null>(null);
	let damageInputs = $state<Record<string, string>>({});
	let tempHpInputs = $state<Record<string, string>>({});
	let chronicleSaved = $state(false);

	function handleSaveToChronicle() {
		combat.saveToChronicle();
		chronicleSaved = true;
		setTimeout(() => (chronicleSaved = false), 2000);
	}

	function handleInitiativeInput(id: string, raw: string) {
		const val = parseInt(raw);
		combat.update(id, { initiative: isNaN(val) ? null : val });
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
					<!-- Mobile name header -->
					<div class="flex items-center gap-1.5 border-b border-gray-700/50 pb-1.5 md:hidden">
						{#if isActive}
							<span class="text-amber-400" title="Active turn">▶</span>
						{/if}
						{#if c.type === 'player' && c.avatarUrl}
							<div class="h-6 w-6 shrink-0 overflow-hidden rounded-full ring-1 ring-blue-700">
								<img src={c.avatarUrl} alt={c.name} class="h-full w-full object-cover" />
							</div>
						{:else}
							<span class="shrink-0 rounded px-1 py-0.5 text-xs font-bold
							       {c.type === 'player' ? 'bg-blue-900/60 text-blue-300' : 'bg-red-900/60 text-red-300'}">
								{c.type === 'player' ? 'PC' : 'NPC'}
							</span>
						{/if}
						<span class="truncate text-sm font-semibold {isActive ? 'text-amber-100' : 'text-white'}">
							{c.name}
						</span>
					</div>

					<!-- Initiative -->
					<input
						type="number"
						value={c.initiative ?? ''}
						placeholder="—"
						oninput={(e) => handleInitiativeInput(c.id, e.currentTarget.value)}
						class="w-full rounded border border-gray-600 bg-gray-900 px-1.5 py-1 text-center text-sm font-bold text-amber-300 focus:border-amber-500 focus:outline-none"
					/>

					<!-- Name + type badge + active indicator -->
					<div class="hidden md:block min-w-0">
						<div class="flex items-center gap-1.5">
							{#if isActive}
								<span class="text-amber-400" title="Active turn">▶</span>
							{/if}
							<!-- Player avatar (small) -->
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

					<!-- AC -->
					<div class="flex items-center justify-end gap-1 pr-3">

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

					<!-- HP bar + controls -->
					<div class="flex flex-col gap-1">
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
						<!-- HP bar (with optional gold THP extension) -->
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
									Set THP
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

					<!-- Conditions -->
					<div class="relative flex flex-wrap items-start gap-1">
						{#each c.statuses as status}
							<button
								onclick={() => combat.toggleStatus(c.id, status)}
								title="Remove {status}"
								class="rounded px-1.5 py-0.5 text-xs font-medium transition hover:opacity-70
								       {conditionColors[status] ?? 'bg-gray-700 text-gray-300'}"
							>
								{status}
							</button>
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

					<!-- Remove -->
					<button
						onclick={() => combat.removeFromCombat(c.id)}
						class="rounded p-1 text-gray-600 transition hover:bg-red-900/40 hover:text-red-400"
						title={c.type === 'player' ? 'Remove from combat (keeps in party)' : 'Remove from combat'}
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
			{/each}
		</div>
	{/if}
</div>
