<!-- Per-session DM notes modal. Left column shows dated note entries; right column
     shows a rich-text editor for the selected entry. Autosaves with 800 ms debounce. -->
<script lang="ts">
	import RichTextEditor from './RichTextEditor.svelte';
	import type { NoteEntry } from '$lib/types';

	interface Props {
		onclose: () => void;
		sessionName: string;
	}

	let { onclose, sessionName }: Props = $props();

	let notes = $state<NoteEntry[]>([]);
	let selectedId = $state<string | null>(null);
	let search = $state('');
	let saveStatus = $state<'idle' | 'saving' | 'saved'>('idle');
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	let selectedNote = $derived(notes.find((n) => n.id === selectedId) ?? null);

	let filteredNotes = $derived.by(() => {
		const q = search.trim().toLowerCase();
		if (!q) return notes;
		return notes.filter((n) => {
			const dateStr = formatDate(n.date).toLowerCase();
			const textContent = n.content.replace(/<[^>]*>/g, '').toLowerCase();
			return dateStr.includes(q) || textContent.includes(q);
		});
	});

	// Load notes on mount
	$effect(() => {
		fetch('/api/notes')
			.then((r) => (r.ok ? r.json() : { notes: [] }))
			.then((data: { notes: NoteEntry[] }) => {
				notes = data.notes ?? [];
				if (notes.length > 0) selectedId = notes[0].id;
			})
			.catch(() => {});
	});

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	async function createNew() {
		const r = await fetch('/api/notes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'create', content: '' })
		});
		if (r.ok) {
			const data: { ok: boolean; note: NoteEntry } = await r.json();
			notes = [data.note, ...notes];
			selectedId = data.note.id;
			saveStatus = 'idle';
		}
	}

	function handleChange(v: string) {
		if (!selectedId) return;
		notes = notes.map((n) => (n.id === selectedId ? { ...n, content: v } : n));
		saveStatus = 'idle';
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(save, 800);
	}

	async function save() {
		if (!selectedId) return;
		const note = notes.find((n) => n.id === selectedId);
		if (!note) return;
		saveStatus = 'saving';
		try {
			const r = await fetch('/api/notes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'update', id: selectedId, content: note.content })
			});
			saveStatus = r.ok ? 'saved' : 'idle';
		} catch {
			saveStatus = 'idle';
		}
	}

	async function deleteSelected() {
		if (!selectedId) return;
		const idToDelete = selectedId;
		notes = notes.filter((n) => n.id !== idToDelete);
		selectedId = notes.length > 0 ? notes[0].id : null;
		saveStatus = 'idle';
		await fetch('/api/notes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'delete', id: idToDelete })
		});
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
		class="flex w-full max-w-4xl flex-col rounded-xl border border-gray-700 bg-gray-900 shadow-2xl"
		style="height: calc(100vh - 8rem)"
	>
		<!-- Header -->
		<div class="shrink-0 border-b border-gray-700 px-5 py-4">
			<div class="flex items-center justify-between">
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
			<!-- Search bar -->
			<div class="relative mt-3">
				<svg xmlns="http://www.w3.org/2000/svg" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
				</svg>
				<input
					type="text"
					bind:value={search}
					placeholder="Search notes…"
					class="w-full rounded-lg border border-gray-600 bg-gray-800 py-2 pl-9 pr-4 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-amber-500"
				/>
			</div>
		</div>

		<!-- Body: sidebar + editor -->
		<div class="flex min-h-0 flex-1">
			<!-- Left column: note list -->
			<div class="flex w-52 shrink-0 flex-col border-r border-gray-700">
				<!-- New note button -->
				<div class="shrink-0 p-2">
					<button
						onclick={createNew}
						class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-amber-600 px-3 py-2 text-sm font-semibold text-amber-500 transition hover:border-amber-400 hover:text-amber-400"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						New Notes
					</button>
				</div>

				<!-- Note entries -->
				<ul class="min-h-0 flex-1 overflow-y-auto p-2 pt-0 space-y-1">
					{#each filteredNotes as note (note.id)}
						<li>
							<button
								onclick={() => { selectedId = note.id; saveStatus = 'idle'; }}
								class="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition
									{selectedId === note.id
										? 'bg-amber-600/20 text-amber-400'
										: 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}"
							>
								<span class="truncate">{formatDate(note.date)}</span>
								{#if selectedId === note.id}
									<button
										onclick={(e) => { e.stopPropagation(); deleteSelected(); }}
										class="ml-1 shrink-0 text-gray-600 transition hover:text-red-400"
										aria-label="Delete note"
										title="Delete"
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								{/if}
							</button>
						</li>
					{:else}
						<li class="px-3 py-4 text-center text-xs text-gray-600">
							{search ? 'No matches' : 'No notes yet'}
						</li>
					{/each}
				</ul>
			</div>

			<!-- Right column: editor -->
			<div class="flex min-h-0 flex-1 flex-col">
				{#if selectedNote}
					<div class="flex min-h-0 flex-1 overflow-hidden p-4">
						<RichTextEditor
							value={selectedNote.content}
							onchange={handleChange}
							placeholder="Write your notes here…"
						/>
					</div>
				{:else}
					<div class="flex flex-1 items-center justify-center text-sm text-gray-600">
						Select a note or create a new one
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
