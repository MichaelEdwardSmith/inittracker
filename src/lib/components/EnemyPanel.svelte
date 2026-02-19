<script lang="ts">
	import { combat } from '$lib/store.svelte';
	import { ENEMY_TEMPLATES, MONSTER_TYPES } from '$lib/enemies';
	import type { EnemyTemplate } from '$lib/types';

	let search = $state('');
	let typeFilter = $state('All');
	let selectedEnemy = $state<EnemyTemplate | null>(null);
	let quantity = $state(1);

	const filtered = $derived(
		ENEMY_TEMPLATES.filter(
			(e) =>
				e.name.toLowerCase().includes(search.toLowerCase()) &&
				(typeFilter === 'All' || e.monsterType === typeFilter)
		)
	);

	function selectEnemy(e: EnemyTemplate) {
		selectedEnemy = selectedEnemy?.name === e.name ? null : e;
	}

	function addToEncounter() {
		if (!selectedEnemy) return;
		combat.addEnemies(selectedEnemy, quantity);
		quantity = 1;
	}

	const crOrder = ['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
	function crLabel(cr: string) {
		return `CR ${cr}`;
	}
</script>

<div class="flex h-full flex-col gap-3">
	<h2 class="text-lg font-bold tracking-wide text-red-400">Enemies</h2>

	<!-- Filters -->
	<div class="flex flex-col gap-2">
		<input
			bind:value={search}
			placeholder="Search monsters..."
			class="rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
		/>
		<select
			bind:value={typeFilter}
			class="rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-red-500 focus:outline-none"
		>
			{#each MONSTER_TYPES as t}
				<option value={t}>{t}</option>
			{/each}
		</select>
	</div>

	<!-- Monster list -->
	<div class="flex-1 overflow-y-auto rounded-lg border border-gray-700">
		{#each filtered as enemy (enemy.name)}
			<button
				onclick={() => selectEnemy(enemy)}
				class="flex w-full items-center gap-2 border-b border-gray-700 px-3 py-2 text-left transition last:border-b-0
				       {selectedEnemy?.name === enemy.name
					? 'bg-red-900/40 text-white'
					: 'bg-gray-800 text-gray-300 hover:bg-gray-750 hover:text-white'}"
			>
				<div class="min-w-0 flex-1">
					<div class="truncate text-sm font-medium">{enemy.name}</div>
					<div class="text-xs text-gray-500">
						{enemy.monsterType} &bull; {crLabel(enemy.cr)}
					</div>
				</div>
				<div class="shrink-0 text-right text-xs text-gray-400">
					<div>AC {enemy.ac}</div>
					<div>{enemy.hp} HP</div>
				</div>
			</button>
		{/each}

		{#if filtered.length === 0}
			<p class="py-6 text-center text-sm text-gray-600">No monsters found</p>
		{/if}
	</div>

	<!-- Add to encounter -->
	{#if selectedEnemy}
		<div class="rounded-lg border border-red-700 bg-red-900/20 p-3">
			<div class="mb-2 text-sm font-semibold text-red-300">{selectedEnemy.name}</div>
			<div class="mb-3 flex items-center gap-2">
				<span class="text-xs text-gray-400">Quantity</span>
				<button
					onclick={() => (quantity = Math.max(1, quantity - 1))}
					class="flex h-7 w-7 items-center justify-center rounded bg-gray-700 text-white hover:bg-gray-600"
				>
					−
				</button>
				<input
					type="number"
					bind:value={quantity}
					min="1"
					max="20"
					class="w-14 rounded border border-gray-600 bg-gray-900 px-2 py-1 text-center text-sm text-white focus:border-red-500 focus:outline-none"
				/>
				<button
					onclick={() => (quantity = Math.min(20, quantity + 1))}
					class="flex h-7 w-7 items-center justify-center rounded bg-gray-700 text-white hover:bg-gray-600"
				>
					+
				</button>
			</div>
			<button
				onclick={addToEncounter}
				class="w-full rounded bg-red-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-600 active:bg-red-800"
			>
				Add to Encounter
			</button>
		</div>
	{/if}
</div>
