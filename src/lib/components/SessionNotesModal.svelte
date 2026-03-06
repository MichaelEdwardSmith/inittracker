<!-- Per-session DM notes modal. Fetches from /api/notes on mount, autosaves
     with 800 ms debounce, and shows Saving… / Saved ✓ status in the header. -->
<script lang="ts">
	import RichTextEditor from './RichTextEditor.svelte';

	interface Props {
		onclose: () => void;
		sessionName: string;
	}

	let { onclose, sessionName }: Props = $props();

	let notes = $state('');
	let saveStatus = $state<'idle' | 'saving' | 'saved'>('idle');
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Load notes on mount
	$effect(() => {
		fetch('/api/notes')
			.then((r) => (r.ok ? r.json() : { notes: '' }))
			.then((data: { notes: string }) => {
				notes = data.notes ?? '';
			})
			.catch(() => {});
	});

	function handleChange(v: string) {
		notes = v;
		saveStatus = 'idle';
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(save, 800);
	}

	async function save() {
		saveStatus = 'saving';
		try {
			const r = await fetch('/api/notes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ notes })
			});
			saveStatus = r.ok ? 'saved' : 'idle';
		} catch {
			saveStatus = 'idle';
		}
	}
</script>

<div
	role="dialog"
	aria-modal="true"
	aria-label="Session notes"
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
	tabindex="-1"
	onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}
	onkeydown={(e) => { if (e.key === 'Escape') onclose(); }}
>
	<div
		class="flex w-full max-w-2xl flex-col rounded-xl border border-gray-700 bg-gray-900 shadow-2xl"
		style="height: calc(100vh - 8rem)"
	>
		<!-- Header -->
		<div class="flex shrink-0 items-center justify-between border-b border-gray-700 px-5 py-4">
			<div>
				<h3 class="font-bold tracking-wide text-gray-200">Session Notes</h3>
				<p class="text-xs text-gray-500 italic">{sessionName}</p>
			</div>
			<div class="flex items-center gap-3">
				{#if saveStatus === 'saving'}
					<span class="text-xs text-gray-500">Saving…</span>
				{:else if saveStatus === 'saved'}
					<span class="text-xs text-green-500">Saved ✓</span>
				{/if}
				<button onclick={onclose} class="text-gray-500 transition hover:text-white" aria-label="Close">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Body -->
		<div class="flex min-h-0 flex-1 overflow-hidden p-4">
			<RichTextEditor value={notes} onchange={handleChange} placeholder="Add notes for this session…" />
		</div>
	</div>
</div>
