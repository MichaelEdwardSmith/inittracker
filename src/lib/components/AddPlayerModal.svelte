<!-- Add Player popup — lets the DM add a party member either by hand (Manual tab) or by
     importing a public D&D Beyond character sheet (D&D Beyond tab). Stays open after each
     add so multiple players can be added in a row; closes via the ✕, Escape, or backdrop
     click. -->
<script lang="ts">
	import { combat } from '$lib/store.svelte';

	interface Props {
		onclose: () => void;
	}
	let { onclose }: Props = $props();

	let name = $state('');
	let level = $state(1);
	let ac = $state(10);
	let hp = $state(10);
	let dexMod = $state(0);
	let passivePerception = $state(10);
	let voiceAliases = $state('');

	// D&D Beyond import
	let activeTab = $state<'manual' | 'ddb'>('manual');
	let ddbUrl = $state('');
	let ddbFetching = $state(false);
	let ddbError = $state('');
	let ddbPreview = $state<{
		name: string;
		maxHp: number;
		ac: number;
		dexMod: number;
		passivePerception: number;
		level: number;
		avatarUrl?: string;
	} | null>(null);

	function extractDDBId(input: string): string | null {
		const trimmed = input.trim();
		const match = trimmed.match(/\/characters?\/(\d+)/i) ?? trimmed.match(/^(\d+)$/);
		return match ? match[1] : null;
	}

	async function fetchDDBCharacter() {
		ddbError = '';
		ddbPreview = null;
		const id = extractDDBId(ddbUrl);
		if (!id) {
			ddbError = 'Paste a D&D Beyond character URL or numeric ID.';
			return;
		}
		ddbFetching = true;
		try {
			const res = await fetch(`/api/dndbeyond?id=${id}`);
			const json = await res.json().catch(() => null);
			if (!res.ok) {
				ddbError = json?.error ?? `Error ${res.status}`;
				return;
			}
			ddbPreview = json;
		} catch {
			ddbError = 'Network error — check your connection.';
		} finally {
			ddbFetching = false;
		}
	}

	function addDDBPlayer() {
		if (!ddbPreview) return;
		combat.addPlayer(
			ddbPreview.name,
			ddbPreview.ac,
			ddbPreview.maxHp,
			ddbPreview.dexMod || undefined,
			ddbPreview.passivePerception || undefined,
			ddbPreview.avatarUrl || undefined,
			ddbPreview.level || undefined
		);
		ddbUrl = '';
		ddbPreview = null;
		ddbError = '';
	}

	function addPlayer() {
		if (!name.trim()) return;
		const aliases = voiceAliases
			.split(',')
			.map((a) => a.trim())
			.filter(Boolean);
		combat.addPlayer(
			name.trim(),
			ac,
			hp,
			dexMod || undefined,
			passivePerception || undefined,
			undefined,
			level || undefined,
			aliases.length > 0 ? aliases : undefined
		);
		name = '';
		level = 1;
		ac = 10;
		hp = 10;
		dexMod = 0;
		passivePerception = 10;
		voiceAliases = '';
	}
</script>

<div
	role="dialog"
	aria-modal="true"
	aria-label="Add Player"
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
	tabindex="-1"
	onclick={(e) => {
		if (e.target === e.currentTarget) onclose();
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape') onclose();
	}}
