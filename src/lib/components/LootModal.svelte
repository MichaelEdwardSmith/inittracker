<!-- Modal for viewing and editing enemy loot. Auto-rolls D&D 5e Individual Treasure on first open. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import type { Combatant, LootItem } from '$lib/types';
	import { generateLoot } from '$lib/loot';

	let { combatant, onclose, onsave }: {
		combatant: Combatant;
		onclose: () => void;
		onsave: (id: string, loot: LootItem[]) => void;
	} = $props();

	let items = $state<LootItem[]>(
		untrack(() =>
			combatant.loot?.length
				? combatant.loot.map((i) => ({ ...i }))
				: generateLoot(combatant.cr ?? '1')
		)
	);

	function reroll() {
		if (items.length > 0) {
			if (!confirm('Re-roll loot? This will replace all current items.')) return;
		}
		items = generateLoot(combatant.cr ?? '1');
	}

	function addItem() {
		items = [...items, { id: crypto.randomUUID(), name: '', quantity: 1 }];
	}

	function removeItem(id: string) {
		items = items.filter((i) => i.id !== id);
	}

	function updateName(id: string, name: string) {
		items = items.map((i) => i.id === id ? { ...i, name } : i);
	}

	function updateQuantity(id: string, value: string) {
		const n = parseInt(value, 10);
		if (!isNaN(n) && n >= 0) {
			items = items.map((i) => i.id === id ? { ...i, quantity: n } : i);
		}
	}

	function save() {
		onsave(combatant.id, items.filter((i) => i.name.trim() !== ''));
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
	onmousedown={(e) => { if (e.target === e.currentTarget) onclose(); }}
>
	<div class="mx-4 w-full max-w-md rounded-xl border border-amber-700/60 bg-gray-900 shadow-2xl flex flex-col max-h-[80vh]">
		<!-- Header -->
		<div class="flex items-center gap-2 border-b border-amber-900/40 px-5 py-3">
			<span class="text-amber-500">⬡</span>
			<span class="flex-1 text-sm font-bold tracking-widest text-amber-300 uppercase">
				Loot — {combatant.name}
			</span>
			<button
				onclick={reroll}
				title="Re-roll loot"
				class="rounded px-2 py-1 text-xs text-gray-500 transition hover:text-amber-400"
			>
				Re-roll
			</button>
			<button
				onclick={onclose}
				class="rounded p-1 text-gray-600 transition hover:text-gray-300"
				title="Close"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Item list -->
		<div class="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-2">
			{#if items.length === 0}
				<p class="text-xs text-gray-600 italic py-2">No loot. Click "Add Item" to add manually.</p>
			{/if}
			{#each items as item (item.id)}
				<div class="flex items-center gap-2">
					<input
						type="number"
						min="0"
						value={item.quantity}
						oninput={(e) => updateQuantity(item.id, (e.target as HTMLInputElement).value)}
						class="w-16 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-center text-sm text-gray-200 focus:border-amber-600 focus:outline-none"
					/>
					<span class="text-gray-600 text-xs">×</span>
					<input
						type="text"
						value={item.name}
						oninput={(e) => updateName(item.id, (e.target as HTMLInputElement).value)}
						placeholder="Item name"
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-gray-200 focus:border-amber-600 focus:outline-none placeholder:text-gray-600"
					/>
					<button
						onclick={() => removeItem(item.id)}
						title="Remove"
						class="rounded p-1 text-gray-700 transition hover:text-red-400"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			{/each}
			<button
				onclick={addItem}
				class="mt-1 rounded border border-dashed border-gray-700 px-3 py-1.5 text-xs text-gray-600 transition hover:border-amber-700 hover:text-amber-600"
			>
				+ Add Item
			</button>
		</div>

		<!-- Footer -->
		<div class="flex gap-2 border-t border-gray-800 px-5 py-3">
			<button
				onclick={onclose}
				class="flex-1 rounded bg-gray-700/50 py-2 text-sm font-semibold text-gray-300 transition hover:bg-gray-600/60"
			>
				Cancel
			</button>
			<button
				onclick={save}
				class="flex-1 rounded bg-amber-700/60 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-600/70"
			>
				Save
			</button>
		</div>
	</div>
</div>
