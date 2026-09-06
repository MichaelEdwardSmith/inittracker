<!-- Full-screen two-panel item reference modal: weapons, armor, gear, tools,
     mounts/vehicles, equipment packs, and magic items. Mirrors SpellsModal2024.svelte. -->
<script lang="ts">
	import type { Item, ItemCategory } from '$lib/types';
	import { triggerRoll } from '$lib/diceOverlay.svelte';
	import { renderDescription, rarityColor, categoryLabel, capitalize } from '$lib/itemRenderer';

	interface Props {
		onclose: () => void;
		initialItem?: string;
	}

	let { onclose, initialItem }: Props = $props();

	let allItems = $state<Item[]>([]);
	let loading = $state(true);
	let search = $state('');
	let filterCategory = $state<ItemCategory | null>(null);
	let filterRarity = $state<string | null>(null);
	let selectedItem = $state<Item | null>(null);

	interface DiceRollResult {
		expr: string;
		rolls: number[];
		sides: number;
		modifier: number;
		total: number;
	}
	let diceRollResult = $state<DiceRollResult | null>(null);

	$effect(() => {
		fetch('/api/items')
			.then((r) => r.json())
			.then((data: { items: Item[] }) => {
				allItems = data.items;
				loading = false;
				if (initialItem) {
					const match = allItems.find((i) => i.name.toLowerCase() === initialItem.toLowerCase());
					if (match) selectedItem = match;
				}
			})
			.catch(() => {
				loading = false;
			});
	});

	const CATEGORY_OPTIONS: ItemCategory[] = [
		'weapon',
		'armor',
		'gear',
		'tool',
		'pack',
		'mount',
		'vehicle',
		'magic-item'
	];

	const RARITY_OPTIONS = ['common', 'uncommon', 'rare', 'very rare', 'legendary', 'artifact'];

	const filteredItems = $derived.by(() => {
		const q = search.toLowerCase();
		return allItems.filter((i) => {
			if (q && !i.name.toLowerCase().includes(q)) return false;
			if (filterCategory && i.category !== filterCategory) return false;
			if (filterRarity && i.rarity?.toLowerCase() !== filterRarity) return false;
			return true;
		});
	});

	function rollDice(expr: string) {
		const m = expr.trim().match(/^(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
		if (!m) return;
		const count = parseInt(m[1]) || 1;
		const sides = parseInt(m[2]);
		const modifier = m[3] ? (m[3] === '+' ? 1 : -1) * parseInt(m[4]) : 0;
		diceRollResult = null;
		triggerRoll(`${count}d${sides}`, (rolls) => {
			const total = rolls.reduce((s, r) => s + r, 0) + modifier;
			diceRollResult = { expr: expr.trim(), rolls, sides, modifier, total };
		});
	}

	function handleDiceClick(e: MouseEvent) {
		const target = (e.target as HTMLElement).closest('[data-dice]') as HTMLElement | null;
		if (!target?.dataset.dice) return;
		e.stopPropagation();
		rollDice(target.dataset.dice);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	role="dialog"
	aria-modal="true"
	aria-label="Item Reference"
	class="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-10 backdrop-blur-sm"
	tabindex="-1"
	onclick={(e) => {
		if (e.target === e.currentTarget) onclose();
	}}
	onkeydown={handleKeydown}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="flex w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl"
		style="max-height: calc(100vh - 5rem);"
		onclick={(e) => e.stopPropagation()}
		onkeydown={handleKeydown}
	>
		<!-- Header -->
		<div class="flex shrink-0 items-center justify-between border-b border-gray-700 px-5 py-3">
			<div class="flex items-center gap-2">
				<h3 class="text-base font-black tracking-wide text-amber-300">Item Reference</h3>
				<span
					class="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-blue-300 uppercase ring-1 ring-blue-500/30"
					>SRD</span
				>
			</div>
			<button
				onclick={onclose}
				class="text-gray-500 transition hover:text-white"
				aria-label="Close"
			>
				<i class="fa-duotone fa-light fa-xmark text-lg" aria-hidden="true"></i>
			</button>
		</div>

		<!-- Body: two panels -->
		<div class="flex min-h-0 flex-1">
			<!-- Left panel: search + filter + list -->
			<div class="flex w-56 shrink-0 flex-col border-r border-gray-700">
				<!-- Search -->
				<div class="shrink-0 p-2">
					<input
						type="text"
						placeholder="Search items…"
						bind:value={search}
						class="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
					/>
				</div>

				<!-- Filters -->
				<div class="shrink-0 space-y-1 px-2 pb-2">
					<select
						bind:value={filterCategory}
						class="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-300 focus:border-amber-500 focus:outline-none"
					>
						<option value={null}>All Categories</option>
						{#each CATEGORY_OPTIONS as cat}
							<option value={cat}>{categoryLabel(cat)}</option>
						{/each}
					</select>
					{#if filterCategory === 'magic-item' || filterCategory === null}
						<select
							bind:value={filterRarity}
							class="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-300 focus:border-amber-500 focus:outline-none"
						>
							<option value={null}>All Rarities</option>
							{#each RARITY_OPTIONS as r}
								<option value={r}>{capitalize(r)}</option>
							{/each}
						</select>
					{/if}
				</div>

				<!-- Item list -->
				<div class="min-h-0 flex-1 overflow-y-auto">
					{#if loading}
						<p class="px-3 py-4 text-xs text-gray-500">Loading items…</p>
					{:else if filteredItems.length === 0}
						<p class="px-3 py-4 text-xs text-gray-500">No items found.</p>
					{:else}
						{#each filteredItems as item}
							<button
								onclick={() => {
									selectedItem = item;
									diceRollResult = null;
								}}
								class="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition
								       {selectedItem?.name === item.name
									? 'bg-amber-900/40 text-amber-200'
									: 'text-gray-300 hover:bg-gray-800 hover:text-white'}"
							>
								<span class="truncate">{item.name}</span>
								{#if item.category === 'magic-item'}
									<span
										class="ml-1 shrink-0 rounded px-1 py-0.5 text-[9px] font-bold ring-1 {rarityColor(
											item.rarity
										)}"
									>
										{item.rarity ? capitalize(item.rarity).slice(0, 3) : '?'}
									</span>
								{:else if item.cost}
									<span class="ml-1 shrink-0 text-[10px] text-gray-500">{item.cost}</span>
								{/if}
							</button>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Right panel: item card -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div class="min-h-0 flex-1 overflow-y-auto p-5 text-gray-200" onclick={handleDiceClick}>
				{#if !selectedItem}
					<div class="flex h-full items-center justify-center text-gray-600">
						<p class="text-sm">Select an item from the list</p>
					</div>
				{:else}
					{@const item = selectedItem}
					<!-- Item name -->
					<h2 class="mb-1 text-xl font-black text-amber-300">{item.name}</h2>

					<!-- Subtitle -->
					<div class="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-400">
						<span>{item.itemType ?? categoryLabel(item.category)}</span>
						{#if item.subCategory}
							<span>·</span>
							<span>{item.subCategory}</span>
						{/if}
						{#if item.rarity}
							<span
								class="rounded px-1.5 py-0.5 text-xs font-semibold ring-1 {rarityColor(
									item.rarity
								)}">{capitalize(item.rarity)}</span
							>
						{/if}
						{#if item.attunement}
							<span
								class="rounded bg-fuchsia-900/50 px-1.5 py-0.5 text-xs font-semibold text-fuchsia-300"
								>{capitalize(item.attunement)}</span
							>
						{/if}
					</div>

					<!-- Info grid -->
					<div
						class="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm"
					>
						{#if item.cost}
							<div>
								<span class="text-xs font-bold tracking-wider text-gray-500 uppercase">Cost</span>
								<p class="text-gray-200">{item.cost}</p>
							</div>
						{/if}
						{#if item.weight}
							<div>
								<span class="text-xs font-bold tracking-wider text-gray-500 uppercase">Weight</span>
								<p class="text-gray-200">{item.weight}</p>
							</div>
						{/if}
						{#if item.damage}
							<div>
								<span class="text-xs font-bold tracking-wider text-gray-500 uppercase">Damage</span>
								<p class="text-gray-200">
									<button class="dice-btn" data-dice={item.damage}>{item.damage}</button>
									{item.damageType}
								</p>
							</div>
						{/if}
						{#if item.range}
							<div>
								<span class="text-xs font-bold tracking-wider text-gray-500 uppercase">Range</span>
								<p class="text-gray-200">{item.range}</p>
							</div>
						{/if}
						{#if item.ac}
							<div>
								<span class="text-xs font-bold tracking-wider text-gray-500 uppercase"
									>Armor Class</span
								>
								<p class="text-gray-200">{item.ac}</p>
							</div>
						{/if}
						{#if item.strengthRequirement}
							<div>
								<span class="text-xs font-bold tracking-wider text-gray-500 uppercase"
									>Str Required</span
								>
								<p class="text-gray-200">{item.strengthRequirement}</p>
							</div>
						{/if}
						{#if item.stealthDisadvantage}
							<div>
								<span class="text-xs font-bold tracking-wider text-gray-500 uppercase">Stealth</span
								>
								<p class="text-gray-200">Disadvantage</p>
							</div>
						{/if}
						{#if item.speed}
							<div>
								<span class="text-xs font-bold tracking-wider text-gray-500 uppercase">Speed</span>
								<p class="text-gray-200">{item.speed}</p>
							</div>
						{/if}
						{#if item.capacity}
							<div>
								<span class="text-xs font-bold tracking-wider text-gray-500 uppercase"
									>Carrying Capacity</span
								>
								<p class="text-gray-200">{item.capacity}</p>
							</div>
						{/if}
					</div>

					<!-- Weapon properties -->
					{#if item.properties && item.properties.length > 0}
						<p class="mb-4 text-sm">
							<span class="text-xs font-bold tracking-wider text-gray-500 uppercase"
								>Properties</span
							>
							<br />
							{item.properties.join(', ')}
						</p>
					{/if}

					<!-- Pack contents -->
					{#if item.contents && item.contents.length > 0}
						<div class="mb-4">
							<p class="mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase">Contents</p>
							<ul class="list-inside list-disc space-y-0.5 text-sm text-gray-300">
								{#each item.contents as c}
									<li>{c}</li>
								{/each}
							</ul>
						</div>
					{/if}

					<!-- Description -->
					{#if item.description}
						<div class="item-body mb-4">
							{@html renderDescription(item.description)}
						</div>
					{/if}

					<!-- Source -->
					<p class="text-xs text-gray-500">
						<span class="font-semibold text-gray-400">Source:</span>
						{item.source}
					</p>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Dice roll result modal -->
{#if diceRollResult}
	{@const r = diceRollResult}
	<div
		class="fixed inset-0 z-[60] flex items-center justify-center"
		role="dialog"
		aria-modal="true"
		aria-label="Dice roll result"
		tabindex="-1"
		onclick={() => (diceRollResult = null)}
		onkeydown={(e) => {
			if (e.key === 'Escape') diceRollResult = null;
		}}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="max-w-sm min-w-[18rem] rounded-xl border border-gray-600 bg-gray-900 p-5 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mb-4 flex items-center justify-between">
				<h4 class="font-black tracking-wide text-amber-400">
					<i class="fa-duotone fa-light fa-dice" aria-hidden="true"></i>
					{r.expr}
				</h4>
				<button
					onclick={() => (diceRollResult = null)}
					class="text-gray-500 transition hover:text-white"
					aria-label="Close"
				>
					<i class="fa-duotone fa-light fa-xmark text-base" aria-hidden="true"></i>
				</button>
			</div>
			<div class="mb-4 flex flex-wrap gap-2">
				{#each r.rolls as roll}
					<div
						class="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-gray-600 bg-gray-800 text-lg font-black text-white"
					>
						{roll}
					</div>
				{/each}
			</div>
			{#if r.modifier !== 0}
				<p class="mb-1 text-sm text-gray-400">
					Dice sum: {r.rolls.reduce((s, v) => s + v, 0)}<span
						class={r.modifier > 0 ? 'text-green-400' : 'text-red-400'}
					>
						{r.modifier > 0 ? '+' : ''}{r.modifier}</span
					>
				</p>
			{/if}
			<p class="text-2xl font-black text-white">
				Total: <span class="text-amber-300">{r.total}</span>
			</p>
			<button
				onclick={() => rollDice(r.expr)}
				class="mt-4 w-full rounded bg-amber-700 py-1.5 text-sm font-bold text-white transition hover:bg-amber-600"
			>
				Roll again
			</button>
		</div>
	</div>
{/if}

<style>
	.item-body :global(p) {
		margin-bottom: 0.5rem;
	}
	.item-body :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 0.75rem;
		font-size: 0.8rem;
	}
	.item-body :global(th),
	.item-body :global(td) {
		border: 1px solid rgb(75, 85, 99);
		padding: 0.25rem 0.5rem;
		text-align: left;
		vertical-align: top;
	}
	.item-body :global(th) {
		background: rgba(255, 255, 255, 0.05);
		font-weight: 700;
	}
	:global(.dice-btn) {
		display: inline;
		font-weight: 700;
		color: rgb(252, 211, 77);
		cursor: pointer;
		text-decoration: underline dotted;
	}
	:global(.dice-btn:hover) {
		color: rgb(251, 191, 36);
	}
</style>
