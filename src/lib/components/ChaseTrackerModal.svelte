<!-- DM control panel for the "Gap Track" chase visualization. Before the chase goes live, the
     DM stages quarry and pursuers here — picked only from combatants currently in the
     initiative order (combat.sorted), no freeform names — without anything reaching the player
     display yet. "Start Chase" is disabled until at least one of each is staged, so players
     never see an empty track. Once started, the DM slides participants along coarse distance
     bands, tracks chase-flavor exhaustion pips, marks drop-outs, and draws complications — all
     of it live-synced to the player display via combat.chaseState. -->
<script lang="ts">
	import type { ChaseParticipant } from '$lib/types';
	import { combat } from '$lib/store.svelte';
	import { chaseBadgeClasses } from '$lib/utils';
	import ChaseTrackBoard from './ChaseTrackBoard.svelte';
	import DotTracker from './DotTracker.svelte';
	import {
		URBAN_CHASE_COMPLICATIONS,
		WILDERNESS_CHASE_COMPLICATIONS,
		rollChaseComplication
	} from '$lib/chaseComplications';

	interface Props {
		onclose: () => void;
		ruleset?: '2014' | '2024';
	}
	let { onclose, ruleset = '2014' }: Props = $props();

	let chase = $derived(combat.chaseState);
	let showRules = $state(false);

	// Staged participants before the chase has started — nothing here reaches the player
	// display until startChase() is called. Cleared once the chase actually begins.
	let stagingParticipants = $state<ChaseParticipant[]>([]);
	const canStart = $derived(
		stagingParticipants.some((p) => p.role === 'quarry') &&
			stagingParticipants.some((p) => p.role === 'pursuer')
	);
	let complicationTable = $state<'urban' | 'wilderness'>('urban');

	// Combatants in the initiative order not already staged under any role — the only pool the
	// DM can pick quarry/pursuers from (a name can't be both, or staged twice).
	const availableCombatants = $derived(
		combat.sorted.filter((c) => !stagingParticipants.some((p) => p.name === c.name))
	);

	// Quarry/pursuers can only be added before the chase starts — once it's running, the roster
	// is locked in and the DM manages participants via the list below instead.
	function addParticipant(name: string, role: ChaseParticipant['role']) {
		stagingParticipants = [
			...stagingParticipants,
			{ id: crypto.randomUUID(), name, role, band: 0, exhaustionPips: 0, dropped: false }
		];
	}

	function removeStaged(id: string) {
		stagingParticipants = stagingParticipants.filter((p) => p.id !== id);
	}

	function startChase() {
		if (!canStart) return;
		combat.startChase(stagingParticipants);
		stagingParticipants = [];
	}

	function drawComplication() {
		const table =
			complicationTable === 'urban' ? URBAN_CHASE_COMPLICATIONS : WILDERNESS_CHASE_COMPLICATIONS;
		const c = rollChaseComplication(table);
		combat.chaseSetComplication(c.effect === '—' ? c.name : `${c.name} — ${c.effect}`);
	}

	function endChase() {
		if (confirm('End this chase? The tracker will disappear from the player display.')) {
			combat.endChase();
		}
	}

	function exhaustionDelta(p: ChaseParticipant, dotIdx: number, filled: boolean): number {
		const newCount = filled ? dotIdx : dotIdx + 1;
		return newCount - p.exhaustionPips;
	}
</script>

<!-- Backdrop -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm"
	onclick={(e) => e.target === e.currentTarget && onclose()}
></div>

<!-- Panel -->
<div
	class="fixed top-[50%] left-[50%] z-[151] flex max-h-[92vh] w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-2xl border border-amber-800/60 bg-gray-900 shadow-2xl"
