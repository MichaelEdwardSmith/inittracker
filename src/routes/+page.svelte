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
	import DiceOverlay from '$lib/components/DiceOverlay.svelte';
	import SessionNotesModal from '$lib/components/SessionNotesModal.svelte';
	import SessionManagerModal from '$lib/components/SessionManagerModal.svelte';
	import DMInboxModal from '$lib/components/DMInboxModal.svelte';
	import SpellsModal from '$lib/components/SpellsModal.svelte';
	import EncounterBuilderModal from '$lib/components/EncounterBuilderModal.svelte';
	import VoiceCommands from '$lib/components/VoiceCommands.svelte';
	import AudioMixer from '$lib/components/AudioMixer.svelte';
	import QuickRulesModal from '$lib/components/QuickRulesModal.svelte';
	import { ENEMY_TEMPLATES } from '$lib/enemies';
	import { combat } from '$lib/store.svelte';
	import { theme } from '$lib/theme.svelte';
	import { browser } from '$app/environment';
	import { setContext } from 'svelte';
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
	let showMixer = $state(false);
	let mixerMounted = $state(false);
	function openMixer() { mixerMounted = true; showMixer = true; }
	let showEncounters = $state(false);
	let showSpells = $state(false);
	let spellToOpen = $state<string | null>(null);

	setContext('openSpell', (name: string) => { spellToOpen = name; showSpells = true; });
	let showNotes = $state(false);
	let showQuickRules = $state(false);
	let showSessionManager = $state(false);
	let sessions = $state<GameSession[]>(untrack(() => data.sessions));
	let activeSession = $state<GameSession>(untrack(() => data.activeSession));
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
			<!-- Hamburger menu -->
			<div class="relative">
				<button
					id="hamburger-btn"
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
		<div class="fixed inset-0 z-40" onclick={() => (showMobileMenu = false)}></div>
	{/if}
	<div class="fixed top-14 right-2 z-50 w-52 overflow-hidden rounded-xl border border-gray-700 bg-gray-800 shadow-2xl {showMobileMenu ? '' : 'hidden'}">
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
				onclick={() => { showSpells = true; showMobileMenu = false; }}
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
				</svg>
				Spells
			</button>
			{#if data.showVoiceCommands}
				<VoiceCommands mobile={true} />
			{/if}
			<button
				onclick={() => { openMixer(); showMobileMenu = false; }}
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
				</svg>
				Mixer
			</button>
			<button
				onclick={() => { showQuickRules = true; showMobileMenu = false; }}
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
				</svg>
				Quick Reference
			</button>
			<button
				onclick={() => { showEncounters = true; showMobileMenu = false; }}
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
				</svg>
				Encounters
			</button>
			<button
				onclick={() => { showSessionManager = true; showMobileMenu = false; }}
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

<!-- Session Manager Modal -->
{#if showSessionManager}
	<SessionManagerModal
		{sessions}
		{activeSession}
		onclose={() => (showSessionManager = false)}
		onswitched={() => (showNotes = false)}
	/>
{/if}

<!-- DM Inbox modal -->
{#if showInbox}
	<DMInboxModal {messages} onclose={() => (showInbox = false)} onclear={clearMessages} />
{/if}

<GuidePopover />

{#if showNotes}
	<SessionNotesModal onclose={() => (showNotes = false)} sessionName={activeSession.name} />
{/if}

{#if showDiceRoller}
	<DiceRollerModal onclose={() => (showDiceRoller = false)} />
{/if}

{#if showEncounters}
	<EncounterBuilderModal onclose={() => (showEncounters = false)} />
{/if}

{#if showSpells}
	<SpellsModal
		initialSpell={spellToOpen ?? undefined}
		onclose={() => { showSpells = false; spellToOpen = null; }}
	/>
{/if}

<DiceOverlay />

<!-- Audio Mixer — mounted once (after first open) and hidden via CSS so audio keeps playing -->
{#if mixerMounted}
	<div class={showMixer ? '' : 'hidden'}>
		<AudioMixer onclose={() => (showMixer = false)} />
	</div>
{/if}

{#if showQuickRules}
	<QuickRulesModal
		onclose={() => (showQuickRules = false)}
		onAddEncounter={(monsters) => {
			combat.clearEnemies();
			for (const m of monsters) {
				const template = ENEMY_TEMPLATES.find((t) => t.name.toLowerCase() === m.name.toLowerCase());
				if (template) {
					combat.addEnemies(template, m.count);
				} else {
					// Fallback: create a minimal template for monsters not in the bestiary
					combat.addEnemies({ name: m.name, ac: 10, hp: 10, cr: '1', monsterType: 'unknown' }, m.count);
				}
			}
			showQuickRules = false;
		}}
	/>
{/if}
