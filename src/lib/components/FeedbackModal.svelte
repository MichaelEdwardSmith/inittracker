<!-- "Send Feedback" modal opened from the dashboard menu. One free-text box, posted to
     /api/feedback and read by the site owner on /admin's Insights tab. -->
<script lang="ts">
	import { focusTrap } from '$lib/actions/focusTrap';

	let { onclose }: { onclose: () => void } = $props();

	const MAX_LENGTH = 2000;

	let message = $state('');
	let sending = $state(false);
	let sent = $state(false);
	let error = $state('');

	async function submit() {
		if (!message.trim() || sending) return;
		sending = true;
		error = '';
		try {
			const res = await fetch('/api/feedback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message })
			});
			if (res.ok) {
				sent = true;
			} else if (res.status === 403) {
				error = 'Feedback needs a full DM account. Guests can email dm@inittracker.com instead.';
			} else if (res.status === 429) {
				error = 'Easy there, adventurer. Wait a few seconds and try again.';
			} else {
				error = 'Could not send your feedback. Please try again.';
			}
		} catch {
			error = 'Could not send your feedback. Check your connection and try again.';
		} finally {
			sending = false;
		}
	}
</script>

<!-- Backdrop -->
<div
	role="presentation"
	class="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm"
	onclick={(e) => e.target === e.currentTarget && onclose()}
></div>

<!-- Panel -->
<div
	role="dialog"
	aria-modal="true"
	aria-label="Send feedback"
	tabindex="-1"
	use:focusTrap
	onkeydown={(e) => e.key === 'Escape' && onclose()}
	class="fixed top-[50%] left-[50%] z-[151] flex max-h-[90vh] w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-2xl border border-amber-800/60 bg-gray-900 shadow-2xl"
>
	<div
		class="flex shrink-0 items-center justify-between border-b border-gray-700/60 bg-gradient-to-r from-amber-950/60 to-gray-900 px-6 py-4"
	>
		<div class="flex items-center gap-3">
			<i class="fa-duotone fa-light fa-comment-dots text-2xl" aria-hidden="true"></i>
			<h2 class="text-lg font-black tracking-wider text-amber-300 uppercase">Send Feedback</h2>
		</div>
		<button
			onclick={onclose}
			aria-label="Close"
			class="rounded-lg p-2 text-gray-500 hover:bg-gray-800 hover:text-white"
			><i class="fa-duotone fa-light fa-xmark" aria-hidden="true"></i></button
		>
	</div>

	<div class="flex flex-col gap-3 overflow-y-auto p-6">
		{#if sent}
			<p class="text-sm text-gray-300">
				Thank you! Your note landed safely, with no saving throw required. Every message gets read.
			</p>
			<button
				onclick={onclose}
				class="self-end rounded border border-amber-600 bg-amber-900/40 px-5 py-2 text-sm font-bold text-amber-300 transition hover:bg-amber-900/70"
			>
				Close
			</button>
		{:else}
			<label for="feedback-message" class="text-sm text-gray-300">
				What's one thing that annoyed you, confused you, or that you wish existed?
			</label>
			<textarea
				id="feedback-message"
				bind:value={message}
				maxlength={MAX_LENGTH}
				rows="6"
				placeholder="Bugs, ideas, missing monsters, anything…"
				class="resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-amber-500 focus:outline-none"
			></textarea>
			<div class="flex items-center justify-between text-xs text-gray-500">
				<span>Sent with your account email so I can follow up if needed.</span>
				<span>{message.length}/{MAX_LENGTH}</span>
			</div>
			{#if error}
				<p class="text-sm text-red-400" role="alert">{error}</p>
			{/if}
			<div class="flex justify-end gap-2">
				<button
					onclick={onclose}
					class="rounded border border-gray-700 px-5 py-2 text-sm font-semibold text-gray-400 transition hover:text-white"
				>
					Cancel
				</button>
				<button
					onclick={submit}
					disabled={!message.trim() || sending}
					class="rounded border border-amber-600 bg-amber-900/40 px-5 py-2 text-sm font-bold text-amber-300 transition hover:bg-amber-900/70 disabled:cursor-not-allowed disabled:opacity-40"
				>
					{sending ? 'Sending…' : 'Send'}
				</button>
			</div>
		{/if}
	</div>
</div>
