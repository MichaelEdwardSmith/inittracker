<!-- Player-facing poll display. Subscribes to /api/poll SSE. When the DM opens a new
     poll it pops up as a full overlay with large tap-to-select choices and live vote
     tallies; it can be minimized to a small corner card and reopened from the hamburger
     menu (bindable `collapsed`). `active` is bindable so the parent can show a
     "View Poll" menu entry only while a poll exists. -->
<script lang="ts">
	import type { PollState } from '$lib/types';
	import { fade, fly } from 'svelte/transition';

	interface Props {
		sessionId: string;
		voterName: string | null;
		active?: boolean;
		collapsed?: boolean;
	}
	let {
		sessionId,
		voterName,
		active = $bindable(false),
		collapsed = $bindable(true)
	}: Props = $props();

	let poll = $state<PollState | null>(null);
	let voterId = $state<string | null>(null);
	let selectedOption = $state<string | null>(null);

	// Persist a per-browser voter id so a player's vote (and "already voted" state)
	// survives reloads, independent of whether they've logged in as a character.
	$effect(() => {
		try {
			const key = `poll_voter_${sessionId}`;
			let id = localStorage.getItem(key);
			if (!id) {
				id = crypto.randomUUID();
				localStorage.setItem(key, id);
			}
			voterId = id;
		} catch {
			voterId = crypto.randomUUID();
		}
	});

	$effect(() => {
		if (!voterId) return;
		const source = new EventSource(
			`/api/poll?session=${sessionId}&voter=${encodeURIComponent(voterId)}`
		);
		source.onmessage = (e) => {
			try {
				const prevId = poll?.id ?? null;
				const data = e.data === 'null' ? null : (JSON.parse(e.data) as PollState);
				poll = data;
				active = !!data;
				selectedOption = data?.myVote ?? null;
				if (data && data.id !== prevId) collapsed = false; // auto-pop a newly opened/changed poll
				if (!data) collapsed = true;
			} catch {
				/* ignore */
			}
		};
		source.onerror = () => {};
		return () => source.close();
	});

	async function vote(optionId: string) {
		if (!poll || !poll.open || !voterId) return;
		selectedOption = optionId;
		try {
			await fetch('/api/poll', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'vote',
					sessionId,
					voterId,
					voterName: voterName ?? 'A player',
					optionId
				})
			});
		} catch {
			/* ignore */
		}
	}

	const totalVotes = $derived(poll?.totalVotes ?? 0);
	function pct(votes: number): number {
		return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
	}
</script>

