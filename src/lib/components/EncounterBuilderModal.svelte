<!-- Encounter Builder modal — create named encounter templates from enemies,
     view CR/XP/difficulty, load them into the initiative tracker, or delete them. -->
<script lang="ts">
	import { combat } from '$lib/store.svelte';
	import { ENEMY_TEMPLATES, MONSTER_TYPES } from '$lib/enemies';
	import { ENEMY_TEMPLATES_2024, MONSTER_TYPES_2024 } from '$lib/enemies2024';
	import {
		crToXp,
		encounterDifficulty,
		encounterDifficulty2024,
		encounterMultiplier,
		XP_THRESHOLDS,
		XP_THRESHOLDS_2024
	} from '$lib/utils';
	import type { Encounter, EncounterEnemy, CustomMonster, EnemyTemplate } from '$lib/types';

	interface Props {
		onclose: () => void;
		ruleset?: '2014' | '2024';
	}

	let { onclose, ruleset = '2014' }: Props = $props();

	// ── Saved encounters ─────────────────────────────────────────────────────
	let encounters = $state<Encounter[]>([]);
	let loadingList = $state(true);

	// ── Custom monsters (fetched once on open) ───────────────────────────────
	let customMonsters = $state<CustomMonster[]>([]);

	// Combined template list (custom first, then edition-appropriate built-ins)
	const builtinTemplates = $derived(ruleset === '2024' ? ENEMY_TEMPLATES_2024 : ENEMY_TEMPLATES);
	const allTemplates = $derived<EnemyTemplate[]>([...customMonsters, ...builtinTemplates]);

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

	// ── Quick Compose — auto-fill staging from a shape + target difficulty ──
	interface EncounterShape {
		value: string;
		label: string;
		/** Relative XP share per monster slot (e.g. one big + several small). */
		shares: number[];
	}
	const SHAPES: EncounterShape[] = [
		{ value: 'boss', label: 'Boss (solo)', shares: [1] },
		{ value: 'boss_minions', label: 'Boss + Minions', shares: [0.6, 0.1, 0.1, 0.1, 0.1] },
		{ value: 'duo', label: 'Duo', shares: [0.5, 0.5] },
		{ value: 'trio', label: 'Trio', shares: [0.34, 0.33, 0.33] },
		{ value: 'horde', label: 'Horde', shares: Array(8).fill(1 / 8) }
	];
	const DIFFICULTY_LABELS_2014 = ['Easy', 'Medium', 'Hard', 'Deadly'];
	const DIFFICULTY_LABELS_2024 = ['Low', 'Moderate', 'High', 'Severe', 'Deadly'];
	const difficultyLabels = $derived(
		ruleset === '2024' ? DIFFICULTY_LABELS_2024 : DIFFICULTY_LABELS_2014
	);

	let quickShape = $state('boss_minions');
	let quickDifficulty = $state('Medium');
	let quickTypeFilter = $state('All');

	// Reset the difficulty pick if it doesn't exist for the current ruleset's label set
	// (e.g. switching 2014 -> 2024 while "Deadly" isn't selected, or vice versa).
	$effect(() => {
		if (!difficultyLabels.includes(quickDifficulty)) quickDifficulty = difficultyLabels[1];
	});

	const monsterTypeOptions = $derived(ruleset === '2024' ? MONSTER_TYPES_2024 : MONSTER_TYPES);

	/** Fills stagingEnemies with a monster mix matching the chosen shape and difficulty,
	 *  picking the closest-XP monster (optionally filtered by creature type) for each slot. */
	function quickCompose() {
		const level = Math.max(1, Math.min(20, Math.round(partyLevel) || 1));
		const shape = SHAPES.find((s) => s.value === quickShape) ?? SHAPES[0];
		const diffIdx = difficultyLabels.indexOf(quickDifficulty);
		const perPlayerXp =
			ruleset === '2024'
				? XP_THRESHOLDS_2024[level][diffIdx]
				: XP_THRESHOLDS[level][Math.min(diffIdx, 3)];
		const totalBudget = perPlayerXp * Math.max(1, partySize);
		const multiplier = ruleset === '2024' ? 1 : encounterMultiplier(shape.shares.length);
		const rawXpTotal = totalBudget / multiplier;

		const pool =
			quickTypeFilter === 'All'
				? allTemplates
				: allTemplates.filter((t) => t.monsterType === quickTypeFilter);
		if (pool.length === 0) {
			formError = `No ${quickTypeFilter} monsters available to compose with.`;
			return;
		}
		formError = '';

		const picks = new Map<string, number>();
		for (const share of shape.shares) {
			const target = Math.max(1, rawXpTotal * share);
			let best = pool[0];
			let bestDist = Infinity;
			for (const t of pool) {
				const xp = Math.max(1, crToXp(t.cr));
				const dist = Math.abs(Math.log(xp) - Math.log(target));
				if (dist < bestDist) {
					bestDist = dist;
					best = t;
				}
			}
			picks.set(best.name, (picks.get(best.name) ?? 0) + 1);
		}

		stagingEnemies = [...picks.entries()].map(([templateName, quantity]) => ({
			templateName,
			quantity
		}));
		if (!encName.trim()) {
			encName = `${shape.label} (${quickDifficulty})`;
		}
	}

	// ── Load on mount ────────────────────────────────────────────────────────
	$effect(() => {
		fetchAll();
	});

	async function fetchAll() {
		loadingList = true;
		const [encRes, monRes] = await Promise.all([fetch('/api/encounters'), fetch('/api/monsters')]);
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
		ruleset === '2024'
			? encounterDifficulty2024(stagingRawXp, partySize, partyLevel)
			: encounterDifficulty(stagingRawXp, stagingEnemyCount, partySize, partyLevel)
	);

	const stagingAdjustedXp = $derived(
		ruleset === '2024'
			? stagingRawXp
			: Math.round(stagingRawXp * encounterMultiplier(stagingEnemyCount))
	);

	// ── Template search filter ───────────────────────────────────────────────
	const filteredTemplates = $derived(
		enemySearch.trim()
			? allTemplates.filter((t) => t.name.toLowerCase().includes(enemySearch.toLowerCase()))
			: allTemplates
	);

	// ── Difficulty badge colour ──────────────────────────────────────────────
	function difficultyColor(d: string) {
		if (d === 'Trivial') return 'bg-gray-700 text-gray-300';
		if (d === 'Easy' || d === 'Low') return 'bg-green-800 text-green-200';
		if (d === 'Medium' || d === 'Moderate') return 'bg-yellow-700 text-yellow-200';
		if (d === 'Hard' || d === 'High') return 'bg-orange-700 text-orange-200';
		if (d === 'Severe') return 'bg-red-700 text-red-200';
		return 'bg-red-900 text-red-200'; // Deadly
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
		const raw = encounterRawXp(enc);
		return ruleset === '2024'
			? raw
			: Math.round(raw * encounterMultiplier(encounterTotalCount(enc)));
	}

	function encounterDiff(enc: Encounter): string {
		const raw = encounterRawXp(enc);
		return ruleset === '2024'
			? encounterDifficulty2024(raw, partySize, partyLevel)
			: encounterDifficulty(raw, encounterTotalCount(enc), partySize, partyLevel);
	}

	// ── Actions ──────────────────────────────────────────────────────────────
	function addToStaging() {
		if (!pickedTemplate) return;
		const existing = stagingEnemies.find((e) => e.templateName === pickedTemplate);
		if (existing) {
			stagingEnemies = stagingEnemies.map((e) =>
				e.templateName === pickedTemplate ? { ...e, quantity: e.quantity + pickedQty } : e
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
		if (!encName.trim()) {
			formError = 'Encounter name is required.';
			return;
		}
		if (stagingEnemies.length === 0) {
			formError = 'Add at least one enemy.';
			return;
		}
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
	<div
		class="flex h-full max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-900 shadow-2xl"
	>
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
					<i class="fa-duotone fa-light fa-xmark text-base" aria-hidden="true"></i>
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
										<span class="rounded px-2 py-0.5 text-xs font-bold {difficultyColor(diff)}"
											>{diff}</span
										>
										<span class="text-xs text-amber-300"
											>{encounterXpDisplay(enc).toLocaleString()} XP</span
										>
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
										<i class="fa-duotone fa-light fa-plus text-sm" aria-hidden="true"></i>
										Load to Initiative
									</button>
									<button
										onclick={() => deleteEncounter(enc.id)}
										class="flex items-center gap-1 rounded border border-red-900 px-2 py-1 text-xs text-red-500 transition hover:border-red-700 hover:text-red-400"
									>
										<i class="fa-duotone fa-light fa-trash text-sm" aria-hidden="true"></i>
										Delete
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Build new encounter toggle -->
			<div class="shrink-0 px-5 pt-4 pb-5">
				<button
					onclick={() => {
						showBuilder = !showBuilder;
						formError = '';
					}}
					class="flex items-center gap-1.5 rounded border border-gray-600 px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-300"
				>
					<i class="fa-duotone fa-light fa-plus text-sm" aria-hidden="true"></i>
					{showBuilder ? 'Cancel' : 'New Encounter'}
				</button>

				{#if showBuilder}
					<div class="mt-4 rounded border border-gray-700 bg-gray-800/40 p-4">
						<!-- Encounter name -->
						<label class="mb-3 block">
							<span class="mb-1 block text-xs font-semibold text-gray-400 uppercase"
								>Encounter Name</span
							>
							<input
								type="text"
								bind:value={encName}
								placeholder="e.g. Goblin Ambush"
								maxlength="100"
								class="w-full rounded border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
							/>
						</label>

						<!-- Quick Compose -->
						<div class="mb-4 rounded border border-violet-800/40 bg-violet-950/10 p-3">
							<span class="mb-2 block text-xs font-semibold text-violet-300 uppercase"
								>Quick Compose</span
							>
							<p class="mb-2 text-[11px] text-gray-500">
								Auto-fills the enemy list below with a monster mix matching a shape and target
								difficulty, using the party size/level above. Replaces anything currently staged.
							</p>
							<div class="flex flex-wrap items-center gap-2">
								<select
									bind:value={quickShape}
									class="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-200 focus:border-violet-500 focus:outline-none"
								>
									{#each SHAPES as s}
										<option value={s.value}>{s.label}</option>
									{/each}
								</select>
								<select
									bind:value={quickDifficulty}
									class="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-200 focus:border-violet-500 focus:outline-none"
								>
									{#each difficultyLabels as d}
										<option value={d}>{d}</option>
									{/each}
								</select>
								<select
									bind:value={quickTypeFilter}
									class="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-200 focus:border-violet-500 focus:outline-none"
								>
									<option value="All">Any type</option>
									{#each monsterTypeOptions as t}
										<option value={t}>{t}</option>
									{/each}
								</select>
								<button
									type="button"
									onclick={quickCompose}
									class="rounded border border-violet-700 bg-violet-900/40 px-3 py-1 text-xs font-semibold text-violet-200 transition hover:bg-violet-900/70"
								>
									<i class="fa-duotone fa-light fa-shuffle text-sm" aria-hidden="true"></i> Compose
								</button>
							</div>
						</div>

						<!-- Enemy picker -->
						<div class="mb-3">
							<span class="mb-1 block text-xs font-semibold text-gray-400 uppercase">Add Enemy</span
							>
							<div class="flex gap-2">
								<div class="relative flex-1">
									<input
										type="text"
										bind:value={enemySearch}
										placeholder="Search enemies…"
										class="w-full rounded border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
									/>
									{#if enemySearch && filteredTemplates.length > 0}
										<div
											class="absolute top-full right-0 left-0 z-10 mt-0.5 max-h-48 overflow-y-auto rounded border border-gray-700 bg-gray-900 shadow-lg"
										>
											{#each filteredTemplates.slice(0, 50) as tmpl}
												<button
													type="button"
													class="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-gray-700"
													onclick={() => {
														pickedTemplate = tmpl.name;
														enemySearch = tmpl.name;
													}}
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
								<span class="mb-1 block text-xs font-semibold text-gray-400 uppercase"
									>Enemies in Encounter</span
								>
								<div class="flex flex-col gap-1">
									{#each stagingEnemies as entry}
										{@const tmpl = allTemplates.find((t) => t.name === entry.templateName)}
										<div
											class="flex items-center justify-between rounded border border-gray-700 bg-gray-800 px-3 py-1.5"
										>
											<span class="text-sm text-gray-200">
												{entry.quantity}× {entry.templateName}
												{#if tmpl}
													<span class="ml-1 text-xs text-gray-500">CR {tmpl.cr}</span>
												{/if}
											</span>
											<button
												onclick={() => removeFromStaging(entry.templateName)}
												aria-label="Remove enemy"
												class="text-gray-600 transition hover:text-red-400"
											>
												<i class="fa-duotone fa-light fa-xmark text-sm" aria-hidden="true"></i>
											</button>
										</div>
									{/each}
								</div>

								<!-- XP / difficulty preview -->
								<div class="mt-2 flex items-center gap-3 text-xs text-gray-400">
									<span
										>{ruleset === '2024' ? 'XP' : 'Adjusted XP'}:
										<span class="font-semibold text-amber-300"
											>{stagingAdjustedXp.toLocaleString()}</span
										></span
									>
									<span class="rounded px-2 py-0.5 font-bold {difficultyColor(stagingDifficulty)}"
										>{stagingDifficulty}</span
									>
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
