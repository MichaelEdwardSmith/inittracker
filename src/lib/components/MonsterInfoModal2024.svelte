<!-- Read-only stat-block modal for a 2024 Monster Manual monster.
     Renders the structured MonsterDetail2024 arrays (traits, actions, bonusActions,
     reactions, legendary) with clickable dice and attack rolls. -->
<script lang="ts">
	import type { MonsterDetail2024, MonsterAction2024 } from '$lib/types';
	import { getContext } from 'svelte';
	import { triggerRoll } from '$lib/diceOverlay.svelte';

	interface Props {
		monster: MonsterDetail2024 | null;
		onclose: () => void;
	}

	let { monster, onclose }: Props = $props();

	const openSpell = getContext<((name: string) => void) | undefined>('openSpell');

	interface DiceRollResult {
		expr: string;
		rolls: number[];
		sides: number;
		modifier: number;
		total: number;
		isAttack?: boolean;
		isSavingThrow?: boolean;
		savingThrowStatLabel?: string;
	}

	let diceRollResult = $state<DiceRollResult | null>(null);

	$effect(() => {
		if (monster) diceRollResult = null;
	});

	const STATS = [
		{ label: 'STR', key: 'STR' as const },
		{ label: 'DEX', key: 'DEX' as const },
		{ label: 'CON', key: 'CON' as const },
		{ label: 'INT', key: 'INT' as const },
		{ label: 'WIS', key: 'WIS' as const },
		{ label: 'CHA', key: 'CHA' as const }
	];

	// ---------------------------------------------------------------------------
	// Dice / attack linkification for plain-text descriptions
	// ---------------------------------------------------------------------------

	/** Wrap dice expressions (e.g. 2d6+3) in clickable buttons. */
	function linkDice(text: string): string {
		return text.replace(
			/\b(\d*d\d+(?:\s*[+-]\s*\d+)?)\b/g,
			(match) =>
				`<button class="dice-btn" data-dice="${match.replace(/\s/g, '')}">${match}</button>`
		);
	}

	/** Wrap "Attack Roll: +N" patterns with clickable attack buttons. */
	function linkAttacks(text: string): string {
		return text.replace(
			/((?:Melee|Ranged|Melee or Ranged)\s+Attack\s+Roll:\s*)([+-]\d+)/gi,
			(_, prefix, mod) => `${prefix}<button class="atk-btn" data-attack="${mod}">${mod}</button>`
		);
	}

	/** Wrap spell names after "At will:", "X/Day:", etc. with clickable spell buttons. */
	function linkSpells(text: string): string {
		return text.replace(
			/((?:At will|(?:\d+\/Day(?:\s+each)?)|(?:Cantrips?))\s*:)\s*([^\n.]+)/gi,
			(_, header: string, spellList: string) => {
				const linked = spellList
					.split(/,\s*/)
					.map((name) => {
						const trimmed = name.trim().replace(/[.;]$/, '');
						if (!trimmed) return name;
						return `<button class="spell-btn" data-spell="${trimmed}">${trimmed}</button>`;
					})
					.join(', ');
				return header + ' ' + linked;
			}
		);
	}

	function renderDesc(text: string): string {
		return linkSpells(linkAttacks(linkDice(text)));
	}

	// ---------------------------------------------------------------------------
	// Dice rolling
	// ---------------------------------------------------------------------------

	function rollDice(expr: string) {
		const m = expr.match(/^(\d*)d(\d+)(?:[+-](\d+))?$/i);
		if (!m) return;
		const count = parseInt(m[1]) || 1;
		const sides = parseInt(m[2]);
		// detect sign from original expr
		const sign = expr.includes('-') ? -1 : 1;
		const modifier = m[3] ? sign * parseInt(m[3]) : 0;
		diceRollResult = null;
		triggerRoll(`${count}d${sides}`, (rolls) => {
			const total = rolls.reduce((s, r) => s + r, 0) + modifier;
			diceRollResult = { expr, rolls, sides, modifier, total };
		});
	}

	function rollAttack(modStr: string) {
		const modifier = parseInt(modStr);
		const sign = modifier >= 0 ? '+' : '';
		diceRollResult = null;
		triggerRoll('1d20', ([roll]) => {
			diceRollResult = {
				expr: `Attack roll ${sign}${modifier}`,
				rolls: [roll],
				sides: 20,
				modifier,
				total: roll + modifier,
				isAttack: true
			};
		});
	}

	function rollSave(statLabel: string) {
		if (!monster) return;
		const ability = monster.abilities[statLabel as keyof typeof monster.abilities];
		const saveStr = ability.save;
		const modifier = parseInt(saveStr);
		const sign = modifier >= 0 ? '+' : '';
		diceRollResult = null;
		triggerRoll('1d20', ([roll]) => {
			diceRollResult = {
				expr: `${statLabel} Save ${sign}${modifier}`,
				rolls: [roll],
				sides: 20,
				modifier,
				total: roll + modifier,
				isSavingThrow: true,
				savingThrowStatLabel: statLabel
			};
		});
	}

	function handleStatBlockClick(e: MouseEvent) {
		const target = (e.target as HTMLElement).closest(
			'[data-dice],[data-attack],[data-spell]'
		) as HTMLElement | null;
		if (!target) return;
		e.stopPropagation();
		if (target.dataset.dice) rollDice(target.dataset.dice);
		else if (target.dataset.attack !== undefined) rollAttack(target.dataset.attack);
		else if (target.dataset.spell) {
			const spellName = target.dataset.spell.replace(/[^a-zA-Z0-9 '\-/]/g, '').trim();
			onclose();
			openSpell?.(spellName);
		}
	}

	// ---------------------------------------------------------------------------
	// Section rendering helper
	// ---------------------------------------------------------------------------
	function renderSection(actions: MonsterAction2024[]): string {
		return actions
			.map((a) => `<p><strong>${a.name}.</strong> ${renderDesc(a.description)}</p>`)
			.join('');
	}

	const traitsHtml = $derived(monster ? renderSection(monster.traits) : '');
	const actionsHtml = $derived(monster ? renderSection(monster.actions) : '');
	const bonusActionsHtml = $derived(monster ? renderSection(monster.bonusActions) : '');
	const reactionsHtml = $derived(monster ? renderSection(monster.reactions) : '');
	const legendaryHtml = $derived(
		monster && monster.legendary.actions.length > 0 ? renderSection(monster.legendary.actions) : ''
	);
	const lairHtml = $derived(
		monster?.lair && monster.lair.actions.length > 0 ? renderSection(monster.lair.actions) : ''
	);
</script>

{#if monster}
	<div
		role="dialog"
		aria-modal="true"
		aria-label="Monster information"
		class="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-12 backdrop-blur-sm"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) onclose();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') onclose();
		}}
	>
		<div
			class="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl"
			style="max-height: calc(100vh - 4rem);"
		>
			<!-- Header -->
			<div class="flex shrink-0 items-center justify-between border-b border-gray-700 px-5 py-4">
				<div>
					<div class="flex items-center gap-2">
						<h3 class="text-lg font-black tracking-wide text-red-400">{monster.name}</h3>
						<span
							class="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-blue-300 uppercase ring-1 ring-blue-500/30"
							>2024</span
						>
					</div>
					<p class="text-xs text-gray-400 italic">
						{monster.size}
						{monster.type}, {monster.alignment}
					</p>
				</div>
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

			<!-- Scrollable body -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div class="overflow-y-auto p-5 text-gray-200" onclick={handleStatBlockClick}>
				<!-- Core stats -->
				<div class="mb-4 flex flex-wrap gap-4 border-b border-gray-700 pb-4 text-sm">
					<div>
						<span class="text-gray-500">AC </span>
						<span class="font-bold text-gray-200">{monster.ac}</span>
					</div>
					<div>
						<span class="text-gray-500">HP </span>
						<span class="font-bold text-gray-200">{@html linkDice(monster.hp)}</span>
					</div>
					<div>
						<span class="text-gray-500">Speed </span>
						<span class="font-bold text-gray-200">{monster.speed}</span>
					</div>
					<div>
						<span class="text-gray-500">CR </span>
						<span class="font-bold text-amber-300">{monster.cr}</span>
						{#if monster.xp}
							<span class="text-gray-500"> ({monster.xp.toLocaleString()} XP)</span>
						{/if}
					</div>
					<div>
						<span class="text-gray-500">Initiative </span>
						<span class="font-bold text-gray-200"
							>{monster.initiative.mod} ({monster.initiative.score})</span
						>
					</div>
				</div>

				<!-- Ability scores — 2024 format: score, mod, and save all shown -->
				<div class="mb-4 border-b border-gray-700 pb-4">
					<div class="grid grid-cols-6 gap-2 text-center">
						{#each STATS as stat}
							{@const ability = monster.abilities[stat.key]}
							<button
								onclick={() => rollSave(stat.label)}
								title="Roll {stat.label} saving throw ({ability.save})"
								class="rounded bg-gray-800 px-1 py-2 transition hover:bg-violet-900/50 hover:ring-1 hover:ring-violet-500 active:scale-95"
							>
								<div class="text-xs font-bold tracking-wider text-red-400 uppercase">
									{stat.label}
								</div>
								<div class="text-sm font-bold text-white">{ability.score}</div>
								<div class="text-xs text-gray-400">{ability.mod}</div>
								<div class="mt-0.5 text-[10px] text-violet-400">Save {ability.save}</div>
							</button>
						{/each}
					</div>
				</div>

				<!-- Secondary stats -->
				<div class="mb-4 flex flex-col gap-1 border-b border-gray-700 pb-4 text-sm">
					{#if monster.skills}
						<div><span class="text-gray-500">Skills </span><span>{monster.skills}</span></div>
					{/if}
					{#if monster.immunities}
						<div>
							<span class="text-gray-500">Immunities </span><span>{monster.immunities}</span>
						</div>
					{/if}
					{#if monster.resistances}
						<div>
							<span class="text-gray-500">Resistances </span><span>{monster.resistances}</span>
						</div>
					{/if}
					{#if monster.vulnerabilities}
						<div>
							<span class="text-gray-500">Vulnerabilities </span><span
								>{monster.vulnerabilities}</span
							>
						</div>
					{/if}
					{#if monster.conditionImmunities}
						<div>
							<span class="text-gray-500">Condition Immunities </span><span
								>{monster.conditionImmunities}</span
							>
						</div>
					{/if}
					{#if monster.senses}
						<div><span class="text-gray-500">Senses </span><span>{monster.senses}</span></div>
					{/if}
					{#if monster.languages}
						<div>
							<span class="text-gray-500">Languages </span><span>{monster.languages}</span>
						</div>
					{/if}
					{#if monster.proficiencyBonus}
						<div>
							<span class="text-gray-500">Proficiency Bonus </span><span
								>{monster.proficiencyBonus}</span
							>
						</div>
					{/if}
				</div>

				<!-- Traits -->
				{#if monster.traits.length > 0}
					<div class="mb-4 border-b border-gray-700 pb-4">
						<div class="stat-section">{@html traitsHtml}</div>
					</div>
				{/if}

				<!-- Actions -->
				{#if monster.actions.length > 0}
					<div class="mb-4 border-b border-gray-700 pb-4">
						<h4 class="mb-2 text-xs font-bold tracking-widest text-red-400 uppercase">Actions</h4>
						<div class="stat-section">{@html actionsHtml}</div>
					</div>
				{/if}

				<!-- Bonus Actions -->
				{#if monster.bonusActions.length > 0}
					<div class="mb-4 border-b border-gray-700 pb-4">
						<h4 class="mb-2 text-xs font-bold tracking-widest text-orange-400 uppercase">
							Bonus Actions
						</h4>
						<div class="stat-section">{@html bonusActionsHtml}</div>
					</div>
				{/if}

				<!-- Reactions -->
				{#if monster.reactions.length > 0}
					<div class="mb-4 border-b border-gray-700 pb-4">
						<h4 class="mb-2 text-xs font-bold tracking-widest text-red-400 uppercase">Reactions</h4>
						<div class="stat-section">{@html reactionsHtml}</div>
					</div>
				{/if}

				<!-- Legendary Actions -->
				{#if monster.legendary.actions.length > 0}
					<div class="mb-4 {lairHtml ? 'border-b border-gray-700 pb-4' : ''}">
						<h4 class="mb-1 text-xs font-bold tracking-widest text-amber-400 uppercase">
							Legendary Actions
						</h4>
						{#if monster.legendary.preamble}
							<p class="mb-2 text-sm text-gray-400 italic">{monster.legendary.preamble}</p>
						{/if}
						<div class="stat-section">{@html legendaryHtml}</div>
					</div>
				{/if}

				<!-- Lair Actions -->
				{#if lairHtml}
					<div class="mb-2">
						<h4 class="mb-1 text-xs font-bold tracking-widest text-teal-400 uppercase">
							Lair Actions
						</h4>
						{#if monster.lair?.preamble}
							<p class="mb-2 text-sm text-gray-400 italic">{monster.lair.preamble}</p>
						{/if}
						<div class="stat-section">{@html lairHtml}</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

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
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
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
					{r.isSavingThrow ? 'd20' : 'Dice sum'}: {r.rolls.reduce((s, v) => s + v, 0)}<span
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
				onclick={() => {
					if (r.isSavingThrow && r.savingThrowStatLabel) rollSave(r.savingThrowStatLabel);
					else if (r.isAttack) rollAttack(String(r.modifier));
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
	.stat-section :global(p) {
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		line-height: 1.5;
	}
	.stat-section :global(strong) {
		color: rgb(229, 231, 235);
	}
	:global(.dice-btn) {
		display: inline;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		color: rgb(252, 211, 77);
		text-decoration: underline dotted;
		cursor: pointer;
		background: transparent;
		border: none;
		padding: 0;
		font-size: inherit;
		line-height: inherit;
	}
	:global(.dice-btn:hover) {
		color: rgb(253, 230, 138);
	}
	:global(.atk-btn) {
		display: inline;
		color: rgb(196, 181, 253);
		text-decoration: underline dotted;
		cursor: pointer;
		background: transparent;
		border: none;
		padding: 0;
		font-size: inherit;
		line-height: inherit;
	}
	:global(.atk-btn:hover) {
		color: rgb(221, 214, 254);
	}
	:global(.spell-btn) {
		display: inline;
		color: rgb(147, 197, 253);
		text-decoration: underline dotted;
		cursor: pointer;
		background: transparent;
		border: none;
		padding: 0;
		font-size: inherit;
		line-height: inherit;
	}
	:global(.spell-btn:hover) {
		color: rgb(191, 219, 254);
	}
</style>
