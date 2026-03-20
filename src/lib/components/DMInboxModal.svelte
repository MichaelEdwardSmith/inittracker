<!-- DM inbox modal — shows received player messages with inline reply + compose. -->
<script lang="ts">
	interface DmMessage {
		id: string;
		from: string;
		text: string;
		timestamp: number;
	}

	interface Props {
		messages: DmMessage[];
		playerNames: string[]; // names of players currently in the combat roster
		onclose: () => void;
		onclear: () => Promise<void>;
		onsend: (to: string, text: string) => Promise<void>;
	}

	let { messages, playerNames, onclose, onclear, onsend }: Props = $props();

	// ── Compose (new message) ─────────────────────────────
	let showCompose = $state(false);
	let composeTo = $state('all');
	let composeText = $state('');
	let composeSending = $state(false);

	// ── Inline reply state (keyed by message id) ──────────
	let replyOpenId = $state<string | null>(null);
	let replyText = $state('');
	let replySending = $state(false);

	function formatTime(ts: number) {
		return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function openReply(id: string, from: string) {
		replyOpenId = id;
		replyText = '';
		composeTo = from; // pre-fill compose target for convenience
	}

	async function sendReply(to: string) {
		if (!replyText.trim()) return;
		replySending = true;
		await onsend(to, replyText.trim());
		replySending = false;
		replyText = '';
		replyOpenId = null;
	}

	async function sendCompose() {
		if (!composeText.trim() || !composeTo) return;
		composeSending = true;
		await onsend(composeTo, composeText.trim());
		composeSending = false;
		composeText = '';
		showCompose = false;
	}
</script>

<div
	class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
>
	<div
		class="flex w-full max-w-lg flex-col rounded-xl border border-gray-700 bg-gray-900 shadow-2xl"
		style="max-height: 85vh;"
	>
		<!-- Header -->
		<div class="flex shrink-0 items-center justify-between border-b border-gray-800 px-5 py-4">
			<h2 class="text-sm font-bold tracking-widest text-gray-200 uppercase">
				Player Messages
				{#if messages.length > 0}
					<span
						class="ml-2 rounded-full bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-400"
						>{messages.length}</span
					>
				{/if}
			</h2>
			<div class="flex items-center gap-2">
				<button
					onclick={() => {
						showCompose = !showCompose;
						replyOpenId = null;
					}}
					title="Send a message to a player"
					class="flex items-center gap-1.5 rounded px-2 py-1 text-xs transition
						{showCompose
						? 'bg-blue-900/50 text-blue-300'
						: 'text-gray-500 hover:bg-gray-800 hover:text-blue-300'}"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-3.5 w-3.5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
					</svg>
					New Message
				</button>
				{#if messages.length > 0}
					<button
						onclick={onclear}
						class="rounded px-2 py-1 text-xs text-gray-600 transition hover:bg-red-900/40 hover:text-red-400"
						>Clear all</button
					>
				{/if}
				<button
					onclick={onclose}
					aria-label="Close"
					class="text-gray-600 transition hover:text-gray-300"
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
		</div>

		<!-- Compose panel -->
		{#if showCompose}
			<div class="shrink-0 border-b border-gray-800 bg-gray-950/60 px-5 py-4">
				<p class="mb-3 text-xs font-bold tracking-widest text-blue-400 uppercase">New Message</p>
				<div class="mb-3">
					<label class="mb-1 block text-xs text-gray-500" for="compose-to">To</label>
					<select
						id="compose-to"
						bind:value={composeTo}
						class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
					>
						<option value="all">All Players</option>
						{#each playerNames as name}
							<option value={name}>{name}</option>
						{/each}
					</select>
				</div>
				<textarea
					bind:value={composeText}
					placeholder="Type your message…"
					rows="3"
					class="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500"
				></textarea>
				<div class="mt-2 flex justify-end gap-2">
					<button
						onclick={() => {
							showCompose = false;
							composeText = '';
						}}
						class="rounded px-3 py-1.5 text-xs text-gray-500 transition hover:text-gray-300"
						>Cancel</button
					>
					<button
						onclick={sendCompose}
						disabled={composeSending || !composeText.trim()}
						class="flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:opacity-40"
					>
						{#if composeSending}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-3.5 w-3.5 animate-spin"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
						{:else}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-3.5 w-3.5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
								/>
							</svg>
						{/if}
						Send
					</button>
				</div>
			</div>
		{/if}

		<!-- Message list -->
		<div class="flex-1 overflow-y-auto">
			{#if messages.length === 0}
				<div class="flex flex-col items-center justify-center gap-2 py-16 text-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-10 w-10 text-gray-700"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
					<p class="text-sm text-gray-600">No messages yet</p>
				</div>
			{:else}
				<ul class="divide-y divide-gray-800">
					{#each [...messages].reverse() as msg (msg.id)}
						<li class="px-5 py-4">
							<div class="flex items-center justify-between gap-2">
								<span class="text-xs font-bold text-amber-400">{msg.from}</span>
								<div class="flex items-center gap-2">
									<span class="text-xs text-gray-600">{formatTime(msg.timestamp)}</span>
									<button
										onclick={() =>
											replyOpenId === msg.id ? (replyOpenId = null) : openReply(msg.id, msg.from)}
										class="rounded px-2 py-0.5 text-xs transition
											{replyOpenId === msg.id
											? 'bg-blue-900/50 text-blue-300'
											: 'text-gray-600 hover:bg-gray-800 hover:text-blue-300'}">Reply</button
									>
								</div>
							</div>
							<p class="mt-1 text-sm leading-relaxed text-gray-300">{msg.text}</p>

							<!-- Inline reply form -->
							{#if replyOpenId === msg.id}
								<div class="mt-3 rounded-lg border border-gray-700 bg-gray-800/60 p-3">
									<p class="mb-2 text-xs text-gray-500">
										Replying to <span class="font-semibold text-amber-400">{msg.from}</span>
									</p>
									<textarea
										bind:value={replyText}
										placeholder="Type your reply…"
										rows="2"
										class="w-full resize-none rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500"
									></textarea>
									<div class="mt-2 flex justify-end gap-2">
										<button
											onclick={() => {
												replyOpenId = null;
												replyText = '';
											}}
											class="rounded px-2 py-1 text-xs text-gray-500 transition hover:text-gray-300"
											>Cancel</button
										>
										<button
											onclick={() => sendReply(msg.from)}
											disabled={replySending || !replyText.trim()}
											class="flex items-center gap-1.5 rounded bg-blue-700 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:opacity-40"
										>
											{#if replySending}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-3 w-3 animate-spin"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
													/>
												</svg>
											{:else}
												Send
											{/if}
										</button>
									</div>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>
