<!-- Freehand annotation layer for Document Share — sits absolutely positioned over a page image
     (parent must be `position: relative` and the same box the image fills). Coordinates and
     stroke width are normalized (0–1) so the same strokes render correctly at any size: the
     DM's small preview in DocShareModal and a viewer's full-screen display alike.
     Non-interactive instances (the player display) just render `strokes` as they change. -->
<script lang="ts">
	import { computeContainRect } from '$lib/utils';
	import type { Stroke } from '$lib/docShareTypes';

	interface Props {
		naturalWidth: number;
		naturalHeight: number;
		strokes: Stroke[];
		interactive?: boolean;
		activeColor?: string;
		activeWidth?: number;
		onStrokeComplete?: (stroke: Stroke) => void;
		/** Fired periodically while drawing (throttled) with the full preview stroke list
		 *  (committed strokes + the in-progress one), so callers can broadcast it live. */
		onLiveUpdate?: (strokes: Stroke[]) => void;
	}
	let {
		naturalWidth,
		naturalHeight,
		strokes,
		interactive = false,
		activeColor = '#ef4444',
		activeWidth = 0.006,
		onStrokeComplete,
		onLiveUpdate
	}: Props = $props();

	let containerW = $state(0);
	let containerH = $state(0);
	let canvas: HTMLCanvasElement | undefined = $state();

	const rect = $derived(computeContainRect(containerW, containerH, naturalWidth, naturalHeight));

	let drawing = false;
	let currentPoints = $state<number[]>([]);

	function redraw() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		const live =
			currentPoints.length >= 4
				? [...strokes, { points: currentPoints, color: activeColor, width: activeWidth }]
				: strokes;
		for (const s of live) {
			if (s.points.length < 4) continue;
			ctx.strokeStyle = s.color;
			ctx.lineWidth = Math.max(1, s.width * canvas.width);
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.beginPath();
			ctx.moveTo(s.points[0] * canvas.width, s.points[1] * canvas.height);
			for (let i = 2; i < s.points.length; i += 2) {
				ctx.lineTo(s.points[i] * canvas.width, s.points[i + 1] * canvas.height);
			}
			ctx.stroke();
		}
	}

	$effect(() => {
		// Reactive deps: rect (size), strokes (committed), currentPoints (live draw)
		const w = Math.round(rect.w);
		const h = Math.round(rect.h);
		strokes;
		currentPoints;
		if (canvas && (canvas.width !== w || canvas.height !== h)) {
			canvas.width = w;
			canvas.height = h;
		}
		redraw();
	});

	function normalizedPoint(e: PointerEvent): [number, number] | null {
		if (!canvas) return null;
		const r = canvas.getBoundingClientRect();
		if (r.width === 0 || r.height === 0) return null;
		const nx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
		const ny = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
		return [nx, ny];
	}

	const LIVE_UPDATE_MS = 80;
	let lastLiveUpdate = 0;

	function onPointerDown(e: PointerEvent) {
		if (!interactive) return;
		const p = normalizedPoint(e);
		if (!p) return;
		drawing = true;
		currentPoints = [p[0], p[1]];
		canvas?.setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!interactive || !drawing) return;
		const p = normalizedPoint(e);
		if (!p) return;
		currentPoints = [...currentPoints, p[0], p[1]];
		const now = performance.now();
		if (onLiveUpdate && now - lastLiveUpdate > LIVE_UPDATE_MS) {
			lastLiveUpdate = now;
			onLiveUpdate([...strokes, { points: currentPoints, color: activeColor, width: activeWidth }]);
		}
	}

	function endStroke(e: PointerEvent) {
		if (!interactive || !drawing) return;
		drawing = false;
		canvas?.releasePointerCapture(e.pointerId);
		if (currentPoints.length >= 4) {
			onStrokeComplete?.({ points: currentPoints, color: activeColor, width: activeWidth });
		}
		currentPoints = [];
	}
</script>

<div
	class="absolute inset-0"
	bind:clientWidth={containerW}
	bind:clientHeight={containerH}
	aria-hidden={!interactive}
>
	<canvas
		bind:this={canvas}
		style="position:absolute; left:{rect.x}px; top:{rect.y}px; width:{rect.w}px; height:{rect.h}px; touch-action:none; {interactive
			? 'cursor:crosshair;'
			: 'pointer-events:none;'}"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={endStroke}
		onpointercancel={endStroke}
	></canvas>
</div>
