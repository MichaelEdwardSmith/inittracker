<!-- OBS Browser Source overlay at /overlay/[sessionId].
     Subscribes to the same SSE stream as the viewer display.
     Designed for a transparent OBS browser source — no background on html/body.
     Set the browser source to your stream resolution (e.g. 1920×1080). -->
<script lang="ts">
	import { untrack } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { sortCombatants, hpPercent, chaseBadgeClasses } from '$lib/utils';
	import ChaseTrackBoard from '$lib/components/ChaseTrackBoard.svelte';
	import BattleGridCanvas from '$lib/components/BattleGridCanvas.svelte';
	import AnnotationCanvas from '$lib/components/AnnotationCanvas.svelte';
	import { renderFogOfWarCanvas } from '$lib/dungeonRender';
	import type { DungeonMapState } from '$lib/dungeonRender';
	import type { Stroke } from '$lib/docShareTypes';
	import type {
		BattleMapViewState,
		BattleMapToken,
		BattleMapRuler,
		BattleMapStroke
	} from '$lib/battleMapTypes';
	import type { StorageState, Combatant, ChaseState } from '$lib/types';

	interface TickerEvent {
		id: string;
		text: string;
		icon: string;
		color: string;
		timestamp: number;
	}

	let { data } = $props();

	let combatState: StorageState = $state({ combatants: [], currentTurnId: null, round: 1 });
	let connected = $state(false);

	// Note: 'Exhausted' is deliberately not in these two maps — it's a cumulative level
	// (exhaustionLevel) rather than a flat entry in `statuses`, so it's synthesized into
	// extraBadges below instead, alongside Transformed/Inspired/Readied/Surprised.
	const conditionAbbrev: Record<string, string> = {
		Blinded: 'Blind',
		Charmed: 'Chrm',
		Concentrating: 'Conc',
		Deafened: 'Deaf',
		Dead: 'Dead',
		Frightened: 'Frgtn',
		Grappled: 'Grpl',
		Incapacitated: 'Incap',
		Invisible: 'Invis',
		Paralyzed: 'Para',
		Petrified: 'Petri',
		Poisoned: 'Pois',
		Prone: 'Prone',
		Restrained: 'Rstr',
		Stunned: 'Stun',
		Unconscious: 'Uncon',
		'Advantage For': 'Adv ^',
		'Advantage Against': 'Adv v',
		'Disadvantage For': 'Dis ^',
		'Disadvantage Against': 'Dis v'
	};

	const conditionBg: Record<string, string> = {
		Blinded: '#4b5563',
		Charmed: '#9d174d',
		Concentrating: '#155e75',
		Deafened: '#92400e',
		Dead: '#111827',
		Frightened: '#6b21a8',
		Grappled: '#c2410c',
		Incapacitated: '#991b1b',
		Invisible: '#1e40af',
		Paralyzed: '#7f1d1d',
		Petrified: '#57534e',
		Poisoned: '#166534',
		Prone: '#78350f',
		Restrained: '#92400e',
		Stunned: '#854d0e',
		Unconscious: '#374151',
		'Advantage For': '#065f46',
		'Advantage Against': '#9f1239',
		'Disadvantage For': '#9a3412',
		'Disadvantage Against': '#134e4a'
	};

	// ── Document Share (full-screen handout + live DM annotations) ──
	// Same in-memory server slot and SSE events as the viewer display. Takes over the frame
	// while the DM has a handout set to visible; page images are fetched lazily per page.
	interface DocShareView {
		id: string;
		name: string;
		pageCount: number;
		currentPage: number;
		visible: boolean;
	}
	let docShareView = $state<DocShareView | null>(null);
	let docSharePageUrls = $state<(string | null)[]>([]);
	let docShareAnnotations = $state<Record<number, Stroke[]>>({});
	let docShareNaturalW = $state(0);
	let docShareNaturalH = $state(0);

	async function downloadDocSharePage(id: string, page: number) {
		try {
			const res = await fetch(`/api/docshare/page?session=${data.sessionId}&id=${id}&page=${page}`);
			if (!res.ok) return;
			const blob = await res.blob();
			docSharePageUrls[page] = URL.createObjectURL(blob);
		} catch {
			/* ignore */
		}
	}

	function applyDocShareState(state: DocShareView | null) {
		if (!state) {
			for (const u of docSharePageUrls) if (u) URL.revokeObjectURL(u);
			docSharePageUrls = [];
			docShareView = null;
			docShareAnnotations = {};
			return;
		}
		if (docShareView?.id !== state.id) {
			for (const u of docSharePageUrls) if (u) URL.revokeObjectURL(u);
			docSharePageUrls = Array(state.pageCount).fill(null);
			docShareAnnotations = {};
		}
		if (docShareView?.currentPage !== state.currentPage) {
			docShareNaturalW = 0;
			docShareNaturalH = 0;
		}
		docShareView = state;
		if (state.visible && !docSharePageUrls[state.currentPage]) {
			downloadDocSharePage(state.id, state.currentPage);
		}
	}

	function applyDocShareAnnotation(msg: { docId: string; page: number; strokes: Stroke[] }) {
		if (!docShareView || msg.docId !== docShareView.id) return;
		docShareAnnotations = { ...docShareAnnotations, [msg.page]: msg.strokes };
	}

	// Full snapshot on every (re)connect — named SSE events aren't replayed.
	async function loadDocShare() {
		try {
			const res = await fetch(`/api/docshare/state?session=${data.sessionId}`);
			const state: DocShareView | null = res.ok ? await res.json() : null;
			applyDocShareState(state);
			if (!state) return;
			const aRes = await fetch(`/api/docshare/annotate?session=${data.sessionId}`);
			if (!aRes.ok) return;
			const anno = (await aRes.json()) as {
				docId: string;
				pageStrokes: Record<number, Stroke[]>;
			} | null;
			if (anno && anno.docId === state.id) docShareAnnotations = anno.pageStrokes;
		} catch {
			/* ignore */
		}
	}

	// ── Dungeon map lower third ──
	// When the DM clicks a room on the Donjon map (revealing it through the fog) while the map is
	// shared, the fog-of-war map slides up in the bottom third for a while, then slides away.
	// Each further reveal restarts the timer. Uses the same renderer as the viewer's map.
	//
	// Zoom: shortly after the strip appears, the camera glides in on the room that was just
	// revealed, holds, then glides back out to the whole map for the rest of the time. The zoom
	// is a CSS transform on the (already drawn) canvas, so no re-render is needed — map cell
	// (row, col) sits at fraction (col / (n_cols + 1), row / (n_rows + 1)) of the canvas.
	const FOG_HOLD_MS = 15000;
	const FOG_ZOOM_DELAY_MS = 700; // let the strip finish sliding up first
	const FOG_ZOOM_HOLD_MS = 6000;
	const FOG_GLIDE_MS = 900;
	const FOG_ZOOM_PAD_CELLS = 2; // context around the room (reaches the doors outside it)
	const FOG_ZOOM_MAX = 6;
	let fogOpen = $state(false);
	let fogCanvas = $state<HTMLCanvasElement | null>(null);
	let fogTimer: ReturnType<typeof setTimeout> | undefined;
	let fogZoomTimers: ReturnType<typeof setTimeout>[] = [];
	// Normalized (0-1) box to frame, or null for the whole map
	let fogFocus = $state<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
	let fogStageW = $state(0);
	let fogStageH = $state(0);
	let fogCanvasW = $state(0);
	let fogCanvasH = $state(0);

	function clearFogZoomTimers() {
		for (const t of fogZoomTimers) clearTimeout(t);
		fogZoomTimers = [];
	}

	// Normalized bounding box (plus padding) of every cell belonging to a room on a floor
	function roomBox(
		nm: NonNullable<StorageState['dungeonMapState']>,
		floor: number,
		roomId: number
	) {
		const d = nm.floors[floor];
		if (!d) return null;
		let minR = Infinity,
			maxR = -Infinity,
			minC = Infinity,
			maxC = -Infinity;
		for (let r = 0; r <= d.n_rows; r++) {
			for (let c = 0; c <= d.n_cols; c++) {
				const cell = d.cell[r][c];
				if (cell & 0x2 && (cell & 0xffc0) >> 6 === roomId) {
					// 0x2 = ROOM, 0xffc0 = ROOM_ID (see dungeonRender.ts)
					minR = Math.min(minR, r);
					maxR = Math.max(maxR, r);
					minC = Math.min(minC, c);
					maxC = Math.max(maxC, c);
				}
			}
		}
		if (!isFinite(minR)) return null;
		const cols = d.n_cols + 1;
		const rows = d.n_rows + 1;
		const clamp = (v: number) => Math.max(0, Math.min(1, v));
		return {
			x0: clamp((minC - FOG_ZOOM_PAD_CELLS) / cols),
			x1: clamp((maxC + 1 + FOG_ZOOM_PAD_CELLS) / cols),
			y0: clamp((minR - FOG_ZOOM_PAD_CELLS) / rows),
			y1: clamp((maxR + 1 + FOG_ZOOM_PAD_CELLS) / rows)
		};
	}

	// CSS transform framing fogFocus inside the stage (origin = canvas centre)
	const fogTransform = $derived.by(() => {
		const f = fogFocus;
		if (!f || fogCanvasW <= 0 || fogCanvasH <= 0 || fogStageW <= 0 || fogStageH <= 0) return '';
		const boxW = (f.x1 - f.x0) * fogCanvasW;
		const boxH = (f.y1 - f.y0) * fogCanvasH;
		// Usable area = stage minus its padding (24px sides, 4px top / 12px bottom)
		const s = Math.max(1, Math.min(FOG_ZOOM_MAX, (fogStageW - 48) / boxW, (fogStageH - 16) / boxH));
		const cx = (f.x0 + f.x1) / 2;
		const cy = (f.y0 + f.y1) / 2;
		const tx = (0.5 - cx) * s * fogCanvasW;
		const ty = (0.5 - cy) * s * fogCanvasH;
		return `translate(${tx}px, ${ty}px) scale(${s})`;
	});

	function detectFogReveal(prev: StorageState, next: StorageState) {
		const pm = prev.dungeonMapState;
		const nm = next.dungeonMapState;
		if (!nm) {
			// Map no longer shared — drop the strip immediately
			clearTimeout(fogTimer);
			clearFogZoomTimers();
			fogOpen = false;
			fogFocus = null;
			return;
		}
		// Only a *room* newly revealed on an already-shared dungeon counts: not the moment the
		// map is first shared, not a switch to a different dungeon, not corridor clicks.
		if (!pm || pm.dungeonName !== nm.dungeonName || pm.floors.length !== nm.floors.length) return;
		let gained: { floor: number; id: number } | null = null;
		nm.revealedRooms.forEach((rooms, f) => {
			const before = new Set(pm.revealedRooms[f] ?? []);
			for (const id of rooms) if (!before.has(id)) gained = { floor: f, id };
		});
		if (!gained) return;
		const g = gained as { floor: number; id: number };

		const wasOpen = fogOpen;
		fogOpen = true;
		clearTimeout(fogTimer);
		fogTimer = setTimeout(() => {
			fogOpen = false;
			fogFocus = null;
		}, FOG_HOLD_MS);

		// Frame the new room — only if it's on the floor actually being drawn
		clearFogZoomTimers();
		const box = g.floor === nm.currentFloor ? roomBox(nm, g.floor, g.id) : null;
		if (!box) {
			fogFocus = null;
			return;
		}
		if (wasOpen) {
			fogFocus = box; // already showing — just glide over to the new room
		} else {
			fogFocus = null; // start from the whole map, then push in after the slide-up
			fogZoomTimers.push(setTimeout(() => (fogFocus = box), FOG_ZOOM_DELAY_MS));
		}
		fogZoomTimers.push(
			setTimeout(
				() => (fogFocus = null),
				(wasOpen ? 0 : FOG_ZOOM_DELAY_MS) + FOG_GLIDE_MS + FOG_ZOOM_HOLD_MS
			)
		);
	}

	// Keep the canvas drawn with the latest fog state while the strip is open
	$effect(() => {
		const ms = combatState.dungeonMapState as DungeonMapState | null | undefined;
		if (fogOpen && ms && fogCanvas) renderFogOfWarCanvas(fogCanvas, ms);
	});

	// ── Stingers: Bloodied! / Stabilized! / Dead banners ──
	// Same triggers as the viewer display, detected by diffing consecutive snapshots.
	type StingerKind = 'bloodied' | 'stable' | 'dead';
	let stinger = $state<{ key: number; kind: StingerKind; text: string; sub: string } | null>(null);
	let stingerTimer: ReturnType<typeof setTimeout> | undefined;
	const STINGER_ICON: Record<StingerKind, string> = {
		bloodied: 'fa-droplet',
		stable: 'fa-heart',
		dead: 'fa-skull'
	};

	function showStinger(kind: StingerKind, text: string, sub: string) {
		clearTimeout(stingerTimer);
		stinger = { key: Date.now(), kind, text, sub };
		stingerTimer = setTimeout(() => (stinger = null), kind === 'bloodied' ? 2600 : 2000);
	}

	function detectStingers(prev: StorageState, next: StorageState) {
		for (const nc of next.combatants) {
			const oc = prev.combatants.find((c) => c.id === nc.id);
			if (!oc) continue;

			// Bloodied — an enemy's HP crosses from above 50% down to at/below it
			if (nc.type === 'enemy' && nc.maxHp > 0 && nc.currentHp > 0) {
				if (oc.currentHp / oc.maxHp > 0.5 && nc.currentHp / nc.maxHp <= 0.5) {
					showStinger('bloodied', 'Bloodied!', nc.name);
					return;
				}
			}

			// Death saves — only compared once a tracker already exists, so the hit that
			// dropped the player to 0 doesn't count; only the save rolls do.
			if (nc.type === 'player' && nc.deathSaves && oc.deathSaves) {
				const wasStable = oc.deathSaves.stable || oc.deathSaves.successes >= 3;
				const nowStable = nc.deathSaves.stable || nc.deathSaves.successes >= 3;
				if (nc.deathSaves.failures >= 3 && oc.deathSaves.failures < 3) {
					showStinger('dead', 'Dead', nc.name);
					return;
				}
				if (nowStable && !wasStable) {
					showStinger('stable', 'Stabilized!', nc.name);
					return;
				}
			}
		}
	}

	// ── Battle Map (full-screen) ──
	// Same in-memory server slot and SSE events the viewer display uses. OBS can't click, so
	// instead of the display's corner badge the map simply takes over the whole frame while the
	// DM has it set to visible, and drops away when they hide it.
	let battleMapView = $state<BattleMapViewState | null>(null);
	let battleMapImageUrl = $state<string | null>(null);
	let battleMapTokens = $state<BattleMapToken[]>([]);
	let battleMapRuler = $state<BattleMapRuler | null>(null);
	let battleMapStrokes = $state<BattleMapStroke[]>([]);
	let ruleset = $state<'2014' | '2024'>('2014');

	// Guards against out-of-order image downloads when the map switches twice in quick succession.
	let battleMapImageRequestId = 0;
	async function downloadBattleMapImage(id: string) {
		const requestId = ++battleMapImageRequestId;
		try {
			const res = await fetch(`/api/battlemap/image?session=${data.sessionId}&id=${id}`);
			if (!res.ok) return;
			const blob = await res.blob();
			if (requestId !== battleMapImageRequestId) return;
			if (battleMapImageUrl) URL.revokeObjectURL(battleMapImageUrl);
			battleMapImageUrl = URL.createObjectURL(blob);
		} catch {
			/* ignore */
		}
	}

	function applyBattleMapState(state: BattleMapViewState | null) {
		if (!state) {
			if (battleMapImageUrl) URL.revokeObjectURL(battleMapImageUrl);
			battleMapImageUrl = null;
			battleMapView = null;
			battleMapTokens = [];
			battleMapRuler = null;
			battleMapStrokes = [];
			cancelTokenFocus();
			return;
		}
		const isDifferentMap = battleMapView !== null && battleMapView.id !== state.id;
		if (battleMapView?.id !== state.id) downloadBattleMapImage(state.id);
		if (isDifferentMap) {
			battleMapTokens = [];
			battleMapRuler = null;
			battleMapStrokes = [];
		}
		if (isDifferentMap || !state.visible) cancelTokenFocus();
		battleMapView = state;
	}

	// ── Auto-camera: when a token is added or moved, the map glides in on it, holds a few
	// seconds, then glides back out (the canvas owns the animation; we just say where). Token
	// updates stream in many times a second while the DM drags, so the target is debounced —
	// the camera flies to where the token comes to rest, not to every intermediate position.
	const FOCUS_SETTLE_MS = 500;
	let battleMapFocus = $state<{ x: number; y: number; nonce: number } | null>(null);
	let focusNonce = 0;
	let focusTarget: { x: number; y: number } | null = null;
	let focusTimer: ReturnType<typeof setTimeout> | undefined;

	function cancelTokenFocus() {
		clearTimeout(focusTimer);
		focusTarget = null;
		battleMapFocus = null;
	}

	function queueTokenFocus(prev: BattleMapToken[], next: BattleMapToken[]) {
		if (!battleMapView?.visible) return; // nobody's looking at the map right now
		const before = new Map(prev.map((t) => [t.combatantId, t]));
		let changed: BattleMapToken | null = null;
		for (const t of next) {
			const p = before.get(t.combatantId);
			if (!p || p.x !== t.x || p.y !== t.y) changed = t; // added, or moved
		}
		if (!changed) return; // removals alone don't pull the camera
		focusTarget = { x: changed.x, y: changed.y };
		clearTimeout(focusTimer);
		focusTimer = setTimeout(() => {
			if (focusTarget) battleMapFocus = { ...focusTarget, nonce: ++focusNonce };
		}, FOCUS_SETTLE_MS);
	}

	// Full snapshot of whatever map exists. Called on every (re)connect, since named SSE events
	// aren't replayed — a map shown while the overlay was disconnected would otherwise be missed.
	async function loadBattleMap() {
		try {
			const res = await fetch(`/api/battlemap/state?session=${data.sessionId}`);
			const state: BattleMapViewState | null = res.ok ? await res.json() : null;
			applyBattleMapState(state);
			if (!state) return;
			const tRes = await fetch(`/api/battlemap/tokens?session=${data.sessionId}`);
			if (tRes.ok) battleMapTokens = await tRes.json();
			const dRes = await fetch(`/api/battlemap/draw?session=${data.sessionId}`);
			if (dRes.ok) battleMapStrokes = await dRes.json();
		} catch {
			/* ignore */
		}
	}

	$effect(() => {
		fetch(`/api/session-ruleset?session=${data.sessionId}`)
			.then((r) => (r.ok ? r.json() : null))
			.then((d) => {
				if (d?.ruleset === '2024') ruleset = '2024';
			})
			.catch(() => {});
	});

	// ── Chase lower third ──
	// The last live chase is held after the DM ends it so the lower third can keep rendering
	// while it fades out (combatState.chaseState is already null by then).
	let lastChase: ChaseState | null = null;
	const shownChase = $derived.by(() => {
		if (combatState.chaseState) lastChase = combatState.chaseState;
		return lastChase;
	});

	// Blue speed-line particles streaking right-to-left — same look as the viewer's chase
	// takeover, just fewer of them for the shorter strip. Randomized once, purely decorative.
	const CHASE_PARTICLES = Array.from({ length: 20 }, () => ({
		top: Math.random() * 100,
		delay: Math.random() * 3,
		duration: 0.8 + Math.random() * 1.8,
		length: 50 + Math.random() * 130,
		thickness: 1.5 + Math.random() * 2,
		opacity: 0.3 + Math.random() * 0.5
	}));

	// ── Battle start/end banner ──
	// Driven by currentTurnId (the DM's actual Start Combat / End Combat signal), not the
	// `inCombat` HUD-visibility proxy below — that one just tracks "is there a roster to
	// show," so it doesn't reliably flip when combat itself starts/ends.
	const isActiveCombat = $derived(combatState.currentTurnId !== null);
	let showStartBanner = $state(false);
	let showEndBanner = $state(false);
	let shakeScreen = $state(false);
	let prevActiveCombat: boolean | null = null;
	let receivedFirstMessage = false;

	$effect(() => {
		const source = new EventSource(`/api/state?session=${data.sessionId}`);
		source.onopen = () => {
			connected = true;
			loadBattleMap();
			loadDocShare();
		};
		source.onmessage = (e) => {
			try {
				const parsed = JSON.parse(e.data) as StorageState;
				if (!receivedFirstMessage) {
					// Prime the battle-banner baseline from the real first snapshot (not the
					// placeholder default state) so opening the overlay mid-fight doesn't
					// misread that as combat just starting.
					receivedFirstMessage = true;
					prevActiveCombat = parsed.currentTurnId !== null;
				}
				combatState = parsed;
			} catch {
				// ignore malformed messages
			}
		};
		source.onerror = () => (connected = false);
		source.addEventListener('docshareState', (e) => {
			applyDocShareState(JSON.parse((e as MessageEvent).data));
		});
		source.addEventListener('docshareRemoved', () => applyDocShareState(null));
		source.addEventListener('docshareAnnotation', (e) => {
			applyDocShareAnnotation(JSON.parse((e as MessageEvent).data));
		});
		source.addEventListener('battleMapState', (e) => {
			applyBattleMapState(JSON.parse((e as MessageEvent).data));
		});
		source.addEventListener('battleMapRemoved', () => applyBattleMapState(null));
		source.addEventListener('battleMapTokens', (e) => {
			const next: BattleMapToken[] = JSON.parse((e as MessageEvent).data);
			queueTokenFocus(battleMapTokens, next);
			battleMapTokens = next;
		});
		source.addEventListener('battleMapRuler', (e) => {
			battleMapRuler = JSON.parse((e as MessageEvent).data);
		});
		source.addEventListener('battleMapDraw', (e) => {
			battleMapStrokes = JSON.parse((e as MessageEvent).data);
		});
		return () => source.close();
	});

	// Visible combatants: skip lair pseudo-cards and benched players
	const visible = $derived(
		sortCombatants(combatState.combatants.filter((c) => c.type !== 'lair' && c.inCombat !== false))
	);

	const inCombat = $derived(visible.length > 0 && combatState.round > 0);

	$effect(() => {
		const now = isActiveCombat;
		if (prevActiveCombat === null) {
			// First state received — establish the baseline without animating, so refreshing
			// mid-combat doesn't replay the start banner.
			prevActiveCombat = now;
			return;
		}
		let startTimer: ReturnType<typeof setTimeout> | undefined;
		let endTimer: ReturnType<typeof setTimeout> | undefined;
		let shakeTimer: ReturnType<typeof setTimeout> | undefined;
		if (now && !prevActiveCombat) {
			showEndBanner = false;
			showStartBanner = true;
			shakeScreen = true;
			shakeTimer = setTimeout(() => (shakeScreen = false), 400);
			startTimer = setTimeout(() => (showStartBanner = false), 1700);
		} else if (!now && prevActiveCombat) {
			showStartBanner = false;
			showEndBanner = true;
			endTimer = setTimeout(() => (showEndBanner = false), 2200);
		}
		prevActiveCombat = now;
		return () => {
			clearTimeout(startTimer);
			clearTimeout(endTimer);
			clearTimeout(shakeTimer);
		};
	});

	const currentIndex = $derived(visible.findIndex((c) => c.id === combatState.currentTurnId));

	// Up to 6 next combatants for the full-width bottom bar
	const upNext = $derived.by<Combatant[]>(() => {
		if (currentIndex < 0 || visible.length <= 1) return [];
		const count = Math.min(6, visible.length - 1);
		return Array.from(
			{ length: count },
			(_, i) => visible[(currentIndex + i + 1) % visible.length]
		).filter((c) => !(c.type === 'enemy' && c.currentHp <= 0));
	});

	const wrapIndex = $derived.by<number | null>(() => {
		if (currentIndex < 0) return null;
		const count = Math.min(6, visible.length - 1);
		const idx = visible.length - currentIndex - 1;
		return idx < count ? idx : null;
	});

	const current = $derived(currentIndex >= 0 ? visible[currentIndex] : null);

	function hpLabel(c: Combatant): string {
		return `${c.currentHp + (c.tempHp ?? 0)}/${c.maxHp}`;
	}

	// Death saves — only for a downed (0 HP) player, mirroring the viewer's panel.
	const deathSaves = $derived(
		current && current.type === 'player' && current.currentHp <= 0
			? (current.deathSaves ?? { successes: 0, failures: 0, stable: false })
			: null
	);

	const avatarSrc = $derived(current ? (current.avatarUrl ?? current.imgUrl ?? null) : null);

	// Badges for combatant state that isn't stored in `statuses` (and so wouldn't otherwise
	// show up next to the flat conditions below) — shown ahead of the regular condition
	// badges on the Now Acting card.
	const extraBadges = $derived.by<Array<{ text: string; bg: string }>>(() => {
		if (!current) return [];
		const badges: Array<{ text: string; bg: string }> = [];
		if (current.transformStash) badges.push({ text: 'Transformed', bg: '#047857' });
		if ((current.exhaustionLevel ?? 0) > 0) {
			badges.push({ text: `Exhausted ${current.exhaustionLevel}`, bg: '#7c2d12' });
		}
		if (current.inspiration) badges.push({ text: 'Inspired', bg: '#b45309' });
		if (current.readiedAction) badges.push({ text: 'Readied', bg: '#5b21b6' });
		if (current.surprised) badges.push({ text: 'Surprised', bg: '#be123c' });
		return badges;
	});

	// ── Combat event ticker ──
	let tickerEvents = $state<TickerEvent[]>([]);
	let _prevState: StorageState | null = null;

	function toEventList(prev: StorageState, next: StorageState): TickerEvent[] {
		const events: TickerEvent[] = [];
		const ts = Date.now();

		if (next.round > prev.round) {
			events.push({
				id: `round-${next.round}-${ts}`,
				text: `Round ${next.round}`,
				icon: '<i class="fa-duotone fa-light fa-swords"></i>',
				color: '#fbbf24',
				timestamp: ts
			});
		}

		for (const c of next.combatants) {
			if (c.type === 'lair' || c.inCombat === false) continue;
			const p = prev.combatants.find((x) => x.id === c.id);
			if (!p) continue;

			const delta = c.currentHp - p.currentHp;
			if (delta < 0 && p.currentHp > 0) {
				if (c.currentHp <= 0) {
					events.push({
						id: `down-${c.id}-${ts}`,
						text: `${c.name} downed`,
						icon: '<i class="fa-duotone fa-light fa-xmark"></i>',
						color: '#9ca3af',
						timestamp: ts
					});
				} else {
					events.push({
						id: `dmg-${c.id}-${ts}`,
						text: c.type === 'player' ? `${c.name}  ${Math.abs(delta)} dmg` : `${c.name} hit`,
						icon: '<i class="fa-duotone fa-light fa-arrow-down"></i>',
						color: '#f87171',
						timestamp: ts
					});
				}
			} else if (delta > 0) {
				events.push({
					id: `heal-${c.id}-${ts}`,
					text: c.type === 'player' ? `${c.name}  +${delta} HP` : `${c.name} healed`,
					icon: '<i class="fa-duotone fa-light fa-arrow-up"></i>',
					color: '#4ade80',
					timestamp: ts
				});
			}

			for (const s of c.statuses) {
				if (!p.statuses.includes(s)) {
					events.push({
						id: `con-on-${c.id}-${s}-${ts}`,
						text: `${c.name} — ${conditionAbbrev[s] ?? s}`,
						icon: '<i class="fa-duotone fa-light fa-plus"></i>',
						color: '#e2e8f0',
						timestamp: ts
					});
				}
			}
			for (const s of p.statuses) {
				if (!c.statuses.includes(s)) {
					events.push({
						id: `con-off-${c.id}-${s}-${ts}`,
						text: `${c.name} — ${conditionAbbrev[s] ?? s} cleared`,
						icon: '<i class="fa-duotone fa-light fa-minus"></i>',
						color: '#6b7280',
						timestamp: ts
					});
				}
			}
		}

		return events;
	}

	// Detect changes on every state update, prepend new events to the top
	$effect(() => {
		const curr = combatState;
		if (_prevState) {
			const newEvents = toEventList(_prevState, curr);
			const prevSnap = _prevState;
			untrack(() => detectStingers(prevSnap, curr));
			untrack(() => detectFogReveal(prevSnap, curr));
			if (newEvents.length > 0) {
				untrack(() => {
					tickerEvents = [...newEvents, ...tickerEvents].slice(0, 5);
				});
			}
		}
		_prevState = JSON.parse(JSON.stringify(curr));
	});

	// Prune events older than 8 seconds
	$effect(() => {
		const timer = setInterval(() => {
			const now = Date.now();
			tickerEvents = tickerEvents.filter((e) => now - e.timestamp < 8000);
		}, 500);
		return () => clearInterval(timer);
	});
