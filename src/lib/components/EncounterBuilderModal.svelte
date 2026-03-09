<!-- Encounter Builder modal — create named encounter templates from enemies,
     view CR/XP/difficulty, load them into the initiative tracker, or delete them. -->
<script lang="ts">
	import { combat } from '$lib/store.svelte';
	import { ENEMY_TEMPLATES } from '$lib/enemies';
	import { crToXp, encounterDifficulty, encounterMultiplier } from '$lib/utils';
	import type { Encounter, EncounterEnemy, CustomMonster, EnemyTemplate } from '$lib/types';

	interface Props {
		onclose: () => void;
	}

	let { onclose }: Props = $props();

	// ── Saved encounters ─────────────────────────────────────────────────────
	let encounters = $state<Encounter[]>([]);
	let loadingList = $state(true);

	// ── Custom monsters (fetched once on open) ───────────────────────────────
	let customMonsters = $state<CustomMonster[]>([]);

	// Combined template list (custom first, then built-ins)
	const allTemplates = $derived<EnemyTemplate[]>([
		...customMonsters,
		...ENEMY_TEMPLATES
	]);

	// ── Build-new-encounter form ─────────────────────────────────────────────
	let showBuilder = $state(false);
	let encName = $state('');
	let stagingEnemies = $state<EncounterEnemy[]>([]);
	let pickedTemplate = $state('');
	let pickedQty = $state(1);
	let enemySearch = $state('');
	let partySize = $state(4);
	let partyLevel = $state(1);
	let saving = $state(false);
	let formError = $state('');

	// ── Load on mount ────────────────────────────────────────────────────────
	$effect(() => {
		fetchAll();
	});

	async function fetchAll() {
		loadingList = true;
		const [encRes, monRes] = await Promise.all([
			fetch('/api/encounters'),
			fetch('/api/monsters')
		]);
		if (encRes.ok) encounters = await encRes.json();
		if (monRes.ok) customMonsters = await monRes.json();
		loadingList = false;
	}

	// ── Derived XP / difficulty for staged enemies ───────────────────────────
	const stagingRawXp = $derived(
		stagingEnemies.reduce((sum, e) => {
			const tmpl = allTemplates.find((t) => t.name === e.templateName);
			return sum + crToXp(tmpl?.cr ?? '0') * e.quantity;
		}, 0)
	);

	const stagingEnemyCount = $derived(stagingEnemies.reduce((s, e) => s + e.quantity, 0));

	const stagingDifficulty = $derived(
		encounterDifficulty(stagingRawXp, stagingEnemyCount, partySize, partyLevel)
	);

	const stagingAdjustedXp = $derived(
		Math.round(stagingRawXp * encounterMultiplier(stagingEnemyCount))
	);

	// ── Template search filter ───────────────────────────────────────────────
	const filteredTemplates = $derived(
		enemySearch.trim()
			? allTemplates.filter((t) =>
					t.name.toLowerCase().includes(enemySearch.toLowerCase())
			  )
			: allTemplates
	);

	// ── Difficulty badge colour ──────────────────────────────────────────────
	function difficultyColor(d: string) {
		if (d === 'Trivial') return 'bg-gray-700 text-gray-300';
		if (d === 'Easy') return 'bg-green-800 text-green-200';
		if (d === 'Medium') return 'bg-yellow-700 text-yellow-200';
		if (d === 'Hard') return 'bg-orange-700 text-orange-200';
		return 'bg-red-800 text-red-200';
	}

	// ── Per-encounter XP helper ──────────────────────────────────────────────
	function encounterRawXp(enc: Encounter): number {
		return enc.enemies.reduce((sum, e) => {
			const tmpl = allTemplates.find((t) => t.name === e.templateName);
			return sum + crToXp(tmpl?.cr ?? '0') * e.quantity;
		}, 0);
	}

	function encounterTotalCount(enc: Encounter): number {
		return enc.enemies.reduce((s, e) => s + e.quantity, 0);
	}

	function encounterXpDisplay(enc: Encounter): number {
		return Math.round(encounterRawXp(enc) * encounterMultiplier(encounterTotalCount(enc)));
	}

	function encounterDiff(enc: Encounter): string {
		return encounterDifficulty(
			encounterRawXp(enc),
			encounterTotalCount(enc),
			partySize,
			partyLevel
		);
	}

	// ── Actions ──────────────────────────────────────────────────────────────
	function addToStaging() {
		if (!pickedTemplate) return;
		const existing = stagingEnemies.find((e) => e.templateName === pickedTemplate);
		if (existing) {
			stagingEnemies = stagingEnemies.map((e) =>
				e.templateName === pickedTemplate
					? { ...e, quantity: e.quantity + pickedQty }
					: e
			);
		} else {
			stagingEnemies = [...stagingEnemies, { templateName: pickedTemplate, quantity: pickedQty }];
		}
		pickedTemplate = '';
		pickedQty = 1;
		enemySearch = '';
	}

	function removeFromStaging(templateName: string) {
		stagingEnemies = stagingEnemies.filter((e) => e.templateName !== templateName);
	}

	async function saveEncounter() {
		formError = '';
		if (!encName.trim()) { formError = 'Encounter name is required.'; return; }
		if (stagingEnemies.length === 0) { formError = 'Add at least one enemy.'; return; }
		saving = true;
		try {
			const res = await fetch('/api/encounters', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: encName.trim(), enemies: stagingEnemies })
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				formError = err.error ?? 'Failed to save.';
				return;
			}
			const created: Encounter = await res.json();
			encounters = [created, ...encounters];
			// Reset form
			encName = '';
			stagingEnemies = [];
			showBuilder = false;
		} finally {
			saving = false;
		}
	}

	async function deleteEncounter(id: string) {
		await fetch(`/api/encounters?id=${id}`, { method: 'DELETE' });
		encounters = encounters.filter((e) => e.id !== id);
	}

	function loadToInitiative(enc: Encounter) {
		for (const entry of enc.enemies) {
			const tmpl = allTemplates.find((t) => t.name === entry.templateName);
			if (tmpl) combat.addEnemies(tmpl, entry.quantity);
		}
		onclose();
	}
