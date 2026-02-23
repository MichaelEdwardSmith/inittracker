<script lang="ts">
	import { combat } from '$lib/store.svelte';

	let name = $state('');
	let ac = $state(10);
	let hp = $state(10);
	let editingId = $state<string | null>(null);
	let editAc = $state(0);
	let editHp = $state(0);
	let editName = $state('');

	// Avatar upload state
	let fileInput: HTMLInputElement;
	let uploadingFor = $state<string | null>(null);

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

	// Crop and resize the selected image to a 256×256 JPEG data URL
	function cropAvatar(file: File): Promise<string> {
		return new Promise((resolve) => {
			const img = new Image();
			img.onload = () => {
				const size = 256;
				const canvas = document.createElement('canvas');
				canvas.width = size;
				canvas.height = size;
				const ctx = canvas.getContext('2d')!;
				const s = Math.min(img.naturalWidth, img.naturalHeight);
				const sx = (img.naturalWidth - s) / 2;
				const sy = (img.naturalHeight - s) / 2;
				ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
				URL.revokeObjectURL(img.src);
				resolve(canvas.toDataURL('image/jpeg', 0.8));
			};
			img.src = URL.createObjectURL(file);
		});
	}

	function openAvatarPicker(playerId: string) {
		uploadingFor = playerId;
		fileInput.value = '';
		fileInput.click();
	}

	async function onFileSelected(e: Event) {
		const id = uploadingFor;
		uploadingFor = null;
		if (!id) return;
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const dataUrl = await cropAvatar(file);
		combat.update(id, { avatarUrl: dataUrl });
	}

	function removeAvatar(id: string) {
		combat.update(id, { avatarUrl: undefined });
	}
</script>

<!-- Hidden file input (shared across all players) -->
<input
	bind:this={fileInput}
	type="file"
	accept="image/*"
	class="hidden"
	onchange={onFileSelected}
/>

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
				<div
					class="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 p-2.5
				           {player.inCombat === false ? 'opacity-60' : ''}"
				>
					<!-- Avatar circle -->
					<div class="group relative shrink-0">
						<button
							onclick={() => openAvatarPicker(player.id)}
							title="Upload avatar"
							class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-gray-600 bg-gray-700 transition hover:border-blue-500"
						>
							{#if player.avatarUrl}
								<img
									src={player.avatarUrl}
									alt={player.name}
									class="h-full w-full object-cover"
								/>
							{:else}
								<span class="text-base leading-none">🛡️</span>
							{/if}
						</button>
						<!-- Remove button (shown on hover when avatar exists) -->
						{#if player.avatarUrl}
							<button
								onclick={() => removeAvatar(player.id)}
								title="Remove avatar"
								class="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-gray-400 ring-1 ring-gray-600 transition hover:text-red-400 group-hover:flex"
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						{/if}
					</div>

					<div class="min-w-0 flex-1">
						<div class="flex min-w-0 items-center gap-1.5">
							<span class="truncate text-sm font-medium text-white">{player.name}</span>
							{#if player.inCombat === false}
								<span class="shrink-0 rounded bg-gray-700 px-1 py-0.5 text-xs text-gray-500"
									>benched</span
								>
							{/if}
						</div>
						<div class="text-xs text-gray-400">AC {player.ac} &bull; {player.maxHp} HP</div>
					</div>
					<div class="flex shrink-0 flex-col gap-1">
						{#if player.inCombat === false}
							<button
								onclick={() => combat.addToCombat(player.id)}
								class="rounded px-2 py-0.5 text-xs text-green-400 transition hover:bg-green-900/40 hover:text-green-300"
							>
								+ Combat
							</button>
						{/if}
						<button
							onclick={() => startEdit(player.id, player.name, player.ac, player.maxHp)}
							title="Edit"
							class="rounded p-1 text-gray-400 transition hover:bg-gray-700 hover:text-white"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
							</svg>
						</button>
						<button
							onclick={() => combat.remove(player.id)}
							title="Delete"
							class="rounded p-1 text-red-400 transition hover:bg-red-900/40 hover:text-red-300"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
						</button>
					</div>
				</div>
			{/if}
		{/each}

		{#if combat.players.length === 0}
			<p class="py-4 text-center text-sm text-gray-600">No players yet</p>
		{/if}
	</div>
</div>
