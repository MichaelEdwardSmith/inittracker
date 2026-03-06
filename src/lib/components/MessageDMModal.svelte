<!-- Message DM modal — players use this to send a text message to the DM. -->
<script lang="ts">
	import type { Combatant } from '$lib/types';

	interface Props {
		players: Combatant[];
		sessionId: string;
		onclose: () => void;
	}

	let { players, sessionId, onclose }: Props = $props();

	let msgFrom = $state('');
	let msgText = $state('');
	let msgSending = $state(false);
	let msgSent = $state(false);

	async function sendMessage() {
		if (!msgFrom || !msgText.trim()) return;
		msgSending = true;
		try {
			await fetch('/api/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId, from: msgFrom, text: msgText.trim() }),
			});
			msgSent = true;
			msgText = '';
			setTimeout(() => { msgSent = false; onclose(); }, 1800);
		} catch {
			// silent
		} finally {
			msgSending = false;
		}
	}
</script>

<div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
	<div class="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
		<div class="flex items-center justify-between border-b border-gray-800 px-5 py-4">
			<h2 class="text-sm font-bold tracking-widest text-gray-200 uppercase">Message the DM</h2>
			<button onclick={onclose} aria-label="Close" class="text-gray-600 transition hover:text-gray-300">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
		{#if msgSent}
			<div class="flex flex-col items-center gap-3 px-5 py-10 text-center">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				<p class="text-sm font-semibold text-green-400">Message sent!</p>
			</div>
		{:else}
			<div class="flex flex-col gap-4 px-5 py-5">
				<div class="flex flex-col gap-1.5">
					<label for="msg-from" class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Sending as</label>
					<select id="msg-from" bind:value={msgFrom} class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-amber-500 focus:outline-none">
						<option value="" disabled>Select your character…</option>
						{#each players as p}
							<option value={p.name}>{p.name}</option>
						{/each}
					</select>
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="msg-text" class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Message</label>
					<textarea id="msg-text" bind:value={msgText} rows="4" placeholder="Type your message…" class="resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-amber-500 focus:outline-none"></textarea>
				</div>
				<button
					onclick={sendMessage}
					disabled={msgSending || !msgFrom || !msgText.trim()}
					class="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
				>
					{msgSending ? 'Sending…' : 'Send Message'}
				</button>
			</div>
		{/if}
	</div>
</div>
