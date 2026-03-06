<!-- DM inbox modal — displays player messages with clear-all action. -->
<script lang="ts">
	interface DmMessage { id: string; from: string; text: string; timestamp: number; }

	interface Props {
		messages: DmMessage[];
		onclose: () => void;
		onclear: () => Promise<void>;
	}

	let { messages, onclose, onclear }: Props = $props();

	function formatTime(ts: number) {
		return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
	<div class="flex w-full max-w-lg flex-col rounded-xl border border-gray-700 bg-gray-900 shadow-2xl" style="max-height: 80vh;">
		<div class="flex items-center justify-between border-b border-gray-800 px-5 py-4">
			<h2 class="text-sm font-bold tracking-widest text-gray-200 uppercase">
				Player Messages
				{#if messages.length > 0}
					<span class="ml-2 rounded-full bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-400">{messages.length}</span>
				{/if}
			</h2>
			<div class="flex items-center gap-2">
				{#if messages.length > 0}
					<button onclick={onclear} class="rounded px-2 py-1 text-xs text-gray-600 transition hover:bg-red-900/40 hover:text-red-400">Clear all</button>
				{/if}
				<button onclick={onclose} aria-label="Close" class="text-gray-600 transition hover:text-gray-300">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>
		<div class="flex-1 overflow-y-auto">
			{#if messages.length === 0}
				<div class="flex flex-col items-center justify-center gap-2 py-16 text-center">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
					<p class="text-sm text-gray-600">No messages yet</p>
				</div>
			{:else}
				<ul class="divide-y divide-gray-800">
					{#each [...messages].reverse() as msg (msg.id)}
						<li class="flex flex-col gap-1 px-5 py-4">
							<div class="flex items-center justify-between gap-2">
								<span class="text-xs font-bold text-amber-400">{msg.from}</span>
								<span class="text-xs text-gray-600">{formatTime(msg.timestamp)}</span>
							</div>
							<p class="text-sm leading-relaxed text-gray-300">{msg.text}</p>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>
