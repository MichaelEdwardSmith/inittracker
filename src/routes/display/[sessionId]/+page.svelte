<!-- Public player viewer at /display/[sessionId]. Subscribes to the DM's combat state
     via SSE, renders the initiative order with HP bars and conditions (ADV_CONDITIONS hidden),
     and provides a form for players to send messages to the DM. No auth required. -->
<script lang="ts">
	import { conditionColors, sortCombatants, hpPercent, hpBarColor } from '$lib/utils';
	import { getMonsterEmoji, getMonsterStyle } from '$lib/monsterAvatars';
	import { getMonsterDetail } from '$lib/enemies';
	import type { StorageState, Combatant } from '$lib/types';
	import ConditionInfoModal from '$lib/components/ConditionInfoModal.svelte';
	import MessageDMModal from '$lib/components/MessageDMModal.svelte';
	import InitiativeRollerModal from '$lib/components/InitiativeRollerModal.svelte';
	import PlayerNotesModal from '$lib/components/PlayerNotesModal.svelte';
	import PlayerInboxModal from '$lib/components/PlayerInboxModal.svelte';
	import type { DmReply } from '$lib/components/PlayerInboxModal.svelte';
	import EmojiPickerModal from '$lib/components/EmojiPickerModal.svelte';
	import DiceRollerModal from '$lib/components/DiceRollerModal.svelte';
	import DiceOverlay from '$lib/components/DiceOverlay.svelte';
	import { fly, fade } from 'svelte/transition';

	let { data } = $props();

	let combatState: StorageState = $state({ combatants: [], currentTurnId: null, round: 1 });
	let connected = $state(false);
	let conditionInfo = $state<string | null>(null);
	let ruleset = $state<'2014' | '2024'>('2014');

	$effect(() => {
		fetch(`/api/session-ruleset?session=${data.sessionId}`)
			.then((r) => (r.ok ? r.json() : null))
			.then((d) => {
				if (d?.ruleset === '2024') ruleset = '2024';
			})
			.catch(() => {});
	});

	// ── Logged-in player identity ────────────────────────────────────────
	let myPlayerName = $state<string | null>(null);
	let myCharacterId = $state<string | null>(null);
	let showCharPicker = $state(false);

	$effect(() => {
		const saved = localStorage.getItem(`player_char_${data.sessionId}`);
		if (saved) myCharacterId = saved;
		fetch('/api/player-me')
			.then((r) => (r.ok ? r.json() : null))
			.then((p) => {
				if (p?.name) {
					myPlayerName = p.name;
					// Re-announce presence on every page load so the server's in-memory
					// map is populated even after a server restart or fresh page visit.
					if (saved) {
						fetch('/api/player-presence', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ sessionId: data.sessionId, characterId: saved })
						}).catch(() => {});
					}
				}
			})
			.catch(() => {});
	});

	function selectCharacter(id: string) {
		myCharacterId = id;
		localStorage.setItem(`player_char_${data.sessionId}`, id);
		showCharPicker = false;
		fetch('/api/player-presence', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sessionId: data.sessionId, characterId: id })
		}).catch(() => {});
	}

	// ── Player → DM messaging ───────────────────────────────────────────
	let showMsgModal = $state(false);
	let showNotesModal = $state(false);
	let showEmojiPicker = $state(false);
	let showDiceRoller = $state(false);

	// ── DM → Player inbox ────────────────────────────────────────────────
	let dmMessages = $state<DmReply[]>([]);
	let dmUnread = $state(0);
	let showDmInbox = $state(false);
	let dmNotif = $state<{ text: string; to: string } | null>(null);
	let dmNotifTimer: ReturnType<typeof setTimeout> | null = null;

	function showDmNotifBanner(text: string, to: string) {
		if (dmNotifTimer) clearTimeout(dmNotifTimer);
		dmNotif = { text, to };
		dmNotifTimer = setTimeout(() => {
			dmNotif = null;
		}, 5000);
	}

	// ── Initiative rolling ────────────────────────────
	let showInitModal = $state(false);
	let showMobileMenu = $state(false);

	// ── Flash overlay ──────────────────────────────────────────────────
	let flashColor = $state<string | null>(null);
	let flashKey = $state(0);
	let flashTimer: ReturnType<typeof setTimeout> | null = null;

	// ── Focus animation — temporarily pan to the affected combatant ────
	let focusCombatantId = $state<string | null>(null);
	let focusTimer: ReturnType<typeof setTimeout> | null = null;

	// CSS colors for each condition flash (brighter than the badge bg so they read on a dark screen)
	const conditionFlashColors: Record<string, string> = {
		Blinded: 'rgba(107, 114, 128, 1)', // gray-500
		Charmed: 'rgba(219,  39, 119, 1)', // pink-600
		Concentrating: 'rgba(  8, 145, 178, 1)', // cyan-600
		Deafened: 'rgba(202, 138,   4, 1)', // yellow-600
		Dead: 'rgba( 75,  85,  99, 1)', // gray-600
		Exhausted: 'rgba(194,  65,  12, 1)', // orange-700
		Frightened: 'rgba(147,  51, 234, 1)', // purple-600
		Grappled: 'rgba(234,  88,  12, 1)', // orange-600
		Incapacitated: 'rgba(220,  38,  38, 1)', // red-600
		Invisible: 'rgba( 37,  99, 235, 1)', // blue-600
		Paralyzed: 'rgba(185,  28,  28, 1)', // red-700
		Petrified: 'rgba(120, 113, 108, 1)', // stone-500
		Poisoned: 'rgba( 22, 163,  74, 1)', // green-500
		Prone: 'rgba(161,  98,   7, 1)', // yellow-700
		Restrained: 'rgba(217, 119,   6, 1)', // amber-600
		Stunned: 'rgba(234, 179,   8, 1)', // yellow-500
		Unconscious: 'rgba( 75,  85,  99, 1)', // gray-600
		'Advantage For': 'rgba( 16, 185, 129, 1)', // emerald-500
		'Advantage Against': 'rgba(225,  29,  72, 1)', // rose-600
		'Disadvantage For': 'rgba(234,  88,  12, 1)', // orange-600
		'Disadvantage Against': 'rgba( 20, 184, 166, 1)' // teal-500
	};

	// ── Audio ──────────────────────────────────────────────────────────
	let joined = $state(false);
	let audioEnabled = $state(true);

	const sounds: Record<string, HTMLAudioElement> = {};

	// ── Mixer track storage (plain Map — managed imperatively) ─────────
	const viewerTracks = new Map<
		string,
		{ name: string; blobUrl: string; audio: HTMLAudioElement }
	>();

	async function downloadTrack(id: string, name: string) {
		try {
			const res = await fetch(`/api/mixer/track?session=${data.sessionId}&id=${id}`);
			if (!res.ok) return;
			const blob = await res.blob();
			const existing = viewerTracks.get(id);
			if (existing) {
				existing.audio.pause();
				URL.revokeObjectURL(existing.blobUrl);
			}
			const blobUrl = URL.createObjectURL(blob);
			const audio = new Audio(blobUrl);
			audio.loop = true;
			viewerTracks.set(id, { name, blobUrl, audio });
		} catch {
			/* ignore */
		}
	}

	function revokeTrack(id: string) {
		const t = viewerTracks.get(id);
		if (!t) return;
		t.audio.pause();
		URL.revokeObjectURL(t.blobUrl);
		viewerTracks.delete(id);
	}

	function applyMixerState(state: {
		masterVolume: number;
		channels: Array<{
			id: string;
			playing: boolean;
			volume: number;
			muted: boolean;
			solo: boolean;
		}>;
	}) {
		const anySolo = state.channels.some((c) => c.solo);
		for (const ch of state.channels) {
			const t = viewerTracks.get(ch.id);
			if (!t) continue;
			const shouldPlay = ch.playing;
			const effVol = ch.muted ? 0 : anySolo && !ch.solo ? 0 : state.masterVolume * ch.volume;
			t.audio.volume = Math.max(0, Math.min(1, effVol));
			if (shouldPlay && t.audio.paused) t.audio.play().catch(() => {});
			else if (!shouldPlay && !t.audio.paused) t.audio.pause();
		}
	}

	const JOINED_KEY = $derived(`viewer-joined-${data.sessionId}`);

	function joinSession() {
		for (const name of [
			'damage',
			'heal',
			'condition',
			'battlestart',
			'fanfare',
			'sword',
			'temphp'
		]) {
			const a = new Audio(`/audio/${name}.mp3`);
			a.preload = 'auto';
			sounds[name] = a;
		}
		joined = true;
		sessionStorage.setItem(JOINED_KEY, '1');
		// Download any tracks already uploaded before this viewer joined
		fetch(`/api/mixer/tracks?session=${data.sessionId}`)
			.then((r) => (r.ok ? r.json() : []))
			.then(async (tracks: Array<{ id: string; name: string }>) => {
				for (const t of tracks) await downloadTrack(t.id, t.name);
			})
			.catch(() => {});
	}

	// Auto-join if the user already dismissed the gate in this browser session
	$effect(() => {
		if (!joined && sessionStorage.getItem(JOINED_KEY)) {
			joinSession();
		}
	});

	function toggleAudio() {
		audioEnabled = !audioEnabled;
	}

	function playSound(name: string) {
		if (!audioEnabled) return;
		const src = sounds[name];
		if (!src) return;
		(src.cloneNode(true) as HTMLAudioElement).play().catch(() => {});
	}

	function triggerEffect(
		soundType: 'damage' | 'heal' | 'condition',
		color: string,
		affectedId?: string
	) {
		const willPan = !!(affectedId && current && affectedId !== current.id);

		// Pan to the affected combatant first; flash + sound fire after the fly-in completes
		if (willPan) {
			if (focusTimer) clearTimeout(focusTimer);
			focusCombatantId = affectedId!;
			focusTimer = setTimeout(() => {
				focusCombatantId = null;
			}, 2200);
		}

		// Delay flash and sound until the fly-in transition finishes (500 ms), or fire immediately
		setTimeout(
			() => {
				if (flashTimer) clearTimeout(flashTimer);
				flashColor = color;
				flashKey++;
				flashTimer = setTimeout(() => {
					flashColor = null;
				}, 750);
				if (soundType === 'damage') playSound('damage');
				else if (soundType === 'heal') playSound('heal');
				else playSound('condition');
			},
			willPan ? 500 : 0
		);
	}

	// Prevents fanfares from firing when the viewer first loads into an already-active combat
	let firstMessageReceived = false;

	$effect(() => {
		const source = new EventSource(`/api/state?session=${data.sessionId}`);

		source.onopen = () => {
			connected = true;
		};

		source.onmessage = (e) => {
			try {
				const newState = JSON.parse(e.data) as StorageState;

				if (firstMessageReceived) {
					// Combat begins (null → active)
					if (combatState.currentTurnId === null && newState.currentTurnId !== null) {
						playSound('battlestart');
					}
					// Combat ends (active → null)
					if (combatState.currentTurnId !== null && newState.currentTurnId === null) {
						playSound('fanfare');
					}
					// Turn advances (one combatant → another)
					if (
						combatState.currentTurnId !== null &&
						newState.currentTurnId !== null &&
						combatState.currentTurnId !== newState.currentTurnId
					) {
						playSound('sword');
					}
				}
				firstMessageReceived = true;

				// Detect changes — skip on the very first message (empty initial state)
				if (combatState.combatants.length > 0) {
					if (newState.aoeEvents && newState.aoeEvents.length > 0) {
						// AoE action — animate each affected combatant in sequence
						const INTERVAL = 1200;
						const isDamage = newState.aoeEvents.some((ev) => ev.delta < 0);
						const color = isDamage ? 'rgba(239, 68, 68, 1)' : 'rgba(34, 197, 94, 1)';
						const soundType = isDamage ? 'damage' : 'heal';
						newState.aoeEvents.forEach((ev, i) => {
							setTimeout(() => {
								triggerEffect(soundType, color, ev.id);
							}, i * INTERVAL);
						});
					} else {
						// Normal single-target detection
						let hadDamage = false;
						let hadHeal = false;
						let hadTempHp = false;
						let affectedId: string | null = null;
						let addedCondition: string | null = null;
						let conditionTargetId: string | null = null;
						for (const nc of newState.combatants) {
							const oc = combatState.combatants.find((c) => c.id === nc.id);
							if (!oc) continue;
							const oldEff = oc.currentHp + (oc.tempHp ?? 0);
							const newEff = nc.currentHp + (nc.tempHp ?? 0);
							if (newEff < oldEff) {
								if (!hadDamage) affectedId = nc.id;
								hadDamage = true;
							} else if (nc.currentHp > oc.currentHp) {
								if (!hadHeal) affectedId = nc.id;
								hadHeal = true;
							}
							if ((nc.tempHp ?? 0) > (oc.tempHp ?? 0)) hadTempHp = true;
							if (!addedCondition) {
								addedCondition = nc.statuses.find((s) => !oc.statuses.includes(s)) ?? null;
								if (addedCondition) conditionTargetId = nc.id;
							}
						}
						if (hadDamage) triggerEffect('damage', 'rgba(239, 68, 68, 1)', affectedId ?? undefined);
						else if (hadHeal)
							triggerEffect('heal', 'rgba(34, 197, 94, 1)', affectedId ?? undefined);
						else if (hadTempHp) {
							playSound('temphp');
						} else if (addedCondition) {
							const color = conditionFlashColors[addedCondition] ?? 'rgba(168, 85, 247, 1)';
							triggerEffect('condition', color, conditionTargetId ?? undefined);
						}
					}
				}

				combatState = newState;
			} catch {
				// Malformed message — ignore.
			}
		};

		source.onerror = () => {
			connected = false;
			// EventSource automatically retries — no manual reconnect needed.
		};

		source.addEventListener('track', (e) => {
			const { id, name } = JSON.parse((e as MessageEvent).data);
			downloadTrack(id, name);
		});
		source.addEventListener('trackRemoved', (e) => {
			const { id } = JSON.parse((e as MessageEvent).data);
			revokeTrack(id);
		});
		source.addEventListener('mixer', (e) => {
			applyMixerState(JSON.parse((e as MessageEvent).data));
		});

		source.addEventListener('dmMessage', (e) => {
			const msg = JSON.parse((e as MessageEvent).data) as DmReply;
			const isForMe = msg.to === 'all' || msg.to === myCharacter?.name || msg.to === myPlayerName;
			if (isForMe) {
				dmMessages = [...dmMessages, msg];
				dmUnread++;
				showDmNotifBanner(msg.text, msg.to);
				if ('vibrate' in navigator) navigator.vibrate(60);
			}
		});

		return () => source.close();
	});

	let isFullscreen = $state(false);

	$effect(() => {
		function onFsChange() {
			isFullscreen = !!document.fullscreenElement;
		}
		document.addEventListener('fullscreenchange', onFsChange);
		return () => document.removeEventListener('fullscreenchange', onFsChange);
	});

	function toggleFullscreen() {
		if (!document.fullscreenElement) document.documentElement.requestFullscreen();
		else document.exitFullscreen();
	}

	// Clock + battery
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

	const sorted = $derived(sortCombatants(combatState.combatants));
	const players = $derived(sorted.filter((c) => c.type === 'player'));
	const myCharacter = $derived(players.find((p) => p.id === myCharacterId) ?? null);

	// Show character picker once joined, logged in, players exist, and no valid selection yet
	$effect(() => {
		if (!joined || !myPlayerName || players.length === 0) return;
		const valid = myCharacterId && players.some((p) => p.id === myCharacterId);
		if (!valid) showCharPicker = true;
	});

	const currentIndex = $derived(sorted.findIndex((c) => c.id === combatState.currentTurnId));
	const current = $derived<Combatant | null>(currentIndex >= 0 ? sorted[currentIndex] : null);

	const upNext = $derived.by<Combatant[]>(() => {
		if (currentIndex < 0 || sorted.length <= 1) return [];
		const count = Math.min(4, sorted.length - 1);
		return Array.from(
			{ length: count },
			(_, i) => sorted[(currentIndex + i + 1) % sorted.length]
		).filter((c) => !(c.type === 'enemy' && c.currentHp <= 0));
	});

	const wrapIndex = $derived.by<number | null>(() => {
		if (currentIndex < 0 || sorted.length <= 1) return null;
		const count = Math.min(4, sorted.length - 1);
		const idx = sorted.length - currentIndex - 1;
		return idx < count ? idx : null;
	});

	// ── Turn notifications ─────────────────────────────────────────────
	let turnNotif = $state<'yours' | 'upnext' | null>(null);
	let turnNotifTimer: ReturnType<typeof setTimeout> | null = null;
	let _prevTurnId: string | null | undefined = undefined;

	function showTurnNotif(type: 'yours' | 'upnext') {
		if (turnNotifTimer) clearTimeout(turnNotifTimer);
		turnNotif = type;
		turnNotifTimer = setTimeout(() => {
			turnNotif = null;
		}, 4000);
		if (type === 'yours' && 'vibrate' in navigator) navigator.vibrate([80, 40, 80]);
	}

	$effect(() => {
		const newTurnId = combatState.currentTurnId;
		if (_prevTurnId === undefined) {
			_prevTurnId = newTurnId;
			return;
		}
		if (_prevTurnId !== newTurnId && newTurnId !== null && myCharacterId && myPlayerName) {
			if (newTurnId === myCharacterId) {
				showTurnNotif('yours');
			} else {
				const idx = sorted.findIndex((c) => c.id === newTurnId);
				if (idx >= 0) {
					const next = sorted[(idx + 1) % sorted.length];
					if (next?.id === myCharacterId) showTurnNotif('upnext');
				}
			}
		}
		_prevTurnId = newTurnId;
	});

	/** The combatant shown in the main display — temporarily overridden when a hit/heal is detected. */
	const displayCombatant = $derived.by<Combatant | null>(() => {
		if (focusCombatantId) {
			return combatState.combatants.find((c) => c.id === focusCombatantId) ?? current;
		}
		return current;
	});

	const backgroundGlow = $derived.by(() => {
		const c = displayCombatant ?? current;
		if (!c) return '';
		return c.type === 'player'
			? 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(37,99,235,0.12) 0%, transparent 70%)'
			: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(185,28,28,0.14) 0%, transparent 70%)';
	});

	const typeAccent = $derived.by(() => {
		const c = displayCombatant ?? current;
		if (!c) return { badge: 'text-gray-400 border-gray-600', label: '' };
		return c.type === 'player'
			? { badge: 'text-blue-300 border-blue-600 bg-blue-950/60', label: 'PLAYER CHARACTER' }
			: c.type === 'lair'
				? { badge: 'text-purple-300 border-purple-600 bg-purple-950/60', label: 'LAIR' }
				: { badge: 'text-red-300 border-red-700 bg-red-950/60', label: 'ENEMY' };
	});
