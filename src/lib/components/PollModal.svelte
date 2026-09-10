<!-- DM polling modal. Lets the DM write a question with up to 10 answer choices
     (prefilled with Yes/No) and open it to players, then shows live vote tallies
     as they come in. Subscribes to /api/poll SSE for the DM's own (voteless) view. -->
<script lang="ts">
	import type { PollState } from '$lib/types';

	interface Props {
		sessionId: string;
		onclose: () => void;
	}
	let { sessionId, onclose }: Props = $props();

	const MAX_OPTIONS = 10;
	const MIN_OPTIONS = 2;

	// ── State ────────────────────────────────────────────────────────────────
	let poll = $state<PollState | null>(null);
	let error = $state<string | null>(null);

	// ── Create-form fields ───────────────────────────────────────────────────
	let question = $state('');
	let options = $state<string[]>(['Yes', 'No']);

	// ── SSE subscription (DM never votes, so no voter id) ───────────────────
	$effect(() => {
		const source = new EventSource(`/api/poll?session=${sessionId}`);
		source.onmessage = (e) => {
			try {
				poll = e.data === 'null' ? null : (JSON.parse(e.data) as PollState);
			} catch {
				/* ignore */
			}
		};
		source.onerror = () => {};
		return () => source.close();
	});

	// Polling fallback, mirrors the Liar's Dice modal's approach
	$effect(() => {
		const id = setInterval(async () => {
			try {
				const r = await fetch(`/api/poll?session=${sessionId}&json=true`);
				if (r.ok) poll = await r.json();
			} catch {
				/* ignore */
			}
		}, 3000);
		return () => clearInterval(id);
	});

	async function post(body: Record<string, unknown>) {
		error = null;
		const r = await fetch('/api/poll', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...body, sessionId })
		});
		if (!r.ok) {
			const j = await r.json().catch(() => ({}));
			error = j.error ?? 'Unknown error';
		}
	}

	function addOption() {
		if (options.length < MAX_OPTIONS) options = [...options, ''];
	}

	function removeOption(i: number) {
		if (options.length > MIN_OPTIONS) options = options.filter((_, idx) => idx !== i);
	}

	const canStart = $derived(
		question.trim().length > 0 && options.filter((o) => o.trim()).length >= MIN_OPTIONS
	);

	async function startPoll() {
		if (!canStart) return;
		await post({
			action: 'create',
			question: question.trim(),
			options: options.map((o) => o.trim()).filter((o) => o.length > 0)
		});
	}

	function resetForm() {
		question = '';
		options = ['Yes', 'No'];
	}

	async function endPoll() {
		if (!confirm('End this poll? Players will no longer see it.')) return;
		await post({ action: 'end' });
		resetForm();
	}

	const totalVotes = $derived(poll?.totalVotes ?? 0);
	function pct(votes: number): number {
		return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
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
	class="fixed top-[50%] left-[50%] z-[151] flex max-h-[90vh] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-2xl border border-indigo-800/60 bg-gray-900 shadow-2xl"
>
	<!-- Header -->
	<div
		class="flex shrink-0 items-center justify-between border-b border-gray-700/60 bg-gradient-to-r from-indigo-950/60 to-gray-900 px-6 py-4"
	>
		<div class="flex items-center gap-3">
			<i class="fa-duotone fa-light fa-square-poll-vertical text-2xl" aria-hidden="true"></i>
			<div>
				<h2 class="text-lg font-black tracking-wider text-indigo-300 uppercase">Poll</h2>
				{#if poll}
					<p class="text-xs text-gray-500">
						{totalVotes} vote{totalVotes !== 1 ? 's' : ''} · {poll.open ? 'Open' : 'Closed'}
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
		{#if !poll}
			<!-- ── Create form ────────────────────────────────────────────────────── -->
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<label
						for="poll-question"
						class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Question</label
					>
					<textarea
						id="poll-question"
						bind:value={question}
						rows="2"
						maxlength="300"
						placeholder="Do you want to take a short rest?"
						class="resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
					></textarea>
				</div>

				<div class="flex flex-col gap-1.5">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Answers</span
						>
						<span class="text-[10px] text-gray-600">{options.length} / {MAX_OPTIONS}</span>
					</div>
					<div class="flex flex-col gap-2">
						{#each options as _, i}
							<div class="flex items-center gap-2">
								<input
									type="text"
									bind:value={options[i]}
									maxlength="100"
									placeholder="Answer {i + 1}"
									class="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
								/>
								<button
									onclick={() => removeOption(i)}
									disabled={options.length <= MIN_OPTIONS}
									aria-label="Remove answer"
									class="shrink-0 rounded-lg p-2 text-gray-600 transition hover:bg-red-950/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-600"
								>
									<i class="fa-duotone fa-light fa-trash text-sm" aria-hidden="true"></i>
								</button>
							</div>
						{/each}
					</div>
					<button
						onclick={addOption}
						disabled={options.length >= MAX_OPTIONS}
						class="mt-1 self-start rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-400 transition hover:border-indigo-600 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-30"
					>
						<i class="fa-duotone fa-light fa-plus" aria-hidden="true"></i> Add Answer
					</button>
				</div>

				<button
					onclick={startPoll}
					disabled={!canStart}
					class="mt-2 rounded-xl bg-indigo-600 py-3 font-black tracking-wider text-white uppercase transition hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
				>
					Open Poll to Players
				</button>
			</div>
		{:else}
			<!-- ── Live results ───────────────────────────────────────────────────── -->
			<div class="flex flex-col gap-4">
				<p class="text-lg font-bold text-gray-100">{poll.question}</p>

				<div class="flex flex-col gap-2.5">
					{#each poll.options as opt}
						{@const p = pct(opt.votes)}
						<div class="flex flex-col gap-1">
							<div class="flex items-center justify-between text-sm">
								<span class="font-semibold text-gray-200">{opt.text}</span>
								<span class="text-gray-400">{opt.votes} · {p}%</span>
							</div>
							<div class="h-3 w-full overflow-hidden rounded-full bg-gray-800">
								<div
									class="h-full rounded-full bg-indigo-500 transition-all duration-500"
									style="width: {p}%;"
								></div>
							</div>
						</div>
					{/each}
				</div>

				{#if !poll.open}
					<p class="text-center text-xs font-semibold tracking-wider text-amber-500 uppercase">
						Voting closed
					</p>
				{/if}
			</div>
		{/if}

		{#if error}
			<p class="mt-3 text-center text-xs text-red-400">{error}</p>
		{/if}
	</div>

	<!-- Footer controls -->
	{#if poll}
		<div class="flex shrink-0 items-center justify-between border-t border-gray-700/60 px-6 py-3">
			{#if poll.open}
				<button
					onclick={() => post({ action: 'close' })}
					class="rounded-lg bg-gray-700 px-4 py-2 text-sm font-bold text-gray-200 transition hover:bg-gray-600"
				>
					<i class="fa-duotone fa-light fa-lock" aria-hidden="true"></i> Close Voting
				</button>
			{:else}
				<button
					onclick={() => post({ action: 'reopen' })}
					class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-600"
				>
					<i class="fa-duotone fa-light fa-lock-open" aria-hidden="true"></i> Reopen Voting
				</button>
			{/if}
			<button
				onclick={endPoll}
				class="rounded-lg border border-gray-600 px-3 py-1.5 text-xs text-gray-400 transition hover:border-red-700 hover:text-red-400"
			>
				End Poll
			</button>
		</div>
	{/if}
</div>