>
	<!-- Header -->
	<div
		class="flex shrink-0 items-center justify-between border-b border-gray-700/60 bg-gradient-to-r from-amber-950/40 to-gray-900 px-6 py-4"
	>
		<div class="flex items-center gap-3">
			<i class="fa-duotone fa-light fa-person-running text-2xl text-amber-400" aria-hidden="true"
			></i>
			<div>
				<h2 class="text-lg font-black tracking-wider text-amber-300 uppercase">Chase Tracker</h2>
				<p class="text-xs text-gray-500">
					{#if chase}Live on the player display{:else}Choose quarry and pursuers to begin{/if}
				</p>
			</div>
		</div>
		<button
			onclick={onclose}
			aria-label="Close"
			class="rounded-lg p-2 text-gray-500 hover:bg-gray-800 hover:text-white"
			><i class="fa-duotone fa-light fa-xmark" aria-hidden="true"></i></button
		>
	</div>

	<!-- Body -->
	<div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
		<!-- Progressively-disclosed rules reference — collapsed by default -->
		<div class="mb-5 overflow-hidden rounded-lg border border-gray-700">
			<button
				onclick={() => (showRules = !showRules)}
				aria-expanded={showRules}
				class="flex w-full items-center justify-between bg-gray-800/60 px-4 py-2.5 text-left transition hover:bg-gray-800"
			>
				<span
					class="flex items-center gap-2 text-xs font-bold tracking-wider text-gray-300 uppercase"
				>
					<i class="fa-duotone fa-light fa-book-open text-amber-400" aria-hidden="true"></i>
					Rules
				</span>
				<i
					class="fa-duotone fa-light {showRules
						? 'fa-chevron-up'
						: 'fa-chevron-down'} text-xs text-gray-500"
					aria-hidden="true"
				></i>
			</button>
			{#if showRules}
				<div class="flex flex-col gap-4 border-t border-gray-700 bg-gray-800/20 px-4 py-4 text-sm">
					<section>
						<h4 class="mb-1.5 text-xs font-bold tracking-wider text-gray-400 uppercase">
							Running the Chase
						</h4>
						<ul class="space-y-1 text-gray-300">
							<li>
								• Treat it like combat: everyone rolls <strong class="text-white">initiative</strong
								>, then takes one action and moves on their turn each round.
							</li>
							<li>
								• Track the <strong class="text-white">distance</strong> between quarry and pursuers.
								The closest pursuer is the "lead."
							</li>
							<li>
								• The chase ends when a side <strong class="text-white">drops out</strong>, the
								quarry is <strong class="text-white">caught</strong>, or the quarry
								<strong class="text-white">escapes</strong> (below).
							</li>
						</ul>
					</section>
					<section>
						<h4 class="mb-1.5 text-xs font-bold tracking-wider text-gray-400 uppercase">
							Dashing &amp; Exhaustion
						</h4>
						<ul class="space-y-1 text-gray-300">
							<li>
								• Everyone can freely <strong class="text-white">Dash</strong> up to
								<strong class="text-white">3 + their CON modifier</strong> times during the chase.
							</li>
							<li>
								• Each Dash beyond that requires a
								<strong class="text-white">DC 10 Constitution check</strong> at the end of the turn, or
								the creature gains one level of exhaustion.
							</li>
							<li>
								• A creature drops out of the chase once exhaustion drops its
								<strong class="text-white">speed to 0</strong>
								({ruleset === '2024' ? 'level 6, at which point it also dies' : 'level 5'}).
							</li>
							<li>• Exhaustion gained this way clears after a short or long rest.</li>
						</ul>
					</section>
					<section>
						<h4 class="mb-1.5 text-xs font-bold tracking-wider text-gray-400 uppercase">
							Escaping
						</h4>
						<p class="text-gray-300">
							Once out of sight of every pursuer, the quarry rolls a
							<strong class="text-white">Dexterity (Stealth)</strong> check at the end of each round
							and compares it to the pursuers' passive Wisdom (Perception). Beating the highest
							passive score ends the chase — the quarry gets away.
							<span class="text-gray-400"
								>Advantage with many hiding places or a crowded/noisy area; disadvantage with few
								hiding places, a quiet/uncrowded area, or a lead pursuer with Survival proficiency.</span
							>
						</p>
					</section>
					<section>
						<h4 class="mb-1.5 text-xs font-bold tracking-wider text-gray-400 uppercase">
							Complications
						</h4>
						<p class="text-gray-300">
							At the end of each participant's turn, roll a d20 — on a
							<strong class="text-white">10 or lower</strong> a complication hits the next
							participant in initiative order. Either side can spend Inspiration to negate one. Once
							the chase is running, use <span class="text-amber-300">Draw Complication</span> to roll
							on the urban or wilderness table.
						</p>
					</section>
				</div>
			{/if}
		</div>

		{#if !chase}
			<div class="flex flex-col gap-5">
				<p class="text-sm text-gray-400">
					Pick at least one quarry and one pursuer from the initiative order, then start the chase —
					nothing shows on the player display until you do.
				</p>

				<!-- Stage participants -->
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<div
						class="flex flex-col gap-2 rounded-lg border border-amber-800/40 bg-amber-950/10 p-3"
					>
						<span class="text-xs font-bold tracking-wider text-amber-400 uppercase">Add Quarry</span
						>
						{#if availableCombatants.length > 0}
							<div class="flex flex-wrap gap-1.5">
								{#each availableCombatants as c (c.id)}
									<button
										onclick={() => addParticipant(c.name, 'quarry')}
										title="Add {c.name} as quarry"
										class="rounded-full border border-gray-700 px-2 py-0.5 text-[11px] text-gray-400 transition hover:border-amber-600 hover:text-amber-300"
									>
										+ {c.name}
									</button>
								{/each}
							</div>
						{:else}
							<p class="text-xs text-gray-600">No one left in the initiative order to add.</p>
						{/if}
					</div>
					<div class="flex flex-col gap-2 rounded-lg border border-red-900/40 bg-red-950/10 p-3">
						<span class="text-xs font-bold tracking-wider text-red-400 uppercase">Add Pursuer</span>
						{#if availableCombatants.length > 0}
							<div class="flex flex-wrap gap-1.5">
								{#each availableCombatants as c (c.id)}
									<button
										onclick={() => addParticipant(c.name, 'pursuer')}
										title="Add {c.name} as pursuer"
										class="rounded-full border border-gray-700 px-2 py-0.5 text-[11px] text-gray-400 transition hover:border-red-600 hover:text-red-300"
									>
										+ {c.name}
									</button>
								{/each}
							</div>
						{:else}
							<p class="text-xs text-gray-600">No one left in the initiative order to add.</p>
						{/if}
					</div>
				</div>

				<!-- Staged list -->
				{#if stagingParticipants.length > 0}
					<div class="flex flex-col gap-2">
						<span class="text-xs font-bold tracking-wider text-gray-500 uppercase">Staged</span>
						{#each stagingParticipants as p (p.id)}
							<div
								class="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/40 px-3 py-2"
							>
								<span
									class="flex-1 truncate text-sm font-semibold {p.role === 'quarry'
										? 'text-amber-300'
										: 'text-red-300'}"
								>
									{p.name}
								</span>
								<span
									class="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase {p.role ===
									'quarry'
										? 'bg-amber-950/60 text-amber-400'
										: 'bg-red-950/60 text-red-400'}"
								>
									{p.role}
								</span>
								<button
									onclick={() => removeStaged(p.id)}
									title="Remove"
									class="rounded p-1.5 text-gray-600 transition hover:bg-red-950/40 hover:text-red-400"
								>
									<i class="fa-duotone fa-light fa-trash text-sm" aria-hidden="true"></i>
								</button>
							</div>
						{/each}
					</div>
				{/if}

				<div class="flex flex-col items-center gap-2 pt-2">
					<button
						onclick={startChase}
						disabled={!canStart}
						class="rounded-xl bg-amber-600 px-6 py-3 font-black tracking-wider text-white uppercase transition hover:bg-amber-500 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500 disabled:active:scale-100"
					>
						Start Chase
					</button>
					{#if !canStart}
						<p class="text-xs text-gray-600">Add at least one quarry and one pursuer to start.</p>
					{/if}
				</div>
			</div>
		{:else}
			<div class="flex flex-col gap-5">
				<!-- Live preview — numbered badges instead of name chips, since full names don't fit
				     the "ADJACENT"/"CLOSE" lanes; the participant list below is the number legend. -->
				<ChaseTrackBoard bands={chase.bands} participants={chase.participants} size="sm" />

				<!-- Participant list -->
				{#if chase.participants.length > 0}
					<div class="flex flex-col gap-2">
						<span class="text-xs font-bold tracking-wider text-gray-500 uppercase"
							>Participants</span
						>
						{#each chase.participants as p, idx (p.id)}
							<div
								class="flex flex-wrap items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/40 px-3 py-2 {p.dropped
									? 'opacity-50'
									: ''}"
							>
								<div
									class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold {chaseBadgeClasses(
										p
									)}"
								>
									{idx + 1}
								</div>
								<span
									class="w-24 shrink-0 truncate text-sm font-semibold {p.role === 'quarry'
										? 'text-amber-300'
										: 'text-red-300'}"
								>
									{p.name}
								</span>
								<div class="flex items-center gap-1">
									<button
										onclick={() => combat.chaseMoveParticipant(p.id, -1)}
										disabled={p.band === 0}
										title="Closer"
										class="rounded p-1 text-gray-400 hover:text-white disabled:opacity-30"
									>
										<i class="fa-duotone fa-light fa-chevron-left" aria-hidden="true"></i>
									</button>
									<span class="min-w-[6rem] text-center text-xs text-gray-400"
										>{chase.bands[p.band]}</span
									>
									<button
										onclick={() => combat.chaseMoveParticipant(p.id, 1)}
										disabled={p.band === chase.bands.length - 1}
										title="Farther"
										class="rounded p-1 text-gray-400 hover:text-white disabled:opacity-30"
									>
										<i class="fa-duotone fa-light fa-chevron-right" aria-hidden="true"></i>
									</button>
								</div>
								<DotTracker
									label="Fatigue"
									color="orange"
									count={6}
									filledCount={p.exhaustionPips}
									dotTitle={(_dotIdx, filled) =>
										filled ? 'Remove exhaustion pip' : 'Add exhaustion pip'}
									onDotClick={(dotIdx, filled) =>
										combat.chaseAddExhaustion(p.id, exhaustionDelta(p, dotIdx, filled))}
								/>
								<button
									onclick={() => combat.chaseToggleDropped(p.id)}
									class="ml-auto rounded px-2 py-1 text-xs font-semibold transition {p.dropped
										? 'bg-gray-700 text-gray-300'
										: 'text-gray-500 hover:text-white'}"
								>
									{p.dropped ? 'Dropped Out' : 'Mark Dropped'}
								</button>
								<button
									onclick={() => combat.chaseRemoveParticipant(p.id)}
									title="Remove"
									class="rounded p-1.5 text-gray-600 transition hover:bg-red-950/40 hover:text-red-400"
								>
									<i class="fa-duotone fa-light fa-trash text-sm" aria-hidden="true"></i>
								</button>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Complications -->
				<div class="flex flex-col gap-2 rounded-lg border border-gray-700 bg-gray-800/40 p-3">
					<div class="flex items-center justify-between">
						<span class="text-xs font-bold tracking-wider text-gray-500 uppercase"
							>Complications</span
						>
						<div class="flex rounded-lg border border-gray-700 text-xs">
							<button
								onclick={() => (complicationTable = 'urban')}
								class="rounded-l-lg px-2 py-1 {complicationTable === 'urban'
									? 'bg-amber-700 text-white'
									: 'text-gray-400'}"
							>
								Urban
							</button>
							<button
								onclick={() => (complicationTable = 'wilderness')}
								class="rounded-r-lg px-2 py-1 {complicationTable === 'wilderness'
									? 'bg-amber-700 text-white'
									: 'text-gray-400'}"
							>
								Wilderness
							</button>
						</div>
					</div>
					{#if chase.complication}
						<div
							class="flex items-start justify-between gap-2 rounded-lg border border-purple-800/50 bg-purple-950/20 px-3 py-2 text-sm text-purple-200"
						>
							<span>{chase.complication}</span>
							<button
								onclick={() => combat.chaseSetComplication(null)}
								class="shrink-0 text-purple-400 hover:text-white"
								aria-label="Clear complication"
							>
								<i class="fa-duotone fa-light fa-xmark" aria-hidden="true"></i>
							</button>
						</div>
					{/if}
					<button
						onclick={drawComplication}
						class="self-start rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-300"
					>
						<i class="fa-duotone fa-light fa-dice" aria-hidden="true"></i> Draw Complication
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Footer -->
	{#if chase}
		<div class="flex shrink-0 items-center justify-between border-t border-gray-700/60 px-6 py-3">
			<span class="text-xs text-gray-500">Visible to players on the display screen</span>
			<button
				onclick={endChase}
				class="rounded-lg border border-gray-600 px-3 py-1.5 text-xs text-gray-400 transition hover:border-red-700 hover:text-red-400"
			>
				End Chase
			</button>
		</div>
	{/if}
</div>