>
	<div
		class="flex w-full max-w-md flex-col rounded-xl border border-amber-700/60 bg-gray-900 shadow-2xl"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-700 px-5 py-4">
			<h3 class="font-bold tracking-wide text-amber-400">+ Add Player</h3>
			<button
				onclick={onclose}
				class="text-gray-500 transition hover:text-white"
				aria-label="Close"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
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

		<!-- Body -->
		<div class="flex flex-col gap-3 p-5">
			<!-- Tab switcher -->
			<div class="flex rounded-lg border border-gray-700 bg-gray-800 p-0.5 text-xs font-medium">
				<button
					type="button"
					onclick={() => (activeTab = 'manual')}
					class="flex-1 rounded-md py-1 transition {activeTab === 'manual'
						? 'bg-amber-600 text-white'
						: 'text-gray-400 hover:text-gray-200'}"
				>
					Manual
				</button>
				<button
					type="button"
					onclick={() => {
						activeTab = 'ddb';
						ddbError = '';
						ddbPreview = null;
					}}
					class="flex-1 rounded-md py-1 transition {activeTab === 'ddb'
						? 'bg-amber-600 text-white'
						: 'text-gray-400 hover:text-gray-200'}"
				>
					D&amp;D Beyond
				</button>
			</div>

			<!-- D&D Beyond import form -->
			{#if activeTab === 'ddb'}
				<div class="flex flex-col gap-2 rounded-lg border border-gray-700 bg-gray-800 p-3">
					<p class="text-xs text-gray-400">Paste a D&amp;D Beyond character URL or ID.</p>
					<div class="flex gap-2">
						<input
							bind:value={ddbUrl}
							placeholder="dndbeyond.com/characters/12345678"
							class="min-w-0 flex-1 rounded border border-gray-600 bg-gray-900 px-2 py-1 text-xs text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									fetchDDBCharacter();
								}
							}}
						/>
						<button
							type="button"
							onclick={fetchDDBCharacter}
							disabled={ddbFetching}
							class="shrink-0 rounded bg-blue-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
						>
							{ddbFetching ? 'Fetching…' : 'Fetch'}
						</button>
					</div>
					{#if ddbError}
						<p class="text-xs text-red-400">{ddbError}</p>
					{/if}
					{#if ddbPreview}
						<div class="rounded-md border border-blue-800/60 bg-gray-900 p-2.5">
							<div class="mb-1.5 text-sm font-semibold text-white">{ddbPreview.name}</div>
							<div class="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-400">
								<span>Level: <span class="text-white">{ddbPreview.level}</span></span>
								<span>Max HP: <span class="text-white">{ddbPreview.maxHp}</span></span>
								<span>AC: <span class="text-white">{ddbPreview.ac}</span></span>
								<span
									>DEX: <span class="text-white"
										>{ddbPreview.dexMod >= 0 ? '+' : ''}{ddbPreview.dexMod}</span
									></span
								>
								<span>Passive: <span class="text-white">{ddbPreview.passivePerception}</span></span>
							</div>
						</div>
						<button
							type="button"
							onclick={addDDBPlayer}
							class="rounded bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-500 active:bg-amber-700"
						>
							+ Add Player
						</button>
					{/if}
				</div>
			{/if}

			<!-- Manual add form -->
			{#if activeTab === 'manual'}
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
					<label class="flex flex-col gap-1">
						<span class="flex items-center gap-1 text-xs text-gray-400">
							Voice Nicknames (optional)
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-3.5 w-3.5 shrink-0 cursor-help text-gray-500"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<title
									>Alternate spellings/pronunciations for Voice Commands to also match against this
									player's name (e.g. Kalstag -&gt; Call Stag). Comma-separated, optional.</title
								>
								<circle cx="12" cy="12" r="9" />
								<path stroke-linecap="round" d="M12 16v-4.5M12 8h.01" />
							</svg>
						</span>
						<input
							bind:value={voiceAliases}
							placeholder="e.g. Call Stag, Kal Stag"
							class="rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
						/>
					</label>
					<label class="flex w-20 flex-col gap-1">
						<span
							class="cursor-help text-xs text-gray-400"
							title="This is your player's starting level">Level</span
						>
						<input
							type="number"
							bind:value={level}
							min="1"
							max="20"
							class="w-full rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-amber-500 focus:outline-none"
						/>
					</label>
					<div class="flex gap-2">
						<label class="flex flex-1 flex-col gap-1">
							<span
								class="cursor-help text-xs text-gray-400"
								title="This is your player's Armor Class">AC</span
							>
							<input
								type="number"
								bind:value={ac}
								min="1"
								max="30"
								class="w-full rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-amber-500 focus:outline-none"
							/>
						</label>
						<label class="flex flex-1 flex-col gap-1">
							<span class="cursor-help text-xs text-gray-400" title="This is your player's Max HP"
								>HP</span
							>
							<input
								type="number"
								bind:value={hp}
								min="1"
								class="w-full rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-amber-500 focus:outline-none"
							/>
						</label>
						<label class="flex flex-1 flex-col gap-1">
							<span
								class="cursor-help text-xs text-gray-400"
								title="This is your player's DEX Modifier">DEX</span
							>
							<input
								type="number"
								bind:value={dexMod}
								min="-10"
								max="10"
								class="w-full rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-amber-500 focus:outline-none"
							/>
						</label>
						<label class="flex flex-1 flex-col gap-1">
							<span
								class="cursor-help text-xs text-gray-400"
								title="This is your player's Passive Perception">Passive</span
							>
							<input
								type="number"
								bind:value={passivePerception}
								min="1"
								max="30"
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
			{/if}
		</div>
	</div>
</div>
