<script lang="ts">
	import type { MonsterDetail } from '$lib/types';

	interface Props {
		monster: MonsterDetail | null;
		onclose: () => void;
	}

	let { monster, onclose }: Props = $props();

	let imgExpanded = $state(false);

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
		if (monster) {
			imgExpanded = false;
			diceRollResult = null;
		}
	});

	/** Wrap dice expressions and attack-roll phrases in clickable buttons. */
	function linkDice(html: string): string {
		// Pass 1 — dice expressions like "2d6+3" or "2d6 + 3"
		let out = html.replace(
			/(<[^>]+>)|(\b\d+d\d+(?:\s*[+-]\s*\d+)?(?=\b|\s|[^a-zA-Z]))/g,
			(_, tag: string | undefined, dice: string | undefined) => {
				if (tag) return tag;
				return `<button class="dice-btn" data-dice="${dice!.trim()}">${dice}</button>`;
			}
		);
		// Pass 2 — attack phrases like "<em>Melee Weapon Attack:</em> +9 to hit"
		//           or plain "Ranged Weapon Attack: +4 to hit" (imported monsters)
		out = out.replace(
			/((?:<em>)?(?:Melee(?:\s+or\s+Ranged)?|Ranged)\s+(?:Weapon|Spell)\s+Attack:?(?:<\/em>)?)\s*([+-]?\d+)\s+to\s+hit/gi,
			(_, label: string, modStr: string) => {
				const mod = parseInt(modStr);
				const sign = mod >= 0 ? '+' : '';
				return `<button class="atk-btn" data-attack="${mod}">${label} ${sign}${mod} to hit</button>`;
			}
		);
		return out;
	}

	function rollDice(expr: string) {
		const m = expr.trim().match(/^(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
		if (!m) return;
		const count = parseInt(m[1]);
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
			isAttack: true
		};
	}

	function handleDiceClick(e: MouseEvent) {
		const target = (e.target as HTMLElement).closest('[data-dice],[data-attack]') as HTMLElement | null;
		if (!target) return;
		e.stopPropagation();
		if (target.dataset.dice) rollDice(target.dataset.dice);
		else if (target.dataset.attack !== undefined) rollAttack(target.dataset.attack);
	}
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
					<h3 class="text-lg font-black tracking-wide text-red-400">{monster.name}</h3>
					<p class="text-xs text-gray-400 italic">{monster.meta}</p>
					{#if monster.source}
						<p class="mt-0.5 text-xs text-gray-500">
							<span class="rounded bg-indigo-900/60 px-1 py-0.5 font-semibold text-indigo-300">{monster.source}</span>{#if monster.page}&nbsp;p.&nbsp;{monster.page}{/if}
						</p>
					{/if}
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

			<!-- Scrollable body — dice clicks bubble up to this handler -->
			<div class="overflow-y-auto p-5 text-gray-200" onclick={handleDiceClick}>
				<!-- Image -->
				{#if monster.imgUrl}
					<div class="mb-4">
						<button
							onclick={() => (imgExpanded = !imgExpanded)}
							class="w-full overflow-hidden rounded-lg focus:outline-none"
							title={imgExpanded ? 'Collapse image' : 'Expand image'}
						>
							<img
								src={monster.imgUrl}
								alt={monster.name}
								class="w-full rounded-lg object-cover transition-all duration-300
								       {imgExpanded ? 'max-h-[32rem] object-contain' : 'h-32 object-top'}"
							/>
						</button>
						<p class="mt-1 text-right text-[10px] text-gray-500">
							{imgExpanded ? 'Click to collapse' : 'Click to expand'}
						</p>
					</div>
				{/if}

				<!-- Core stats -->
				<div class="mb-4 flex flex-wrap gap-4 border-b border-gray-700 pb-4 text-sm">
					<div>
						<span class="text-gray-500">AC</span>
						<span class="font-bold text-gray-200">{monster.armorClass}</span>
					</div>
					<div>
						<span class="text-gray-500">HP</span>
						<!-- HP often contains a dice expression like 52 (8d8+16) -->
						<span class="font-bold text-gray-200">{@html linkDice(monster.hitPoints)}</span>
					</div>
					<div>
						<span class="text-gray-500">Speed</span>
						<span class="font-bold text-gray-200">{monster.speed}</span>
					</div>
					<div>
						<span class="text-gray-500">CR</span>
						<span class="font-bold text-amber-300">{monster.challenge}</span>
					</div>
				</div>

				<!-- Ability scores -->
				<div class="mb-4 grid grid-cols-6 gap-2 border-b border-gray-700 pb-4 text-center">
					{#each [{ label: 'STR', val: monster.str, mod: monster.strMod }, { label: 'DEX', val: monster.dex, mod: monster.dexMod }, { label: 'CON', val: monster.con, mod: monster.conMod }, { label: 'INT', val: monster.int, mod: monster.intMod }, { label: 'WIS', val: monster.wis, mod: monster.wisMod }, { label: 'CHA', val: monster.cha, mod: monster.chaMod }] as stat}
						<div class="rounded bg-gray-800 px-1 py-2">
							<div class="text-xs font-bold tracking-wider text-red-400 uppercase">
								{stat.label}
							</div>
							<div class="text-sm font-bold text-white">{stat.val}</div>
							<div class="text-xs text-gray-400">{stat.mod}</div>
						</div>
					{/each}
				</div>

				<!-- Secondary stats -->
				<div class="mb-4 flex flex-col gap-1 border-b border-gray-700 pb-4 text-sm">
					{#if monster.savingThrows}
						<div>
							<span class="text-gray-500">Saving Throws </span><span>{monster.savingThrows}</span>
						</div>
					{/if}
					{#if monster.skills}
						<div><span class="text-gray-500">Skills </span><span>{monster.skills}</span></div>
					{/if}
					{#if monster.damageVulnerabilities}
					<div>
						<span class="text-gray-500">Damage Vulnerabilities </span><span
							>{monster.damageVulnerabilities}</span
						>
					</div>
				{/if}
				{#if monster.damageImmunities}
						<div>
							<span class="text-gray-500">Damage Immunities </span><span
								>{monster.damageImmunities}</span
							>
						</div>
					{/if}
					{#if monster.damageResistances}
						<div>
							<span class="text-gray-500">Damage Resistances </span><span
								>{monster.damageResistances}</span
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
						<div><span class="text-gray-500">Languages </span><span>{monster.languages}</span></div>
					{/if}
				</div>

				<!-- Traits -->
				{#if monster.traits}
					<div class="mb-4 border-b border-gray-700 pb-4">
						<div class="[&_em]:text-gray-300 [&_p]:mb-2 [&_strong]:text-gray-200">
							{@html linkDice(monster.traits)}
						</div>
					</div>
				{/if}

				<!-- Actions -->
				{#if monster.actions}
					<div class="mb-4 border-b border-gray-700 pb-4">
						<h4 class="mb-2 text-xs font-bold tracking-widest text-red-400 uppercase">Actions</h4>
						<div class="[&_em]:text-gray-300 [&_p]:mb-2 [&_strong]:text-gray-200">
							{@html linkDice(monster.actions)}
						</div>
					</div>
				{/if}

				<!-- Reactions -->
				{#if monster.reactions}
					<div class="mb-4 border-b border-gray-700 pb-4">
						<h4 class="mb-2 text-xs font-bold tracking-widest text-red-400 uppercase">Reactions</h4>
						<div class="[&_em]:text-gray-300 [&_p]:mb-2 [&_strong]:text-gray-200">
							{@html linkDice(monster.reactions)}
						</div>
					</div>
				{/if}

				<!-- Legendary Actions -->
				{#if monster.legendaryActions}
					<div class="mb-2">
						<h4 class="mb-2 text-xs font-bold tracking-widest text-amber-400 uppercase">
							Legendary Actions
						</h4>
						<div class="[&_em]:text-gray-300 [&_p]:mb-2 [&_strong]:text-gray-200">
							{@html linkDice(monster.legendaryActions)}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Dice roll result modal (z-[60], renders above the info modal) -->
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
		<div
			class="min-w-[18rem] max-w-sm rounded-xl border border-gray-600 bg-gray-900 p-5 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Title row -->
			<div class="mb-4 flex items-center justify-between">
				<h4 class="font-black tracking-wide text-amber-400">🎲 {r.expr}</h4>
				<button
					onclick={() => (diceRollResult = null)}
					class="text-gray-500 transition hover:text-white"
					aria-label="Close"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Individual die results -->
			<div class="mb-4 flex flex-wrap gap-2">
				{#each r.rolls as roll}
					<div class="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-gray-600 bg-gray-800 text-lg font-black text-white">
						{roll}
					</div>
				{/each}
			</div>

			<!-- Modifier line (only shown when there is one) -->
			{#if r.modifier !== 0}
				<p class="mb-1 text-sm text-gray-400">
					Dice sum: {r.rolls.reduce((s, v) => s + v, 0)}<span class={r.modifier > 0 ? 'text-green-400' : 'text-red-400'}> {r.modifier > 0 ? '+' : ''}{r.modifier}</span>
				</p>
			{/if}

			<!-- Total -->
			<p class="text-2xl font-black text-white">
				Total: <span class="text-amber-300">{r.total}</span>
			</p>

			<button
				onclick={() => r.isAttack ? rollAttack(String(r.modifier)) : rollDice(r.expr)}
				class="mt-4 w-full rounded bg-amber-700 py-1.5 text-sm font-bold text-white transition hover:bg-amber-600"
			>
				Roll again
			</button>
		</div>
	</div>
{/if}

<style>
	/* Dice expression buttons injected via {@html linkDice(...)} */
	:global(.dice-btn) {
		display: inline;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		color: rgb(252, 211, 77); /* amber-300 */
		text-decoration: underline;
		text-decoration-style: dotted;
		cursor: pointer;
		background: transparent;
		border: none;
		padding: 0;
		font-size: inherit;
		line-height: inherit;
	}
	:global(.dice-btn:hover) {
		color: rgb(253, 230, 138); /* amber-200 */
	}
	/* Attack-roll phrase buttons (Melee/Ranged Weapon Attack: +N to hit) */
	:global(.atk-btn) {
		display: inline;
		color: rgb(196, 181, 253); /* violet-300 */
		text-decoration: underline;
		text-decoration-style: dotted;
		cursor: pointer;
		background: transparent;
		border: none;
		padding: 0;
		font-size: inherit;
		line-height: inherit;
		font-style: inherit;
		font-weight: inherit;
	}
	:global(.atk-btn:hover) {
		color: rgb(221, 214, 254); /* violet-200 */
	}
</style>
