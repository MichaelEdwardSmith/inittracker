<!-- Shared battle-grid rendering + interaction layer — sits over a map image (parent must size a
     box for it, same contract as AnnotationCanvas). Renders a calibrated grid, combatant tokens,
     a measurement ruler, and DM freehand/straight-line drawing. Coordinates are normalized (0-1)
     relative to the map image's own dimensions, exactly like Document Share's stroke coordinates,
     so the same position data renders correctly on the DM's modal preview and a viewer's
     full-screen display at any size. Non-interactive instances (the player display) just render
     props as they change. -->
<script lang="ts">
	import { computeContainRect } from '$lib/utils';
	import { hpPercent, hpTextColor } from '$lib/utils';
	import { getMonsterDetail } from '$lib/enemies';
	import { getMonsterDetail2024 } from '$lib/enemies2024';
	import { getMonsterEmoji, getMonsterStyle } from '$lib/monsterAvatars';
	import type { Combatant } from '$lib/types';
	import type { BattleMapToken, BattleMapRuler, BattleMapStroke } from '$lib/battleMapTypes';

	type Tool = 'move' | 'measure' | 'pen' | 'line' | 'erase';

	interface Props {
		imageUrl: string;
		naturalWidth: number;
		naturalHeight: number;
		gridSquaresAcross: number;
		gridSquaresDown: number;
		feetPerSquare: number;
		showGrid: boolean;
		tokens: BattleMapToken[];
		combatants: Combatant[];
		ruler: BattleMapRuler | null;
		strokes: BattleMapStroke[];
		ruleset?: '2014' | '2024';
		interactive?: boolean;
		tool?: Tool;
		drawColor?: string;
		drawWidth?: number;
		snapLine?: boolean;
		onTokenMove?: (combatantId: string, x: number, y: number) => void;
		onRulerChange?: (ruler: BattleMapRuler | null) => void;
		onStrokeComplete?: (stroke: BattleMapStroke) => void;
		onLiveDraw?: (strokes: BattleMapStroke[]) => void;
		onErase?: (strokes: BattleMapStroke[]) => void;
	}
	let {
		imageUrl,
		naturalWidth,
		naturalHeight,
		gridSquaresAcross,
		gridSquaresDown,
		feetPerSquare,
		showGrid,
		tokens,
		combatants,
		ruler,
		strokes,
		ruleset = '2014',
		interactive = false,
		tool = 'move',
		drawColor = '#ef4444',
		drawWidth = 0.006,
		snapLine = false,
		onTokenMove,
		onRulerChange,
		onStrokeComplete,
		onLiveDraw,
		onErase
	}: Props = $props();

	let containerW = $state(0);
	let containerH = $state(0);
	let overlay: HTMLDivElement | undefined = $state();

	// ── Zoom + pan — a per-viewer preference, not shared combat state, so it's local UI state
	// rather than a synced prop. Center-anchored zoom; pan is clamped so the content's edges
	// never leave dead space inside the container. ──
	const ZOOM_MIN = 1;
	const ZOOM_MAX = 4;
	const ZOOM_STEP = 0.5;
	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);

	// Panning is expressed in real screen pixels (not normalized to the image), applied outside
	// the scale transform, so a given pointer-movement delta pans by the same screen distance
	// regardless of zoom level.
	function clampPan(x: number, y: number): [number, number] {
		const maxX = (containerW * (zoom - 1)) / 2;
		const maxY = (containerH * (zoom - 1)) / 2;
		return [Math.max(-maxX, Math.min(maxX, x)), Math.max(-maxY, Math.min(maxY, y))];
	}

	function zoomIn() {
		zoom = Math.min(ZOOM_MAX, zoom + ZOOM_STEP);
		[panX, panY] = clampPan(panX, panY);
	}
	function zoomOut() {
		zoom = Math.max(ZOOM_MIN, zoom - ZOOM_STEP);
		[panX, panY] = clampPan(panX, panY);
	}
	function resetZoom() {
		zoom = 1;
		panX = 0;
		panY = 0;
	}

	// A new map replaces the old one entirely — start it unzoomed/uncentered rather than
	// carrying over whatever zoom/pan was set for the previous image.
	$effect(() => {
		imageUrl;
		zoom = 1;
		panX = 0;
		panY = 0;
	});

	// ── Panning — dragging empty map space (not a token) pans when zoomed in. Uses the same
	// `tool` gate as everything else: available whenever the DM's Move tool is active, or
	// unconditionally on the read-only player view (which has no competing tool). ──
	let panning = $state(false);
	let panPointerStart: [number, number] = [0, 0];
	let panOrigin: [number, number] = [0, 0];

	function canPan(): boolean {
		return (!interactive || tool === 'move') && zoom > ZOOM_MIN;
	}

	function startPan(e: PointerEvent) {
		if (!canPan()) return;
		panning = true;
		panPointerStart = [e.clientX, e.clientY];
		panOrigin = [panX, panY];
		overlay?.setPointerCapture(e.pointerId);
	}

	function movePan(e: PointerEvent) {
		if (!panning) return;
		const dx = e.clientX - panPointerStart[0];
		const dy = e.clientY - panPointerStart[1];
		[panX, panY] = clampPan(panOrigin[0] + dx, panOrigin[1] + dy);
	}

	function endPan(e: PointerEvent) {
		if (!panning) return;
		panning = false;
		overlay?.releasePointerCapture(e.pointerId);
	}

	const rect = $derived(computeContainRect(containerW, containerH, naturalWidth, naturalHeight));

	// Grid cell size, normalized (0-1) relative to the image's own width/height respectively.
	// The square's real size is ALWAYS derived from the width alone (gridSquaresAcross), so cells
	// stay true squares no matter what — "squares down" doesn't stretch cell height, it only
	// controls how many rows of that fixed-size square get drawn (which may leave the rest of a
	// tall image ungridded, or clip past a short one — both are intentional: the DM is defining
	// the play area's extent, not distorting the grid to fit the whole image).
	const squareNormX = $derived(gridSquaresAcross > 0 ? 1 / gridSquaresAcross : 1);
	const squareNormY = $derived(
		naturalHeight > 0 ? squareNormX * (naturalWidth / naturalHeight) : squareNormX
	);
	// Falls back to however many rows naturally fit the image if gridSquaresDown is ever
	// missing/invalid (e.g. a map's view state predates this field, since it lives in
	// in-memory-only server state that isn't migrated).
	const effectiveRows = $derived(
		gridSquaresDown > 0 ? gridSquaresDown : squareNormY > 0 ? Math.round(1 / squareNormY) : 1
	);

	// A token spanning an even number of squares (2x2 Large, 4x4 Gargantuan) has no single
	// square at its middle — its true center sits on the intersection between squares. An
	// odd span (1x1, 3x3 Huge) or a fractional one (0.5 Tiny) centers on a square like normal.
	function snapToGrid(nx: number, ny: number, squares = 1): [number, number] {
		if (squares % 2 === 0) {
			const col = Math.max(0, Math.min(gridSquaresAcross, Math.round(nx / squareNormX)));
			const row = Math.max(0, Math.min(effectiveRows, Math.round(ny / squareNormY)));
			return [col * squareNormX, row * squareNormY];
		}
		const col = Math.max(0, Math.min(gridSquaresAcross - 1, Math.floor(nx / squareNormX)));
		const row = Math.max(0, Math.min(effectiveRows - 1, Math.floor(ny / squareNormY)));
		return [(col + 0.5) * squareNormX, (row + 0.5) * squareNormY];
	}

	// Snaps to the nearest grid *intersection* rather than a cell center — used for the line
	// tool, where a wall/boundary runs along square edges rather than through their middle.
	function snapToGridCorner(nx: number, ny: number): [number, number] {
		const col = Math.max(0, Math.min(gridSquaresAcross, Math.round(nx / squareNormX)));
		const row = Math.max(0, Math.min(effectiveRows, Math.round(ny / squareNormY)));
		return [col * squareNormX, row * squareNormY];
	}

	function tokenVisual(c: Combatant) {
		if (c.type === 'player') {
			return { imgUrl: c.avatarUrl, emoji: null as string | null, ring: 'ring-blue-500' };
		}
		if (c.type === 'lair') {
			return { imgUrl: undefined, emoji: '🏰', ring: 'ring-purple-500' };
		}
		const detail =
			ruleset === '2024'
				? getMonsterDetail2024(c.templateName ?? '')
				: getMonsterDetail(c.templateName ?? '');
		const style = getMonsterStyle(c.monsterType);
		return {
			imgUrl: c.imgUrl ?? detail?.imgUrl,
			emoji: getMonsterEmoji(c.templateName, c.monsterType),
			ring: style.ring
		};
	}

	// D&D size category → how many grid squares across the token should span. Small and Medium
	// both occupy a single square per RAW, so they (and anything unrecognized — players, lairs,
	// custom monsters with no stat block on file) fall through to the 1-square default.
	const SIZE_SQUARES: Record<string, number> = {
		tiny: 0.5,
		large: 2,
		huge: 3,
		gargantuan: 4
	};

	// `c.size` is resolved once and stored on the combatant when it's added (store.svelte.ts),
	// which is the only way a custom/bestiary-imported monster's size is known at all — it isn't
	// in either built-in lookup map. Combatants added before that field existed fall back to
	// resolving it here: 2024 stat blocks carry `size` directly; 2014 ones only have it embedded
	// in the free-text `meta` string (e.g. "Large giant, chaotic evil").
	function monsterSizeCategory(c: Combatant): string | undefined {
		if (c.type !== 'enemy') return undefined;
		if (c.size) return c.size;
		if (ruleset === '2024') {
			return getMonsterDetail2024(c.templateName ?? '')?.size;
		}
		return getMonsterDetail(c.templateName ?? '')?.meta?.match(
			/^(Tiny|Small|Medium|Large|Huge|Gargantuan)/i
		)?.[0];
	}

	function tokenSizeSquares(c: Combatant): number {
		return SIZE_SQUARES[monsterSizeCategory(c)?.toLowerCase() ?? ''] ?? 1;
	}

	function combatantFor(id: string): Combatant | undefined {
		return combatants.find((c) => c.id === id);
	}

	function normalizedPoint(e: PointerEvent): [number, number] | null {
		if (!overlay) return null;
		const r = overlay.getBoundingClientRect();
		if (r.width === 0 || r.height === 0) return null;
		const nx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
		const ny = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
		return [nx, ny];
	}

	const LIVE_UPDATE_MS = 80;
	let lastLiveUpdate = 0;
	function throttled(fn: () => void) {
		const now = performance.now();
		if (now - lastLiveUpdate < LIVE_UPDATE_MS) return;
		lastLiveUpdate = now;
		fn();
	}

	// ── Token dragging ──────────────────────────────────────────────────────
	let draggingId = $state<string | null>(null);
	// Optimistic local position shown while dragging, so the token tracks the pointer
	// immediately instead of waiting on a server round-trip.
	let dragPos = $state<[number, number] | null>(null);

	function displayPos(t: BattleMapToken): [number, number] {
		return draggingId === t.combatantId && dragPos ? dragPos : [t.x, t.y];
	}

	function startTokenDrag(e: PointerEvent, combatantId: string) {
		if (!interactive || tool !== 'move') return;
		e.stopPropagation();
		const p = normalizedPoint(e);
		if (!p) return;
		draggingId = combatantId;
		const c = combatantFor(combatantId);
		dragPos = snapToGrid(p[0], p[1], c ? tokenSizeSquares(c) : 1);
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function moveTokenDrag(e: PointerEvent) {
		if (!draggingId) return;
		const p = normalizedPoint(e);
		if (!p) return;
		const c = combatantFor(draggingId);
		dragPos = snapToGrid(p[0], p[1], c ? tokenSizeSquares(c) : 1);
		throttled(() => onTokenMove?.(draggingId!, dragPos![0], dragPos![1]));
	}

	function endTokenDrag(e: PointerEvent) {
		if (!draggingId) return;
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		if (dragPos) onTokenMove?.(draggingId, dragPos[0], dragPos[1]);
		draggingId = null;
		dragPos = null;
	}

	// ── Measurement ruler ────────────────────────────────────────────────────
	let measuring = false;

	function startMeasure(e: PointerEvent) {
		if (!interactive || tool !== 'measure') return;
		const p = normalizedPoint(e);
		if (!p) return;
		measuring = true;
		onRulerChange?.({ from: p, to: p });
		overlay?.setPointerCapture(e.pointerId);
	}

	function moveMeasure(e: PointerEvent) {
		if (!measuring || !ruler) return;
		const p = normalizedPoint(e);
		if (!p) return;
		throttled(() => onRulerChange?.({ from: ruler!.from, to: p }));
	}

	function endMeasure(e: PointerEvent) {
		if (!measuring) return;
		measuring = false;
		overlay?.releasePointerCapture(e.pointerId);
		const p = normalizedPoint(e);
		if (p && ruler) onRulerChange?.({ from: ruler.from, to: p });
	}

	const rulerFeet = $derived.by(() => {
		if (!ruler) return 0;
		// Measured in grid-square units per axis (not raw pixels), so distance stays correct
		// even when columns/rows are calibrated to non-square cells.
		const dxSquares = (ruler.to[0] - ruler.from[0]) / squareNormX;
		const dySquares = (ruler.to[1] - ruler.from[1]) / squareNormY;
		const squares = Math.hypot(dxSquares, dySquares);
		return Math.round((squares * feetPerSquare) / 5) * 5;
	});

	// ── Drawing — freehand ("pen") grows a point list; a straight line ("line") always keeps
	// just its start and current point, so dragging re-aims it like a ruler. ──
	let drawing = false;
	let currentStrokePoints = $state<number[]>([]);

	function startDraw(e: PointerEvent) {
		if (!interactive || (tool !== 'pen' && tool !== 'line')) return;
		const p = normalizedPoint(e);
		if (!p) return;
		drawing = true;
		const start = tool === 'line' && snapLine ? snapToGridCorner(p[0], p[1]) : p;
		currentStrokePoints = [start[0], start[1]];
		overlay?.setPointerCapture(e.pointerId);
	}

	function moveDraw(e: PointerEvent) {
		if (!drawing) return;
		const p = normalizedPoint(e);
		if (!p) return;
		if (tool === 'line') {
			const end = snapLine ? snapToGridCorner(p[0], p[1]) : p;
			currentStrokePoints = [currentStrokePoints[0], currentStrokePoints[1], end[0], end[1]];
		} else {
			currentStrokePoints = [...currentStrokePoints, p[0], p[1]];
		}
		throttled(() => onLiveDraw?.(previewStrokes));
	}

	function endDraw(e: PointerEvent) {
		if (!drawing) return;
		drawing = false;
		overlay?.releasePointerCapture(e.pointerId);
		if (currentStrokePoints.length >= 4) {
			onStrokeComplete?.({ points: currentStrokePoints, color: drawColor, width: drawWidth });
		}
		currentStrokePoints = [];
	}

	const previewStrokes = $derived(
		currentStrokePoints.length >= 4
			? [...strokes, { points: currentStrokePoints, color: drawColor, width: drawWidth }]
			: strokes
	);

	// ── Erasing — removes whole strokes the pointer passes near, rather than clearing every
	// drawing at once. Distance is checked in on-screen pixels (via `rect`, same scale as
	// rendering) against each stroke's own line width, so thick lines are easier to hit than
	// thin ones. `eraseWorking` is a local copy for the duration of one drag so rapid successive
	// hits don't each wait on the `strokes` prop to round-trip back down before the next check. ──
	let erasing = false;
	let eraseWorking: BattleMapStroke[] = [];

	function pointToSegmentDist(
		px: number,
		py: number,
		x1: number,
		y1: number,
		x2: number,
		y2: number
	): number {
		const dx = x2 - x1;
		const dy = y2 - y1;
		const lenSq = dx * dx + dy * dy;
		const t = lenSq > 0 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq)) : 0;
		return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
	}

	function strokeNearPoint(stroke: BattleMapStroke, px: number, py: number): boolean {
		const pts = stroke.points;
		const threshold = Math.max(10, stroke.width * rect.w * 0.5 + 8);
		for (let i = 0; i + 3 < pts.length; i += 2) {
			const x1 = pts[i] * rect.w;
			const y1 = pts[i + 1] * rect.h;
			const x2 = pts[i + 2] * rect.w;
			const y2 = pts[i + 3] * rect.h;
			if (pointToSegmentDist(px, py, x1, y1, x2, y2) <= threshold) return true;
		}
		return false;
	}

	function eraseAt(nx: number, ny: number) {
		const px = nx * rect.w;
		const py = ny * rect.h;
		const remaining = eraseWorking.filter((s) => !strokeNearPoint(s, px, py));
		if (remaining.length === eraseWorking.length) return;
		eraseWorking = remaining;
		throttled(() => onErase?.(eraseWorking));
	}

	function startErase(e: PointerEvent) {
		if (!interactive || tool !== 'erase') return;
		const p = normalizedPoint(e);
		if (!p) return;
		erasing = true;
		eraseWorking = strokes;
		overlay?.setPointerCapture(e.pointerId);
		eraseAt(p[0], p[1]);
	}

	function moveErase(e: PointerEvent) {
		if (!erasing) return;
		const p = normalizedPoint(e);
		if (!p) return;
		eraseAt(p[0], p[1]);
	}

	function endErase(e: PointerEvent) {
		if (!erasing) return;
		erasing = false;
		overlay?.releasePointerCapture(e.pointerId);
		// Unthrottled final sync — guarantees the last hits in a fast drag actually get saved.
		onErase?.(eraseWorking);
	}

	function strokePointsAttr(points: number[]): string {
		const out: string[] = [];
		for (let i = 0; i < points.length; i += 2) {
			out.push(`${points[i] * rect.w},${points[i + 1] * rect.h}`);
		}
		return out.join(' ');
	}

	// ── Combined pointer dispatch — gated by `tool` within each handler, so exactly one
	// interaction is ever active at a time. Token drags start from the token's own pointerdown
	// (below) rather than here, and stop propagation, so a token click never also starts a pan. ──
	function handlePointerDown(e: PointerEvent) {
		startMeasure(e);
		startDraw(e);
		startErase(e);
		startPan(e);
	}
	function handlePointerMove(e: PointerEvent) {
		moveMeasure(e);
		moveTokenDrag(e);
		moveDraw(e);
		moveErase(e);
		movePan(e);
	}
	function handlePointerUp(e: PointerEvent) {
		endMeasure(e);
		endTokenDrag(e);
		endDraw(e);
		endErase(e);
		endPan(e);
	}

	const overlayCursor = $derived.by(() => {
		if (canPan()) return panning ? 'grabbing' : 'grab';
		if (interactive && tool !== 'move') return 'crosshair';
		return '';
	});

	// Grid line positions, expressed as fractions of the rendered rect (0-1).
	const vLines = $derived(
		showGrid ? Array.from({ length: gridSquaresAcross + 1 }, (_, i) => i * squareNormX) : []
	);
	const hLines = $derived(
		showGrid ? Array.from({ length: effectiveRows + 1 }, (_, i) => i * squareNormY) : []
	);
