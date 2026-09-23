<!-- Player-facing chase takeover — pops up full-screen (same z-index tier as the dungeon room
     reveal) the moment the DM starts a chase, same as PollView/room-reveal aren't gated behind
     a menu click. Players can minimize it to a small pill if they need to see initiative/HP
     underneath mid-chase; it re-expands automatically the next time the DM starts a *new*
     chase. Purely a live rendering of combatState.chaseState — the DM's ChaseTrackerModal owns
     all the mutation logic. The looping chase.mp3 track itself is owned and played by the parent
     display page (so it keeps looping even while minimized); this component only renders the
     Mute button (`muted`/`onToggleMute` — a mute separate from the display's overall sound
     toggle) and reports taps back up. -->
<script lang="ts">
	import type { ChaseState } from '$lib/types';
	import ChaseTrackBoard from './ChaseTrackBoard.svelte';
	import { chaseBadgeClasses } from '$lib/utils';
	import { fade } from 'svelte/transition';

	interface Props {
		chaseState: ChaseState | null | undefined;
		muted: boolean;
		onToggleMute: () => void;
		/** How long the overlay takes to fade away when the DM ends the chase (matches the music fade). */
		endFadeMs?: number;
	}
	let { chaseState, muted, onToggleMute, endFadeMs = 400 }: Props = $props();

	// The last live chase state, held onto after the DM ends the chase so the overlay can keep
	// rendering it while it fades out (chaseState is already null by then).
	let lastChase: ChaseState | null = null;
	const shown = $derived.by(() => {
		if (chaseState) lastChase = chaseState;
		return lastChase;
	});

	// Minimizing/expanding stays snappy; only the chase ending uses the long fade. Svelte reads
	// transition params when the transition starts, so this picks the right one each time.
	const outFade = () => ({ duration: chaseState ? 400 : endFadeMs });
	const pillOutFade = () => ({ duration: chaseState ? 200 : endFadeMs });

	let expanded = $state(true);
	let wasActive = false;

	// Force full-screen back open whenever a *new* chase starts (not on every band/HP tweak
	// while one is already running, or a minimized player would get yanked back every round).
	$effect(() => {
		const active = !!chaseState;
		if (active && !wasActive) expanded = true;
		wasActive = active;
	});

	// Blue streaking background particles suggesting rightward-to-leftward motion (speed lines).
	// Randomized once per page load — purely decorative.
	const CHASE_PARTICLES = Array.from({ length: 32 }, (_, i) => ({
		top: Math.random() * 100,
		delay: Math.random() * 3,
		duration: 0.8 + Math.random() * 1.8,
		length: 50 + Math.random() * 130,
		thickness: 1.5 + Math.random() * 2,
		opacity: 0.3 + Math.random() * 0.5
	}));
</script>

