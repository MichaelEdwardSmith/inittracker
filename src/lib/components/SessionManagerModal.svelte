<!-- Session manager modal — create, rename, delete, and switch game sessions. -->
<script lang="ts">
	import { combat } from '$lib/store.svelte';
	import { invalidateAll } from '$app/navigation';
	import type { GameSession } from '$lib/types';

	interface Props {
		sessions: GameSession[];
		activeSession: GameSession;
		onclose: () => void;
		onswitched: () => void;
	}

	let { sessions, activeSession, onclose, onswitched }: Props = $props();

	let busy = $state(false);
	let renamingId = $state<string | null>(null);
	let renameValue = $state('');
	let newSessionName = $state('');
	let showNewSessionInput = $state(false);
	let deleteConfirmId = $state<string | null>(null);

	async function switchSession(session: GameSession) {
		if (session.id === activeSession.id || busy) return;
		busy = true;
		try {
			const res = await fetch('/api/sessions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'switch', id: session.id })
			});
			if (res.ok) {
				onswitched();
				onclose();
				await invalidateAll();
				await combat.loadFromServer();
			}
		} finally {
			busy = false;
		}
	}

	function startRename(session: GameSession) {
		renamingId = session.id;
		renameValue = session.name;
	}

	async function commitRename(sessionId: string) {
		if (!renameValue.trim()) {
			renamingId = null;
			return;
		}
		const res = await fetch('/api/sessions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'rename', id: sessionId, name: renameValue })
		});
		renamingId = null;
		if (res.ok) await invalidateAll();
	}

	async function createSession() {
		if (busy) return;
		const name = newSessionName.trim() || `Session ${sessions.length + 1}`;
		busy = true;
		try {
			const res = await fetch('/api/sessions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'create', name })
			});
			if (res.ok) {
				newSessionName = '';
				showNewSessionInput = false;
				await invalidateAll();
			}
		} finally {
			busy = false;
		}
	}

	async function deleteSession(session: GameSession) {
		if (sessions.length <= 1) return;
		if (deleteConfirmId !== session.id) {
			deleteConfirmId = session.id;
			return;
		}
		deleteConfirmId = null;
		const res = await fetch('/api/sessions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'delete', id: session.id })
		});
		if (res.ok) {
			await invalidateAll();
			if (session.id === activeSession.id) await combat.loadFromServer();
		}
	}
</script>

<div
	role="dialog"
	aria-modal="true"
	aria-label="Session manager"
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
	tabindex="-1"
	onclick={(e) => {
		if (e.target === e.currentTarget) onclose();
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape') onclose();
	}}
>
	<div class="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-700 px-5 py-4">
			<div class="flex items-center gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-amber-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 11H5m14-7H5m14 14H5"
					/>
				</svg>
				<h2 class="text-sm font-bold tracking-widest text-gray-200 uppercase">Sessions</h2>
			</div>
			<button
				onclick={onclose}
				class="rounded p-1 text-gray-500 transition hover:bg-gray-800 hover:text-white"
				aria-label="Close"
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

		<!-- Session list -->
		<ul class="max-h-72 divide-y divide-gray-800 overflow-y-auto">
			{#each sessions as session (session.id)}
				{@const isActive = session.id === activeSession.id}
				{@const isRenaming = renamingId === session.id}
				{@const awaitingDeleteConfirm = deleteConfirmId === session.id}
				<li
					class="group flex items-center gap-3 px-4 py-3 transition {isActive
						? 'bg-amber-900/20'
						: 'hover:bg-gray-800/60'}"
				>
					<span
						class="flex h-2 w-2 shrink-0 rounded-full {isActive ? 'bg-amber-400' : 'bg-gray-700'}"
					></span>
					<div class="min-w-0 flex-1">
						{#if isRenaming}
							<!-- svelte-ignore a11y_autofocus -->
							<input
								autofocus
								type="text"
								class="w-full rounded border border-amber-500 bg-gray-800 px-2 py-0.5 text-sm text-white outline-none"
								bind:value={renameValue}
								onkeydown={(e) => {
									if (e.key === 'Enter') commitRename(session.id);
									if (e.key === 'Escape') renamingId = null;
								}}
								onblur={() => commitRename(session.id)}
							/>
						{:else}
							<button
								class="w-full text-left"
								onclick={() => !isActive && switchSession(session)}
								disabled={isActive || busy}
							>
								<span
									class="block truncate text-sm font-medium {isActive
										? 'text-amber-300'
										: 'text-gray-200 group-hover:text-white'}">{session.name}</span
								>
								<span
									class="font-mono text-xs tracking-widest {isActive
										? 'text-amber-500/70'
										: 'text-gray-500'}">{session.sessionId}</span
								>
							</button>
						{/if}
					</div>
					<div class="flex shrink-0 items-center gap-1">
						{#if !isRenaming}
							<button
								onclick={() => startRename(session)}
								title="Rename"
								class="rounded p-1 text-gray-600 transition hover:bg-gray-700 hover:text-gray-300"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-3.5 w-3.5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
									/>
								</svg>
							</button>
						{/if}
						{#if sessions.length > 1}
							{#if awaitingDeleteConfirm}
								<button
									onclick={() => deleteSession(session)}
									title="Confirm delete"
									class="rounded px-1.5 py-0.5 text-xs font-semibold text-red-400 ring-1 ring-red-500/50 transition hover:bg-red-900/30"
									>Sure?</button
								>
								<button
									onclick={() => (deleteConfirmId = null)}
									title="Cancel"
									class="rounded p-1 text-gray-500 transition hover:text-gray-300"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-3.5 w-3.5"
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
							{:else}
								<button
									onclick={() => deleteSession(session)}
									title="Delete session"
									class="rounded p-1 text-gray-600 transition hover:bg-gray-700 hover:text-red-400"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-3.5 w-3.5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</button>
							{/if}
						{:else}
							<span
								title="Can't delete last session"
								class="cursor-not-allowed rounded p-1 text-gray-800"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-3.5 w-3.5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							</span>
						{/if}
					</div>
				</li>
			{/each}
		</ul>

		<!-- New session footer -->
		<div class="border-t border-gray-700 px-4 py-3">
			{#if showNewSessionInput}
				<div class="flex items-center gap-2">
					<!-- svelte-ignore a11y_autofocus -->
					<input
						autofocus
						type="text"
						placeholder="Session name…"
						class="flex-1 rounded border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:border-amber-500"
						bind:value={newSessionName}
						onkeydown={(e) => {
							if (e.key === 'Enter') createSession();
							if (e.key === 'Escape') {
								showNewSessionInput = false;
								newSessionName = '';
							}
						}}
					/>
					<button
						onclick={createSession}
						disabled={busy}
						class="rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
						>Create</button
					>
					<button
						aria-label="Cancel"
						onclick={() => {
							showNewSessionInput = false;
							newSessionName = '';
						}}
						class="rounded p-1.5 text-gray-500 transition hover:text-gray-300"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
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
			{:else}
				<button
					onclick={() => (showNewSessionInput = true)}
					class="flex w-full items-center justify-center gap-2 rounded border border-dashed border-gray-700 py-2 text-xs font-semibold text-gray-500 transition hover:border-amber-600/60 hover:text-amber-400"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-3.5 w-3.5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					New Session
				</button>
			{/if}
		</div>
	</div>
</div>