</script>

<div
	class="absolute inset-0 overflow-hidden"
	bind:clientWidth={containerW}
	bind:clientHeight={containerH}
>
	<div
		class="absolute inset-0"
		style="transform: translate({panX}px, {panY}px) scale({zoom}); transform-origin: 50% 50%;"
	>
		<img src={imageUrl} alt="Battle map" class="h-full w-full object-contain" draggable="false" />

		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			bind:this={overlay}
			class="absolute"
			style="left:{rect.x}px; top:{rect.y}px; width:{rect.w}px; height:{rect.h}px; touch-action:none; {overlayCursor
				? `cursor:${overlayCursor};`
				: ''}"
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			onpointercancel={handlePointerUp}
		>
			{#if showGrid && rect.w > 0}
				<svg class="pointer-events-none absolute inset-0" width={rect.w} height={rect.h}>
					{#each vLines as f (f)}
						<line
							x1={f * rect.w}
							y1={0}
							x2={f * rect.w}
							y2={rect.h}
							stroke="rgba(255,255,255,0.25)"
							stroke-width="1"
						/>
					{/each}
					{#each hLines as f (f)}
						<line
							x1={0}
							y1={f * rect.h}
							x2={rect.w}
							y2={f * rect.h}
							stroke="rgba(255,255,255,0.25)"
							stroke-width="1"
						/>
					{/each}
				</svg>
			{/if}

			{#if previewStrokes.length > 0}
				<svg class="pointer-events-none absolute inset-0" width={rect.w} height={rect.h}>
					{#each previewStrokes as s, i (i)}
						{#if s.points.length >= 4}
							<polyline
								points={strokePointsAttr(s.points)}
								fill="none"
								stroke={s.color}
								stroke-width={Math.max(1, s.width * rect.w)}
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						{/if}
					{/each}
				</svg>
			{/if}

			{#if ruler}
				<svg class="pointer-events-none absolute inset-0" width={rect.w} height={rect.h}>
					<line
						x1={ruler.from[0] * rect.w}
						y1={ruler.from[1] * rect.h}
						x2={ruler.to[0] * rect.w}
						y2={ruler.to[1] * rect.h}
						stroke="#facc15"
						stroke-width="2.5"
						stroke-dasharray="6 4"
					/>
					<circle cx={ruler.from[0] * rect.w} cy={ruler.from[1] * rect.h} r="4" fill="#facc15" />
					<circle cx={ruler.to[0] * rect.w} cy={ruler.to[1] * rect.h} r="4" fill="#facc15" />
					<text
						x={((ruler.from[0] + ruler.to[0]) / 2) * rect.w}
						y={((ruler.from[1] + ruler.to[1]) / 2) * rect.h - 10}
						text-anchor="middle"
						fill="#facc15"
						font-size="14"
						font-weight="700"
						style="paint-order: stroke; stroke: #000; stroke-width: 3px;"
					>
						{rulerFeet} ft
					</text>
				</svg>
			{/if}

			{#each tokens as t (t.combatantId)}
				{@const c = combatantFor(t.combatantId)}
				{#if c}
					{@const [px, py] = displayPos(t)}
					{@const v = tokenVisual(c)}
					{@const pct = hpPercent(c)}
					{@const size =
						Math.min(squareNormX * rect.w, squareNormY * rect.h) * tokenSizeSquares(c) * 0.8}
					<!-- Anchor wrapper is sized to exactly the avatar (not avatar+badge), so
				     -translate-{x,y}-1/2 centers the picture itself on the token's true grid
				     position — the HP badge hangs below without shifting that anchor. -->
					<div
						class="absolute -translate-x-1/2 -translate-y-1/2 {draggingId === t.combatantId
							? 'z-20'
							: 'z-10'}"
						style="left:{px * 100}%; top:{py * 100}%; width:{size}px; height:{size}px;"
					>
						<button
							type="button"
							title={c.type === 'player' || interactive
								? `${c.name} — ${c.currentHp}/${c.maxHp} HP`
								: c.name}
							class="block h-full w-full overflow-hidden rounded-full bg-gray-900 shadow-lg ring-2 transition-transform {v.ring} {draggingId ===
							t.combatantId
								? 'scale-110'
								: ''} {interactive && tool === 'move' ? 'cursor-grab active:cursor-grabbing' : ''}"
							disabled={!interactive || tool !== 'move'}
							onpointerdown={(e) => startTokenDrag(e, t.combatantId)}
						>
							{#if v.imgUrl}
								<img
									src={v.imgUrl}
									alt={c.name}
									class="h-full w-full object-cover"
									draggable="false"
								/>
							{:else if v.emoji}
								<span
									class="flex h-full w-full items-center justify-center select-none"
									style="font-size: 60%;">{v.emoji}</span
								>
							{:else}
								<span
									class="flex h-full w-full items-center justify-center text-xs font-bold text-white"
									>{c.name.slice(0, 2).toUpperCase()}</span
								>
							{/if}
						</button>
						{#if c.type === 'player' || interactive}
							<span
								role="presentation"
								class="absolute top-full left-1/2 mt-0.5 -translate-x-1/2 rounded bg-black/70 px-1 text-[10px] leading-tight font-bold whitespace-nowrap {hpTextColor(
									pct
								)} {interactive && tool === 'move' ? 'cursor-grab active:cursor-grabbing' : ''}"
								onpointerdown={(e) => startTokenDrag(e, t.combatantId)}
							>
								{c.currentHp}/{c.maxHp}
							</span>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	</div>
</div>

<!-- Zoom control — a per-viewer preference, so it's identical on the DM's preview and the
     player's full-screen view. Sits above the scaled/clipped content, always at its own size. -->
<div
	class="absolute right-2 bottom-2 z-30 flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-900/90 p-1 shadow-lg"
>
	<button
		type="button"
		onclick={zoomOut}
		disabled={zoom <= ZOOM_MIN}
		aria-label="Zoom out"
		class="flex h-7 w-7 items-center justify-center rounded text-gray-300 transition hover:bg-gray-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
	>
		<i class="fa-duotone fa-light fa-magnifying-glass-minus text-sm" aria-hidden="true"></i>
	</button>
	<button
		type="button"
		onclick={resetZoom}
		title="Reset zoom & pan"
		class="w-10 rounded px-1 text-center text-xs font-semibold text-gray-400 tabular-nums transition hover:bg-gray-700 hover:text-white"
	>
		{Math.round(zoom * 100)}%
	</button>
	<button
		type="button"
		onclick={zoomIn}
		disabled={zoom >= ZOOM_MAX}
		aria-label="Zoom in"
		class="flex h-7 w-7 items-center justify-center rounded text-gray-300 transition hover:bg-gray-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
	>
		<i class="fa-duotone fa-light fa-magnifying-glass-plus text-sm" aria-hidden="true"></i>
	</button>
</div>