{#if chaseState && shown}
	{#if expanded}
		<div
			class="fixed inset-0 z-[180] flex flex-col overflow-hidden bg-gray-950/97 backdrop-blur-sm"
			in:fade={{ duration: 400 }}
			out:fade|global={outFade()}
		>
			<!-- Speed-line particles streaking right-to-left, suggesting motion -->
			<div aria-hidden="true" class="pointer-events-none absolute inset-0">
				{#each CHASE_PARTICLES as p, i (i)}
					<span
						class="chase-particle"
						style="top: {p.top}%; width: {p.length}px; height: {p.thickness}px; animation-duration: {p.duration}s; animation-delay: -{p.delay}s; --chase-particle-opacity: {p.opacity};"
					></span>
				{/each}
			</div>

			<div class="relative z-10 flex shrink-0 items-center justify-between px-4 py-4 sm:px-8">
				<div class="flex items-center gap-3">
					<i
						class="fa-duotone fa-light fa-person-running animate-pulse text-2xl text-amber-400"
						aria-hidden="true"
					></i>
					<h2 class="text-xl font-black tracking-[0.3em] text-amber-400 uppercase sm:text-2xl">
						The Chase
					</h2>
				</div>
				<div class="flex items-center gap-2">
					<button
						onclick={onToggleMute}
						title={muted ? 'Unmute chase audio' : 'Mute chase audio'}
						class="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-400 transition hover:border-gray-500 hover:text-white"
					>
						<i
							class="fa-duotone fa-light {muted ? 'fa-volume-xmark' : 'fa-volume-high'}"
							aria-hidden="true"
						></i>
						{muted ? 'Unmute' : 'Mute'}
					</button>
					<button
						onclick={() => (expanded = false)}
						title="Minimize"
						class="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-400 transition hover:border-gray-500 hover:text-white"
					>
						<i class="fa-duotone fa-light fa-down-left-and-up-right-to-center" aria-hidden="true"
						></i>
						Minimize
					</button>
				</div>
			</div>

			<div
				class="relative z-10 flex min-h-0 flex-1 flex-col justify-center gap-6 overflow-y-auto px-4 pb-8 sm:px-8"
			>
				<ChaseTrackBoard bands={shown.bands} participants={shown.participants} size="xl" />

				<!-- Legend mapping the track's numbered badges back to names, with a small
				     exhaustion-pip row under each name -->
				<div class="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
					{#each shown.participants as p, idx (p.id)}
						<div class="flex items-center gap-2 {p.dropped ? 'opacity-50' : ''}">
							<span
								class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold {chaseBadgeClasses(
									p
								)}"
							>
								{idx + 1}
							</span>
							<div class="flex flex-col gap-1">
								<span
									class="text-sm font-semibold sm:text-base {p.dropped
										? 'text-gray-500 line-through'
										: p.role === 'quarry'
											? 'text-amber-300'
											: 'text-red-300'}"
								>
									{p.name}
								</span>
								{#if p.exhaustionPips > 0}
									<div class="flex gap-0.5">
										{#each Array(p.exhaustionPips) as _}
											<span class="h-1.5 w-1.5 rounded-full bg-orange-400"></span>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				{#if shown.complication}
					<div
						class="mx-auto flex max-w-2xl items-start gap-3 rounded-xl border border-orange-900/40 bg-orange-950/30 px-5 py-4 text-orange-300"
					>
						<i
							class="fa-duotone fa-light fa-triangle-exclamation mt-0.5 shrink-0"
							aria-hidden="true"
						></i>
						<span class="text-sm leading-relaxed italic sm:text-base">{shown.complication}</span>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<button
			onclick={() => (expanded = true)}
			in:fade={{ duration: 200 }}
			out:fade|global={pillOutFade()}
			class="fixed top-16 left-1/2 z-[180] flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-700/60 bg-gray-900/95 px-4 py-2 text-xs font-bold tracking-wider text-amber-300 uppercase shadow-xl backdrop-blur-sm transition hover:border-amber-500"
		>
			<i class="fa-duotone fa-light fa-person-running" aria-hidden="true"></i>
			Chase in Progress
			<i
				class="fa-duotone fa-light fa-up-right-and-down-left-from-center text-[10px]"
				aria-hidden="true"
			></i>
		</button>
	{/if}
{/if}

<style>
	.chase-particle {
		position: absolute;
		left: 100%;
		border-radius: 999px;
		background: linear-gradient(to left, rgba(96, 165, 250, 0.95), rgba(96, 165, 250, 0));
		box-shadow: 0 0 6px 1px rgba(96, 165, 250, 0.55);
		animation-name: chase-streak;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
	}
	@keyframes chase-streak {
		0% {
			transform: translateX(0);
			opacity: 0;
		}
		8% {
			opacity: var(--chase-particle-opacity, 0.6);
		}
		92% {
			opacity: var(--chase-particle-opacity, 0.6);
		}
		100% {
			transform: translateX(-160vw);
			opacity: 0;
		}
	}
</style>
