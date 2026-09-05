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
	import FirstRunEditionModal from '$lib/components/FirstRunEditionModal.svelte';
	import DMInboxModal from '$lib/components/DMInboxModal.svelte';
	import SpellsModal from '$lib/components/SpellsModal.svelte';
	import SpellsModal2024 from '$lib/components/SpellsModal2024.svelte';
	import EncounterBuilderModal from '$lib/components/EncounterBuilderModal.svelte';
	import VoiceCommands from '$lib/components/VoiceCommands.svelte';
	import AudioMixer from '$lib/components/AudioMixer.svelte';
	// QuickRulesModal, GeneratorsModal, DungeonGeneratorModal are lazy-loaded on first open
	// to keep them out of the initial server/client bundle (~415 KB of inline data).
	import { ENEMY_TEMPLATES } from '$lib/enemies';
	import { batteryIcon } from '$lib/utils';
	import { combat } from '$lib/store.svelte';
	import { theme } from '$lib/theme.svelte';
	import { browser } from '$app/environment';
	import { setContext } from 'svelte';
	import { enhance } from '$app/forms';
	import type { GameSession } from '$lib/types';

	let { data } = $props();

	let copied = $state(false);
	let openPanel = $state<'players' | 'enemies' | null>(null);

	// ── Right sidebar resize (enemy panel) ──────────────────────────────────
	const SIDEBAR_MIN = 200;
	const SIDEBAR_MAX = 520;
	const SIDEBAR_DEFAULT = 288; // w-72
	let sidebarWidth = $state(
		browser
			? Math.min(
					SIDEBAR_MAX,
					Math.max(
						SIDEBAR_MIN,
						parseInt(localStorage.getItem('enemy-panel-width') ?? '') || SIDEBAR_DEFAULT
					)
				)
			: SIDEBAR_DEFAULT
	);

	function startResize(e: MouseEvent) {
		e.preventDefault();
		startResizeFrom(e.clientX);
	}
	function startResizeTouch(e: TouchEvent) {
		e.preventDefault();
		startResizeFrom(e.touches[0].clientX);
	}
	function startResizeFrom(startX: number) {
		const startWidth = sidebarWidth;
		const onMouseMove = (mv: MouseEvent) => {
			sidebarWidth = Math.min(
				SIDEBAR_MAX,
				Math.max(SIDEBAR_MIN, startWidth + (startX - mv.clientX))
			);
		};
		const onTouchMove = (mv: TouchEvent) => {
			mv.preventDefault();
			sidebarWidth = Math.min(
				SIDEBAR_MAX,
				Math.max(SIDEBAR_MIN, startWidth + (startX - mv.touches[0].clientX))
			);
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

	// ── Left sidebar resize (player panel) ──────────────────────────────────
	const PLAYER_MIN = 180;
	const PLAYER_MAX = 480;
	const PLAYER_DEFAULT = 256; // w-64
	let playerWidth = $state(
		browser
			? Math.min(
					PLAYER_MAX,
					Math.max(
						PLAYER_MIN,
						parseInt(localStorage.getItem('player-panel-width') ?? '') || PLAYER_DEFAULT
					)
				)
			: PLAYER_DEFAULT
	);

	function startResizePlayer(e: MouseEvent) {
		e.preventDefault();
		startResizePlayerFrom(e.clientX);
	}
	function startResizePlayerTouch(e: TouchEvent) {
		e.preventDefault();
		startResizePlayerFrom(e.touches[0].clientX);
	}
	function startResizePlayerFrom(startX: number) {
		const startWidth = playerWidth;
		const onMouseMove = (mv: MouseEvent) => {
			playerWidth = Math.min(PLAYER_MAX, Math.max(PLAYER_MIN, startWidth + (mv.clientX - startX)));
		};
		const onTouchMove = (mv: TouchEvent) => {
			mv.preventDefault();
			playerWidth = Math.min(
				PLAYER_MAX,
				Math.max(PLAYER_MIN, startWidth + (mv.touches[0].clientX - startX))
			);
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

	// ── Modals & overlays ─────────────────────────────────────────────────────
	let showDiceRoller = $state(false);
	let showMixer = $state(false);
	let mixerMounted = $state(false);
	function openMixer() {
		mixerMounted = true;
		showMixer = true;
	}
	let showEncounters = $state(false);
	let showSpells = $state(false);
	let spellToOpen = $state<string | null>(null);

	setContext('openSpell', (name: string) => {
		spellToOpen = name;
		showSpells = true;
	});
	let showNotes = $state(false);
	let showQuickRules = $state(false);
	let showGenerators = $state(false);
	let showLiarsDice = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let LiarsDiceModalComp = $state<any>(null);
	async function openLiarsDice() {
		showLiarsDice = true;
		showMobileMenu = false;
		if (!LiarsDiceModalComp)
			LiarsDiceModalComp = (await import('$lib/components/LiarsDiceModal.svelte')).default;
	}
	let showDungeon = $state(false);
	let showDonjon = $state(false);
	let showTown = $state(false);
	let showInn = $state(false);

	// Lazily-loaded heavy modal components
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let QuickRulesModalComp = $state<any>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let GeneratorsModalComp = $state<any>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let DungeonGeneratorModalComp = $state<any>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let DonjonModalComp = $state<any>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let TownModalComp = $state<any>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let InnModalComp = $state<any>(null);

	async function openQuickRules() {
		showQuickRules = true;
		showMobileMenu = false;
		if (!QuickRulesModalComp)
			QuickRulesModalComp = (await import('$lib/components/QuickRulesModal.svelte')).default;
	}
	async function openGenerators() {
		showGenerators = true;
		showMobileMenu = false;
		if (!GeneratorsModalComp)
			GeneratorsModalComp = (await import('$lib/components/GeneratorsModal.svelte')).default;
	}
	async function openDungeon() {
		showDungeon = true;
		if (!DungeonGeneratorModalComp)
			DungeonGeneratorModalComp = (await import('$lib/components/DungeonGeneratorModal.svelte'))
				.default;
	}
	async function openDonjon() {
		showDonjon = true;
		if (!DonjonModalComp)
			DonjonModalComp = (await import('$lib/components/DonjonDungeonModal.svelte')).default;
	}
	async function openTown() {
		showTown = true;
		if (!TownModalComp)
			TownModalComp = (await import('$lib/components/TownGeneratorModal.svelte')).default;
	}
	async function openInn() {
		showInn = true;
		if (!InnModalComp)
			InnModalComp = (await import('$lib/components/InnGeneratorModal.svelte')).default;
	}

	// ── Session management ────────────────────────────────────────────────────
	let showSessionManager = $state(false);
	let sessions = $state<GameSession[]>(untrack(() => data.sessions));
	let activeSession = $state<GameSession>(untrack(() => data.activeSession));
	let showMobileMenu = $state(false);
	const MENU_SECTIONS_DEFAULT_COLLAPSED = {
		tools: true,
		campaign: true,
		account: true,
		display: true
	};
	let collapsedMenuSections = $state<Record<string, boolean>>(
		browser
			? {
					...MENU_SECTIONS_DEFAULT_COLLAPSED,
					...JSON.parse(localStorage.getItem('collapsed-menu-sections') ?? '{}')
				}
			: MENU_SECTIONS_DEFAULT_COLLAPSED
	);
	function toggleMenuSection(key: string) {
		collapsedMenuSections[key] = !collapsedMenuSections[key];
		if (browser)
			localStorage.setItem('collapsed-menu-sections', JSON.stringify(collapsedMenuSections));
	}
	let guestEditionPicked = $state(false);
	let isFullscreen = $state(false);
	let presences = $state<Record<string, string>>({});

	async function fetchPresences() {
		try {
			const res = await fetch(`/api/player-presence?session=${activeSession.sessionId}`);
			if (res.ok) presences = await res.json();
		} catch {
			/* silent */
		}
	}

	$effect(() => {
		fetchPresences();
		const id = setInterval(fetchPresences, 10_000);
		return () => clearInterval(id);
	});

	$effect(() => {
		function onFsChange() {
			isFullscreen = !!document.fullscreenElement;
		}
		document.addEventListener('fullscreenchange', onFsChange);
		return () => document.removeEventListener('fullscreenchange', onFsChange);
	});

	// ── Clock, battery & fullscreen ──────────────────────────────────────────
	let currentTime = $state('');
	let batteryLevel = $state<number | null>(null);
	let batteryCharging = $state(false);
	let isTouchDevice = $state(false);

	$effect(() => {
		function formatTime() {
			return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		}
		currentTime = formatTime();
		const id = setInterval(() => {
			currentTime = formatTime();
		}, 10000);
		return () => clearInterval(id);
	});

	$effect(() => {
		isTouchDevice = navigator.maxTouchPoints > 0;
		if (!isTouchDevice || !('getBattery' in navigator)) return;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(navigator as any).getBattery().then((battery: any) => {
			batteryLevel = Math.round(battery.level * 100);
			batteryCharging = battery.charging;
			battery.addEventListener('levelchange', () => {
				batteryLevel = Math.round(battery.level * 100);
			});
			battery.addEventListener('chargingchange', () => {
				batteryCharging = battery.charging;
			});
		});
	});

	function toggleFullscreen() {
		if (!document.fullscreenElement) document.documentElement.requestFullscreen();
		else document.exitFullscreen();
	}

	// ── DM inbox ──────────────────────────────────────────────────────────────────────
	interface DmMessage {
		id: string;
		from: string;
		text: string;
		timestamp: number;
	}
	let messages = $state<DmMessage[]>([]);
	let seenCount = $state(0);
	let showInbox = $state(false);
	const unreadCount = $derived(Math.max(0, messages.length - seenCount));

	$effect(() => {
		if (data.isGuest) return;
		async function poll() {
			try {
				const r = await fetch('/api/messages');
				if (r.ok) messages = await r.json();
			} catch {
				/* ignore */
			}
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

	// ── Floating emoji reactions ───────────────────────────────────────────────────
	interface FloatingEmoji {
		id: string;
		emoji: string;
		from: string;
		x: number;
		duration: number;
	}
	let floatingEmojis = $state<FloatingEmoji[]>([]);
	let lastEmojiPoll = Date.now();

	function spawnFloatingEmoji(emoji: string, from: string) {
		const item: FloatingEmoji = {
			id: crypto.randomUUID(),
			emoji,
			from,
			x: 10 + Math.random() * 80,
			duration: 3.5 + Math.random() * 1.5
		};
		floatingEmojis = [...floatingEmojis, item];
		setTimeout(
			() => {
				floatingEmojis = floatingEmojis.filter((e) => e.id !== item.id);
			},
			(item.duration + 0.5) * 1000
		);
	}

	$effect(() => {
		if (data.isGuest) return;
		const interval = setInterval(async () => {
			try {
				const r = await fetch(`/api/emoji-reaction?since=${lastEmojiPoll}`);
				if (r.ok) {
					const { reactions } = await r.json();
					const now = Date.now();
					lastEmojiPoll = now;
					for (const reaction of reactions) {
						spawnFloatingEmoji(reaction.emoji, reaction.from);
					}
				}
			} catch {
				/* ignore */
			}
		}, 2500);
		return () => clearInterval(interval);
	});

	// ── State sync & messaging ────────────────────────────────────────────────
	async function sendDmReply(to: string, text: string) {
		await fetch('/api/dm-reply', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ to, text })
		});
	}

	const playerNames = $derived(
		combat.combatants.filter((c) => c.type === 'player').map((c) => c.name)
	);

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
		if (data.isGuest) return;
		const sessionId = activeSession.sessionId;
		const source = new EventSource(`/api/state?session=${sessionId}`);
		source.onmessage = (e) => {
			try {
				combat.applyExternalState(JSON.parse(e.data));
			} catch {
				/* ignore malformed messages */
			}
		};
		return () => source.close();
	});
</script>

<div class="flex h-screen flex-col overflow-hidden bg-gray-950 text-white">
	<div aria-hidden="true" class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
		<div class="bg-orb orb-1"></div>
		<div class="bg-orb orb-2"></div>
		<div class="bg-orb orb-3"></div>
		<div class="bg-orb orb-4"></div>
	</div>

	{#if data.isImpersonating}
		<div
			class="relative z-10 flex shrink-0 flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-600 px-4 py-1.5 text-center text-xs font-semibold text-black sm:text-sm"
		>
			<span>
				<i class="fa-duotone fa-light fa-shield-halved" aria-hidden="true"></i> Admin view — viewing
				<strong>{data.dmFirstName}</strong>{#if data.dmEmail}
					({data.dmEmail}){/if}'s account as {data.impersonatingAdminEmail}
			</span>
			<form method="POST" action="/admin?/stop" use:enhance>
				<button
					type="submit"
					class="rounded border border-black/30 bg-black/10 px-2 py-0.5 text-xs font-bold tracking-wide uppercase transition hover:bg-black/20"
				>
					Exit
				</button>
			</form>
		</div>
	{/if}

	<!-- App header -->
	<header class="flex shrink-0 items-center border-b border-gray-800 bg-gray-900 px-6 py-3">
		<i class="fa-duotone fa-light fa-swords text-xl" aria-hidden="true"></i>
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
					<i class="fa-duotone fa-light fa-check text-sm text-green-400" aria-hidden="true"></i>
				{:else}
					<i class="fa-duotone fa-light fa-copy text-sm" aria-hidden="true"></i>
				{/if}
			</button>
		</div>

		<div class="ml-auto flex items-center gap-2">
			<!-- Time + battery -->
			{#if currentTime}
				<div class="flex items-center gap-1.5 text-xs text-gray-400">
					<span class="font-mono tabular-nums">{currentTime}</span>
					{#if isTouchDevice && batteryLevel !== null}
						<span
							class="flex items-center gap-0.5 {batteryLevel <= 20
								? 'text-red-400'
								: batteryCharging
									? 'text-green-400'
									: ''}"
						>
							<i
								class="fa-duotone fa-light {batteryIcon(batteryLevel, batteryCharging)} text-sm"
								aria-hidden="true"
							></i>
							<span>{batteryLevel}%</span>
						</span>
					{/if}
				</div>
			{/if}
			<!-- Hamburger menu -->
			<div class="relative">
				<button
					id="hamburger-btn"
					onclick={() => (showMobileMenu = !showMobileMenu)}
					aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
					class="flex items-center rounded border border-gray-700 bg-gray-800 p-1.5 text-gray-400 transition hover:border-amber-600 hover:text-amber-300"
				>
					{#if showMobileMenu}
						<i class="fa-duotone fa-light fa-xmark text-base" aria-hidden="true"></i>
					{:else}
						<i class="fa-duotone fa-light fa-bars text-base" aria-hidden="true"></i>
					{/if}
				</button>
				{#if unreadCount > 0 && !data.isGuest}
					<span
						class="pointer-events-none absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black"
					>
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
	<div
		class="fixed top-14 right-2 z-50 max-h-[calc(100vh-4rem)] w-52 overflow-y-auto rounded-xl border border-gray-700 bg-gray-800 shadow-2xl {showMobileMenu
			? ''
			: 'hidden'}"
	>
		<button
			onclick={() => toggleMenuSection('tools')}
			title="Expand or collapse this section"
			class="flex w-full items-center justify-between px-4 pt-2.5 pb-1 text-left text-[10px] font-bold tracking-wider text-gray-500 uppercase transition hover:text-gray-300"
		>
			Session Tools
			<i
				class="fa-duotone fa-light fa-chevron-down shrink-0 text-xs transition-transform {collapsedMenuSections.tools
					? '-rotate-90'
					: ''}"
				aria-hidden="true"
			></i>
		</button>
		{#if !collapsedMenuSections.tools}
			<button
				onclick={() => {
					showNotes = true;
					showMobileMenu = false;
				}}
				title="Freeform DM notes for this session"
				class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<i class="fa-duotone fa-light fa-pen-to-square shrink-0 text-base" aria-hidden="true"></i>
				Notes
			</button>
			<button
				onclick={() => {
					showDiceRoller = true;
					showMobileMenu = false;
				}}
				title="Roll dice with a virtual dice roller"
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<i class="fa-duotone fa-light fa-cube shrink-0 text-base" aria-hidden="true"></i>
				Dice Roller
			</button>
			<button
				onclick={() => {
					showSpells = true;
					showMobileMenu = false;
				}}
				title="Browse and reference spells"
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<i class="fa-duotone fa-light fa-book-open shrink-0 text-base" aria-hidden="true"></i>
				Spells
			</button>
			<button
				onclick={openQuickRules}
				title="Quick-reference tabletop rules"
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<i class="fa-duotone fa-light fa-file-lines shrink-0 text-base" aria-hidden="true"></i>
				Quick Reference
			</button>
			<button
				onclick={openLiarsDice}
				title="Play a round of Liar's Dice"
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<i class="fa-duotone fa-light fa-dice-five shrink-0 text-base" aria-hidden="true"></i>
				Liar's Dice
			</button>
			<button
				onclick={openGenerators}
				title="Random NPC, dungeon, and encounter generators"
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<i class="fa-duotone fa-light fa-gear shrink-0 text-base" aria-hidden="true"></i>
				Generators
			</button>
			<button
				onclick={() => {
					openMixer();
					showMobileMenu = false;
				}}
				title="Ambient audio and sound effect mixer"
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<i class="fa-duotone fa-light fa-sliders shrink-0 text-base" aria-hidden="true"></i>
				Mixer
			</button>
			{#if data.showVoiceCommands}
				<VoiceCommands mobile={true} />
			{/if}
		{/if}

		<button
			onclick={() => toggleMenuSection('campaign')}
			title="Expand or collapse this section"
			class="flex w-full items-center justify-between border-t border-gray-700 px-4 pt-2.5 pb-1 text-left text-[10px] font-bold tracking-wider text-gray-500 uppercase transition hover:text-gray-300"
		>
			Campaign
			<i
				class="fa-duotone fa-light fa-chevron-down shrink-0 text-xs transition-transform {collapsedMenuSections.campaign
					? '-rotate-90'
					: ''}"
				aria-hidden="true"
			></i>
		</button>
		{#if !collapsedMenuSections.campaign}
			<button
				onclick={() => {
					showSessionManager = true;
					showMobileMenu = false;
				}}
				title="Create, rename, or switch game sessions"
				class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<i class="fa-duotone fa-light fa-bars shrink-0 text-base" aria-hidden="true"></i>
				Sessions
			</button>
			<button
				onclick={() => {
					showEncounters = true;
					showMobileMenu = false;
				}}
				title="Build and save encounters"
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<i class="fa-duotone fa-light fa-clipboard shrink-0 text-base" aria-hidden="true"></i>
				Encounters
			</button>
			<a
				href="/history"
				onclick={() => (showMobileMenu = false)}
				title="View past combat history"
				class="flex items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<i class="fa-duotone fa-light fa-book-open shrink-0 text-base" aria-hidden="true"></i>
				Chronicle
			</a>
			<a
				href="/display/{activeSession.sessionId}"
				target="_blank"
				rel="noopener"
				onclick={() => (showMobileMenu = false)}
				title="Open the public player display in a new tab"
				class="flex items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<i class="fa-duotone fa-light fa-display shrink-0 text-base" aria-hidden="true"></i>
				Player Display
			</a>
		{/if}

		<button
			onclick={() => toggleMenuSection('account')}
			title="Expand or collapse this section"
			class="flex w-full items-center justify-between border-t border-gray-700 px-4 pt-2.5 pb-1 text-left text-[10px] font-bold tracking-wider text-gray-500 uppercase transition hover:text-gray-300"
		>
			Account
			<i
				class="fa-duotone fa-light fa-chevron-down shrink-0 text-xs transition-transform {collapsedMenuSections.account
					? '-rotate-90'
					: ''}"
				aria-hidden="true"
			></i>
		</button>
		{#if !collapsedMenuSections.account}
			{#if !data.isGuest}
				<button
					onclick={() => {
						openInbox();
						showMobileMenu = false;
					}}
					title="Messages from your players"
					class="relative flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition
				       {unreadCount > 0
						? 'text-amber-400 hover:bg-amber-900/30'
						: 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
				>
					<i class="fa-duotone fa-light fa-envelope shrink-0 text-base" aria-hidden="true"></i>
					Messages
					{#if unreadCount > 0}
						<span
							class="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black"
						>
							{unreadCount}
						</span>
					{/if}
				</button>
			{/if}
			<a
				id="guide-link"
				href="/guide"
				onclick={() => (showMobileMenu = false)}
				title="Open the user guide"
				class="flex items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<i class="fa-duotone fa-light fa-circle-question shrink-0 text-base" aria-hidden="true"></i>
				Guide
			</a>
			{#if data.isAdmin && !data.isImpersonating}
				<a
					href="/admin"
					onclick={() => (showMobileMenu = false)}
					title="Admin panel"
					class="flex items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
				>
					<i class="fa-duotone fa-light fa-circle-check shrink-0 text-base" aria-hidden="true"></i>
					Admin
				</a>
			{/if}
			<a
				href="mailto:dm@inittracker.com"
				onclick={() => (showMobileMenu = false)}
				title="Email support"
				class="flex items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<i class="fa-duotone fa-light fa-envelope shrink-0 text-base" aria-hidden="true"></i>
				Contact
			</a>
		{/if}

		<button
			onclick={() => toggleMenuSection('display')}
			title="Expand or collapse this section"
			class="flex w-full items-center justify-between border-t border-gray-700 px-4 pt-2.5 pb-1 text-left text-[10px] font-bold tracking-wider text-gray-500 uppercase transition hover:text-gray-300"
		>
			Display
			<i
				class="fa-duotone fa-light fa-chevron-down shrink-0 text-xs transition-transform {collapsedMenuSections.display
					? '-rotate-90'
					: ''}"
				aria-hidden="true"
			></i>
		</button>
		{#if !collapsedMenuSections.display}
			<button
				onclick={() => {
					toggleFullscreen();
					showMobileMenu = false;
				}}
				title="Toggle full screen mode"
				class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				{#if isFullscreen}
					<i class="fa-duotone fa-light fa-compress shrink-0 text-base" aria-hidden="true"></i>
					Exit Full Screen
				{:else}
					<i class="fa-duotone fa-light fa-expand shrink-0 text-base" aria-hidden="true"></i>
					Full Screen
				{/if}
			</button>
			<button
				onclick={() => {
					theme.toggle();
					showMobileMenu = false;
				}}
				title="Switch between light and dark theme"
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				{#if theme.isDark}
					<i class="fa-duotone fa-light fa-sun shrink-0 text-base" aria-hidden="true"></i>
					Light Mode
				{:else}
					<i class="fa-duotone fa-light fa-moon shrink-0 text-base" aria-hidden="true"></i>
					Dark Mode
				{/if}
			</button>
		{/if}
		<form method="POST" action="/logout" class="border-t border-gray-700">
			<button
				type="submit"
				title="Sign out of your DM account"
				class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-500 transition hover:bg-red-900/30 hover:text-red-400"
			>
				<i class="fa-duotone fa-light fa-right-from-bracket shrink-0 text-base" aria-hidden="true"
				></i>
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
				class="absolute inset-y-0 right-0 z-10 flex w-3 cursor-col-resize items-center justify-center transition-colors hover:bg-blue-500/30 active:bg-blue-500/50"
				onmousedown={startResizePlayer}
				ontouchstart={startResizePlayerTouch}
				role="separator"
				aria-label="Drag to resize panel"
				style="touch-action: none; -webkit-touch-callout: none; user-select: none"
				oncontextmenu={(e) => e.preventDefault()}
			>
				<div class="pointer-events-none flex flex-col gap-[3px]">
					<div class="h-[3px] w-[3px] rounded-full bg-gray-500"></div>
					<div class="h-[3px] w-[3px] rounded-full bg-gray-500"></div>
					<div class="h-[3px] w-[3px] rounded-full bg-gray-500"></div>
				</div>
			</div>
			<PlayerPanel {presences} />
		</aside>

		<!-- Center: Initiative tracker -->
		<main class="flex min-w-0 flex-1 flex-col p-4">
			<InitiativeTracker ruleset={activeSession.ruleset} />
		</main>

		<!-- Right sidebar: Enemies (desktop only, resizable) -->
		<aside
			class="relative hidden shrink-0 flex-col border-l border-gray-800 bg-gray-900/50 p-4 md:flex"
			style="width: {sidebarWidth}px"
		>
			<!-- Drag handle — left edge -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				class="absolute inset-y-0 left-0 z-10 flex w-3 cursor-col-resize items-center justify-center transition-colors hover:bg-blue-500/30 active:bg-blue-500/50"
				onmousedown={startResize}
				ontouchstart={startResizeTouch}
				role="separator"
				aria-label="Drag to resize panel"
				style="touch-action: none; -webkit-touch-callout: none; user-select: none"
				oncontextmenu={(e) => e.preventDefault()}
			>
				<div class="pointer-events-none flex flex-col gap-[3px]">
					<div class="h-[3px] w-[3px] rounded-full bg-gray-500"></div>
					<div class="h-[3px] w-[3px] rounded-full bg-gray-500"></div>
					<div class="h-[3px] w-[3px] rounded-full bg-gray-500"></div>
				</div>
			</div>
			<EnemyPanel ruleset={activeSession.ruleset} />
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
			<i class="fa-duotone fa-light fa-shield-halved" aria-hidden="true"></i>
			Party
		</button>
		<button
			onclick={() => (openPanel = openPanel === 'enemies' ? null : 'enemies')}
			class="flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold transition
			       {openPanel === 'enemies'
				? 'bg-red-600/20 text-red-300'
				: 'text-gray-400 hover:bg-gray-800 hover:text-white'}"
		>
			<i class="fa-duotone fa-light fa-skull" aria-hidden="true"></i>
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
				<i class="fa-duotone fa-light fa-xmark text-lg" aria-hidden="true"></i>
			</button>
		</div>
		<div class="min-h-0 flex-1 overflow-y-auto">
			{#if openPanel === 'players'}
				<PlayerPanel {presences} />
			{:else}
				<EnemyPanel ruleset={activeSession.ruleset} />
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

<!-- Floating emoji reactions from viewers -->
{#if floatingEmojis.length > 0}
	<div class="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
		{#each floatingEmojis as item (item.id)}
			<div
				class="floating-emoji absolute bottom-0"
				style="left:{item.x}%; animation-duration:{item.duration}s;"
				aria-hidden="true"
			>
				<span class="text-6xl drop-shadow-lg">{item.emoji}</span>
				<span class="mt-1 block text-center text-xs font-semibold text-white/70">{item.from}</span>
			</div>
		{/each}
	</div>
{/if}

<!-- DM Inbox modal -->
{#if showInbox}
	<DMInboxModal
		{messages}
		{playerNames}
		onclose={() => (showInbox = false)}
		onclear={clearMessages}
		onsend={sendDmReply}
	/>
{/if}

<GuidePopover />

{#if showNotes}
	<SessionNotesModal onclose={() => (showNotes = false)} sessionName={activeSession.name} />
{/if}

{#if showDiceRoller}
	<DiceRollerModal onclose={() => (showDiceRoller = false)} />
{/if}

{#if showEncounters}
	<EncounterBuilderModal onclose={() => (showEncounters = false)} ruleset={activeSession.ruleset} />
{/if}

{#if showSpells}
	{#if activeSession.ruleset === '2024'}
		<SpellsModal2024
			initialSpell={spellToOpen ?? undefined}
			onclose={() => {
				showSpells = false;
				spellToOpen = null;
			}}
		/>
	{:else}
		<SpellsModal
			initialSpell={spellToOpen ?? undefined}
			onclose={() => {
				showSpells = false;
				spellToOpen = null;
			}}
		/>
	{/if}
{/if}

<DiceOverlay />

<!-- Audio Mixer — mounted once (after first open) and hidden via CSS so audio keeps playing -->
{#if mixerMounted}
	<div class={showMixer ? '' : 'hidden'}>
		<AudioMixer onclose={() => (showMixer = false)} />
	</div>
{/if}

{#if showLiarsDice && LiarsDiceModalComp}
	{@const LiarsDice = LiarsDiceModalComp}
	<LiarsDice
		sessionId={activeSession.sessionId}
		dmName={data.dmFirstName || 'Dungeon Master'}
		onclose={() => (showLiarsDice = false)}
	/>
{/if}

{#if showQuickRules && QuickRulesModalComp}
	{@const QuickRules = QuickRulesModalComp}
	<QuickRules onclose={() => (showQuickRules = false)} ruleset={activeSession.ruleset} />
{/if}

{#if showGenerators && GeneratorsModalComp}
	{@const Generators = GeneratorsModalComp}
	<Generators
		onclose={() => (showGenerators = false)}
		onOpenDungeon={() => {
			showGenerators = false;
			openDonjon();
		}}
		onOpenTown={() => {
			showGenerators = false;
			openTown();
		}}
		onOpenInn={() => {
			showGenerators = false;
			openInn();
		}}
		onAddEncounter={(monsters: { name: string; count: number }[]) => {
			combat.clearEnemies();
			for (const m of monsters) {
				const template = ENEMY_TEMPLATES.find((t) => t.name.toLowerCase() === m.name.toLowerCase());
				if (template) {
					combat.addEnemies(template, m.count);
				} else {
					// Fallback: create a minimal template for monsters not in the bestiary
					combat.addEnemies(
						{ name: m.name, ac: 10, hp: 10, cr: '1', monsterType: 'unknown' },
						m.count
					);
				}
			}
			showGenerators = false;
		}}
	/>
{/if}

{#if DungeonGeneratorModalComp}
	{@const DungeonGenerator = DungeonGeneratorModalComp}
	<div style="display:{showDungeon ? 'block' : 'none'}">
		<DungeonGenerator
			onclose={() => (showDungeon = false)}
			onAddEncounter={(monsters: { name: string; count: number }[]) => {
				for (const m of monsters) {
					const template = ENEMY_TEMPLATES.find(
						(t) => t.name.toLowerCase() === m.name.toLowerCase()
					);
					if (template) {
						combat.addEnemies(template, m.count);
					} else {
						combat.addEnemies(
							{ name: m.name, ac: 10, hp: 10, cr: '1', monsterType: 'unknown' },
							m.count
						);
					}
				}
				showDungeon = false;
			}}
		/>
	</div>
{/if}

{#if DonjonModalComp}
	{@const DonjonModal = DonjonModalComp}
	<div style="display:{showDonjon ? 'block' : 'none'}">
		<DonjonModal onclose={() => (showDonjon = false)} />
	</div>
{/if}

{#if TownModalComp}
	{@const TownModal = TownModalComp}
	<div style="display:{showTown ? 'block' : 'none'}">
		<TownModal onclose={() => (showTown = false)} />
	</div>
{/if}

{#if InnModalComp}
	{@const InnModal = InnModalComp}
	<div style="display:{showInn ? 'block' : 'none'}">
		<InnModal onclose={() => (showInn = false)} />
	</div>
{/if}

{#if data.needsEditionSetup && !guestEditionPicked}
	<FirstRunEditionModal
		sessionId={activeSession.id}
		isGuest={data.isGuest}
		onpick={(ruleset) => {
			activeSession = { ...activeSession, ruleset };
			guestEditionPicked = true;
		}}
	/>
{/if}

<style>
	.floating-emoji {
		animation: float-up linear forwards;
		transform-origin: center bottom;
	}
	@keyframes float-up {
		0% {
			transform: translateY(0) translateX(0px) scale(0.4);
			opacity: 0;
		}
		8% {
			transform: translateY(-6vh) translateX(12px) scale(1.2);
			opacity: 1;
		}
		25% {
			transform: translateY(-25vh) translateX(-18px) scale(1);
			opacity: 1;
		}
		50% {
			transform: translateY(-50vh) translateX(22px) scale(1);
			opacity: 1;
		}
		70% {
			transform: translateY(-70vh) translateX(-14px) scale(1);
			opacity: 0.8;
		}
		88% {
			transform: translateY(-84vh) translateX(10px) scale(0.9);
			opacity: 0.3;
		}
		100% {
			transform: translateY(-95vh) translateX(0px) scale(0.7);
			opacity: 0;
		}
	}

	.bg-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(90px);
	}
	.orb-1 {
		width: min(65vw, 700px);
		height: min(65vw, 700px);
		background: rgba(88, 28, 135, 0.45);
		top: -15%;
		left: -12%;
		animation: orb-drift-1 24s ease-in-out infinite;
	}
	.orb-2 {
		width: min(55vw, 620px);
		height: min(55vw, 620px);
		background: rgba(30, 58, 138, 0.45);
		bottom: -18%;
		right: -10%;
		animation: orb-drift-2 30s ease-in-out infinite;
	}
	.orb-3 {
		width: min(45vw, 520px);
		height: min(45vw, 520px);
		background: rgba(120, 53, 15, 0.35);
		top: 35%;
		left: 42%;
		transform: translate(-50%, -50%);
		animation: orb-drift-3 20s ease-in-out infinite;
	}
	.orb-4 {
		width: min(38vw, 440px);
		height: min(38vw, 440px);
		background: rgba(49, 46, 129, 0.4);
		top: 15%;
		right: 18%;
		animation: orb-drift-4 26s ease-in-out infinite;
	}
	@keyframes orb-drift-1 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		25% {
			transform: translate(8vw, 6vh) scale(1.06);
		}
		55% {
			transform: translate(3vw, 12vh) scale(0.94);
		}
		75% {
			transform: translate(-3vw, 7vh) scale(1.03);
		}
	}
	@keyframes orb-drift-2 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		30% {
			transform: translate(-7vw, -9vh) scale(1.08);
		}
		65% {
			transform: translate(-2vw, -4vh) scale(0.92);
		}
	}
	@keyframes orb-drift-3 {
		0%,
		100% {
			transform: translate(-50%, -50%) scale(1);
		}
		40% {
			transform: translate(calc(-50% + 7vw), calc(-50% - 9vh)) scale(1.1);
		}
		70% {
			transform: translate(calc(-50% - 5vw), calc(-50% + 5vh)) scale(0.9);
		}
	}
	@keyframes orb-drift-4 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		35% {
			transform: translate(6vw, 9vh) scale(0.94);
		}
		68% {
			transform: translate(-5vw, 4vh) scale(1.06);
		}
	}
</style>
