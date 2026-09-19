<!-- DM scheduling modal. Propose a handful of candidate date/times for the next session,
     watch players' availability come in, then confirm one. Modeled on PollModal.svelte, but
     backed by /api/scheduling (persisted in Mongo, polled — not SSE) since players answer over
     hours/days rather than live in front of the DM. -->
<script lang="ts">
	import type { SchedulingAvailability, SchedulingProposal } from '$lib/types';
	import type { SessionPlayerSummary } from '$lib/server/playerModel';
	import { formatSlot } from '$lib/utils';

	interface Props {
		onclose: () => void;
	}
	let { onclose }: Props = $props();

	const MAX_SLOTS = 8;
	const AVAIL_META: Record<SchedulingAvailability, { label: string; class: string }> = {
		yes: { label: 'Yes', class: 'text-emerald-400' },
		maybe: { label: 'Maybe', class: 'text-amber-400' },
		no: { label: 'No', class: 'text-red-400' }
	};

	// ── State ────────────────────────────────────────────────────────────────
	let loaded = $state(false);
	let active = $state<SchedulingProposal | null>(null);
	let roster = $state<SessionPlayerSummary[]>([]);
	let error = $state<string | null>(null);
	let showNewForm = $state(false);

	// ── Create-form fields — start as a single blank datetime-local input ──────
	let draftSlots = $state<{ start: string; label: string }[]>([{ start: '', label: '' }]);

	async function load() {
		try {
			const r = await fetch('/api/scheduling');
			if (!r.ok) return;
			const data: { active: SchedulingProposal | null; roster: SessionPlayerSummary[] } =
				await r.json();
			active = data.active;
			roster = data.roster ?? [];
			if (!active) showNewForm = true;
		} finally {
			loaded = true;
		}
	}

	$effect(() => {
		load();
		const id = setInterval(load, 5000);
		return () => clearInterval(id);
	});

	async function post(body: Record<string, unknown>): Promise<boolean> {
		error = null;
		const r = await fetch('/api/scheduling', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (!r.ok) {
			error = (await r.text().catch(() => '')) || 'Something went wrong';
			return false;
		}
		return true;
	}

	function addSlot() {
		if (draftSlots.length < MAX_SLOTS) draftSlots = [...draftSlots, { start: '', label: '' }];
	}

	function removeSlot(i: number) {
		if (draftSlots.length > 1) draftSlots = draftSlots.filter((_, idx) => idx !== i);
	}

	const canPropose = $derived(draftSlots.some((s) => s.start.trim().length > 0));

	async function propose() {
		const slots = draftSlots
			.filter((s) => s.start.trim().length > 0)
			.map((s) => ({
				start: new Date(s.start).toISOString(),
				label: s.label.trim() || undefined
			}));
		if (slots.length === 0) return;
		const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		const ok = await post({ action: 'propose', slots, timeZone });
		if (ok) {
			draftSlots = [{ start: '', label: '' }];
			showNewForm = false;
			await load();
		}
	}

	async function confirmSlot(slotId: string) {
		if (!active) return;
		if (!confirm('Confirm this time? Players will see it as the locked-in session time.')) return;
		const ok = await post({ action: 'confirm', proposalId: active.id, slotId });
		if (ok) await load();
	}

	async function cancelProposal() {
		if (!active) return;
		if (!confirm('Cancel this proposal? Players will no longer be able to vote on it.')) return;
		const ok = await post({ action: 'cancel', proposalId: active.id });
		if (ok) {
			active = null;
			showNewForm = true;
		}
	}

	function tally(slotId: string): Record<SchedulingAvailability, number> {
		const counts: Record<SchedulingAvailability, number> = { yes: 0, maybe: 0, no: 0 };
		for (const vote of active?.votes ?? []) {
			const a = vote.avail[slotId];
			if (a) counts[a]++;
		}
		return counts;
	}

	const respondedCount = $derived(active?.votes.length ?? 0);
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
	class="fixed top-[50%] left-[50%] z-[151] flex max-h-[90vh] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-2xl border border-teal-800/60 bg-gray-900 shadow-2xl"
>
	<!-- Header -->
	<div
		class="flex shrink-0 items-center justify-between border-b border-gray-700/60 bg-gradient-to-r from-teal-950/60 to-gray-900 px-6 py-4"
	>
		<div class="flex items-center gap-3">
			<i class="fa-duotone fa-light fa-calendar-days text-2xl" aria-hidden="true"></i>
			<div>
				<h2 class="text-lg font-black tracking-wider text-teal-300 uppercase">Schedule Session</h2>
				{#if active}
					<p class="text-xs text-gray-500">
						{respondedCount} of {roster.length} player{roster.length !== 1 ? 's' : ''} responded
					</p>
				{/if}
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
		{#if !loaded}
			<p class="text-center text-sm text-gray-500">Loading…</p>
		{:else if showNewForm}
			<!-- ── Create form ────────────────────────────────────────────────────── -->
			<div class="flex flex-col gap-4">
				{#if roster.length === 0}
					<p
						class="rounded-lg border border-amber-800/60 bg-amber-950/30 px-3 py-2 text-xs text-amber-300"
					>
						No players have joined this session with an account yet — anyone who joins later without
						logging in first won't see this proposal.
					</p>
				{:else}
					<p class="text-xs text-gray-500">
						{roster.length} player{roster.length !== 1 ? 's' : ''} will see this proposal:
						{roster.map((p) => p.displayName).join(', ')}
					</p>
				{/if}

				<div class="flex flex-col gap-1.5">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold tracking-wider text-gray-500 uppercase"
							>Candidate Times</span
						>
						<span class="text-[10px] text-gray-600">{draftSlots.length} / {MAX_SLOTS}</span>
					</div>
					<div class="flex flex-col gap-2">
						{#each draftSlots as _, i}
							<div class="flex items-center gap-2">
								<input
									type="datetime-local"
									bind:value={draftSlots[i].start}
									class="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-teal-500 focus:outline-none"
								/>
								<input
									type="text"
									bind:value={draftSlots[i].label}
									maxlength="100"
									placeholder="Label (optional)"
									class="w-32 min-w-0 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-teal-500 focus:outline-none"
								/>
								<button
									onclick={() => removeSlot(i)}
									disabled={draftSlots.length <= 1}
									aria-label="Remove time"
									class="shrink-0 rounded-lg p-2 text-gray-600 transition hover:bg-red-950/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-600"
								>
									<i class="fa-duotone fa-light fa-trash text-sm" aria-hidden="true"></i>
								</button>
							</div>
						{/each}
					</div>
					<button
						onclick={addSlot}
						disabled={draftSlots.length >= MAX_SLOTS}
						class="mt-1 self-start rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-400 transition hover:border-teal-600 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-30"
					>
						<i class="fa-duotone fa-light fa-plus" aria-hidden="true"></i> Add Time
					</button>
				</div>

				<div class="flex items-center gap-2">
					{#if active}
						<button
							onclick={() => (showNewForm = false)}
							class="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800"
						>
							Back
						</button>
					{/if}
					<button
						onclick={propose}
						disabled={!canPropose}
						class="flex-1 rounded-xl bg-teal-600 py-3 font-black tracking-wider text-white uppercase transition hover:bg-teal-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Propose to Players
					</button>
				</div>
			</div>
		{:else if active}
			<!-- ── Live results ───────────────────────────────────────────────────── -->
			<div class="flex flex-col gap-4">
				{#if active.status === 'confirmed'}
					<p
						class="rounded-lg border border-emerald-800/60 bg-emerald-950/30 px-3 py-2 text-center text-sm font-semibold text-emerald-300"
					>
						<i class="fa-duotone fa-light fa-circle-check" aria-hidden="true"></i>
						Confirmed for {formatSlot(
							active.slots.find((s) => s.id === active?.confirmedSlotId)?.start ?? ''
						)}
					</p>
				{/if}

				<div class="flex flex-col gap-3">
					{#each active.slots as slot}
						{@const counts = tally(slot.id)}
						{@const isConfirmed = active.confirmedSlotId === slot.id}
						<div
							class="rounded-lg border px-3 py-2.5 {isConfirmed
								? 'border-emerald-700 bg-emerald-950/20'
								: 'border-gray-700 bg-gray-800/60'}"
						>
							<div class="flex items-center justify-between gap-2">
								<div>
									<p class="text-sm font-semibold text-gray-100">{formatSlot(slot.start)}</p>
									{#if slot.label}
										<p class="text-xs text-gray-500">{slot.label}</p>
									{/if}
								</div>
								{#if active.status === 'open'}
									<button
										onclick={() => confirmSlot(slot.id)}
										class="shrink-0 rounded-lg border border-teal-700 px-3 py-1.5 text-xs font-bold text-teal-300 transition hover:bg-teal-900/40"
									>
										Confirm
									</button>
								{/if}
							</div>
							<div class="mt-1.5 flex gap-3 text-xs">
								<span class={AVAIL_META.yes.class}>{counts.yes} yes</span>
								<span class={AVAIL_META.maybe.class}>{counts.maybe} maybe</span>
								<span class={AVAIL_META.no.class}>{counts.no} no</span>
							</div>
						</div>
					{/each}
				</div>

				{#if active.votes.length > 0}
					<div class="flex flex-col gap-1 border-t border-gray-800 pt-3">
						<span class="text-xs font-semibold tracking-wider text-gray-500 uppercase"
							>Responses</span
						>
						{#each active.votes as vote}
							<p class="text-xs text-gray-400">{vote.displayName}</p>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		{#if error}
			<p class="mt-3 text-center text-xs text-red-400">{error}</p>
		{/if}
	</div>

	<!-- Footer controls -->
	{#if loaded && active && !showNewForm}
		<div class="flex shrink-0 items-center justify-between border-t border-gray-700/60 px-6 py-3">
			<button
				onclick={() => (showNewForm = true)}
				class="rounded-lg bg-gray-700 px-4 py-2 text-sm font-bold text-gray-200 transition hover:bg-gray-600"
			>
				<i class="fa-duotone fa-light fa-arrow-rotate-right" aria-hidden="true"></i> Propose New Dates
			</button>
			{#if active.status === 'open'}
				<button
					onclick={cancelProposal}
					class="rounded-lg border border-gray-600 px-3 py-1.5 text-xs text-gray-400 transition hover:border-red-700 hover:text-red-400"
				>
					Cancel Proposal
				</button>
			{/if}
		</div>
	{/if}
</div>
