<!-- Legendary actions modal — shows a monster's legendary action text with clickable
     dice/attack buttons. Contains its own dice-result overlay. -->
<script lang="ts">
	interface Props {
		modal: { name: string; text: string } | null;
		onclose: () => void;
	}

	import { triggerRoll } from '$lib/diceOverlay.svelte';

	let { modal, onclose }: Props = $props();

	interface DiceRollResult {
		expr: string;
		rolls: number[];
		modifier: number;
		total: number;
		isAttack?: boolean;
	}

	let diceResult = $state<DiceRollResult | null>(null);

	function linkDice(html: string): string {
		let out = html.replace(
			/(<[^>]+>)|(\b\d*d\d+(?:\s*[+-]\s*\d+)?(?=\b|\s|[^a-zA-Z]))/g,
			(_, tag: string | undefined, dice: string | undefined) => {
				if (tag) return tag;
				return `<button class="dice-btn" data-dice="${dice!.trim()}">${dice}</button>`;
			}
		);
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
		const m = expr.trim().match(/^(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
		if (!m) return;
		const count = parseInt(m[1]) || 1;
		const sides = parseInt(m[2]);
		const modifier = m[3] ? (m[3] === '+' ? 1 : -1) * parseInt(m[4]) : 0;
		diceResult = null;
		triggerRoll(`${count}d${sides}`, (rolls) => {
			diceResult = { expr: expr.trim(), rolls, modifier, total: rolls.reduce((s, r) => s + r, 0) + modifier };
		});
	}

	function rollAttack(modStr: string) {
		const modifier = parseInt(modStr);
		const sign = modifier >= 0 ? '+' : '';
		diceResult = null;
		triggerRoll('1d20', ([roll]) => {
			diceResult = { expr: `Attack roll ${sign}${modifier}`, rolls: [roll], modifier, total: roll + modifier, isAttack: true };
		});
	}

	function handleDiceClick(e: MouseEvent) {
		const target = (e.target as HTMLElement).closest('[data-dice],[data-attack]') as HTMLElement | null;
		if (!target) return;
		e.stopPropagation();
		if (target.dataset.dice) rollDice(target.dataset.dice);
		else if (target.dataset.attack !== undefined) rollAttack(target.dataset.attack);
	}

	function close() {
		diceResult = null;
		onclose();
	}
</script>

{#if modal}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
		onmousedown={(e) => { if (e.target === e.currentTarget) close(); }}
	>
		<div class="mx-4 w-full max-w-lg rounded-xl border border-amber-700/50 bg-gray-900 shadow-2xl">
			<div class="flex items-center justify-between border-b border-amber-900/40 px-5 py-3">
				<div class="flex items-center gap-2">
					<span class="text-amber-400">★</span>
					<span class="text-sm font-bold tracking-widest text-amber-300 uppercase">Legendary Actions</span>
					<span class="text-xs text-gray-500">— {modal.name}</span>
				</div>
				<button onclick={close} aria-label="Close" class="text-gray-600 transition hover:text-gray-300">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				class="monster-text max-h-[60vh] overflow-y-auto px-5 py-4 text-sm text-gray-300 leading-relaxed"
				onclick={handleDiceClick}
			>
				{@html linkDice(modal.text)}
			</div>
		</div>
	</div>
{/if}

{#if diceResult}
	{@const r = diceResult}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="fixed inset-0 z-[60] flex items-center justify-center" onclick={() => (diceResult = null)}>
		<div class="min-w-[18rem] max-w-sm rounded-xl border border-gray-600 bg-gray-900 p-5 shadow-2xl" onclick={(e) => e.stopPropagation()}>
			<div class="mb-4 flex items-center justify-between">
				<h4 class="font-black tracking-wide text-amber-400">🎲 {r.expr}</h4>
				<button onclick={() => (diceResult = null)} aria-label="Close" class="text-gray-500 transition hover:text-white">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="mb-4 flex flex-wrap gap-2">
				{#each r.rolls as roll}
					<div class="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-gray-600 bg-gray-800 text-lg font-black text-white">{roll}</div>
				{/each}
			</div>
			{#if r.modifier !== 0}
				<p class="mb-1 text-sm text-gray-400">
					{r.isAttack ? 'd20' : 'Dice sum'}: {r.rolls.reduce((s, v) => s + v, 0)}<span class={r.modifier > 0 ? 'text-green-400' : 'text-red-400'}> {r.modifier > 0 ? '+' : ''}{r.modifier}</span>
				</p>
			{/if}
			<p class="text-2xl font-black text-white">Total: <span class="text-amber-300">{r.total}</span></p>
			<button
				onclick={() => { if (r.isAttack) rollAttack(String(r.modifier)); else rollDice(r.expr); }}
				class="mt-4 w-full rounded bg-amber-700 py-1.5 text-sm font-bold text-white transition hover:bg-amber-600"
			>Roll again</button>
		</div>
	</div>
{/if}
