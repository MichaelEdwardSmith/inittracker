<!-- DM-side enemy management panel. Lists built-in enemy templates and the DM's saved
     custom monsters; supports adding enemies to the tracker, managing custom monsters
     (create, edit, delete, import from bestiary), and viewing monster stat blocks. -->
<script lang="ts">
	import { combat } from '$lib/store.svelte';
	import {
		ENEMY_TEMPLATES,
		MONSTER_TYPES,
		getMonsterDetail,
		preloadMonsterDetails
	} from '$lib/enemies';
	import {
		ENEMY_TEMPLATES_2024,
		MONSTER_TYPES_2024,
		getMonsterDetail2024,
		preloadMonsterDetails2024
	} from '$lib/enemies2024';
	import { onMount } from 'svelte';
	onMount(() => {
		preloadMonsterDetails();
		preloadMonsterDetails2024();
	});
	import type { EnemyTemplate, CustomMonster, MonsterDetail, MonsterDetail2024 } from '$lib/types';
	import MonsterInfoModal from '$lib/components/MonsterInfoModal.svelte';
	import MonsterInfoModal2024 from '$lib/components/MonsterInfoModal2024.svelte';
	import ImportBestiaryModal from '$lib/components/ImportBestiaryModal.svelte';

	interface Props {
		ruleset?: '2014' | '2024';
	}

	let { ruleset = '2014' }: Props = $props();

	// Extended display type — built-ins have no id/isCustom/detail
	type DisplayTemplate = EnemyTemplate & {
		id?: string;
		isCustom?: boolean;
		detail?: MonsterDetail;
	};

	// ── Encounter state ──────────────────────────────────────────────────────
	let search = $state('');
	let typeFilter = $state('All');
	let sortBy = $state<'name' | 'type'>('name');
	let sourceFilter = $state('All');
	let selectedEnemy = $state<DisplayTemplate | null>(null);
	let quantity = $state(1);

	// ── Monster info modal ───────────────────────────────────────────────────
	let infoMonster2014 = $state<MonsterDetail | null>(null);
	let infoMonster2024 = $state<MonsterDetail2024 | null>(null);

	function showInfo(e: DisplayTemplate) {
		if (ruleset === '2024') {
			infoMonster2024 = getMonsterDetail2024(e.name) ?? null;
		} else {
			infoMonster2014 = e.detail ?? getMonsterDetail(e.name) ?? null;
		}
	}

	// ── Custom monsters ──────────────────────────────────────────────────────
	let customMonsters = $state<CustomMonster[]>([]);
	let showModal = $state(false);
	let showImportModal = $state(false);

	// Form state (shared between create & edit modes)
	let formName = $state('');
	let formAc = $state<number | ''>(10);
	let formHp = $state<number | ''>(10);
	let formCr = $state('1');
	let formType = $state('Humanoid');
	let editingId = $state<string | null>(null);
	let formError = $state('');
	let saving = $state(false);
	let formImgUrl = $state<string | undefined>(undefined);
	let avatarInput = $state<HTMLInputElement>();

	async function cropAvatar(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const url = URL.createObjectURL(file);
			const img = new Image();
			img.onload = () => {
				const size = Math.min(img.width, img.height);
				const canvas = document.createElement('canvas');
				canvas.width = 256;
				canvas.height = 256;
				const ctx = canvas.getContext('2d')!;
				ctx.drawImage(
					img,
					(img.width - size) / 2,
					(img.height - size) / 2,
					size,
					size,
					0,
					0,
					256,
					256
				);
				URL.revokeObjectURL(url);
				resolve(canvas.toDataURL('image/jpeg', 0.8));
			};
			img.onerror = reject;
			img.src = url;
		});
	}

	async function onAvatarSelected(e: Event) {
		const file = (e.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		formImgUrl = await cropAvatar(file);
	}

	// ── Derived lists ────────────────────────────────────────────────────────
	const builtinTemplates = $derived(ruleset === '2024' ? ENEMY_TEMPLATES_2024 : ENEMY_TEMPLATES);

	const allTemplates = $derived<DisplayTemplate[]>([
		...customMonsters.map((m) => ({ ...m, isCustom: true as const })),
		...builtinTemplates.map((m) => ({ ...m, isCustom: false as const }))
	]);

	const availableSources = $derived(
		[...new Set(allTemplates.filter((e) => e.source).map((e) => e.source!))].sort()
	);

	const filtered = $derived.by(() => {
		const matches = (e: DisplayTemplate) =>
			e.name.toLowerCase().includes(search.toLowerCase()) &&
			(typeFilter === 'All' || e.monsterType === typeFilter) &&
			(sourceFilter === 'All' || e.source === sourceFilter);

		const custom = allTemplates
			.filter((e) => e.isCustom && matches(e))
			.sort((a, b) => a.name.localeCompare(b.name));

		const builtin = allTemplates.filter((e) => !e.isCustom && matches(e));
		if (sortBy === 'type') {
			builtin.sort(
				(a, b) => a.monsterType.localeCompare(b.monsterType) || a.name.localeCompare(b.name)
			);
		} else {
			builtin.sort((a, b) => a.name.localeCompare(b.name));
		}

		return [...custom, ...builtin];
	});

	// Monster types for the filter dropdown
	const monsterTypesForFilter = $derived(
		ruleset === '2024' ? ['All', ...MONSTER_TYPES_2024] : MONSTER_TYPES
	);

	// Monster types for the custom monster form select (no "All")
	const formTypes = $derived(MONSTER_TYPES.filter((t) => t !== 'All'));

	// ── Selection helpers ────────────────────────────────────────────────────
	function isSameEnemy(a: DisplayTemplate | null, b: DisplayTemplate): boolean {
		if (!a) return false;
		if (a.id && b.id) return a.id === b.id;
		// Both built-in — match by name only
		return !a.id && !b.id && a.name === b.name;
	}

	function selectEnemy(e: DisplayTemplate) {
		selectedEnemy = isSameEnemy(selectedEnemy, e) ? null : e;
	}

	function addToEncounter() {
		if (!selectedEnemy) return;
		combat.addEnemies(selectedEnemy, quantity);
		quantity = 1;
	}

	function quickAddEnemy(e: DisplayTemplate) {
		selectedEnemy = e;
		combat.addEnemies(e, 1);
	}

	function crLabel(cr: string) {
		return `CR ${cr}`;
	}

	// ── Custom monster API ───────────────────────────────────────────────────
	async function loadCustomMonsters() {
		try {
			const res = await fetch('/api/monsters');
			if (res.ok) customMonsters = await res.json();
		} catch {
			// Silently ignore network errors
		}
	}

	$effect(() => {
		loadCustomMonsters();
	});

	function openCreate() {
		resetForm();
		showModal = true;
	}

	function openEdit(m: CustomMonster) {
		editingId = m.id;
		formName = m.name;
		formAc = m.ac;
		formHp = m.hp;
		formCr = m.cr;
		formType = m.monsterType;
		formImgUrl = m.imgUrl;
		formError = '';
	}

	function openEditFromList(m: CustomMonster) {
		openEdit(m);
		showModal = true;
	}

	async function saveMonster() {
		formError = '';
		if (!formName.trim()) {
			formError = 'Name is required.';
			return;
		}
		if (!formAc || Number(formAc) < 1) {
			formError = 'AC must be at least 1.';
			return;
		}
		if (!formHp || Number(formHp) < 1) {
			formError = 'HP must be at least 1.';
			return;
		}

		saving = true;
		try {
			const body = {
				name: formName.trim(),
				ac: Number(formAc),
				hp: Number(formHp),
				cr: formCr.trim() || '1',
				monsterType: formType,
				imgUrl: formImgUrl ?? null
			};

			let res: Response;
			if (editingId) {
				res = await fetch(`/api/monsters/${editingId}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body)
				});
			} else {
				res = await fetch('/api/monsters', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body)
				});
			}

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				formError = data.error ?? 'Failed to save.';
			} else {
				await loadCustomMonsters();
				resetForm();
			}
		} catch {
			formError = 'Network error.';
		} finally {
			saving = false;
		}
	}

	async function deleteMonster(id: string) {
		try {
			await fetch(`/api/monsters/${id}`, { method: 'DELETE' });
			if (selectedEnemy?.id === id) selectedEnemy = null;
			await loadCustomMonsters();
		} catch {
			// Silently ignore
		}
	}

	function resetForm() {
		editingId = null;
		formName = '';
		formAc = 10;
		formHp = 10;
		formCr = '1';
		formType = 'Humanoid';
		formImgUrl = undefined;
		formError = '';
	}

	function closeModal() {
		showModal = false;
		resetForm();
	}
</script>

<div class="flex h-full flex-col gap-3">
	<!-- Header row -->
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-bold tracking-wide text-red-400">Enemies / NPCs</h2>
		<div class="flex items-center gap-1.5">
			<button
				onclick={() => (showImportModal = true)}
				title="Import monsters from a 5etools bestiary JSON"
				class="flex items-center gap-1 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:border-indigo-600 hover:text-indigo-300"
			>
				<i class="fa-solid fa-upload text-sm" aria-hidden="true"></i>
				Import
			</button>
			<button
				onclick={openCreate}
				title="Manage custom monsters"
				class="flex items-center gap-1 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300"
			>
				<i class="fa-solid fa-plus text-sm" aria-hidden="true"></i>
				Custom
			</button>
		</div>
	</div>

	<!-- Filters -->
	<div class="flex flex-col gap-2">
		<input
			bind:value={search}
			placeholder="Search monsters..."
			class="rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
		/>
		<div class="flex gap-2">
			<select
				bind:value={typeFilter}
				class="flex-1 rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-red-500 focus:outline-none"
			>
				{#each monsterTypesForFilter as t}
					<option value={t}>{t}</option>
				{/each}
			</select>
			<select
				bind:value={sortBy}
				class="rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-red-500 focus:outline-none"
			>
				<option value="name">A–Z</option>
				<option value="type">By Type</option>
			</select>
		</div>
		{#if availableSources.length > 0}
			<select
				bind:value={sourceFilter}
				class="rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-red-500 focus:outline-none"
			>
				<option value="All">All Books</option>
				{#each availableSources as src}
					<option value={src}>{src}</option>
				{/each}
			</select>
		{/if}
	</div>

	<!-- Monster list -->
	<div class="flex-1 overflow-y-auto rounded-lg border border-gray-700">
		{#each filtered as enemy (enemy.id ?? enemy.name)}
			<div
				class="flex items-center border-b border-gray-700 last:border-b-0
				       {isSameEnemy(selectedEnemy, enemy)
					? 'bg-red-900/40 text-white'
					: 'bg-gray-800 text-gray-300'}"
			>
				<button
					onclick={() => selectEnemy(enemy)}
					ondblclick={() => quickAddEnemy(enemy)}
					class="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left transition hover:brightness-125"
				>
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-1.5 truncate">
							{#if enemy.isCustom}
								{#if enemy.imgUrl}
									<div class="h-6 w-6 shrink-0 overflow-hidden rounded-full ring-1 ring-amber-700">
										<img src={enemy.imgUrl} alt={enemy.name} class="h-full w-full object-cover" />
									</div>
								{:else}
									<span class="shrink-0 text-xs text-amber-400" title="Custom monster">✦</span>
								{/if}
							{/if}
							<span class="truncate text-sm font-medium">{enemy.name}</span>
							{#if enemy.source}
								<span
									class="shrink-0 rounded bg-indigo-900/60 px-1 py-0.5 text-[10px] leading-none font-semibold text-indigo-300"
								>
									{enemy.source}
								</span>
							{/if}
						</div>
						<div class="text-xs text-gray-500">
							{enemy.monsterType} &bull; {crLabel(enemy.cr)}
						</div>
					</div>
					<div class="shrink-0 text-right text-xs text-gray-400">
						<div>AC {enemy.ac}</div>
						<div>{enemy.hp} HP</div>
					</div>
				</button>
				<!-- Info button (built-ins and imported monsters with stat blocks) -->
				{#if !enemy.isCustom || enemy.detail}
					<button
						onclick={() => showInfo(enemy)}
						title="View {enemy.name} stat block"
						class="shrink-0 px-2 py-2 text-gray-600 transition hover:text-blue-400"
					>
						<i class="fa-solid fa-circle-info text-sm" aria-hidden="true"></i>
					</button>
				{/if}
				{#if enemy.isCustom && enemy.id && !enemy.source}
					<button
						onclick={() =>
							openEditFromList({
								id: enemy.id!,
								name: enemy.name,
								ac: enemy.ac,
								hp: enemy.hp,
								cr: enemy.cr,
								monsterType: enemy.monsterType,
								imgUrl: enemy.imgUrl
							})}
						title="Edit {enemy.name}"
						class="shrink-0 px-2 py-2 text-gray-600 transition hover:text-amber-400"
					>
						<i class="fa-solid fa-pen-to-square text-sm" aria-hidden="true"></i>
					</button>
				{/if}
			</div>
		{/each}

		{#if filtered.length === 0}
			<p class="py-6 text-center text-sm text-gray-600">No monsters found</p>
		{/if}
	</div>

	<!-- Add to encounter -->
	{#if selectedEnemy}
		<div class="rounded-lg border border-red-700 bg-red-900/20 p-3">
			<div class="mb-2 flex items-center justify-between gap-1.5">
				<span class="flex items-center gap-1.5 text-sm font-semibold text-red-300">
					{#if selectedEnemy.isCustom}
						<span class="text-xs text-amber-400">✦</span>
					{/if}
					{selectedEnemy.name}
				</span>
				<button
					onclick={() => {
						selectedEnemy = null;
						quantity = 1;
					}}
					aria-label="Dismiss"
					class="rounded p-0.5 text-red-700 transition hover:bg-red-900/40 hover:text-red-300"
				>
					<i class="fa-solid fa-xmark text-base" aria-hidden="true"></i>
				</button>
			</div>
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

<!-- Custom Monster Management Modal -->
{#if showModal}
	<!-- Backdrop -->
	<div
		role="dialog"
		aria-modal="true"
		aria-label="Enemy details"
		class="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-16 backdrop-blur-sm"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) closeModal();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') closeModal();
		}}
	>
		<div
			class="flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl"
			style="max-height: calc(100vh - 5rem);"
		>
			<!-- Modal header -->
			<div class="flex shrink-0 items-center justify-between border-b border-gray-700 px-5 py-4">
				<h3 class="font-black tracking-widest text-amber-400 uppercase">Custom Monsters</h3>
				<button
					onclick={closeModal}
					class="text-gray-500 transition hover:text-white"
					aria-label="Close"
				>
					<i class="fa-solid fa-xmark text-lg" aria-hidden="true"></i>
				</button>
			</div>

			<div class="flex flex-col gap-5 overflow-y-auto p-5">
				<!-- Create / Edit form -->
				<div class="rounded-lg border border-gray-700 bg-gray-800/60 p-4">
					<h4 class="mb-3 text-xs font-bold tracking-widest text-gray-400 uppercase">
						{editingId ? 'Edit Monster' : 'New Monster'}
					</h4>

					<div class="flex flex-col gap-3">
						<!-- Name -->
						<div>
							<label for="cm-name" class="mb-1 block text-xs tracking-wider text-gray-500 uppercase"
								>Name</label
							>
							<input
								id="cm-name"
								bind:value={formName}
								type="text"
								placeholder="e.g. Oathbreaker Knight"
								class="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 focus:outline-none"
							/>
						</div>

						<!-- AC / HP / CR row -->
						<div class="flex gap-3">
							<div class="flex-1">
								<label for="cm-ac" class="mb-1 block text-xs tracking-wider text-gray-500 uppercase"
									>AC</label
								>
								<input
									id="cm-ac"
									bind:value={formAc}
									type="number"
									min="1"
									max="99"
									class="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 focus:outline-none"
								/>
							</div>
							<div class="flex-1">
								<label for="cm-hp" class="mb-1 block text-xs tracking-wider text-gray-500 uppercase"
									>HP</label
								>
								<input
									id="cm-hp"
									bind:value={formHp}
									type="number"
									min="1"
									class="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 focus:outline-none"
								/>
							</div>
							<div class="flex-1">
								<label for="cm-cr" class="mb-1 block text-xs tracking-wider text-gray-500 uppercase"
									>CR</label
								>
								<input
									id="cm-cr"
									bind:value={formCr}
									type="text"
									placeholder="1/4"
									class="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 focus:outline-none"
								/>
							</div>
						</div>

						<!-- Monster Type -->
						<div>
							<label for="cm-type" class="mb-1 block text-xs tracking-wider text-gray-500 uppercase"
								>Type</label
							>
							<select
								id="cm-type"
								bind:value={formType}
								class="w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 focus:outline-none"
							>
								{#each formTypes as t}
									<option value={t}>{t}</option>
								{/each}
							</select>
						</div>

						<!-- Avatar upload -->
						<div>
							<label
								for="avatar-upload"
								class="mb-1 block text-xs tracking-wider text-gray-500 uppercase"
								>Avatar (optional)</label
							>
							<div class="flex items-center gap-3">
								{#if formImgUrl}
									<div class="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-1 ring-gray-600">
										<img src={formImgUrl} alt="Preview" class="h-full w-full object-cover" />
									</div>
									<button
										type="button"
										onclick={() => avatarInput?.click()}
										class="text-xs text-gray-400 transition hover:text-gray-200">Change</button
									>
									<button
										type="button"
										onclick={() => (formImgUrl = undefined)}
										class="text-xs text-red-500 transition hover:text-red-400">Remove</button
									>
								{:else}
									<button
										type="button"
										onclick={() => avatarInput?.click()}
										class="rounded border border-gray-600 px-3 py-2 text-xs text-gray-400 transition hover:border-gray-500 hover:text-gray-200"
										>Choose Image</button
									>
								{/if}
							</div>
							<input
								id="avatar-upload"
								bind:this={avatarInput}
								type="file"
								accept="image/*"
								class="hidden"
								onchange={onAvatarSelected}
							/>
						</div>

						{#if formError}
							<p class="text-xs text-red-400">{formError}</p>
						{/if}

						<div class="flex gap-2">
							<button
								onclick={saveMonster}
								disabled={saving}
								class="flex-1 rounded bg-amber-600 px-3 py-2 text-sm font-bold text-gray-950 transition hover:bg-amber-500 disabled:opacity-50"
							>
								{saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Monster'}
							</button>
							{#if editingId}
								<button
									onclick={resetForm}
									class="rounded border border-gray-600 px-3 py-2 text-sm text-gray-400 transition hover:border-gray-500 hover:text-white"
								>
									Cancel Edit
								</button>
							{/if}
						</div>
					</div>
				</div>

				<!-- Existing custom monsters -->
				{#if customMonsters.length > 0}
					<div>
						<h4 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
							Your Custom Monsters
						</h4>
						<div class="flex flex-col gap-1">
							{#each customMonsters as m (m.id)}
								<div
									class="flex items-center gap-3 rounded-lg border px-3 py-2.5
									       {editingId === m.id
										? 'border-amber-600/60 bg-amber-950/20'
										: 'border-gray-700 bg-gray-800/50'}"
								>
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-1.5">
											<span class="text-xs text-amber-400">✦</span>
											<span class="truncate text-sm font-medium text-white">{m.name}</span>
										</div>
										<div class="text-xs text-gray-500">
											{m.monsterType} &bull; {crLabel(m.cr)} &bull; AC {m.ac} &bull; {m.hp} HP
										</div>
									</div>
									<div class="flex shrink-0 items-center gap-1">
										{#if !m.source}
											<button
												onclick={() => openEdit(m)}
												title="Edit"
												class="rounded p-1.5 text-gray-500 transition hover:bg-gray-700 hover:text-amber-400"
											>
												<i class="fa-solid fa-pen-to-square text-sm" aria-hidden="true"></i>
											</button>
										{/if}
										<button
											onclick={() => deleteMonster(m.id)}
											title="Delete"
											class="rounded p-1.5 text-gray-500 transition hover:bg-gray-700 hover:text-red-400"
										>
											<i class="fa-solid fa-trash text-sm" aria-hidden="true"></i>
										</button>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<p class="text-center text-sm text-gray-600">No custom monsters yet. Create one above.</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if ruleset === '2024'}
	<MonsterInfoModal2024 monster={infoMonster2024} onclose={() => (infoMonster2024 = null)} />
{:else}
	<MonsterInfoModal monster={infoMonster2014} onclose={() => (infoMonster2014 = null)} />
{/if}

<ImportBestiaryModal bind:open={showImportModal} onImport={loadCustomMonsters} />