</script>

<!-- Backdrop -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
	role="dialog"
	aria-modal="true"
>
	<div class="flex h-full max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-900 shadow-2xl">
		<!-- Header -->
		<div class="flex shrink-0 items-center justify-between border-b border-gray-700 px-5 py-3">
			<h2 class="text-base font-bold tracking-widest text-amber-400 uppercase">Encounters</h2>
			<div class="flex items-center gap-3">
				<!-- Party context inputs (affect difficulty display) -->
				<label class="flex items-center gap-1 text-xs text-gray-400">
					Party
					<input
						type="number"
						min="1"
						max="20"
						bind:value={partySize}
						class="w-12 rounded border border-gray-600 bg-gray-800 px-1 py-0.5 text-center text-xs text-white"
					/>
				</label>
				<label class="flex items-center gap-1 text-xs text-gray-400">
					Lvl
					<input
						type="number"
						min="1"
						max="20"
						bind:value={partyLevel}
						class="w-12 rounded border border-gray-600 bg-gray-800 px-1 py-0.5 text-center text-xs text-white"
					/>
				</label>
				<button
					onclick={onclose}
					class="rounded p-1 text-gray-500 transition hover:text-white"
					aria-label="Close"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>

		<div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
			<!-- Saved encounters list -->
			<div class="shrink-0 px-5 pt-4">
				{#if loadingList}
					<p class="text-sm text-gray-500">Loading…</p>
				{:else if encounters.length === 0}
					<p class="text-sm text-gray-500 italic">No encounters saved yet. Build one below.</p>
				{:else}
					<div class="flex flex-col gap-3">
						{#each encounters as enc (enc.id)}
							{@const diff = encounterDiff(enc)}
							<div class="rounded border border-gray-700 bg-gray-800/60 p-3">
								<div class="mb-1.5 flex items-start justify-between gap-2">
									<span class="font-semibold text-white">{enc.name}</span>
									<div class="flex shrink-0 items-center gap-2">
										<span class="rounded px-2 py-0.5 text-xs font-bold {difficultyColor(diff)}">{diff}</span>
										<span class="text-xs text-amber-300">{encounterXpDisplay(enc).toLocaleString()} XP</span>
									</div>
								</div>
								<p class="mb-2 text-xs text-gray-400">
									{enc.enemies.map((e) => `${e.quantity}× ${e.templateName}`).join(', ')}
								</p>
								<div class="flex gap-2">
									<button
										onclick={() => loadToInitiative(enc)}
										class="flex items-center gap-1 rounded border border-amber-700 bg-amber-900/30 px-2 py-1 text-xs font-semibold text-amber-300 transition hover:bg-amber-900/60"
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
										</svg>
										Load to Initiative
									</button>
									<button
										onclick={() => deleteEncounter(enc.id)}
										class="flex items-center gap-1 rounded border border-red-900 px-2 py-1 text-xs text-red-500 transition hover:border-red-700 hover:text-red-400"
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
										</svg>
										Delete
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Build new encounter toggle -->
			<div class="shrink-0 px-5 pb-5 pt-4">
				<button
					onclick={() => { showBuilder = !showBuilder; formError = ''; }}
					class="flex items-center gap-1.5 rounded border border-gray-600 px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-300"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
					</svg>
					{showBuilder ? 'Cancel' : 'New Encounter'}
				</button>

				{#if showBuilder}
					<div class="mt-4 rounded border border-gray-700 bg-gray-800/40 p-4">
						<!-- Encounter name -->
						<label class="mb-3 block">
							<span class="mb-1 block text-xs font-semibold text-gray-400 uppercase">Encounter Name</span>
							<input
								type="text"
								bind:value={encName}
								placeholder="e.g. Goblin Ambush"
								maxlength="100"
								class="w-full rounded border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
							/>
						</label>

						<!-- Enemy picker -->
						<div class="mb-3">
							<span class="mb-1 block text-xs font-semibold text-gray-400 uppercase">Add Enemy</span>
							<div class="flex gap-2">
								<div class="relative flex-1">
									<input
										type="text"
										bind:value={enemySearch}
										placeholder="Search enemies…"
										class="w-full rounded border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
									/>
									{#if enemySearch && filteredTemplates.length > 0}
										<div class="absolute left-0 right-0 top-full z-10 mt-0.5 max-h-48 overflow-y-auto rounded border border-gray-700 bg-gray-900 shadow-lg">
											{#each filteredTemplates.slice(0, 50) as tmpl}
												<button
													type="button"
													class="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-gray-700"
													onclick={() => { pickedTemplate = tmpl.name; enemySearch = tmpl.name; }}
												>
													<span class="text-gray-200">{tmpl.name}</span>
													<span class="ml-2 shrink-0 text-xs text-gray-500">CR {tmpl.cr}</span>
												</button>
											{/each}
										</div>
									{/if}
								</div>
								<input
									type="number"
									min="1"
									max="99"
									bind:value={pickedQty}
									class="w-16 rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-center text-sm text-white focus:border-amber-500 focus:outline-none"
								/>
								<button
									onclick={addToStaging}
									disabled={!pickedTemplate}
									class="rounded border border-amber-700 bg-amber-900/30 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-900/60 disabled:cursor-not-allowed disabled:opacity-40"
								>
									Add
								</button>
							</div>
						</div>

						<!-- Staged enemies -->
						{#if stagingEnemies.length > 0}
							<div class="mb-3">
								<span class="mb-1 block text-xs font-semibold text-gray-400 uppercase">Enemies in Encounter</span>
								<div class="flex flex-col gap-1">
									{#each stagingEnemies as entry}
										{@const tmpl = allTemplates.find((t) => t.name === entry.templateName)}
										<div class="flex items-center justify-between rounded border border-gray-700 bg-gray-800 px-3 py-1.5">
											<span class="text-sm text-gray-200">
												{entry.quantity}× {entry.templateName}
												{#if tmpl}
													<span class="ml-1 text-xs text-gray-500">CR {tmpl.cr}</span>
												{/if}
											</span>
											<button
												onclick={() => removeFromStaging(entry.templateName)}
												class="text-gray-600 transition hover:text-red-400"
											>
												<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
													<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
												</svg>
											</button>
										</div>
									{/each}
								</div>

								<!-- XP / difficulty preview -->
								<div class="mt-2 flex items-center gap-3 text-xs text-gray-400">
									<span>Total XP: <span class="font-semibold text-amber-300">{stagingAdjustedXp.toLocaleString()}</span></span>
									<span class="rounded px-2 py-0.5 font-bold {difficultyColor(stagingDifficulty)}">{stagingDifficulty}</span>
									<span class="text-gray-600">(for {partySize} players, lvl {partyLevel})</span>
								</div>
							</div>
						{/if}

						{#if formError}
							<p class="mb-2 text-xs text-red-400">{formError}</p>
						{/if}

						<button
							onclick={saveEncounter}
							disabled={saving}
							class="rounded border border-amber-700 bg-amber-900/40 px-4 py-1.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-900/70 disabled:opacity-50"
						>
							{saving ? 'Saving…' : 'Save Encounter'}
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
