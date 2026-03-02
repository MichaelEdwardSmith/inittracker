<script lang="ts">
	import PlayerPanel from '$lib/components/PlayerPanel.svelte';
	import EnemyPanel from '$lib/components/EnemyPanel.svelte';
	import InitiativeTracker from '$lib/components/InitiativeTracker.svelte';
	import { untrack } from 'svelte';
	import GuidePopover from '$lib/components/GuidePopover.svelte';
	import { combat } from '$lib/store.svelte';
	import { invalidateAll } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { GameSession } from '$lib/types';

	let { data } = $props();

	let copied = $state(false);
	let openPanel = $state<'players' | 'enemies' | null>(null);

	// Right sidebar resize
	const SIDEBAR_MIN = 200;
	const SIDEBAR_MAX = 520;
	const SIDEBAR_DEFAULT = 288; // w-72
	let sidebarWidth = $state(
		browser
			? Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, parseInt(localStorage.getItem('enemy-panel-width') ?? '') || SIDEBAR_DEFAULT))
			: SIDEBAR_DEFAULT
	);

	function startResize(e: MouseEvent) {
		e.preventDefault();
		const startX = e.clientX;
		const startWidth = sidebarWidth;

		const onMove = (mv: MouseEvent) => {
			sidebarWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth + (startX - mv.clientX)));
		};
		const onUp = () => {
			document.removeEventListener('mousemove', onMove);
			document.removeEventListener('mouseup', onUp);
			document.body.style.userSelect = '';
			document.body.style.cursor = '';
			if (browser) localStorage.setItem('enemy-panel-width', String(sidebarWidth));
		};

		document.body.style.userSelect = 'none';
		document.body.style.cursor = 'col-resize';
		document.addEventListener('mousemove', onMove);
		document.addEventListener('mouseup', onUp);
	}

	// Session manager state
	let showSessionManager = $state(false);
	let sessions = $state<GameSession[]>(untrack(() => data.sessions));
	let activeSession = $state<GameSession>(untrack(() => data.activeSession));
	let sessionManagerBusy = $state(false);
	let renamingId = $state<string | null>(null);
	let renameValue = $state('');
	let newSessionName = $state('');
	let showNewSessionInput = $state(false);
	let deleteConfirmId = $state<string | null>(null);

	// Keep sessions in sync when page data refreshes (e.g. after invalidateAll)
	$effect(() => {
		sessions = data.sessions;
		activeSession = data.activeSession;
	});

	function copySessionId() {
		navigator.clipboard.writeText(activeSession.sessionId).then(() => {
			copied = true;
			setTimeout(() => (copied = false), 2000);
		});
	}

	// Re-hydrate the client store from the server on every page load so the
	// DM screen recovers its state after a browser refresh.
	$effect(() => {
		combat.loadFromServer();
	});

	// -------------------------------------------------------------------------
	// Session manager helpers
	// -------------------------------------------------------------------------

	function openSessionManager() {
		showSessionManager = true;
		renamingId = null;
		showNewSessionInput = false;
		deleteConfirmId = null;
	}

	function closeSessionManager() {
		showSessionManager = false;
		renamingId = null;
		showNewSessionInput = false;
		deleteConfirmId = null;
	}

	async function switchSession(session: GameSession) {
		if (session.id === activeSession.id || sessionManagerBusy) return;
		sessionManagerBusy = true;
		try {
			const res = await fetch('/api/sessions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'switch', id: session.id })
			});
			if (res.ok) {
				closeSessionManager();
				await invalidateAll();
				await combat.loadFromServer();
			}
		} finally {
			sessionManagerBusy = false;
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
		if (res.ok) {
			sessions = sessions.map((s) => (s.id === sessionId ? { ...s, name: renameValue } : s));
			if (activeSession.id === sessionId) activeSession = { ...activeSession, name: renameValue };
		}
	}

	async function createSession() {
		if (sessionManagerBusy) return;
		const name = newSessionName.trim() || `Session ${sessions.length + 1}`;
		sessionManagerBusy = true;
		try {
			const res = await fetch('/api/sessions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'create', name })
			});
			if (res.ok) {
				const created: { id: string; sessionId: string } = await res.json();
				sessions = [...sessions, { id: created.id, sessionId: created.sessionId, name }];
				newSessionName = '';
				showNewSessionInput = false;
			}
		} finally {
			sessionManagerBusy = false;
		}
	}

	async function deleteSession(session: GameSession) {
		if (sessions.length <= 1) return;
		if (deleteConfirmId !== session.id) {
			deleteConfirmId = session.id;
			return;
		}
		// Second click — confirmed
		deleteConfirmId = null;
		const res = await fetch('/api/sessions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'delete', id: session.id })
		});
		if (res.ok) {
			sessions = sessions.filter((s) => s.id !== session.id);
			// If we deleted the active session, re-fetch everything
			if (session.id === activeSession.id) {
				await invalidateAll();
				await combat.loadFromServer();
			}
		}
	}

	function cancelDeleteConfirm() {
		deleteConfirmId = null;
	}