</script>

<svelte:head>
	<title>Initiative Display</title>
</svelte:head>

<div class="flex h-screen flex-col overflow-hidden bg-gray-950 font-sans text-white">
	<!-- Drifting atmospheric orbs -->
	<div aria-hidden="true" class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
		<div class="bg-orb orb-1"></div>
		<div class="bg-orb orb-2"></div>
		<div class="bg-orb orb-3"></div>
		<div class="bg-orb orb-4"></div>
	</div>

	<!-- Join Session gate — satisfies browser autoplay policy -->
	{#if !joined}
		<div
			class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/95 backdrop-blur-sm"
		>
			<div class="flex flex-col items-center gap-8 px-8 text-center">
				<div class="text-7xl opacity-60">⚔️</div>
				<div>
					<p class="text-3xl font-black tracking-[0.25em] text-amber-400 uppercase">
						Battle Awaits
					</p>
					<p class="mt-3 text-sm tracking-widest text-gray-500 uppercase">
						Tap to join this session with live audio
					</p>
				</div>
				<button
					onclick={joinSession}
					class="rounded-lg border border-amber-600/60 bg-amber-950/60 px-10 py-4 text-base font-bold tracking-widest text-amber-300 uppercase transition hover:border-amber-500 hover:bg-amber-900/60 hover:text-amber-200 active:scale-95"
				>
					Join Session
				</button>
				<button
					onclick={() => {
						joined = true;
						audioEnabled = false;
						sessionStorage.setItem(JOINED_KEY, '1');
					}}
					class="text-xs tracking-widest text-gray-700 uppercase underline-offset-2 hover:text-gray-500 hover:underline"
				>
					Continue without sound
				</button>
			</div>
		</div>
	{/if}

	<!-- Character picker — shown to logged-in players who haven't selected their character yet -->
	{#if showCharPicker && joined}
		<div class="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-sm">
			<div
				class="w-full max-w-md rounded-t-2xl border-t border-gray-700 bg-gray-900 px-5 pt-5 pb-10 shadow-2xl"
			>
				<div class="mx-auto mb-1 h-1 w-10 rounded-full bg-gray-700"></div>
				<div class="mt-4 mb-5 text-center">
					<p class="text-lg font-black tracking-wide text-white">Who are you?</p>
					<p class="mt-1 text-xs text-gray-500">
						Select your character to pre-fill initiative rolls and messages.
					</p>
				</div>
				<div class="space-y-2">
					{#each players as player}
						<button
							onclick={() => selectCharacter(player.id)}
							class="hover:bg-gray-750 flex w-full items-center gap-4 rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-left transition hover:border-blue-500/60 active:scale-[0.98]"
						>
							{#if player.avatarUrl}
								<img
									src={player.avatarUrl}
									alt={player.name}
									class="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-gray-600"
								/>
							{:else}
								<div
									class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-900 text-base font-bold text-blue-300"
								>
									{player.name[0].toUpperCase()}
								</div>
							{/if}
							<span class="text-base font-semibold text-white">{player.name}</span>
						</button>
					{/each}
				</div>
				<button
					onclick={() => (showCharPicker = false)}
					class="mt-5 w-full text-center text-xs text-gray-600 transition hover:text-gray-400"
				>
					Skip for now
				</button>
			</div>
		</div>
	{/if}

	<!-- Full-screen flash overlay -->
	{#key flashKey}
		{#if flashColor}
			<div
				class="flash-overlay pointer-events-none fixed inset-0 z-50"
				style="background: {flashColor};"
			></div>
		{/if}
	{/key}

	<!-- Atmospheric background glow -->
	{#if current}
		<div
			class="pointer-events-none absolute inset-0 z-0 transition-all duration-700"
			style="background: {backgroundGlow};"
		></div>
	{/if}

	<!-- DM message notification -->
	{#if dmNotif}
		<div
			transition:fade={{ duration: 300 }}
			class="pointer-events-none fixed inset-0 z-[275] flex items-end justify-center px-6 pb-24"
		>
			{#key dmNotif}
				<button
					transition:fly={{ y: 30, duration: 350 }}
					onclick={() => {
						dmNotif = null;
						showDmInbox = true;
					}}
					class="pointer-events-auto flex w-full max-w-sm flex-col gap-1.5 rounded-2xl border border-purple-500/50 bg-gray-950/95 px-5 py-4 text-left shadow-2xl shadow-purple-900/30 backdrop-blur-md"
				>
					<div class="flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 shrink-0 text-purple-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
						<span class="text-xs font-bold tracking-widest text-purple-400 uppercase"
							>Message from DM</span
						>
						<span class="ml-auto text-xs text-gray-600">tap to view</span>
					</div>
					<p class="line-clamp-2 text-sm leading-relaxed text-gray-200">{dmNotif.text}</p>
				</button>
			{/key}
		</div>
	{/if}

	<!-- Turn notifications -->
	{#if turnNotif}
		<div
			transition:fade={{ duration: 300 }}
			class="pointer-events-none fixed inset-0 z-[280] flex items-start justify-center px-6 pt-20"
		>
			{#key turnNotif}
				<button
					transition:fly={{ y: -30, duration: 350 }}
					onclick={() => {
						turnNotif = null;
					}}
					class="pointer-events-auto flex flex-col items-center gap-2 rounded-2xl border px-10 py-7 text-center shadow-2xl backdrop-blur-md
						{turnNotif === 'yours'
						? 'border-amber-500/60 bg-gray-950/90 shadow-amber-500/20'
						: 'border-blue-500/60 bg-gray-950/90 shadow-blue-500/20'}"
				>
					{#if turnNotif === 'yours'}
						<div class="animate-bounce text-5xl">⚔️</div>
						<p class="text-2xl font-black tracking-widest text-amber-400 uppercase">
							It's Your Turn!
						</p>
						{#if myCharacter}
							<p class="text-sm font-semibold text-amber-300/70">{myCharacter.name}</p>
						{/if}
					{:else}
						<div class="text-5xl">🎲</div>
						<p class="text-2xl font-black tracking-widest text-blue-400 uppercase">
							You're Up Next!
						</p>
						{#if myCharacter}
							<p class="text-sm font-semibold text-blue-300/70">Get ready, {myCharacter.name}!</p>
						{/if}
					{/if}
					<p class="mt-1 text-xs text-gray-600">tap to dismiss</p>
				</button>
			{/key}
		</div>
	{/if}

	<!-- Header bar -->
	<header
		class="relative z-10 flex shrink-0 items-center justify-between border-b border-gray-800/60 bg-gray-900/80 px-4 py-3 backdrop-blur-sm sm:px-8"
	>
		<div class="flex items-center gap-3">
			<span class="text-lg">⚔️</span>
			<span class="text-sm font-bold tracking-[0.3em] text-amber-400 uppercase"
				>Initiative Tracker</span
			>
			<span
				class="flex items-center gap-1.5 text-xs {connected ? 'text-green-500' : 'text-gray-600'}"
			>
				<span
					class="inline-block h-1.5 w-1.5 rounded-full {connected ? 'bg-green-500' : 'bg-gray-600'}"
				></span>
				{connected ? 'Live' : 'Connecting…'}
			</span>
		</div>
		<div class="flex items-center gap-2 sm:gap-3">
			{#if combatState.currentTurnId}
				<div class="flex items-center gap-2">
					<span class="text-xs tracking-widest text-gray-500 uppercase">Round</span>
					<span class="text-2xl font-black text-amber-400">{combatState.round}</span>
				</div>
			{/if}
			<!-- Time + battery -->
			{#if currentTime}
				<div class="flex items-center gap-1.5 text-xs text-gray-500">
					<span class="font-mono tabular-nums">{currentTime}</span>
					{#if isTouchDevice && batteryLevel !== null}
						<span
							class="flex items-center gap-0.5 {batteryLevel <= 20
								? 'text-red-400'
								: batteryCharging
									? 'text-green-400'
									: ''}"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-3.5 w-3.5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
							>
								<rect x="2" y="7" width="17" height="10" rx="1.5" />
								<path d="M19 10v4" stroke-width="2.5" stroke-linecap="round" />
								<rect
									x="3.5"
									y="8.5"
									width={Math.round((batteryLevel / 100) * 14)}
									height="7"
									rx="0.75"
									fill="currentColor"
									stroke="none"
								/>
							</svg>
							<span>{batteryLevel}%</span>
						</span>
					{/if}
				</div>
			{/if}
			<!-- Hamburger (with unread DM message badge) -->
			<div class="relative">
				<button
					onclick={() => (showMobileMenu = !showMobileMenu)}
					title="Menu"
					class="flex items-center justify-center rounded border border-gray-800 bg-gray-900/60 p-1.5 text-gray-500 transition hover:border-gray-600 hover:text-gray-300"
				>
					{#if showMobileMenu}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					{/if}
				</button>
				{#if dmUnread > 0}
					<span
						class="pointer-events-none absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-bold text-white"
						>{dmUnread}</span
					>
				{/if}
			</div>
		</div>
	</header>
	<!-- Viewer nav dropdown â€" styled to match DM hamburger -->
	{#if showMobileMenu}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="fixed inset-0 z-[190]" onclick={() => (showMobileMenu = false)}></div>
	{/if}
	<div
		class="fixed top-14 right-2 z-[200] w-52 overflow-hidden rounded-xl border border-gray-700 bg-gray-800 shadow-2xl {showMobileMenu
			? ''
			: 'hidden'}"
	>
		{#if joined}
			<button
				onclick={toggleAudio}
				class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition {audioEnabled
					? 'text-amber-400 hover:bg-amber-900/30'
					: 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
			>
				{#if audioEnabled}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 shrink-0"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M15.536 8.464a5 5 0 010 7.072"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M18.364 5.636a9 9 0 010 12.728"
						/>
					</svg>
					Sound On
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 shrink-0"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M23 9l-6 6M17 9l6 6" />
					</svg>
					Sound Off
				{/if}
			</button>
		{/if}
		<button
			onclick={() => {
				showEmojiPicker = true;
				showMobileMenu = false;
			}}
			class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
		>
			<span class="text-base leading-none">😄</span>
			React to DM
		</button>
		<button
			onclick={() => {
				showDiceRoller = true;
				showMobileMenu = false;
			}}
			class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4 shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<rect x="2" y="2" width="20" height="20" rx="3" ry="3" />
				<circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none" />
				<circle cx="17" cy="7" r="1.2" fill="currentColor" stroke="none" />
				<circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
				<circle cx="7" cy="17" r="1.2" fill="currentColor" stroke="none" />
				<circle cx="17" cy="17" r="1.2" fill="currentColor" stroke="none" />
			</svg>
			Dice Roller
		</button>
		{#if myPlayerName && players.length > 0}
			<button
				onclick={() => {
					showCharPicker = true;
					showMobileMenu = false;
				}}
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				{#if myCharacter?.avatarUrl}
					<img
						src={myCharacter.avatarUrl}
						alt={myCharacter.name}
						class="h-4 w-4 shrink-0 rounded-full object-cover"
					/>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 shrink-0"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
						/>
					</svg>
				{/if}
				{myCharacter ? myCharacter.name : 'Choose Character'}
			</button>
		{/if}
		{#if players.length > 0}
			<button
				onclick={() => {
					showMsgModal = true;
					showMobileMenu = false;
				}}
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 shrink-0"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
					/>
				</svg>
				Message DM
			</button>
			<button
				onclick={() => {
					showInitModal = true;
					showMobileMenu = false;
				}}
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 shrink-0"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
					/>
				</svg>
				Roll Initiative
			</button>
		{/if}
		{#if myPlayerName}
			<button
				onclick={() => {
					showNotesModal = true;
					showMobileMenu = false;
				}}
				class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 shrink-0"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
					/>
				</svg>
				My Notes
			</button>
		{/if}
		<button
			onclick={() => {
				showDmInbox = true;
				dmUnread = 0;
				showMobileMenu = false;
			}}
			class="relative flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm transition
				{dmUnread > 0
				? 'text-purple-400 hover:bg-purple-900/30'
				: 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4 shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
				/>
			</svg>
			DM Messages
			{#if dmUnread > 0}
				<span
					class="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-black text-black"
				>
					{dmUnread}
				</span>
			{/if}
		</button>
		<a
			href="mailto:dm@inittracker.com"
			onclick={() => (showMobileMenu = false)}
			class="flex items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4 shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
				/>
			</svg>
			Contact
		</a>
		<a
			href="/player-guide?back=/display/{data.sessionId}"
			onclick={() => (showMobileMenu = false)}
			class="flex items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4 shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			Player Guide
		</a>
		<button
			onclick={() => {
				toggleFullscreen();
				showMobileMenu = false;
			}}
			class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
		>
			{#if isFullscreen}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 shrink-0"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"
					/>
				</svg>
				Exit Full Screen
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 shrink-0"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
					/>
				</svg>
				Full Screen
			{/if}
		</button>
		{#if myPlayerName}
			<a
				href="/player/logout"
				class="flex items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-sm text-red-400 transition hover:bg-red-900/30 hover:text-red-300"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 shrink-0"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
					/>
				</svg>
				Sign Out
			</a>
		{/if}
	</div>

	{#if !current}
		<!-- Waiting for combat -->
		<div class="relative z-10 flex flex-1 flex-col items-center justify-center gap-6">
			<div class="text-6xl opacity-20">⚔️</div>
			<div class="text-center">
				<p class="text-4xl font-black tracking-[0.2em] text-gray-700 uppercase">Awaiting Combat</p>
				<p class="mt-3 text-sm tracking-widest text-gray-600 uppercase">
					The Dungeon Master will begin shortly…
				</p>
			</div>
		</div>
	{:else}
		{@const dc = displayCombatant ?? current}
		<!-- Active combatant display -->
		<div class="relative z-10 flex flex-1 overflow-hidden">
			{#key dc.id}
				{@const pct = hpPercent(dc)}
				{@const isBloodied = dc.type === 'enemy' && pct > 0 && pct <= 50}
				{@const showAc = dc.type === 'player'}
				{@const isUnconsciousPlayer = dc.type === 'player' && dc.currentHp <= 0}
				<main
					in:fly={{ y: 28, duration: 500 }}
					out:fly={{ y: -20, duration: 250 }}
					class="absolute inset-0 flex flex-col items-center justify-center px-12 pb-4"
				>
					<!-- Type label -->
					<div class="mb-5 flex items-center gap-3">
						<div class="h-px w-16 bg-gradient-to-r from-transparent to-gray-600"></div>
						<span
							class="rounded-full border px-4 py-1 text-xs font-black tracking-[0.25em] uppercase {typeAccent.badge}"
						>
							{typeAccent.label}
						</span>
						<div class="h-px w-16 bg-gradient-to-l from-transparent to-gray-600"></div>
					</div>

					<!-- Avatar token -->
					{#if dc.type === 'enemy'}
						{@const style = getMonsterStyle(dc.monsterType)}
						{@const imgUrl = dc.imgUrl ?? getMonsterDetail(dc.templateName ?? '')?.imgUrl}
						{#if imgUrl}
							<a
								href={imgUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="mb-6 h-44 w-44 cursor-pointer overflow-hidden rounded-full ring-4 ring-offset-4 ring-offset-gray-950 {isBloodied
									? 'bloodied-avatar ring-red-600'
									: style.ring}"
								style={isBloodied ? '' : 'box-shadow: 0 0 48px -8px var(--tw-ring-color);'}
							>
								<img src={imgUrl} alt={dc.name} class="h-full w-full object-cover object-top" />
							</a>
						{:else}
							{@const emoji = getMonsterEmoji(dc.templateName, dc.monsterType)}
							<div
								class="mb-6 flex h-44 w-44 items-center justify-center rounded-full ring-4 ring-offset-4 ring-offset-gray-950 {style.bg} {isBloodied
									? 'bloodied-avatar ring-red-600'
									: style.ring}"
								style={isBloodied ? '' : 'box-shadow: 0 0 48px -8px var(--tw-ring-color);'}
							>
								<span class="select-none" style="font-size: 5rem; line-height: 1;">{emoji}</span>
							</div>
						{/if}
					{:else if dc.avatarUrl}
						<div
							class="mb-6 h-44 w-44 overflow-hidden rounded-full ring-4 ring-blue-500 ring-offset-4 ring-offset-gray-950"
							style="box-shadow: 0 0 48px -8px rgba(59,130,246,0.6);"
						>
							<img src={dc.avatarUrl} alt={dc.name} class="h-full w-full object-cover" />
						</div>
					{/if}

					<!-- Bloodied badge (enemy only, HP ≤ 50%) -->
					{#if isBloodied}
						<div
							class="mb-3 flex items-center gap-2 rounded-full border border-red-700/60 bg-red-950/60 px-4 py-1"
						>
							<span class="text-base leading-none">🩸</span>
							<span class="text-xs font-black tracking-[0.25em] text-red-400 uppercase"
								>Bloodied</span
							>
						</div>
					{/if}

					<!-- Name -->
					<h1
						class="mb-2 text-center leading-none font-black tracking-widest uppercase
					       {dc.type === 'player'
							? 'text-blue-50'
							: dc.type === 'lair'
								? 'text-purple-50'
								: 'text-red-50'}"
						style="font-size: clamp(1.5rem, calc((100vw - 6rem) / 11), {dc.type === 'player'
							? '4.5rem'
							: '3.75rem'}); text-shadow: 0 0 40px {dc.type === 'player'
							? 'rgba(96,165,250,0.4)'
							: dc.type === 'lair'
								? 'rgba(192,132,252,0.4)'
								: 'rgba(248,113,113,0.4)'};"
					>
						{dc.name}
					</h1>

					<!-- Stats row -->
					<div class="mt-6 flex items-center gap-10">
						{#if dc.initiative !== null}
							<div class="text-center">
								<div class="text-xs tracking-widest text-gray-500 uppercase">Initiative</div>
								<div class="text-4xl font-black text-amber-400">{dc.initiative}</div>
							</div>
							{#if showAc && !isUnconsciousPlayer}
								<div class="h-10 w-px bg-gray-700"></div>
							{/if}
						{/if}
						{#if showAc && !isUnconsciousPlayer}
							<div class="text-center">
								<div class="text-xs tracking-widest text-gray-500 uppercase">Armor Class</div>
								<div class="text-4xl font-black text-gray-100">{dc.ac}</div>
							</div>
						{/if}
						{#if dc.type === 'player' && !isUnconsciousPlayer}
							<div class="h-10 w-px bg-gray-700"></div>
							<div class="text-center">
								<div class="text-xs tracking-widest text-gray-500 uppercase">Hit Points</div>
								<div
									class="text-4xl font-black {pct <= 0
										? 'text-gray-500'
										: pct <= 25
											? 'text-red-400'
											: pct <= 50
												? 'text-amber-400'
												: 'text-green-400'}"
								>
									{dc.currentHp}<span class="text-xl text-gray-600">/{dc.maxHp}</span>
								</div>
								{#if (dc.tempHp ?? 0) > 0}
									<div class="mt-1 text-lg font-bold text-yellow-400">+{dc.tempHp} THP</div>
								{/if}
							</div>
						{/if}
					</div>

					<!-- HP bar + THP extension (players only) -->
					{#if dc.type === 'player'}
						{#if dc.currentHp > 0}
							<div class="relative mt-5 h-4 w-full max-w-2xl rounded-full bg-gray-800 shadow-inner">
								{#if (dc.tempHp ?? 0) > 0}
									{@const total = dc.maxHp + dc.tempHp}
									{@const hpW = (dc.currentHp / total) * 100}
									{@const thpW = (dc.tempHp / total) * 100}
									<div
										class="h-full rounded-full transition-all duration-500 {hpBarColor(pct)}"
										style="width: {hpW}%;"
									></div>
									<div
										class="absolute top-0 h-full rounded-full bg-yellow-400 transition-all duration-500"
										style="left: {hpW}%; width: {thpW}%;"
									></div>
								{:else}
									<div
										class="h-full rounded-full transition-all duration-500 {hpBarColor(pct)}"
										style="width: {pct}%;"
									></div>
								{/if}
							</div>
						{:else}
							<!-- Death saving throws panel -->
							{@const ds = dc.deathSaves ?? { successes: 0, failures: 0, stable: false }}
							{@const isDead = ds.failures >= 3}
							{@const isStable = ds.stable || ds.successes >= 3}
							<div class="mt-6 w-full max-w-lg">
								<div class="mb-3 flex items-center gap-4">
									<div class="h-px flex-1 bg-gray-700"></div>
									<span class="text-xs font-black tracking-[0.25em] text-gray-500 uppercase"
										>☠ Death Saving Throws</span
									>
									<div class="h-px flex-1 bg-gray-700"></div>
								</div>
								{#if isDead}
									<div
										class="flex flex-col items-center gap-2 rounded-xl border border-red-800/60 bg-red-950/50 px-6 py-5"
									>
										<span class="text-5xl">☠</span>
										<span class="text-2xl font-black tracking-[0.3em] text-red-400 uppercase"
											>Dead</span
										>
									</div>
								{:else if isStable}
									<div
										class="flex flex-col items-center gap-2 rounded-xl border border-green-800/60 bg-green-950/50 px-6 py-5"
									>
										<span class="text-5xl">♥</span>
										<span class="text-2xl font-black tracking-[0.3em] text-green-400 uppercase"
											>Stabilized</span
										>
									</div>
								{:else}
									<div class="grid grid-cols-2 gap-4">
										<div
											class="flex flex-col items-center gap-3 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-4"
										>
											<span class="text-xs font-black tracking-[0.2em] text-red-500 uppercase"
												>Failures</span
											>
											<div class="flex gap-3">
												{#each [0, 1, 2] as i}
													<div
														class="flex h-10 w-10 items-center justify-center rounded-full border-2 text-xl {ds.failures >
														i
															? 'border-red-600 bg-red-800/60 text-red-300'
															: 'border-gray-700 bg-gray-900/60 text-gray-700'}"
													>
														{ds.failures > i ? '☠' : '○'}
													</div>
												{/each}
											</div>
										</div>
										<div
											class="flex flex-col items-center gap-3 rounded-xl border border-green-900/50 bg-green-950/30 px-4 py-4"
										>
											<span class="text-xs font-black tracking-[0.2em] text-green-600 uppercase"
												>Successes</span
											>
											<div class="flex gap-3">
												{#each [0, 1, 2] as i}
													<div
														class="flex h-10 w-10 items-center justify-center rounded-full border-2 text-xl {ds.successes >
														i
															? 'border-green-600 bg-green-800/60 text-green-300'
															: 'border-gray-700 bg-gray-900/60 text-gray-700'}"
													>
														{ds.successes > i ? '♥' : '○'}
													</div>
												{/each}
											</div>
										</div>
									</div>
								{/if}
							</div>
						{/if}
					{/if}

					<!-- Active conditions -->
					{#if dc.statuses.length > 0}
						<div class="mt-5 flex flex-wrap justify-center gap-2">
							{#each dc.statuses as status}
								<div
									class="flex items-center rounded-full text-sm font-semibold tracking-wide {conditionColors[
										status
									] ?? 'bg-gray-700 text-gray-200'}"
								>
									<span class="py-1 pr-2 pl-3">{status}</span>
									<button
										onclick={() => (conditionInfo = status)}
										title="What is {status}?"
										class="py-1 pr-2 opacity-50 transition hover:opacity-100"
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
												d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</main>
			{/key}
		</div>

		<!-- Up Next strip -->
		{#if upNext.length > 0}
			<footer
				class="relative z-10 shrink-0 border-t border-gray-800/80 bg-gray-900/90 px-8 py-4 backdrop-blur-sm"
			>
				<div class="flex items-center gap-6">
					<div class="shrink-0">
						<span class="text-xs font-black tracking-[0.3em] text-gray-500 uppercase">Up Next</span>
						<span class="ml-2 text-gray-600">▶</span>
					</div>

					<div class="flex flex-1 items-center gap-3 overflow-hidden">
						{#each upNext as c, i}
							{@const pct = hpPercent(c)}
							{#if i === wrapIndex}
								<div class="hidden shrink-0 items-center gap-2 sm:flex">
									<div class="h-8 w-px bg-gray-700/60"></div>
									<span
										class="text-xs font-black tracking-[0.2em] whitespace-nowrap text-amber-500/60 uppercase"
										>Top of the Order</span
									>
									<div class="h-8 w-px bg-gray-700/60"></div>
								</div>
							{/if}
							<div
								class="{i > 0
									? 'hidden sm:flex'
									: 'flex'} min-w-0 flex-1 flex-col items-center gap-1 rounded-lg border px-2 py-2 sm:flex-row sm:gap-3 sm:px-3 sm:py-2.5
								       {c.type === 'player'
									? 'border-blue-900/60 bg-blue-950/30'
									: c.type === 'lair'
										? 'border-purple-900/60 bg-purple-950/30'
										: 'border-red-900/60 bg-red-950/30'}"
							>
								{#if c.type === 'enemy'}
									{@const style = getMonsterStyle(c.monsterType)}
									{@const imgUrl = c.imgUrl ?? getMonsterDetail(c.templateName ?? '')?.imgUrl}
									{#if imgUrl}
										<a
											href={imgUrl}
											target="_blank"
											rel="noopener noreferrer"
											class="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 {style.ring} cursor-pointer"
										>
											<img
												src={imgUrl}
												alt={c.name}
												class="h-full w-full object-cover object-top"
											/>
										</a>
									{:else}
										<div
											class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-2 {style.bg} {style.ring}"
										>
											<span class="text-xl leading-none select-none"
												>{getMonsterEmoji(c.templateName, c.monsterType)}</span
											>
										</div>
									{/if}
								{:else if c.avatarUrl}
									<div class="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-blue-700">
										<img src={c.avatarUrl} alt={c.name} class="h-full w-full object-cover" />
									</div>
								{:else}
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-950 ring-2 ring-blue-700"
									>
										<span class="text-xl leading-none select-none">🛡️</span>
									</div>
								{/if}

								<div class="w-full min-w-0 sm:flex-1">
									<div class="flex items-center justify-center gap-1.5 sm:justify-start">
										<span
											class="hidden shrink-0 rounded px-1 py-0.5 text-xs font-bold sm:inline {c.type ===
											'player'
												? 'bg-blue-900/60 text-blue-400'
												: c.type === 'lair'
													? 'bg-purple-900/60 text-purple-400'
													: 'bg-red-900/60 text-red-400'}"
										>
											{c.type === 'player' ? 'PC' : c.type === 'lair' ? 'LAIR' : 'NPC'}
										</span>
										<span class="truncate text-sm font-semibold text-gray-200">{c.name}</span>
										{#if c.type === 'enemy' && hpPercent(c) > 0 && hpPercent(c) <= 50}
											<span class="shrink-0 text-sm leading-none" title="Bloodied">🩸</span>
										{/if}
										{#if c.initiative !== null}
											<span class="ml-auto hidden shrink-0 text-xs text-amber-500 sm:inline"
												>{c.initiative}</span
											>
										{/if}
									</div>

									{#if c.type === 'player'}
										<div
											class="relative mt-1.5 hidden h-1.5 w-full overflow-hidden rounded-full bg-gray-800 sm:block"
										>
											{#if (c.tempHp ?? 0) > 0}
												{@const total = c.maxHp + (c.tempHp ?? 0)}
												{@const hpW = (c.currentHp / total) * 100}
												{@const thpW = ((c.tempHp ?? 0) / total) * 100}
												<div
													class="absolute inset-y-0 left-0 {hpBarColor(pct)}"
													style="width: {hpW}%;"
												></div>
												<div
													class="absolute inset-y-0 bg-yellow-400"
													style="left: {hpW}%; width: {thpW}%;"
												></div>
											{:else}
												<div
													class="absolute inset-y-0 left-0 {hpBarColor(pct)}"
													style="width: {pct}%;"
												></div>
											{/if}
										</div>
										<div class="mt-0.5 hidden items-center gap-1.5 text-xs sm:flex">
											<span
												class={pct <= 0
													? 'text-gray-600'
													: pct <= 25
														? 'text-red-400'
														: pct <= 50
															? 'text-amber-400'
															: 'text-green-400'}
											>
												{c.currentHp}/{c.maxHp} HP
											</span>
											{#if (c.tempHp ?? 0) > 0}
												<span class="font-bold text-yellow-400">+{c.tempHp} THP</span>
											{/if}
										</div>
									{/if}
								</div>

								{#if c.statuses.length > 0}
									<div class="shrink-0 text-right">
										<div class="flex flex-wrap justify-end gap-0.5">
											{#each c.statuses.slice(0, 3) as s}
												<div
													class="flex items-center rounded text-xs {conditionColors[s] ??
														'bg-gray-700 text-gray-300'}"
												>
													<span class="py-0.5 pr-0.5 pl-1">{s}</span>
													<button
														onclick={() => (conditionInfo = s)}
														title="What is {s}?"
														class="py-0.5 pr-0.5 opacity-50 transition hover:opacity-100"
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															class="h-2.5 w-2.5"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
															/>
														</svg>
													</button>
												</div>
											{/each}
											{#if c.statuses.length > 3}
												<span class="text-xs text-gray-600">+{c.statuses.length - 3}</span>
											{/if}
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</footer>
		{/if}
	{/if}
</div>

<!-- Message DM modal -->
{#if showMsgModal}
	<MessageDMModal
		{players}
		sessionId={data.sessionId}
		preselectedName={myCharacter?.name ?? ''}
		onclose={() => (showMsgModal = false)}
	/>
{/if}

<!-- Roll Initiative modal -->
{#if showInitModal}
	<InitiativeRollerModal
		{players}
		sessionId={data.sessionId}
		preselectedId={myCharacterId ?? ''}
		onclose={() => (showInitModal = false)}
	/>
{/if}

<ConditionInfoModal condition={conditionInfo} onclose={() => (conditionInfo = null)} {ruleset} />

{#if showNotesModal && myPlayerName}
	<PlayerNotesModal playerName={myPlayerName} onclose={() => (showNotesModal = false)} />
{/if}

{#if showDmInbox}
	<PlayerInboxModal
		messages={dmMessages}
		onclose={() => (showDmInbox = false)}
		onclear={() => {
			dmMessages = [];
			dmUnread = 0;
		}}
	/>
{/if}

{#if showEmojiPicker}
	<EmojiPickerModal
		sessionId={data.sessionId}
		playerName={myPlayerName}
		onclose={() => (showEmojiPicker = false)}
	/>
{/if}

{#if showDiceRoller}
	<DiceRollerModal onclose={() => (showDiceRoller = false)} />
{/if}

<DiceOverlay />

<style>
	/* Bloodied enemy avatar — pulsing crimson ring */
	@keyframes bloodied-glow {
		0%,
		100% {
			box-shadow:
				0 0 50px -2px rgba(185, 28, 28, 0.85),
				0 0 0 4px rgba(220, 38, 38, 0.8);
		}
		50% {
			box-shadow:
				0 0 80px 6px rgba(220, 38, 38, 1),
				0 0 0 4px rgba(239, 68, 68, 1);
		}
	}
	.bloodied-avatar {
		animation: bloodied-glow 2s ease-in-out infinite;
	}

	@keyframes flash-effect {
		0% {
			opacity: 0.5;
		}
		100% {
			opacity: 0;
		}
	}
	.flash-overlay {
		animation: flash-effect 0.75s ease-out forwards;
	}

	/* ── Atmospheric drifting orbs ── */
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
