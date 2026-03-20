<!-- Read-only inbox for messages received from the DM. -->
<script lang="ts">
	export interface DmReply {
		id: string;
		to: string;
		text: string;
		timestamp: number;
	}

	interface Props {
		messages: DmReply[];
		onclose: () => void;
		onclear: () => void;
	}

	let { messages, onclose, onclear }: Props = $props();

	function formatTime(ts: number) {
		return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function formatDate(ts: number) {
		return new Date(ts).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div
	role="dialog"
	aria-modal="true"
	aria-label="Messages from DM"
	class="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
	tabindex="-1"
	onclick={(e) => {
		if (e.target === e.currentTarget) onclose();
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape') onclose();
	}}
>
	<div
		class="flex w-full max-w-md flex-col rounded-xl border border-purple-900/60 bg-gray-900 shadow-2xl"
		style="max-height: 80vh;"
	>
		<!-- Header -->
		<div class="flex shrink-0 items-center justify-between border-b border-gray-800 px-5 py-4">
			<div>
				<h2 class="text-sm font-bold tracking-widest text-purple-300 uppercase">From the DM</h2>
				<p class="text-xs text-gray-600">
					{messages.length} message{messages.length !== 1 ? 's' : ''}
				</p>
			</div>
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

		<!-- Message list -->
		<div class="flex-1 overflow-y-auto">
			{#if messages.length === 0}
				<div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
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
					<p class="text-sm text-gray-600">No messages from the DM yet</p>
				</div>
			{:else}
				<ul class="divide-y divide-gray-800">
					{#each [...messages].reverse() as msg (msg.id)}
						<li class="px-5 py-4">
							<div class="mb-1 flex items-center justify-between gap-2">
								<span class="text-xs font-bold text-purple-400">
									Dungeon Master
									{#if msg.to !== 'all'}
										→ <span class="text-gray-400">{msg.to}</span>
									{:else}
										→ <span class="text-gray-500">Everyone</span>
									{/if}
								</span>
								<span class="text-xs text-gray-600"
									>{formatDate(msg.timestamp)} {formatTime(msg.timestamp)}</span
								>
							</div>
							<p class="text-sm leading-relaxed text-gray-200">{msg.text}</p>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>