</script>

<div class="flex h-screen flex-col overflow-hidden bg-gray-950 text-white">
	<!-- App header -->
	<header class="flex shrink-0 items-center border-b border-gray-800 bg-gray-900 px-6 py-3">
		<span class="text-xl">⚔️</span>
		<h1 class="ml-3 hidden text-xl font-bold tracking-widest text-amber-400 uppercase md:block">
			Initiative Tracker
		</h1>

		<!-- Active session name + ID display -->
		<div
			class="ml-6 flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-1.5"
		>
			<span class="hidden text-xs tracking-widest text-gray-500 uppercase sm:inline">Session</span>
			<span class="max-w-[120px] truncate text-sm font-semibold text-amber-300"
				>{activeSession.name}</span
			>
			<span class="font-black tracking-[0.2em] text-amber-400">{activeSession.sessionId}</span>
			<button
				onclick={copySessionId}
				title="Copy session ID"
				class="ml-1 rounded p-0.5 text-gray-500 transition hover:text-amber-400"
			>
				{#if copied}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-3.5 w-3.5 text-green-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				{:else}
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
							d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
						/>
					</svg>
				{/if}
			</button>
		</div>

		<div class="ml-auto flex items-center gap-2">
			<!-- Sessions manager button -->
			<button
				onclick={openSessionManager}
				title="Manage Sessions"
				class="flex items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300"
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
						d="M19 11H5m14-7H5m14 14H5"
					/>
				</svg>
				<span class="hidden sm:inline">Sessions</span>
			</button>

			<a
				href="/history"
				title="Combat Chronicles"
				class="flex items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300"
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
						d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
					/>
				</svg>
				<span class="hidden md:inline">Chronicle</span>
			</a>
			<a
				id="guide-link"
				href="/guide"
				title="User Guide"
				class="flex items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300"
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
						d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<span class="hidden md:inline">Guide</span>
			</a>
			<a
				href="/display/{activeSession.sessionId}"
				target="_blank"
				rel="noopener"
				title="Open Player Display"
				class="hidden items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300 md:flex"
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
						d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
					/>
				</svg>
				Player Display
			</a>
			<a
				href="mailto:dm@inittracker.com"
				title="Contact us"
				class="flex items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300"
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
						d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
					/>
				</svg>
				<span class="hidden sm:inline">Contact</span>
			</a>
			<form method="POST" action="/logout">
				<button
					type="submit"
					class="flex items-center gap-1 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-500 transition hover:border-red-800 hover:text-red-400"
					title="Log out"
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
							d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
						/>
					</svg>
				</button>
			</form>
		</div>
	</header>

	<!-- Main layout -->
	<div class="flex min-h-0 flex-1">
		<!-- Left sidebar: Players (desktop only) -->
		<aside
			class="hidden w-64 shrink-0 flex-col border-r border-gray-800 bg-gray-900/50 p-4 md:flex"
		>
			<PlayerPanel />
		</aside>

		<!-- Center: Initiative tracker -->
		<main class="flex min-w-0 flex-1 flex-col p-4">
			<InitiativeTracker />
		</main>

		<!-- Right sidebar: Enemies (desktop only, resizable) -->
		<aside
			class="relative hidden shrink-0 flex-col border-l border-gray-800 bg-gray-900/50 p-4 md:flex"
			style="width: {sidebarWidth}px"
		>
			<!-- Drag handle — left edge -->
			<div
				class="absolute inset-y-0 left-0 z-10 w-1.5 cursor-col-resize transition-colors hover:bg-blue-500/30"
				onmousedown={startResize}
				role="separator"
				aria-label="Drag to resize panel"
			></div>
			<EnemyPanel />
		</aside>
	</div>

	<!-- Mobile bottom action bar -->
	<div
		class="flex shrink-0 items-center justify-around border-t border-gray-800 bg-gray-900 py-2 md:hidden"
	>
		<button
			onclick={() => (openPanel = openPanel === 'players' ? null : 'players')}
			class="flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold transition
			       {openPanel === 'players'
				? 'bg-amber-600/20 text-amber-300'
				: 'text-gray-400 hover:bg-gray-800 hover:text-white'}"
		>
			<span>🛡️</span>
			Party
		</button>
		<button
			onclick={() => (openPanel = openPanel === 'enemies' ? null : 'enemies')}
			class="flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold transition
			       {openPanel === 'enemies'
				? 'bg-red-600/20 text-red-300'
				: 'text-gray-400 hover:bg-gray-800 hover:text-white'}"
		>
			<span>💀</span>
			Enemies
		</button>
	</div>
</div>

<!-- Mobile panel overlay (full screen) -->
{#if openPanel !== null}
	<div class="fixed inset-0 z-50 flex flex-col bg-gray-900 p-4 md:hidden">
		<div class="mb-3 flex shrink-0 items-center justify-between">
			<span class="text-sm font-bold tracking-widest text-gray-400 uppercase">
				{openPanel === 'players' ? 'Party' : 'Enemies'}
			</span>
			<button
				onclick={() => (openPanel = null)}
				class="rounded p-1 text-gray-500 transition hover:bg-gray-800 hover:text-white"
				aria-label="Close panel"
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
		<div class="min-h-0 flex-1 overflow-y-auto">
			{#if openPanel === 'players'}
				<PlayerPanel />
			{:else}
				<EnemyPanel />
			{/if}
		</div>
	</div>
{/if}

<!-- =========================================================================
     Session Manager Modal
     ========================================================================= -->
{#if showSessionManager}
	<div
		role="dialog"
		aria-modal="true"
		aria-label="Session manager"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) closeSessionManager();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') closeSessionManager();
		}}
	>
		<div class="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
			<!-- Modal header -->
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
					onclick={closeSessionManager}
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
						class="group flex items-center gap-3 px-4 py-3 transition
						       {isActive ? 'bg-amber-900/20' : 'hover:bg-gray-800/60'}"
					>
						<!-- Active indicator -->
						<span
							class="flex h-2 w-2 shrink-0 rounded-full {isActive ? 'bg-amber-400' : 'bg-gray-700'}"
						></span>

						<!-- Name / rename input -->
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
									disabled={isActive || sessionManagerBusy}
								>
									<span
										class="block truncate text-sm font-medium {isActive
											? 'text-amber-300'
											: 'text-gray-200 group-hover:text-white'}"
									>
										{session.name}
									</span>
									<span
										class="font-mono text-xs tracking-widest {isActive
											? 'text-amber-500/70'
											: 'text-gray-500'}"
									>
										{session.sessionId}
									</span>
								</button>
							{/if}
						</div>

						<!-- Action buttons -->
						<div class="flex shrink-0 items-center gap-1">
							<!-- Rename -->
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

							<!-- Delete -->
							{#if sessions.length > 1}
								{#if awaitingDeleteConfirm}
									<button
										onclick={() => deleteSession(session)}
										title="Confirm delete"
										class="rounded px-1.5 py-0.5 text-xs font-semibold text-red-400 ring-1 ring-red-500/50 transition hover:bg-red-900/30"
									>
										Sure?
									</button>
									<button
										onclick={cancelDeleteConfirm}
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
							disabled={sessionManagerBusy}
							class="rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
						>
							Create
						</button>
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
{/if}

<GuidePopover />
