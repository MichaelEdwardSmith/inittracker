<!-- DM dashboard (/) — the main authenticated page. Composes PlayerPanel, EnemyPanel,
     and InitiativeTracker; hosts the top header with session switcher, Messages inbox,
     light/dark toggle, and guide popover; handles DM inbox polling and mobile hamburger menu. -->
<script lang="ts">
	import PlayerPanel from '$lib/components/PlayerPanel.svelte';
	import EnemyPanel from '$lib/components/EnemyPanel.svelte';
	import InitiativeTracker from '$lib/components/InitiativeTracker.svelte';
	import { untrack } from 'svelte';
	import GuidePopover from '$lib/components/GuidePopover.svelte';
	import DiceRollerModal from '$lib/components/DiceRollerModal.svelte';
	import SessionNotesModal from '$lib/components/SessionNotesModal.svelte';
	import { combat } from '$lib/store.svelte';
	import { theme } from '$lib/theme.svelte';
	import { invalidateAll } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { GameSession } from '$lib/types';

	let { data } = $props();

	let copied = $state(false);
	let openPanel = $state<'players' | 'enemies' | null>(null);

	// Right sidebar resize (enemy panel)
	const SIDEBAR_MIN = 200;
	const SIDEBAR_MAX = 520;
	const SIDEBAR_DEFAULT = 288; // w-72
	let sidebarWidth = $state(
		browser
			? Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, parseInt(localStorage.getItem('enemy-panel-width') ?? '') || SIDEBAR_DEFAULT))
			: SIDEBAR_DEFAULT
	);

	function startResize(e: MouseEvent) { e.preventDefault(); startResizeFrom(e.clientX); }
	function startResizeTouch(e: TouchEvent) { e.preventDefault(); startResizeFrom(e.touches[0].clientX); }
	function startResizeFrom(startX: number) {
		const startWidth = sidebarWidth;
		const onMouseMove = (mv: MouseEvent) => {
			sidebarWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth + (startX - mv.clientX)));
		};
		const onTouchMove = (mv: TouchEvent) => {
			mv.preventDefault();
			sidebarWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth + (startX - mv.touches[0].clientX)));
		};
		const onUp = () => {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onUp);
			document.removeEventListener('touchmove', onTouchMove);
			document.removeEventListener('touchend', onUp);
			document.removeEventListener('touchcancel', onUp);
			document.body.style.userSelect = '';
			document.body.style.cursor = '';
			if (browser) localStorage.setItem('enemy-panel-width', String(sidebarWidth));
		};
		document.body.style.userSelect = 'none';
		document.body.style.cursor = 'col-resize';
		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onUp);
		document.addEventListener('touchmove', onTouchMove, { passive: false });
		document.addEventListener('touchend', onUp);
		document.addEventListener('touchcancel', onUp);
	}

	// Left sidebar resize (player panel)
	const PLAYER_MIN = 180;
	const PLAYER_MAX = 480;
	const PLAYER_DEFAULT = 256; // w-64
	let playerWidth = $state(
		browser
			? Math.min(PLAYER_MAX, Math.max(PLAYER_MIN, parseInt(localStorage.getItem('player-panel-width') ?? '') || PLAYER_DEFAULT))
			: PLAYER_DEFAULT
	);

	function startResizePlayer(e: MouseEvent) { e.preventDefault(); startResizePlayerFrom(e.clientX); }
	function startResizePlayerTouch(e: TouchEvent) { e.preventDefault(); startResizePlayerFrom(e.touches[0].clientX); }
	function startResizePlayerFrom(startX: number) {
		const startWidth = playerWidth;
		const onMouseMove = (mv: MouseEvent) => {
			playerWidth = Math.min(PLAYER_MAX, Math.max(PLAYER_MIN, startWidth + (mv.clientX - startX)));
		};
		const onTouchMove = (mv: TouchEvent) => {
			mv.preventDefault();
			playerWidth = Math.min(PLAYER_MAX, Math.max(PLAYER_MIN, startWidth + (mv.touches[0].clientX - startX)));
		};
		const onUp = () => {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onUp);
			document.removeEventListener('touchmove', onTouchMove);
			document.removeEventListener('touchend', onUp);
			document.removeEventListener('touchcancel', onUp);
			document.body.style.userSelect = '';
			document.body.style.cursor = '';
			if (browser) localStorage.setItem('player-panel-width', String(playerWidth));
		};
		document.body.style.userSelect = 'none';
		document.body.style.cursor = 'col-resize';
		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onUp);
		document.addEventListener('touchmove', onTouchMove, { passive: false });
		document.addEventListener('touchend', onUp);
		document.addEventListener('touchcancel', onUp);
	}

	// Session manager state
	let showDiceRoller = $state(false);
	let showNotes = $state(false);
	let showSessionManager = $state(false);
	let sessions = $state<GameSession[]>(untrack(() => data.sessions));
	let activeSession = $state<GameSession>(untrack(() => data.activeSession));
	let sessionManagerBusy = $state(false);
	let renamingId = $state<string | null>(null);
	let renameValue = $state('');
	let newSessionName = $state('');
	let showNewSessionInput = $state(false);
	let deleteConfirmId = $state<string | null>(null);
	let showMobileMenu = $state(false);
	let isFullscreen = $state(false);

	$effect(() => {
		function onFsChange() { isFullscreen = !!document.fullscreenElement; }
		document.addEventListener('fullscreenchange', onFsChange);
		return () => document.removeEventListener('fullscreenchange', onFsChange);
	});

	function toggleFullscreen() {
		if (!document.fullscreenElement) document.documentElement.requestFullscreen();
		else document.exitFullscreen();
	}

	// ── DM inbox ──────────────────────────────────────────────────────────────────────
	interface DmMessage { id: string; from: string; text: string; timestamp: number; }
	let messages = $state<DmMessage[]>([]);
	let seenCount = $state(0);
	let showInbox = $state(false);
	const unreadCount = $derived(Math.max(0, messages.length - seenCount));

	$effect(() => {
		async function poll() {
			try {
				const r = await fetch('/api/messages');
				if (r.ok) messages = await r.json();
			} catch { /* ignore */ }
		}
		poll();
		const id = setInterval(poll, 5000);
		return () => clearInterval(id);
	});

	function openInbox() {
		showInbox = true;
		seenCount = messages.length;
	}

	async function clearMessages() {
		await fetch('/api/messages', { method: 'DELETE' });
		messages = [];
		seenCount = 0;
	}

	function formatTime(ts: number) {
		return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}


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

	// Subscribe to the session's SSE stream so external state changes (e.g. player
	// initiative rolls) are reflected immediately without a manual refresh.
	$effect(() => {
		const sessionId = activeSession.sessionId;
		const source = new EventSource(`/api/state?session=${sessionId}`);
		source.onmessage = (e) => {
			try {
				combat.applyExternalState(JSON.parse(e.data));
			} catch { /* ignore malformed messages */ }
		};
		return () => source.close();
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
				showNotes = false;
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
			<!-- Desktop: all buttons (md and up) -->
			<div class="hidden items-center gap-2 md:flex">
				<!-- Messages button -->
				<button
					onclick={openInbox}
					class="relative flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-semibold transition
					       {unreadCount > 0
						? 'border-amber-600/70 bg-amber-900/30 text-amber-400 hover:bg-amber-900/50'
						: 'border-gray-700 bg-gray-800/60 text-gray-400 hover:border-gray-500 hover:text-gray-200'}"
					title="Player messages"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
					Messages
					{#if unreadCount > 0}
						<span class="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black">
							{unreadCount}
						</span>
					{/if}
				</button>
				<button
					onclick={() => (showNotes = true)}
					title="Session Notes"
					class="flex items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
					</svg>
					<span>Notes</span>
				</button>
				<button
					onclick={() => (showDiceRoller = true)}
					title="Dice Roller"
					class="flex items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
					</svg>
					<span>Dice</span>
				</button>
				<button
					onclick={openSessionManager}
					title="Manage Sessions"
					class="flex items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14-7H5m14 14H5"/>
					</svg>
					<span>Sessions</span>
				</button>
				<a href="/history" title="Combat Chronicles" class="flex items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
					</svg>
					<span>Chronicle</span>
				</a>
				<a id="guide-link" href="/guide" title="User Guide" class="flex items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
					<span>Guide</span>
				</a>
				<a href="/display/{activeSession.sessionId}" target="_blank" rel="noopener" title="Open Player Display" class="flex items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
					</svg>
					<span>Player Display</span>
				</a>
				<a href="mailto:dm@inittracker.com" title="Contact us" class="flex items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
					</svg>
					<span>Contact</span>
				</a>
				<button
					onclick={toggleFullscreen}
					title={isFullscreen ? 'Exit full screen' : 'Full screen'}
					class="flex items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300"
				>
					{#if isFullscreen}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"/>
						</svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"/>
						</svg>
					{/if}
				</button>
				<button
					onclick={() => theme.toggle()}
					title={theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
					class="flex items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300"
				>
					{#if theme.isDark}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="5"/>
							<path stroke-linecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
						</svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
						</svg>
					{/if}
				</button>
				<form method="POST" action="/logout">
					<button type="submit" title="Log out" class="flex items-center gap-1 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-500 transition hover:border-red-800 hover:text-red-400">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
						</svg>
					</button>
				</form>
			</div>

			<!-- Mobile: hamburger (below md) -->
			<div class="relative md:hidden">
				<button
					onclick={() => (showMobileMenu = !showMobileMenu)}
					aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
					class="flex items-center rounded border border-gray-700 bg-gray-800 p-1.5 text-gray-400 transition hover:border-amber-600 hover:text-amber-300"
				>
					{#if showMobileMenu}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
						</svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
						</svg>
					{/if}
				</button>
				{#if unreadCount > 0}
					<span class="pointer-events-none absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black">
						{unreadCount > 9 ? '9+' : unreadCount}
					</span>
				{/if}
			</div>
		</div>
	</header>

	<!-- Mobile nav dropdown -->
	{#if showMobileMenu}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="fixed inset-0 z-40 md:hidden" onclick={() => (showMobileMenu = false)}></div>
		<div class="fixed top-14 right-2 z-50 w-52 overflow-hidden rounded-xl border border-gray-700 bg-gray-800 shadow-2xl md:hidden">
			<button
				onclick={() => { openInbox(); showMobileMenu = false; }}
				class="relative flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition
				       {unreadCount > 0 ? 'text-amber-400 hover:bg-amber-900/30' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
				</svg>
				Messages
				{#if unreadCount > 0}
					<span class="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black">
						{unreadCount}
					</span>
				{/if}
			</button>
			<button
				onclick={() => { showNotes = true; showMobileMenu = false; }}
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
				</svg>
				Notes
			</button>
			<button
				onclick={() => { showDiceRoller = true; showMobileMenu = false; }}
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
				</svg>
				Dice Roller
			</button>
			<button
				onclick={() => { openSessionManager(); showMobileMenu = false; }}
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14-7H5m14 14H5"/>
				</svg>
				Sessions
			</button>
			<a
				href="/history"
				onclick={() => (showMobileMenu = false)}
				class="flex items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
				</svg>
				Chronicle
			</a>
			<a
				id="guide-link"
				href="/guide"
				onclick={() => (showMobileMenu = false)}
				class="flex items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				Guide
			</a>
			<a
				href="/display/{activeSession.sessionId}"
				target="_blank"
				rel="noopener"
				onclick={() => (showMobileMenu = false)}
				class="flex items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
				</svg>
				Player Display
			</a>
			<a
				href="mailto:dm@inittracker.com"
				onclick={() => (showMobileMenu = false)}
				class="flex items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
				</svg>
				Contact
			</a>
			<button
				onclick={() => { toggleFullscreen(); showMobileMenu = false; }}
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				{#if isFullscreen}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"/>
					</svg>
					Exit Full Screen
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"/>
					</svg>
					Full Screen
				{/if}
			</button>
			<button
				onclick={() => { theme.toggle(); showMobileMenu = false; }}
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				{#if theme.isDark}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="5"/>
						<path stroke-linecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
					</svg>
					Light Mode
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
					</svg>
					Dark Mode
				{/if}
			</button>
			<form method="POST" action="/logout" class="border-t border-gray-700">
				<button
					type="submit"
					class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-500 transition hover:bg-red-900/30 hover:text-red-400"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
					</svg>
					Log out
				</button>
			</form>
		</div>
	{/if}

	<!-- Main layout -->
	<div class="flex min-h-0 flex-1">
		<!-- Left sidebar: Players (desktop only, resizable) -->
		<aside
			class="relative hidden shrink-0 flex-col border-r border-gray-800 bg-gray-900/50 p-4 md:flex"
			style="width: {playerWidth}px"
		>
			<!-- Drag handle — right edge -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				class="absolute inset-y-0 right-0 z-10 w-3 cursor-col-resize transition-colors hover:bg-blue-500/30 active:bg-blue-500/50"
				onmousedown={startResizePlayer}
				ontouchstart={startResizePlayerTouch}
				role="separator"
				aria-label="Drag to resize panel"
				style="touch-action: none; -webkit-touch-callout: none; user-select: none"
				oncontextmenu={(e) => e.preventDefault()}
			></div>
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
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				class="absolute inset-y-0 left-0 z-10 w-3 cursor-col-resize transition-colors hover:bg-blue-500/30 active:bg-blue-500/50"
				onmousedown={startResize}
				ontouchstart={startResizeTouch}
				role="separator"
				aria-label="Drag to resize panel"
				style="touch-action: none; -webkit-touch-callout: none; user-select: none"
				oncontextmenu={(e) => e.preventDefault()}
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

<!-- DM Inbox modal -->
{#if showInbox}
	<div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
						<button
							onclick={clearMessages}
							class="rounded px-2 py-1 text-xs text-gray-600 transition hover:bg-red-900/40 hover:text-red-400"
						>
							Clear all
						</button>
					{/if}
					<button onclick={() => (showInbox = false)} aria-label="Close" class="text-gray-600 transition hover:text-gray-300">
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
{/if}

<GuidePopover />

{#if showNotes}
	<SessionNotesModal onclose={() => (showNotes = false)} sessionName={activeSession.name} />
{/if}

{#if showDiceRoller}
	<DiceRollerModal onclose={() => (showDiceRoller = false)} />
{/if}
