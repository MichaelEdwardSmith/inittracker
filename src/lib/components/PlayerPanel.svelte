<script lang="ts">
	import { combat } from '$lib/store.svelte';

	let name = $state('');
	let ac = $state(10);
	let hp = $state(10);
	let editingId = $state<string | null>(null);
	let editAc = $state(0);
	let editHp = $state(0);
	let editName = $state('');

	function addPlayer() {
		if (!name.trim()) return;
		combat.addPlayer(name.trim(), ac, hp);
		name = '';
		ac = 10;
		hp = 10;
	}

	function startEdit(id: string, playerName: string, playerAc: number, playerMaxHp: number) {
		editingId = id;
		editName = playerName;
		editAc = playerAc;
		editHp = playerMaxHp;
	}

	function saveEdit(id: string) {
		if (!editName.trim()) return;
		combat.update(id, { name: editName.trim(), ac: editAc, maxHp: editHp, currentHp: editHp });
		editingId = null;
	}
</script>

<div class="flex h-full flex-col gap-3">
	<h2 class="text-lg font-bold tracking-wide text-amber-400">Party</h2>

	<!-- Add player form -->
	<form
		onsubmit={(e) => {
			e.preventDefault();
			addPlayer();
		}}
		class="flex flex-col gap-2 rounded-lg border border-gray-700 bg-gray-800 p-3"
	>
		<input
			bind:value={name}
			placeholder="Player name"
			class="rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
		/>
		<div class="flex gap-2">
			<label class="flex flex-1 flex-col gap-1">
				<span class="text-xs text-gray-400">AC</span>
				<input
					type="number"
					bind:value={ac}
					min="1"
					max="30"
					class="w-full rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-amber-500 focus:outline-none"
				/>
			</label>
			<label class="flex flex-1 flex-col gap-1">
				<span class="text-xs text-gray-400">Max HP</span>
				<input
					type="number"
					bind:value={hp}
					min="1"
					class="w-full rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-amber-500 focus:outline-none"
				/>
			</label>
		</div>
		<button
			type="submit"
			class="rounded bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-500 active:bg-amber-700"
		>
			+ Add Player
		</button>
	</form>

	<!-- Player list -->
	<div class="flex flex-1 flex-col gap-2 overflow-y-auto">
		{#each combat.players as player (player.id)}
			{#if editingId === player.id}
				<div class="flex flex-col gap-2 rounded-lg border border-amber-600 bg-gray-800 p-3">
					<input
						bind:value={editName}
						class="rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-amber-500 focus:outline-none"
					/>
					<div class="flex gap-2">
						<label class="flex flex-1 flex-col gap-1">
							<span class="text-xs text-gray-400">AC</span>
							<input
								type="number"
								bind:value={editAc}
								min="1"
								max="30"
								class="w-full rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-amber-500 focus:outline-none"
							/>
						</label>
						<label class="flex flex-1 flex-col gap-1">
							<span class="text-xs text-gray-400">Max HP</span>
							<input
								type="number"
								bind:value={editHp}
								min="1"
								class="w-full rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-amber-500 focus:outline-none"
							/>
						</label>
					</div>
					<div class="flex gap-2">
						<button
							onclick={() => saveEdit(player.id)}
							class="flex-1 rounded bg-amber-600 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-500"
						>
							Save
						</button>
						<button
							onclick={() => (editingId = null)}
							class="flex-1 rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
						>
							Cancel
						</button>
					</div>
				</div>
			{:else}
				<div class="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 p-2.5">
					<div class="min-w-0 flex-1">
						<div class="truncate text-sm font-medium text-white">{player.name}</div>
						<div class="text-xs text-gray-400">AC {player.ac} &bull; {player.maxHp} HP</div>
					</div>
					<button
						onclick={() => startEdit(player.id, player.name, player.ac, player.maxHp)}
						class="rounded px-2 py-1 text-xs text-gray-400 transition hover:bg-gray-700 hover:text-white"
					>
						Edit
					</button>
					<button
						onclick={() => combat.remove(player.id)}
						class="rounded px-2 py-1 text-xs text-red-400 transition hover:bg-red-900/40 hover:text-red-300"
					>
						Remove
					</button>
				</div>
			{/if}
		{/each}

		{#if combat.players.length === 0}
			<p class="py-4 text-center text-sm text-gray-600">No players yet</p>
		{/if}
	</div>
</div>
