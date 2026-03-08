<!-- Full-screen two-panel spell reference modal. Left panel: search + filter list.
     Right panel: spell card with rich description and clickable dice. -->
<script lang="ts">
	import type { Spell5e } from '$lib/types';
	import {
		formatSchool,
		formatLevel,
		formatTime,
		formatRange,
		formatComponents,
		formatDuration,
		getClasses,
		renderEntries,
	} from '$lib/spellRenderer';

	interface Props {
		onclose: () => void;
		initialSpell?: string;
	}

	let { onclose, initialSpell }: Props = $props();

	let allSpells = $state<Spell5e[]>([]);
	let loading = $state(true);
	let search = $state('');
	let filterLevel = $state<number | null>(null);
	let filterSchool = $state<string | null>(null);
	let filterClass = $state<string | null>(null);
	let selectedSpell = $state<Spell5e | null>(null);

	interface DiceRollResult {
		expr: string;
		rolls: number[];
		sides: number;
		modifier: number;
		total: number;
		isAttack?: boolean;
	}
	let diceRollResult = $state<DiceRollResult | null>(null);

	// Load spells on mount
	$effect(() => {
		fetch('/api/spells')
			.then((r) => r.json())
			.then((data: { spells: Spell5e[] }) => {
				allSpells = data.spells;
				loading = false;
				if (initialSpell) {
					const match = allSpells.find(
						(s) => s.name.toLowerCase() === initialSpell.toLowerCase()
					);
					if (match) selectedSpell = match;
				}
			})
			.catch(() => {
				loading = false;
			});
	});

	const SCHOOL_OPTIONS = [
		{ abbr: 'A', name: 'Abjuration' },
		{ abbr: 'C', name: 'Conjuration' },
		{ abbr: 'D', name: 'Divination' },
		{ abbr: 'E', name: 'Enchantment' },
		{ abbr: 'V', name: 'Evocation' },
		{ abbr: 'I', name: 'Illusion' },
		{ abbr: 'N', name: 'Necromancy' },
		{ abbr: 'T', name: 'Transmutation' },
	];

	const CLASS_OPTIONS = [
		'Artificer', 'Bard', 'Cleric', 'Druid', 'Paladin',
		'Ranger', 'Sorcerer', 'Warlock', 'Wizard',
	];

	const filteredSpells = $derived.by(() => {
		const q = search.toLowerCase();
		return allSpells.filter((s) => {
			if (q && !s.name.toLowerCase().includes(q)) return false;
			if (filterLevel !== null && s.level !== filterLevel) return false;
			if (filterSchool && s.school !== filterSchool) return false;
			if (filterClass) {
				const classes = getClasses(s);
				if (!classes.some((c) => c.toLowerCase() === filterClass!.toLowerCase())) return false;
			}
			return true;
		});
	});

	function rollDice(expr: string) {
		const m = expr.trim().match(/^(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
		if (!m) return;
		const count = parseInt(m[1]) || 1;
		const sides = parseInt(m[2]);
		const modifier = m[3] ? (m[3] === '+' ? 1 : -1) * parseInt(m[4]) : 0;
		const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
		const total = rolls.reduce((s, r) => s + r, 0) + modifier;
		diceRollResult = { expr: expr.trim(), rolls, sides, modifier, total };
	}

	function rollAttack(modStr: string) {
		const modifier = parseInt(modStr);
		const roll = Math.floor(Math.random() * 20) + 1;
		const sign = modifier >= 0 ? '+' : '';
		diceRollResult = {
			expr: `Attack roll ${sign}${modifier}`,
			rolls: [roll],
			sides: 20,
			modifier,
			total: roll + modifier,
			isAttack: true,
		};
	}

	function handleDiceClick(e: MouseEvent) {
		const target = (e.target as HTMLElement).closest('[data-dice],[data-attack]') as HTMLElement | null;
		if (!target) return;
		e.stopPropagation();
		if (target.dataset.dice) rollDice(target.dataset.dice);
		else if (target.dataset.attack !== undefined) rollAttack(target.dataset.attack);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	role="dialog"
	aria-modal="true"
	aria-label="Spell Reference"
	class="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-10 backdrop-blur-sm"
	tabindex="-1"
	onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}
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
			<h3 class="text-base font-black tracking-wide text-violet-300">Spell Reference</h3>
			<button onclick={onclose} class="text-gray-500 transition hover:text-white" aria-label="Close">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
				</svg>
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
						{#each [1,2,3,4,5,6,7,8,9] as lvl}
							<option value={lvl}>{formatLevel(lvl)}</option>
						{/each}
					</select>
					<select
						bind:value={filterSchool}
						class="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-300 focus:border-violet-500 focus:outline-none"
					>
						<option value={null}>All Schools</option>
						{#each SCHOOL_OPTIONS as s}
							<option value={s.abbr}>{s.name}</option>
						{/each}
					</select>
					<select
						bind:value={filterClass}
						class="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-300 focus:border-violet-500 focus:outline-none"
					>
						<option value={null}>All Classes</option>
						{#each CLASS_OPTIONS as cls}
							<option value={cls}>{cls}</option>
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
								onclick={() => { selectedSpell = spell; diceRollResult = null; }}
								class="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition
								       {selectedSpell?.name === spell.name && selectedSpell?.source === spell.source
									? 'bg-violet-900/40 text-violet-200'
									: 'text-gray-300 hover:bg-gray-800 hover:text-white'}"
							>
								<span class="truncate">{spell.name}</span>
								<span class="ml-1 shrink-0 rounded px-1 py-0.5 text-[10px] font-bold
								             {spell.level === 0 ? 'bg-emerald-900/60 text-emerald-300' : 'bg-gray-700 text-gray-400'}">
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
						<span>{formatSchool(spell.school)}</span>
						<span class="rounded bg-indigo-900/60 px-1.5 py-0.5 text-xs font-semibold text-indigo-300">{spell.source}</span>
						{#if spell.ritual}
							<span class="rounded bg-amber-900/50 px-1.5 py-0.5 text-xs font-semibold text-amber-300">Ritual</span>
						{/if}
					</div>

					<!-- Info grid -->
					<div class="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm">
						<div>
							<span class="text-xs font-bold tracking-wider text-gray-500 uppercase">Casting Time</span>
							<p class="text-gray-200">{formatTime(spell.time as unknown[])}</p>
						</div>
						<div>
							<span class="text-xs font-bold tracking-wider text-gray-500 uppercase">Range</span>
							<p class="text-gray-200">{formatRange(spell.range)}</p>
						</div>
						<div>
							<span class="text-xs font-bold tracking-wider text-gray-500 uppercase">Components</span>
							<p class="text-gray-200">{formatComponents(spell.components)}</p>
						</div>
						<div>
							<span class="text-xs font-bold tracking-wider text-gray-500 uppercase">Duration</span>
							<p class="text-gray-200">{formatDuration(spell.duration as unknown[])}</p>
						</div>
					</div>

					<!-- Description -->
					<div class="spell-body mb-4">
						{@html renderEntries(spell.entries as unknown[])}
					</div>

					<!-- At higher levels -->
					{#if spell.entriesHigherLevel && (spell.entriesHigherLevel as unknown[]).length > 0}
						<div class="mb-4 rounded border border-amber-800/40 bg-amber-900/10 p-3">
							<p class="mb-1 text-xs font-bold tracking-wider text-amber-400 uppercase">At Higher Levels</p>
							<div class="spell-body text-sm">
								{@html renderEntries(spell.entriesHigherLevel as unknown[])}
							</div>
						</div>
					{/if}

					<!-- Classes -->
					{#if getClasses(spell).length > 0}
						<p class="text-xs text-gray-500">
							<span class="font-semibold text-gray-400">Available to:</span>
							{getClasses(spell).join(', ')}
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
		onkeydown={(e) => { if (e.key === 'Escape') diceRollResult = null; }}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="min-w-[18rem] max-w-sm rounded-xl border border-gray-600 bg-gray-900 p-5 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mb-4 flex items-center justify-between">
				<h4 class="font-black tracking-wide text-amber-400">🎲 {r.expr}</h4>
				<button onclick={() => (diceRollResult = null)} class="text-gray-500 transition hover:text-white" aria-label="Close">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
					</svg>
				</button>
			</div>
			<div class="mb-4 flex flex-wrap gap-2">
				{#each r.rolls as roll}
					<div class="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-gray-600 bg-gray-800 text-lg font-black text-white">
						{roll}
					</div>
				{/each}
			</div>
			{#if r.modifier !== 0}
				<p class="mb-1 text-sm text-gray-400">
					{r.isAttack ? 'd20' : 'Dice sum'}: {r.rolls.reduce((s, v) => s + v, 0)}<span class={r.modifier > 0 ? 'text-green-400' : 'text-red-400'}> {r.modifier > 0 ? '+' : ''}{r.modifier}</span>
				</p>
			{/if}
			<p class="text-2xl font-black text-white">Total: <span class="text-amber-300">{r.total}</span></p>
			<button
				onclick={() => {
					if (r.isAttack) rollAttack(String(r.modifier));
					else rollDice(r.expr);
				}}
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
	.spell-body :global(ul) {
		list-style: disc;
		padding-left: 1.25rem;
		margin-bottom: 0.5rem;
	}
	.spell-body :global(li) {
		margin-bottom: 0.25rem;
	}
	.spell-body :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 0.75rem;
		font-size: 0.8rem;
	}
	.spell-body :global(th),
	.spell-body :global(td) {
		border: 1px solid rgb(75, 85, 99);
		padding: 0.25rem 0.5rem;
		text-align: left;
	}
	.spell-body :global(th) {
		background: rgb(31, 41, 55);
		font-weight: 600;
		color: rgb(209, 213, 219);
	}
	.spell-body :global(caption) {
		font-weight: 700;
		text-align: left;
		padding-bottom: 0.25rem;
		color: rgb(156, 163, 175);
	}
</style>
