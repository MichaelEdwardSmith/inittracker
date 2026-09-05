<!-- Full-screen two-panel spell reference modal for the 2024 D&D spell list.
     Mirrors SpellsModal.svelte in layout but renders the flat 2024 spell format. -->
<script lang="ts">
	import type { Spell2024 } from '$lib/types';
	import { triggerRoll } from '$lib/diceOverlay.svelte';
	import { formatLevel } from '$lib/spellRenderer';

	interface Props {
		onclose: () => void;
		initialSpell?: string;
	}

	let { onclose, initialSpell }: Props = $props();

	let allSpells = $state<Spell2024[]>([]);
	let loading = $state(true);
	let search = $state('');
	let filterLevel = $state<number | null>(null);
	let filterSchool = $state<string | null>(null);
	let filterClass = $state<string | null>(null);
	let selectedSpell = $state<Spell2024 | null>(null);

	interface DiceRollResult {
		expr: string;
		rolls: number[];
		sides: number;
		modifier: number;
		total: number;
		isAttack?: boolean;
	}
	let diceRollResult = $state<DiceRollResult | null>(null);

	$effect(() => {
		fetch('/api/spells2024')
			.then((r) => r.json())
			.then((data: { spells: Spell2024[] }) => {
				allSpells = data.spells;
				loading = false;
				if (initialSpell) {
					const match = allSpells.find((s) => s.name.toLowerCase() === initialSpell.toLowerCase());
					if (match) selectedSpell = match;
				}
			})
			.catch(() => {
				loading = false;
			});
	});

	const SCHOOL_OPTIONS = [
		'abjuration',
		'conjuration',
		'divination',
		'enchantment',
		'evocation',
		'illusion',
		'necromancy',
		'transmutation'
	];

	const CLASS_OPTIONS = [
		'bard',
		'cleric',
		'druid',
		'paladin',
		'ranger',
		'sorcerer',
		'warlock',
		'wizard'
	];

	const filteredSpells = $derived.by(() => {
		const q = search.toLowerCase();
		return allSpells.filter((s) => {
			if (q && !s.name.toLowerCase().includes(q)) return false;
			if (filterLevel !== null && s.level !== filterLevel) return false;
			if (filterSchool && s.school !== filterSchool) return false;
			if (filterClass && !s.classes.includes(filterClass)) return false;
			return true;
		});
	});

	function capitalize(s: string) {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}

	function formatCastingTime(spell: Spell2024): string {
		if (spell.castingTime) return capitalize(spell.castingTime);
		switch (spell.actionType) {
			case 'bonusAction':
				return 'Bonus Action';
			case 'reaction':
				return 'Reaction';
			default:
				return 'Action';
		}
	}

	function formatComponents(spell: Spell2024): string {
		const parts = spell.components.map((c) => c.toUpperCase());
		if (spell.material) {
			// Replace bare 'M' with 'M (material)'
			const idx = parts.indexOf('M');
			if (idx !== -1) parts[idx] = `M (${spell.material})`;
		}
		return parts.join(', ');
	}

	// Linkify dice expressions in plain description text → clickable buttons
	function linkDice(text: string): string {
		return text.replace(/\b(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?\b/g, (match) => {
			return `<button class="dice-btn" data-dice="${match}">${match}</button>`;
		});
	}

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
	aria-label="Spell Reference 2024"
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
				<h3 class="text-base font-black tracking-wide text-violet-300">Spell Reference</h3>
				<span
					class="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-blue-300 uppercase ring-1 ring-blue-500/30"
					>2024</span
				>
			</div>
			<button
				onclick={onclose}
				class="text-gray-500 transition hover:text-white"
				aria-label="Close"
			>
				<i class="fa-solid fa-xmark text-lg" aria-hidden="true"></i>
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
						placeholder="Search spells…"
						bind:value={search}
						class="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
					/>
				</div>

				<!-- Filters -->
				<div class="shrink-0 space-y-1 px-2 pb-2">
					<select
						bind:value={filterLevel}
						class="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-300 focus:border-violet-500 focus:outline-none"
					>
						<option value={null}>All Levels</option>
						<option value={0}>Cantrip</option>
						{#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as lvl}
							<option value={lvl}>{formatLevel(lvl)}</option>
						{/each}
					</select>
					<select
						bind:value={filterSchool}
						class="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-300 focus:border-violet-500 focus:outline-none"
					>
						<option value={null}>All Schools</option>
						{#each SCHOOL_OPTIONS as s}
							<option value={s}>{capitalize(s)}</option>
						{/each}
					</select>
					<select
						bind:value={filterClass}
						class="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-300 focus:border-violet-500 focus:outline-none"
					>
						<option value={null}>All Classes</option>
						{#each CLASS_OPTIONS as cls}
							<option value={cls}>{capitalize(cls)}</option>
						{/each}
					</select>
				</div>

				<!-- Spell list -->
				<div class="min-h-0 flex-1 overflow-y-auto">
					{#if loading}
						<p class="px-3 py-4 text-xs text-gray-500">Loading spells…</p>
					{:else if filteredSpells.length === 0}
						<p class="px-3 py-4 text-xs text-gray-500">No spells found.</p>
					{:else}
						{#each filteredSpells as spell}
							<button
								onclick={() => {
									selectedSpell = spell;
									diceRollResult = null;
								}}
								class="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition
								       {selectedSpell?.name === spell.name
									? 'bg-violet-900/40 text-violet-200'
									: 'text-gray-300 hover:bg-gray-800 hover:text-white'}"
							>
								<span class="truncate">{spell.name}</span>
								<span
									class="ml-1 shrink-0 rounded px-1 py-0.5 text-[10px] font-bold
								             {spell.level === 0
										? 'bg-emerald-900/60 text-emerald-300'
										: 'bg-gray-700 text-gray-400'}"
								>
									{spell.level === 0 ? 'C' : spell.level}
								</span>
							</button>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Right panel: spell card -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div class="min-h-0 flex-1 overflow-y-auto p-5 text-gray-200" onclick={handleDiceClick}>
				{#if !selectedSpell}
					<div class="flex h-full items-center justify-center text-gray-600">
						<p class="text-sm">Select a spell from the list</p>
					</div>
				{:else}
					{@const spell = selectedSpell}
					<!-- Spell name -->
					<h2 class="mb-1 text-xl font-black text-violet-300">{spell.name}</h2>

					<!-- Subtitle -->
					<div class="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-400">
						<span>{spell.level === 0 ? 'Cantrip' : `${formatLevel(spell.level)} spell`}</span>
						<span>·</span>
						<span>{capitalize(spell.school)}</span>
						{#if spell.concentration}
							<span class="rounded bg-sky-900/50 px-1.5 py-0.5 text-xs font-semibold text-sky-300"
								>Concentration</span
							>
						{/if}
						{#if spell.ritual}
							<span
								class="rounded bg-amber-900/50 px-1.5 py-0.5 text-xs font-semibold text-amber-300"
								>Ritual</span
							>
						{/if}
					</div>

					<!-- Info grid -->
					<div
						class="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm"
					>
						<div>
							<span class="text-xs font-bold tracking-wider text-gray-500 uppercase"
								>Casting Time</span
							>
							<p class="text-gray-200">{formatCastingTime(spell)}</p>
							{#if spell.castingTrigger}
								<p class="mt-0.5 text-xs leading-relaxed text-gray-500 italic">
									{spell.castingTrigger}
								</p>
							{/if}
						</div>
						<div>
							<span class="text-xs font-bold tracking-wider text-gray-500 uppercase">Range</span>
							<p class="text-gray-200">{spell.range}</p>
						</div>
						<div>
							<span class="text-xs font-bold tracking-wider text-gray-500 uppercase"
								>Components</span
							>
							<p class="text-gray-200">{formatComponents(spell)}</p>
						</div>
						<div>
							<span class="text-xs font-bold tracking-wider text-gray-500 uppercase">Duration</span>
							<p class="text-gray-200">{capitalize(spell.duration)}</p>
						</div>
					</div>

					<!-- Description -->
					<div class="spell-body mb-4">
						{#each spell.description.split('\n\n') as para}
							<p>{@html linkDice(para)}</p>
						{/each}
					</div>

					<!-- At higher levels (slot) -->
					{#if spell.higherLevelSlot}
						<div class="mb-4 rounded border border-amber-800/40 bg-amber-900/10 p-3">
							<p class="mb-1 text-xs font-bold tracking-wider text-amber-400 uppercase">
								Using a Higher-Level Spell Slot
							</p>
							<p class="spell-body text-sm">{@html linkDice(spell.higherLevelSlot)}</p>
						</div>
					{/if}

					<!-- Cantrip upgrade -->
					{#if spell.cantripUpgrade}
						<div class="mb-4 rounded border border-emerald-800/40 bg-emerald-900/10 p-3">
							<p class="mb-1 text-xs font-bold tracking-wider text-emerald-400 uppercase">
								Cantrip Upgrade
							</p>
							<p class="spell-body text-sm">{@html linkDice(spell.cantripUpgrade)}</p>
						</div>
					{/if}

					<!-- Classes -->
					{#if spell.classes.length > 0}
						<p class="text-xs text-gray-500">
							<span class="font-semibold text-gray-400">Available to:</span>
							{spell.classes.map(capitalize).join(', ')}
						</p>
					{/if}
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
				<h4 class="font-black tracking-wide text-amber-400">🎲 {r.expr}</h4>
				<button
					onclick={() => (diceRollResult = null)}
					class="text-gray-500 transition hover:text-white"
					aria-label="Close"
				>
					<i class="fa-solid fa-xmark text-base" aria-hidden="true"></i>
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
	.spell-body :global(p) {
		margin-bottom: 0.5rem;
	}
	.spell-body :global(.dice-btn) {
		display: inline;
		font-weight: 700;
		color: rgb(252, 211, 77);
		cursor: pointer;
		text-decoration: underline dotted;
	}
	.spell-body :global(.dice-btn:hover) {
		color: rgb(251, 191, 36);
	}
</style>
