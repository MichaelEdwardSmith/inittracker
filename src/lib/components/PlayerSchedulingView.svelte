<!-- Player-facing scheduling display. Same auto-pop / minimize-to-corner-card shape as
     PollView.svelte, but polls /api/scheduling instead of subscribing to SSE — availability
     trickles in over hours/days rather than live in front of everyone, so a poll interval is
     enough. Pops open automatically whenever an active proposal appears or changes status (new
     proposal, or the DM just confirmed one) — including the very first poll after the page loads,
     so a player who opens /display and finds an open proposal sees it immediately without having
     to know to look for it. `active`/`collapsed` are bindable so the parent can show a "View
     Session Times" menu entry only while a proposal exists, and reopen a minimized one. -->
<script lang="ts">
	import type { SchedulingAvailability, SchedulingProposal } from '$lib/types';
	import { fade, fly } from 'svelte/transition';
	import { formatSlot } from '$lib/utils';

	interface Props {
		sessionId: string;
		loggedIn: boolean;
		active?: boolean;
		collapsed?: boolean;
	}
	let {
		sessionId,
		loggedIn,
		active = $bindable(false),
		collapsed = $bindable(true)
	}: Props = $props();

	const AVAIL_OPTIONS: { value: SchedulingAvailability; label: string; activeClass: string }[] = [
		{ value: 'yes', label: 'Yes', activeClass: 'bg-emerald-600 text-white' },
		{ value: 'maybe', label: 'Maybe', activeClass: 'bg-amber-600 text-white' },
		{ value: 'no', label: 'No', activeClass: 'bg-red-600 text-white' }
	];

	let proposal = $state<SchedulingProposal | null>(null);
	let myAvail = $state<Record<string, SchedulingAvailability>>({});
	let saving = $state(false);
	let prevId: string | null = null;
	let prevStatus: string | null = null;

	async function load() {
		if (!loggedIn) return;
		try {
			const r = await fetch(`/api/scheduling?session=${sessionId}`);
			if (!r.ok) return;
			const data: {
				active: SchedulingProposal | null;
				myAvail: Record<string, SchedulingAvailability> | null;
			} = await r.json();
			proposal = data.active;
			myAvail = data.myAvail ?? {};
			active = !!data.active;
			if (data.active && (data.active.id !== prevId || data.active.status !== prevStatus)) {
				collapsed = false; // a new proposal appeared, or the DM just confirmed one
			}
			if (!data.active) collapsed = true;
			prevId = data.active?.id ?? null;
			prevStatus = data.active?.status ?? null;
		} catch {
			/* ignore — next poll tick will retry */
		}
	}

	$effect(() => {
		if (!loggedIn) return;
		load();
		const id = setInterval(load, 10000);
		return () => clearInterval(id);
	});

	async function setAvail(slotId: string, value: SchedulingAvailability) {
		if (!proposal) return;
		myAvail = { ...myAvail, [slotId]: value };
		saving = true;
		try {
			await fetch('/api/scheduling', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'vote',
					sessionId,
					proposalId: proposal.id,
					avail: myAvail
				})
			});
		} finally {
			saving = false;
		}
	}

	const confirmedStart = $derived(
		proposal?.slots.find((s) => s.id === proposal?.confirmedSlotId)?.start ?? null
	);
</script>

{#if proposal && !collapsed}
	<!-- ── Full overlay — pops up when a proposal opens or is confirmed ────────── -->
	<div
		transition:fade={{ duration: 250 }}
		class="fixed inset-0 z-[190] flex items-center justify-center bg-gray-950/95 p-6 backdrop-blur-sm"
	>
		<div
			transition:fly={{ y: 20, duration: 300 }}
			class="w-full max-w-lg rounded-2xl border border-teal-800/50 bg-gray-900 p-6 shadow-2xl sm:p-8"
		>
			<div class="mb-4 flex items-start justify-between gap-3">
				<span
					class="rounded-full border border-teal-700/60 bg-teal-950/50 px-3 py-1 text-xs font-black tracking-widest text-teal-300 uppercase"
				>
					<i class="fa-duotone fa-light fa-calendar-days" aria-hidden="true"></i> Session Times
				</span>
				<button
					onclick={() => (collapsed = true)}
					aria-label="Minimize"
					class="shrink-0 rounded-lg p-1.5 text-gray-500 transition hover:bg-white/10 hover:text-white"
				>
					<i class="fa-duotone fa-light fa-chevron-down" aria-hidden="true"></i>
				</button>
			</div>

			{#if proposal.status === 'confirmed' && confirmedStart}
				<p
					class="rounded-lg border border-emerald-800/60 bg-emerald-950/30 px-3 py-2 text-center text-sm font-semibold text-emerald-300"
				>
					<i class="fa-duotone fa-light fa-circle-check" aria-hidden="true"></i>
					Next session confirmed for {formatSlot(confirmedStart)}
				</p>
			{:else}
				<p class="mb-4 text-sm text-gray-400">
					Mark your availability for each candidate time — the DM will pick one once everyone's
					responded.
				</p>
				<div class="flex flex-col gap-3">
					{#each proposal.slots as slot}
						<div class="rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2.5">
							<p class="text-sm font-semibold text-gray-100">{formatSlot(slot.start)}</p>
							{#if slot.label}
								<p class="text-xs text-gray-500">{slot.label}</p>
							{/if}
							<div class="mt-2 flex gap-2">
								{#each AVAIL_OPTIONS as opt}
									<button
										onclick={() => setAvail(slot.id, opt.value)}
										class="flex-1 rounded-lg border border-gray-700 py-1.5 text-xs font-bold transition {myAvail[
											slot.id
										] === opt.value
											? opt.activeClass
											: 'text-gray-400 hover:bg-gray-700'}"
									>
										{opt.label}
									</button>
								{/each}
							</div>
						</div>
					{/each}
				</div>
				{#if saving}
					<p class="mt-3 text-center text-xs text-gray-600">Saving…</p>
				{/if}
			{/if}
		</div>
	</div>
{:else if proposal && collapsed}
	<!-- ── Minimized card ─────────────────────────────────────────────────────── -->
	<div
		transition:fly={{ y: 20, duration: 250 }}
		class="fixed right-4 bottom-4 z-[120] w-full max-w-xs overflow-hidden rounded-2xl border border-teal-800/60 bg-gray-950/95 shadow-2xl backdrop-blur-md sm:right-6 sm:bottom-6"
	>
		<div
			class="flex items-center gap-2 border-b border-gray-800/60 bg-gradient-to-r from-teal-950/70 to-gray-950 px-4 py-2.5"
		>
			<i class="fa-duotone fa-light fa-calendar-days text-base" aria-hidden="true"></i>
			<span class="flex-1 truncate text-sm font-black tracking-wider text-teal-300 uppercase"
				>Session Times{proposal.status === 'confirmed' ? ' — Confirmed' : ''}</span
			>
			<button
				onclick={() => (collapsed = false)}
				class="rounded p-1 text-gray-500 transition hover:text-teal-400"
				aria-label="Expand"
			>
				<i class="fa-duotone fa-light fa-chevron-up" aria-hidden="true"></i>
			</button>
		</div>
		<div class="p-3 text-sm text-gray-300">
			{#if proposal.status === 'confirmed' && confirmedStart}
				<p>Confirmed for {formatSlot(confirmedStart)}</p>
			{:else}
				<p>
					{proposal.slots.length} candidate time{proposal.slots.length !== 1 ? 's' : ''} — tap to respond
				</p>
			{/if}
		</div>
	</div>
{/if}