{#if poll && !collapsed}
	<!-- ── Full overlay — pops up when a poll opens or changes ────────────────── -->
	<div
		transition:fade={{ duration: 250 }}
		class="fixed inset-0 z-[190] flex items-center justify-center bg-gray-950/95 p-6 backdrop-blur-sm"
	>
		<div
			transition:fly={{ y: 20, duration: 300 }}
			class="w-full max-w-lg rounded-2xl border border-indigo-800/50 bg-gray-900 p-6 shadow-2xl sm:p-8"
		>
			<div class="mb-4 flex items-start justify-between gap-3">
				<span
					class="rounded-full border border-indigo-700/60 bg-indigo-950/50 px-3 py-1 text-xs font-black tracking-widest text-indigo-300 uppercase"
				>
					<i class="fa-duotone fa-light fa-square-poll-vertical" aria-hidden="true"></i> Poll
				</span>
				<button
					onclick={() => (collapsed = true)}
					aria-label="Minimize"
					class="shrink-0 rounded-lg p-1.5 text-gray-500 transition hover:bg-white/10 hover:text-white"
				>
					<i class="fa-duotone fa-light fa-chevron-down" aria-hidden="true"></i>
				</button>
			</div>

			<h2 class="mb-6 text-center text-xl leading-snug font-black text-white sm:text-2xl">
				{poll.question}
			</h2>

			<div class="flex flex-col gap-3">
				{#each poll.options as opt}
					{@const p = pct(opt.votes)}
					{@const picked = selectedOption === opt.id}
					<button
						onclick={() => poll?.open && (selectedOption = opt.id)}
						disabled={!poll.open}
						class="relative flex items-center gap-4 overflow-hidden rounded-xl border-2 px-5 py-4 text-left transition disabled:cursor-not-allowed
							{picked
							? 'border-indigo-500 bg-indigo-950/50'
							: 'border-gray-700 bg-gray-800/60 hover:border-gray-600'}"
					>
						<div
							class="absolute inset-y-0 left-0 -z-0 bg-indigo-900/30 transition-all duration-500"
							style="width: {p}%;"
						></div>
						<span
							class="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 {picked
								? 'border-indigo-400 bg-indigo-500'
								: 'border-gray-500'}"
						>
							{#if picked}
								<span class="h-2.5 w-2.5 rounded-full bg-white"></span>
							{/if}
						</span>
						<span class="relative z-10 flex-1 text-lg font-semibold text-gray-100">{opt.text}</span>
						<span class="relative z-10 shrink-0 text-sm font-bold text-gray-400"
							>{opt.votes} · {p}%</span
						>
					</button>
				{/each}
			</div>

			<p class="mt-4 text-center text-xs text-gray-500">
				{totalVotes} vote{totalVotes !== 1 ? 's' : ''} so far
			</p>

			{#if poll.open}
				<button
					onclick={() => selectedOption && vote(selectedOption)}
					disabled={!selectedOption || selectedOption === poll.myVote}
					class="mt-4 w-full rounded-xl bg-indigo-600 py-3 font-black tracking-wider text-white uppercase transition hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
				>
					{poll.myVote ? 'Update Vote' : 'Submit Vote'}
				</button>
			{:else}
				<p class="mt-4 text-center text-sm font-semibold tracking-wider text-amber-500 uppercase">
					Voting closed
				</p>
			{/if}
		</div>
	</div>
{:else if poll && collapsed}
	<!-- ── Minimized card — tap a choice to (re)vote, or expand for the full view ── -->
	<div
		transition:fly={{ y: 20, duration: 250 }}
		class="fixed right-4 bottom-4 z-[120] w-full max-w-xs overflow-hidden rounded-2xl border border-indigo-800/60 bg-gray-950/95 shadow-2xl backdrop-blur-md sm:right-6 sm:bottom-6"
	>
		<div
			class="flex items-center gap-2 border-b border-gray-800/60 bg-gradient-to-r from-indigo-950/70 to-gray-950 px-4 py-2.5"
		>
			<i class="fa-duotone fa-light fa-square-poll-vertical text-base" aria-hidden="true"></i>
			<span class="flex-1 truncate text-sm font-black tracking-wider text-indigo-300 uppercase"
				>Poll{!poll.open ? ' — Closed' : ''}</span
			>
			<button
				onclick={() => (collapsed = false)}
				class="rounded p-1 text-gray-500 transition hover:text-indigo-400"
				aria-label="Expand"
			>
				<i class="fa-duotone fa-light fa-chevron-up" aria-hidden="true"></i>
			</button>
		</div>
		<div class="flex flex-col gap-2 p-3">
			<p class="line-clamp-2 text-sm font-semibold text-gray-200">{poll.question}</p>
			{#each poll.options as opt}
				{@const p = pct(opt.votes)}
				{@const picked = selectedOption === opt.id}
				<button
					onclick={() => vote(opt.id)}
					disabled={!poll.open}
					class="relative overflow-hidden rounded-lg border px-3 py-2 text-left text-xs transition disabled:cursor-not-allowed
						{picked ? 'border-indigo-500 bg-indigo-950/50' : 'border-gray-700 bg-gray-800/50'}"
				>
					<div
						class="absolute inset-y-0 left-0 bg-indigo-900/40 transition-all duration-500"
						style="width: {p}%;"
					></div>
					<span class="relative z-10 flex items-center justify-between gap-2">
						<span class="font-semibold text-gray-200">{opt.text}</span>
						<span class="shrink-0 text-gray-400">{opt.votes} · {p}%</span>
					</span>
				</button>
			{/each}
		</div>
	</div>
{/if}
