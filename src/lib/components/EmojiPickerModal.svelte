<!-- Emoji reaction picker for viewers — tap an emoji to send it to the DM. -->
<script lang="ts">
	interface Props {
		sessionId: string;
		playerName: string | null;
		onclose: () => void;
	}

	let { sessionId, playerName, onclose }: Props = $props();

	const EMOJIS = [
		// Reactions
		'😂',
		'❤️',
		'👍',
		'👎',
		'😱',
		'🤔',
		'🥳',
		'😭',
		'😤',
		'😍',
		'🤯',
		'🙏',
		// D&D / Combat
		'⚔️',
		'🛡️',
		'🎲',
		'💀',
		'👻',
		'🔥',
		'⚡',
		'💪',
		'🏃',
		'🗡️',
		'🐉',
		'✨',
		// Misc
		'🎉',
		'🍺',
		'💯',
		'🌟',
		'🤣',
		'👀'
	];

	async function send(emoji: string) {
		fetch('/api/emoji-reaction', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ emoji, sessionId, from: playerName ?? 'Guest' })
		}).catch(() => {});
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="fixed inset-0 z-[260] flex items-end justify-center p-4 pb-8"
	onclick={(e) => {
		if (e.target === e.currentTarget) onclose();
	}}
>
	<div class="w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-800 px-4 py-3">
			<p class="text-xs font-bold tracking-widest text-gray-400 uppercase">Send to DM</p>
			<button
				onclick={onclose}
				class="text-gray-600 transition hover:text-gray-300"
				aria-label="Close"
			>
				<i class="fa-solid fa-xmark text-base" aria-hidden="true"></i>
			</button>
		</div>

		<!-- Emoji grid -->
		<div class="p-4">
			<div class="grid grid-cols-6 gap-2">
				{#each EMOJIS as emoji}
					<button
						onclick={() => send(emoji)}
						class="flex items-center justify-center rounded-xl p-2 text-3xl transition hover:bg-gray-700 active:scale-90"
						title={emoji}
					>
						{emoji}
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>