</script>

<svelte:head>
	<style>
		html,
		body {
			background: transparent !important;
			margin: 0;
			padding: 0;
			overflow: hidden;
			width: 100%;
			height: 100%;
		}
	</style>
</svelte:head>

<!-- Full-screen transparent canvas — OBS browser source fills this -->
<div id="main-content" role="main" tabindex="-1" class="screen" class:screen-shake={shakeScreen}>
	{#if !connected}
		<!-- Small connecting indicator top-left -->
		<div class="connecting-chip">
			<span class="dot-pulse"></span>
			Connecting…
		</div>
	{:else if inCombat}
		<!-- ── Left column: Now Acting + event ticker ── -->
		<div class="left-stack">
			{#if current}
				{#key current.id}
					{@const pct = hpPercent(current)}
					<aside class="side-panel">
						<div class="header">
							<i class="fa-duotone fa-light fa-swords sword" aria-hidden="true"></i>
							<span class="round-label">ROUND {combatState.round}</span>
							<span class="type-badge {current.type === 'player' ? 'badge-pc' : 'badge-npc'}">
								{current.type === 'player' ? 'PC' : 'NPC'}
							</span>
						</div>

						<div class="current-body">
							<div class="now-acting-label">Now Acting</div>
							<div class="current-main">
								{#if avatarSrc}
									<div class="avatar-wrap">
										<img src={avatarSrc} alt={current.name} class="avatar-img" />
									</div>
								{/if}
								<div class="current-info">
									<div class="current-name">{current.name}</div>

									{#if deathSaves}
										<div class="ds-panel">
											<div class="ds-title">
												<i class="fa-duotone fa-light fa-skull" aria-hidden="true"></i> Death Saves
											</div>
											{#if deathSaves.failures >= 3}
												<div class="ds-state ds-dead">
													<i class="fa-duotone fa-light fa-skull" aria-hidden="true"></i> Dead
												</div>
											{:else if deathSaves.stable || deathSaves.successes >= 3}
												<div class="ds-state ds-stable">
													<i class="fa-duotone fa-light fa-heart" aria-hidden="true"></i> Stabilized
												</div>
											{:else}
												<div class="ds-row">
													<span class="ds-label ds-fail-label">Fail</span>
													{#each [0, 1, 2] as i}
														<span class="ds-pip" class:ds-fail-on={deathSaves.failures > i}>
															<i
																class={deathSaves.failures > i
																	? 'fa-duotone fa-light fa-skull'
																	: 'fa-regular fa-circle'}
																aria-hidden="true"
															></i>
														</span>
													{/each}
												</div>
												<div class="ds-row">
													<span class="ds-label ds-pass-label">Pass</span>
													{#each [0, 1, 2] as i}
														<span class="ds-pip" class:ds-pass-on={deathSaves.successes > i}>
															<i
																class={deathSaves.successes > i
																	? 'fa-duotone fa-light fa-heart'
																	: 'fa-regular fa-circle'}
																aria-hidden="true"
															></i>
														</span>
													{/each}
												</div>
											{/if}
										</div>
									{:else if current.maxHp > 0}
										<!-- Exact HP numbers are players-only, matching the viewer display;
										     enemies get the bar alone. -->
										{#if current.type === 'player'}
											<div class="current-hp-row">
												<span
													class="current-hp-num"
													style="color:{pct <= 0
														? '#6b7280'
														: pct <= 25
															? '#f87171'
															: pct <= 50
																? '#fbbf24'
																: '#4ade80'}">{hpLabel(current)}</span
												>
												<span class="current-hp-label">HP</span>
											</div>
										{/if}
										<div class="current-hp-track">
											{#if current.tempHp > 0}
												{@const total = current.maxHp + current.tempHp}
												{@const hpW = (current.currentHp / total) * 100}
												{@const thpW = (current.tempHp / total) * 100}
												<div
													class="current-hp-fill"
													style="width:{hpW}%;background:{pct <= 0
														? '#374151'
														: pct <= 25
															? '#dc2626'
															: pct <= 50
																? '#d97706'
																: '#16a34a'}"
												></div>
												<div class="current-hp-temp" style="left:{hpW}%;width:{thpW}%"></div>
											{:else}
												<div
													class="current-hp-fill"
													style="width:{pct}%;background:{pct <= 0
														? '#374151'
														: pct <= 25
															? '#dc2626'
															: pct <= 50
																? '#d97706'
																: '#16a34a'}"
												></div>
											{/if}
										</div>
									{/if}

									{#if current.statuses.length > 0 || extraBadges.length > 0}
										<div class="current-badges">
											{#each extraBadges as extra}
												<span class="badge" style="background:{extra.bg}">{extra.text}</span>
											{/each}
											{#each current.statuses as status}
												<span class="badge" style="background:{conditionBg[status] ?? '#374151'}"
													>{conditionAbbrev[status] ?? status}</span
												>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</div>
					</aside>
				{/key}
			{/if}

			<!-- ── Event ticker ── -->
			{#if tickerEvents.length > 0}
				<div class="ticker-panel">
					{#each tickerEvents as event (event.id)}
						<div class="ticker-row" style="--event-color:{event.color}">
							<span class="ticker-icon">{@html event.icon}</span>
							<span class="ticker-text">{event.text}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- ── Up Next bar (full-width, bottom of screen) ── -->
		{#if upNext.length > 0}
			<footer class="up-next-bar">
				<div class="un-label-group">
					<span class="un-label">Up Next</span>
					<i class="fa-duotone fa-light fa-square-arrow-right un-arrow" aria-hidden="true"></i>
				</div>

				<div class="un-cards">
					{#each upNext as c, i}
						{@const pct = hpPercent(c)}
						{#if i === wrapIndex}
							<div class="wrap-divider">
								<div class="wrap-line"></div>
								<span class="wrap-text">Next Round</span>
								<div class="wrap-line"></div>
							</div>
						{/if}
						<div class="un-card {c.type === 'player' ? 'un-player' : 'un-enemy'}">
							<div class="un-top">
								<span class="un-type-badge {c.type === 'player' ? 'badge-pc' : 'badge-npc'}"
									>{c.type === 'player' ? 'PC' : 'NPC'}</span
								>
								<span class="un-name">{c.name}</span>
								{#if c.type === 'enemy' && pct <= 50 && pct > 0}
									<i class="fa-duotone fa-light fa-droplet" title="Bloodied" aria-hidden="true"></i>
								{/if}
								{#if c.initiative !== null}
									<span class="un-init">{c.initiative}</span>
								{/if}
							</div>
							<div class="un-bar-track">
								<div
									class="un-bar-fill"
									style="width:{pct}%;background:{pct <= 0
										? '#374151'
										: pct <= 25
											? '#dc2626'
											: pct <= 50
												? '#d97706'
												: '#16a34a'}"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</footer>
		{/if}
	{/if}

	<!-- ── Chase lower third (bottom third of the frame, sits over the Up Next bar) ── -->
	{#if combatState.chaseState && shownChase}
		<section
			class="chase-third"
			aria-label="The Chase"
			in:fly={{ y: 80, duration: 450 }}
			out:fade={{ duration: 400 }}
		>
			<div aria-hidden="true" class="chase-particles">
				{#each CHASE_PARTICLES as p, i (i)}
					<span
						class="chase-particle"
						style="top: {p.top}%; width: {p.length}px; height: {p.thickness}px; animation-duration: {p.duration}s; animation-delay: -{p.delay}s; --chase-particle-opacity: {p.opacity};"
					></span>
				{/each}
			</div>

			<div class="chase-content">
				<div class="chase-title">
					<i class="fa-duotone fa-light fa-person-running chase-title-icon" aria-hidden="true"></i>
					The Chase
				</div>

				<ChaseTrackBoard
					bands={shownChase.bands}
					participants={shownChase.participants}
					size="md"
					wide
				/>

				<div class="chase-legend">
					{#each shownChase.participants as p, idx (p.id)}
						<div class="chase-legend-item" class:chase-dropped={p.dropped}>
							<span class="chase-legend-badge {chaseBadgeClasses(p)}">{idx + 1}</span>
							<span
								class="chase-legend-name"
								class:legend-quarry={p.role === 'quarry' && !p.dropped}
								class:legend-pursuer={p.role !== 'quarry' && !p.dropped}
								class:legend-out={p.dropped}>{p.name}</span
							>
							{#if p.exhaustionPips > 0}
								<span class="chase-pips">
									{#each Array(p.exhaustionPips) as _}<span class="chase-pip"></span>{/each}
								</span>
							{/if}
						</div>
					{/each}
				</div>

				{#if shownChase.complication}
					<div class="chase-complication">
						<i class="fa-duotone fa-light fa-triangle-exclamation" aria-hidden="true"></i>
						<span>{shownChase.complication}</span>
					</div>
				{/if}
			</div>
		</section>
	{/if}

	<!-- ── Dungeon map lower third: fog-of-war map, shown briefly after a room is revealed ── -->
	{#if fogOpen && combatState.dungeonMapState}
		{@const ms = combatState.dungeonMapState}
		<section
			class="fog-third"
			aria-label="Dungeon map"
			in:fly={{ y: 80, duration: 450 }}
			out:fade={{ duration: 400 }}
		>
			<div class="fog-header">
				<i class="fa-duotone fa-light fa-map" aria-hidden="true"></i>
				<span>{ms.dungeonName || 'Dungeon Map'}</span>
				{#if ms.floors.length > 1}
					<span class="fog-floor">Floor {ms.currentFloor + 1} of {ms.floors.length}</span>
				{/if}
			</div>
			<div class="fog-stage" bind:clientWidth={fogStageW} bind:clientHeight={fogStageH}>
				<canvas
					aria-label="Dungeon map shared by the DM"
					bind:this={fogCanvas}
					bind:clientWidth={fogCanvasW}
					bind:clientHeight={fogCanvasH}
					class="fog-canvas"
					style="transform: {fogTransform || 'none'};"
				></canvas>
			</div>
		</section>
	{/if}

	<!-- ── Document Share: DM's handout (image/PDF page) + live annotations, full-screen ── -->
	{#if docShareView?.visible}
		<div class="doc-share-full" transition:fade={{ duration: 400 }}>
			{#if docSharePageUrls[docShareView.currentPage]}
				<div class="doc-share-stage">
					{#key `${docShareView.id}:${docShareView.currentPage}`}
						<img
							src={docSharePageUrls[docShareView.currentPage]}
							alt={docShareView.name}
							class="doc-share-img"
							transition:fade={{ duration: 250 }}
							onload={(e) => {
								docShareNaturalW = (e.currentTarget as HTMLImageElement).naturalWidth;
								docShareNaturalH = (e.currentTarget as HTMLImageElement).naturalHeight;
							}}
						/>
					{/key}
					{#if docShareNaturalW > 0}
						<AnnotationCanvas
							naturalWidth={docShareNaturalW}
							naturalHeight={docShareNaturalH}
							strokes={docShareAnnotations[docShareView.currentPage] ?? []}
						/>
					{/if}
				</div>
			{:else}
				<i class="fa-duotone fa-light fa-spinner-third doc-share-spinner" aria-hidden="true"></i>
			{/if}
			{#if docShareView.pageCount > 1}
				<div class="doc-share-page">
					Page {docShareView.currentPage + 1} / {docShareView.pageCount}
				</div>
			{/if}
		</div>
	{/if}

	<!-- ── Battle Map: takes over the whole frame while the DM has it shown ── -->
	{#if battleMapView?.visible && battleMapImageUrl}
		<div class="battle-map-full" transition:fade={{ duration: 400 }}>
			<BattleGridCanvas
				imageUrl={battleMapImageUrl}
				naturalWidth={battleMapView.naturalWidth}
				naturalHeight={battleMapView.naturalHeight}
				gridSquaresAcross={battleMapView.gridSquaresAcross}
				gridSquaresDown={battleMapView.gridSquaresDown}
				feetPerSquare={battleMapView.feetPerSquare}
				showGrid={battleMapView.showGrid}
				tokens={battleMapTokens}
				combatants={combatState.combatants}
				ruler={battleMapRuler}
				strokes={battleMapStrokes}
				{ruleset}
				showZoomControls={false}
				fadeEdges
				focus={battleMapFocus}
			/>
		</div>
	{/if}

	<!-- ── Dungeon room reveal: panel with a word-by-word description, over a dimmed frame ── -->
	{#if combatState.dungeonRoomDescription}
		{@const rd = combatState.dungeonRoomDescription}
		{@const bodyWords = rd.body.split(' ')}
		{@const nameWords = rd.name.split(' ')}
		<div class="room-reveal-backdrop" transition:fade={{ duration: 1200 }}>
			<div class="room-reveal-panel">
				<div class="room-reveal-meta">{rd.theme} · {rd.label}</div>
				<h2 class="room-reveal-name">
					{#each nameWords as word, i}
						<span class="room-word" style="animation-delay: {400 + i * 120}ms"
							>{word}{i < nameWords.length - 1 ? ' ' : ''}</span
						>
					{/each}
				</h2>
				<p class="room-reveal-body">
					{#each bodyWords as word, i}
						<span class="room-word" style="animation-delay: {800 + i * 80}ms"
							>{word}{i < bodyWords.length - 1 ? ' ' : ''}</span
						>
					{/each}
				</p>
				{#if rd.hazard}
					{@const hazardWords = rd.hazard.split(' ')}
					<div class="room-reveal-hazard">
						<i class="fa-duotone fa-light fa-triangle-exclamation" aria-hidden="true"></i>
						<span>
							{#each hazardWords as word, i}
								<span
									class="room-word"
									style="animation-delay: {800 + bodyWords.length * 80 + 400 + i * 80}ms"
									>{word}{i < hazardWords.length - 1 ? ' ' : ''}</span
								>
							{/each}
						</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- ── Stinger: Bloodied! / Stabilized! / Dead ── -->
	{#if stinger}
		<div class="stinger-wrap">
			{#key stinger.key}
				<div
					class="stinger stinger-{stinger.kind}"
					in:fly={{ y: -20, duration: 350 }}
					out:fly={{ y: 20, duration: 250 }}
				>
					<i
						class="fa-duotone fa-light {STINGER_ICON[stinger.kind]} stinger-icon"
						aria-hidden="true"
					></i>
					<p class="stinger-text">{stinger.text}</p>
					<p class="stinger-sub">{stinger.sub}</p>
				</div>
			{/key}
		</div>
	{/if}

	<!-- ── Battle start/end banner ── -->
	{#if showStartBanner}
		<div class="battle-banner">
			<div class="impact-flash"></div>
			<div class="shockwave"></div>
			<div class="combat-banner-text start-text">
				<i class="fa-duotone fa-light fa-swords banner-icon" aria-hidden="true"></i>
				Combat
				<i class="fa-duotone fa-light fa-swords banner-icon" aria-hidden="true"></i>
			</div>
		</div>
	{:else if showEndBanner}
		<div class="battle-banner">
			<div class="combat-banner-text end-text">Combat Ended</div>
		</div>
	{/if}
</div>

<style>
	* {
		box-sizing: border-box;
	}

	/* Full-screen transparent canvas */
	.screen {
		position: fixed;
		inset: 0;
		font-family: 'Segoe UI', system-ui, sans-serif;
		pointer-events: none;
	}

	/* ── Connecting chip ── */
	.connecting-chip {
		position: absolute;
		top: 20px;
		left: 20px;
		display: flex;
		align-items: center;
		gap: 10px;
		background: rgba(6, 8, 24, 0.85);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 9px;
		padding: 10px 16px;
		color: rgba(255, 255, 255, 0.4);
		font-size: 15px;
	}

	/* ── Left column stack ── */
	.left-stack {
		position: absolute;
		top: 20px;
		left: 20px;
		width: 290px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	/* ── Side panel ── */
	.side-panel {
		background: rgba(6, 8, 24, 0.88);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		overflow: hidden;
		backdrop-filter: blur(4px);
		animation: turn-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	/* ── Event ticker ── */
	.ticker-panel {
		background: rgba(6, 8, 24, 0.82);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 10px;
		overflow: hidden;
		backdrop-filter: blur(4px);
	}

	.ticker-row {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 7px 14px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		animation: event-in 0.25s ease both;
	}

	.ticker-row:last-child {
		border-bottom: none;
	}

	.ticker-icon {
		font-size: 11px;
		font-weight: 800;
		color: var(--event-color);
		flex-shrink: 0;
		width: 13px;
		text-align: center;
		line-height: 1;
	}

	.ticker-text {
		font-size: 13px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.7);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	@keyframes event-in {
		from {
			opacity: 0;
			transform: translateY(-5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes turn-in {
		from {
			opacity: 0;
			transform: translateX(-18px) scale(0.97);
		}
		to {
			opacity: 1;
			transform: translateX(0) scale(1);
		}
	}

	.header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 11px 16px 10px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
		background: rgba(255, 255, 255, 0.03);
	}

	.sword {
		opacity: 0.5;
		font-size: 16px;
	}

	.round-label {
		font-size: 14px;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: rgba(251, 191, 36, 0.9);
		text-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
		flex: 1;
	}

	.type-badge {
		font-size: 10px;
		font-weight: 800;
		padding: 2px 6px;
		border-radius: 4px;
		letter-spacing: 0.05em;
		flex-shrink: 0;
	}

	.badge-pc {
		background: rgba(30, 64, 175, 0.6);
		color: #93c5fd;
	}

	.badge-npc {
		background: rgba(127, 29, 29, 0.6);
		color: #fca5a5;
	}

	/* Currently Up card body */
	.current-body {
		padding: 14px 16px 16px;
	}

	.now-acting-label {
		font-size: 10px;
		font-weight: 900;
		letter-spacing: 0.25em;
		text-transform: uppercase;
		color: rgba(251, 191, 36, 0.6);
		margin-bottom: 8px;
	}

	.current-main {
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}

	.avatar-wrap {
		flex-shrink: 0;
		width: 58px;
		height: 58px;
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.05);
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.current-info {
		flex: 1;
		min-width: 0;
	}

	.current-name {
		font-size: 20px;
		font-weight: 700;
		color: #f8fafc;
		text-shadow: 0 2px 6px rgba(0, 0, 0, 0.9);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.15;
		margin-bottom: 10px;
	}

	.current-hp-row {
		display: flex;
		align-items: baseline;
		gap: 5px;
		margin-bottom: 6px;
	}

	.current-hp-num {
		font-size: 18px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
	}

	.current-hp-label {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: rgba(255, 255, 255, 0.3);
		text-transform: uppercase;
	}

	.current-hp-track {
		position: relative;
		height: 7px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		overflow: hidden;
	}

	.current-hp-fill {
		height: 100%;
		border-radius: 4px;
		transition:
			width 0.4s ease,
			background 0.4s ease;
	}

	.current-hp-temp {
		position: absolute;
		top: 0;
		height: 100%;
		background: #facc15;
		border-radius: 4px;
		opacity: 0.9;
		transition:
			width 0.4s ease,
			left 0.4s ease;
	}

	.current-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 10px;
	}

	.badge {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: rgba(255, 255, 255, 0.9);
		padding: 2px 5px;
		border-radius: 3px;
	}

	/* ── Up Next bar ── */
	.up-next-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 14px 32px;
		background: rgba(6, 8, 24, 0.9);
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(6px);
	}

	.un-label-group {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}

	.un-label {
		font-size: 12px;
		font-weight: 900;
		letter-spacing: 0.25em;
		color: rgba(107, 114, 128, 0.9);
		text-transform: uppercase;
		white-space: nowrap;
	}

	.un-arrow {
		font-size: 12px;
		color: rgba(107, 114, 128, 0.4);
	}

	.un-cards {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}

	.wrap-divider {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.wrap-line {
		width: 1px;
		height: 34px;
		background: rgba(251, 191, 36, 0.25);
	}

	.wrap-text {
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.15em;
		color: rgba(251, 191, 36, 0.5);
		text-transform: uppercase;
		white-space: nowrap;
	}

	.un-card {
		flex: 1;
		min-width: 0;
		max-width: 240px;
		padding: 8px 12px 9px;
		border-radius: 8px;
		border: 1px solid;
	}

	.un-player {
		border-color: rgba(59, 130, 246, 0.35);
		background: rgba(30, 58, 138, 0.3);
	}

	.un-enemy {
		border-color: rgba(185, 28, 28, 0.35);
		background: rgba(69, 10, 10, 0.3);
	}

	.un-top {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 6px;
	}

	.un-type-badge {
		font-size: 10px;
		font-weight: 800;
		padding: 2px 5px;
		border-radius: 3px;
		flex-shrink: 0;
		letter-spacing: 0.05em;
	}

	.badge-pc {
		background: rgba(30, 64, 175, 0.6);
		color: #93c5fd;
	}

	.badge-npc {
		background: rgba(127, 29, 29, 0.6);
		color: #fca5a5;
	}

	.un-name {
		flex: 1;
		font-size: 15px;
		font-weight: 600;
		color: #f1f5f9;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
		min-width: 0;
	}

	.un-init {
		font-size: 13px;
		font-weight: 700;
		color: rgba(251, 191, 36, 0.7);
		flex-shrink: 0;
		font-variant-numeric: tabular-nums;
	}

	.un-bar-track {
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		overflow: hidden;
	}

	.un-bar-fill {
		height: 100%;
		border-radius: 2px;
		transition: width 0.4s ease;
	}

	/* ── Connecting pulse dot ── */
	.dot-pulse {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		animation: pulse 1.4s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.3;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.3);
		}
	}

	/* ── Chase lower third ── */
	.chase-third {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 33.333vh;
		z-index: 5;
		overflow: hidden;
		background: rgba(3, 7, 18, 0.96);
		border-top: 1px solid rgba(251, 191, 36, 0.35);
		box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5);
	}

	.chase-particles {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.chase-particle {
		position: absolute;
		left: 100%;
		border-radius: 999px;
		background: linear-gradient(to left, rgba(96, 165, 250, 0.95), rgba(96, 165, 250, 0));
		box-shadow: 0 0 6px 1px rgba(96, 165, 250, 0.55);
		animation-name: chase-streak;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
	}

	@keyframes chase-streak {
		0% {
			transform: translateX(0);
			opacity: 0;
		}
		8%,
		92% {
			opacity: var(--chase-particle-opacity, 0.6);
		}
		100% {
			transform: translateX(-160vw);
			opacity: 0;
		}
	}

	.chase-content {
		position: relative;
		z-index: 1;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 8px;
		padding: 8px 40px;
	}

	.chase-title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		font-size: 20px;
		font-weight: 900;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: #fbbf24;
		text-shadow: 0 0 14px rgba(251, 191, 36, 0.4);
	}

	.chase-title-icon {
		font-size: 22px;
	}

	.chase-legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 6px 28px;
	}

	.chase-legend-item {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.chase-dropped {
		opacity: 0.5;
	}

	.chase-legend-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border-width: 2px;
		border-style: solid;
		font-size: 12px;
		font-weight: 700;
	}

	.chase-legend-name {
		font-size: 16px;
		font-weight: 600;
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
	}

	.legend-quarry {
		color: #fcd34d;
	}

	.legend-pursuer {
		color: #fca5a5;
	}

	.legend-out {
		color: #6b7280;
		text-decoration: line-through;
	}

	.chase-pips {
		display: flex;
		gap: 2px;
	}

	.chase-pip {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #fb923c;
	}

	.chase-complication {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		margin: 0 auto;
		max-width: 1100px;
		padding: 8px 18px;
		border-radius: 10px;
		border: 1px solid rgba(124, 45, 18, 0.5);
		background: rgba(67, 20, 7, 0.45);
		color: #fdba74;
		font-size: 16px;
		font-style: italic;
		line-height: 1.35;
	}

	/* ── Battle start/end banner ── */
	.screen-shake {
		animation: screen-shake 0.4s ease-in-out;
	}

	@keyframes screen-shake {
		0%,
		100% {
			transform: translate(0, 0);
		}
		10% {
			transform: translate(-6px, 3px);
		}
		20% {
			transform: translate(5px, -4px);
		}
		30% {
			transform: translate(-5px, 4px);
		}
		40% {
			transform: translate(6px, -3px);
		}
		50% {
			transform: translate(-4px, 2px);
		}
		60% {
			transform: translate(3px, -2px);
		}
		70% {
			transform: translate(-2px, 1px);
		}
		80% {
			transform: translate(2px, -1px);
		}
		90% {
			transform: translate(-1px, 0);
		}
	}

	/* ── Dungeon map lower third ── */
	.fog-third {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 33.333vh;
		z-index: 6;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: rgba(3, 7, 18, 0.96);
		border-top: 1px solid rgba(129, 140, 248, 0.4);
		box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5);
	}

	.fog-header {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 24px 4px;
		font-size: 15px;
		font-weight: 700;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #a5b4fc;
	}

	.fog-floor {
		margin-left: auto;
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.1em;
		color: #6b7280;
	}

	.fog-stage {
		flex: 1;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden; /* the zoomed canvas must not spill past the strip */
		padding: 4px 24px 12px;
	}

	.fog-canvas {
		display: block;
		max-width: 100%;
		max-height: 100%;
		width: auto;
		height: auto;
		image-rendering: pixelated;
		transform-origin: 50% 50%;
		transition: transform 900ms cubic-bezier(0.45, 0, 0.2, 1);
	}

	/* ── Dungeon room reveal (above handouts and the map, like the viewer) ── */
	.room-reveal-backdrop {
		position: absolute;
		inset: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(3, 7, 18, 0.85);
		backdrop-filter: blur(4px);
	}

	.room-reveal-panel {
		width: 100%;
		max-width: 780px;
		padding: 44px 52px;
		border-radius: 20px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: #111827;
		text-align: center;
		box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
		animation: room-panel-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	@keyframes room-panel-in {
		from {
			opacity: 0;
			transform: scale(0.88) translateY(16px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.room-reveal-meta {
		margin-bottom: 6px;
		font-size: 15px;
		font-weight: 600;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #6b7280;
		opacity: 0;
		animation: word-rise 0.6s ease-out 200ms forwards;
	}

	.room-reveal-name {
		margin: 0 0 22px;
		font-size: 44px;
		font-weight: 700;
		color: #fff;
		line-height: 1.15;
	}

	.room-reveal-body {
		margin: 0;
		font-size: 26px;
		font-style: italic;
		line-height: 1.55;
		color: #d1d5db;
	}

	.room-reveal-hazard {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		margin-top: 24px;
		padding: 12px 18px;
		border-radius: 10px;
		border: 1px solid rgba(124, 45, 18, 0.5);
		background: rgba(67, 20, 7, 0.45);
		text-align: left;
		font-size: 20px;
		font-style: italic;
		line-height: 1.45;
		color: #fdba74;
	}

	.room-word {
		display: inline;
		opacity: 0;
		animation: word-rise 0.5s ease-out forwards;
	}

	@keyframes word-rise {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ── Document Share full-screen (above the battle map, like the viewer) ── */
	.doc-share-full {
		position: absolute;
		inset: 0;
		z-index: 9;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		background: #030712;
	}

	.doc-share-stage {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.doc-share-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		border-radius: 8px;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
	}

	.doc-share-spinner {
		font-size: 48px;
		color: #4b5563;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.doc-share-page {
		position: absolute;
		bottom: 32px;
		left: 50%;
		transform: translateX(-50%);
		padding: 6px 16px;
		border-radius: 999px;
		border: 1px solid #374151;
		background: rgba(17, 24, 39, 0.9);
		color: #d1d5db;
		font-size: 15px;
		font-weight: 600;
	}

	/* ── Death saves (Now Acting card, downed player) ── */
	.ds-panel {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.ds-title {
		font-size: 11px;
		font-weight: 900;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: rgba(156, 163, 175, 0.9);
	}

	.ds-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.ds-label {
		width: 34px;
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.ds-fail-label {
		color: #ef4444;
	}

	.ds-pass-label {
		color: #16a34a;
	}

	.ds-pip {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 2px solid #374151;
		background: rgba(17, 24, 39, 0.6);
		color: #374151;
		font-size: 12px;
	}

	.ds-fail-on {
		border-color: #dc2626;
		background: rgba(153, 27, 27, 0.6);
		color: #fca5a5;
	}

	.ds-pass-on {
		border-color: #16a34a;
		background: rgba(22, 101, 52, 0.6);
		color: #86efac;
	}

	.ds-state {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 20px;
		font-weight: 900;
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}

	.ds-dead {
		color: #f87171;
	}

	.ds-stable {
		color: #4ade80;
	}

	/* ── Stingers (Bloodied! / Stabilized! / Dead) ── */
	.stinger-wrap {
		position: absolute;
		inset: 0;
		z-index: 25;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.stinger {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 32px 48px;
		border-radius: 16px;
		border: 1px solid;
		background: rgba(3, 7, 18, 0.9);
		backdrop-filter: blur(6px);
		text-align: center;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
	}

	.stinger-bloodied {
		border-color: rgba(220, 38, 38, 0.7);
		color: #f87171;
		box-shadow: 0 0 40px rgba(220, 38, 38, 0.3);
	}

	.stinger-stable {
		border-color: rgba(22, 163, 74, 0.7);
		color: #4ade80;
		box-shadow: 0 0 40px rgba(22, 163, 74, 0.3);
	}

	.stinger-dead {
		border-color: rgba(153, 27, 27, 0.7);
		color: #ef4444;
		box-shadow: 0 0 40px rgba(127, 29, 29, 0.4);
	}

	.stinger-icon {
		font-size: 64px;
	}

	.stinger-text {
		margin: 0;
		font-size: 48px;
		font-weight: 900;
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}

	.stinger-sub {
		margin: 0;
		font-size: 20px;
		color: #9ca3af;
	}

	/* ── Battle Map full-screen ── */
	.battle-map-full {
		position: absolute;
		inset: 0;
		z-index: 8;
		background: #030712;
	}

	.battle-banner {
		z-index: 20;
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.impact-flash {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			circle,
			rgba(255, 255, 255, 0.9) 0%,
			rgba(251, 191, 36, 0.4) 40%,
			transparent 70%
		);
		animation: impact-flash 0.35s ease-out forwards;
	}

	@keyframes impact-flash {
		0% {
			opacity: 0;
		}
		15% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}

	.shockwave {
		position: absolute;
		width: 40px;
		height: 40px;
		border: 6px solid rgba(251, 191, 36, 0.8);
		border-radius: 50%;
		animation: shockwave-ring 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	@keyframes shockwave-ring {
		0% {
			width: 40px;
			height: 40px;
			opacity: 0.9;
			border-width: 6px;
		}
		100% {
			width: 900px;
			height: 900px;
			opacity: 0;
			border-width: 1px;
		}
	}

	.combat-banner-text {
		position: relative;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		display: flex;
		align-items: center;
		gap: 24px;
	}

	.banner-icon {
		font-size: 0.55em;
		opacity: 0.85;
	}

	.start-text {
		font-size: 96px;
		color: #fef3c7;
		text-shadow:
			0 0 30px rgba(251, 191, 36, 0.9),
			0 4px 12px rgba(0, 0, 0, 0.8);
		animation: banner-in-out 1.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}

	@keyframes banner-in-out {
		0% {
			transform: scale(0) rotate(-8deg);
			opacity: 0;
		}
		15% {
			transform: scale(1.18) rotate(2deg);
			opacity: 1;
		}
		25% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
		82% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
		100% {
			transform: scale(0.6) rotate(0deg);
			opacity: 0;
		}
	}

	.end-text {
		font-size: 64px;
		color: #e2e8f0;
		text-shadow:
			0 0 24px rgba(148, 163, 184, 0.6),
			0 4px 12px rgba(0, 0, 0, 0.8);
		animation: banner-fade 2.2s ease-in-out forwards;
	}

	@keyframes banner-fade {
		0% {
			opacity: 0;
			transform: translateY(14px);
		}
		15% {
			opacity: 1;
			transform: translateY(0);
		}
		75% {
			opacity: 1;
			transform: translateY(0);
		}
		100% {
			opacity: 0;
			transform: translateY(-10px);
		}
	}
</style>
