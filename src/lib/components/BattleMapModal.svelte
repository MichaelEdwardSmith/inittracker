<!-- DM battle-map modal. Lets the DM upload a local map image to an in-memory-only server slot
     (never MongoDB — see battleMapState.ts), calibrate a grid, place combatant tokens, drag them,
     measure distances, then show/hide the map on the player display. Single-slot: a new upload
     replaces whatever was prepared before. -->
<script lang="ts">
	import { combat } from '$lib/store.svelte';
	import BattleGridCanvas from './BattleGridCanvas.svelte';
	import type {
		BattleMapViewState,
		BattleMapToken,
		BattleMapRuler,
		BattleMapStroke
	} from '$lib/battleMapTypes';
	import type { SavedBattleMap } from '$lib/types';

	interface Props {
		sessionId: string;
		ruleset?: '2014' | '2024';
		onclose: () => void;
	}
	let { sessionId, ruleset = '2014', onclose }: Props = $props();

	const MAX_IMAGE_BYTES = 15_000_000; // must match server's limit in api/battlemap/image/+server.ts
	const JPEG_QUALITY = 0.88;
	// A generated blank battlemat is sized to exactly fit its grid (no leftover ungridded space):
	// pixels-per-square times the desired squares-across/down.
	const PX_PER_SQUARE = 80;
	const DEFAULT_BLANK_GRID_ACROSS = 30;
	const DEFAULT_BLANK_GRID_DOWN = 20;
	const MAX_MAT_DIMENSION = 4000;
	const DRAW_COLORS = ['#ef4444', '#facc15', '#22c55e', '#38bdf8', '#f8fafc', '#000000'];
	const DRAW_WIDTHS = [
		{ label: 'Thin', value: 0.003 },
		{ label: 'Medium', value: 0.007 },
		{ label: 'Thick', value: 0.014 }
	];

	type Tool = 'move' | 'measure' | 'pen' | 'line' | 'erase';

	let viewState = $state<BattleMapViewState | null>(null);
	let imageBlobUrl = $state<string | null>(null);
	let tokens = $state<BattleMapToken[]>([]);
	let ruler = $state<BattleMapRuler | null>(null);
	let strokes = $state<BattleMapStroke[]>([]);
	let tool = $state<Tool>('move');
	let drawColor = $state(DRAW_COLORS[0]);
	let drawWidth = $state(DRAW_WIDTHS[1].value);
	let snapLine = $state(false);
	let uploading = $state(false);
	let error = $state<string | null>(null);
	let fileInput: HTMLInputElement | undefined = $state();

	// ── Saved map library — per-DM-account, reusable across game sessions ──
	let savedMaps = $state<SavedBattleMap[]>([]);
	let showLibrary = $state(false);
	let libraryBusyId = $state<string | null>(null);
	let showSaveForm = $state(false);
	let saveNameInput = $state('');
	let savingToLibrary = $state(false);

	// ── Accordion sections — collapsed by default except Tools, the one thing a DM touches
	// constantly mid-combat. Keeping the rest tucked away is what stops this panel from
	// scrolling off screen. ──
	let toolsOpen = $state(true);
	let tokensOpen = $state(false);
	let gridOpen = $state(false);
	let mapLibraryOpen = $state(false);

	function revokeImage() {
		if (imageBlobUrl) URL.revokeObjectURL(imageBlobUrl);
		imageBlobUrl = null;
	}

	// ── Resync on open — a map may already be prepared/shown from an earlier session ──
	$effect(() => {
		(async () => {
			try {
				const res = await fetch(`/api/battlemap/state?session=${sessionId}`);
				if (!res.ok) return;
				const state = (await res.json()) as BattleMapViewState | null;
				if (!state) return;
				viewState = state;
				await loadImageBlob(state.id);
				const tRes = await fetch(`/api/battlemap/tokens?session=${sessionId}`);
				if (tRes.ok) tokens = await tRes.json();
				const dRes = await fetch(`/api/battlemap/draw?session=${sessionId}`);
				if (dRes.ok) strokes = await dRes.json();
			} catch {
				/* ignore — resync is best-effort */
			}
		})();
		loadSavedMaps();
		return () => {
			revokeImage();
			if (blankMatResizeTimer) clearTimeout(blankMatResizeTimer);
		};
	});

	async function loadSavedMaps() {
		try {
			const res = await fetch('/api/battlemap/library');
			if (res.ok) savedMaps = await res.json();
		} catch {
			/* ignore — library list is best-effort */
		}
	}

	async function saveCurrentMapToLibrary() {
		if (!viewState || !saveNameInput.trim()) return;
		savingToLibrary = true;
		error = null;
		try {
			const res = await fetch('/api/battlemap/library', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: saveNameInput.trim() })
			});
			if (!res.ok) {
				const reason = await res.text().catch(() => '');
				throw new Error(reason || `HTTP ${res.status}`);
			}
			const saved = (await res.json()) as SavedBattleMap;
			savedMaps = [saved, ...savedMaps];
			saveNameInput = '';
			showSaveForm = false;
		} catch (e) {
			const reason = e instanceof Error ? e.message : '';
			error = reason ? `Couldn't save map: ${reason}` : "Couldn't save map.";
		} finally {
			savingToLibrary = false;
		}
	}

	async function loadSavedMap(id: string) {
		libraryBusyId = id;
		error = null;
		try {
			const res = await fetch('/api/battlemap/library/load', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			if (!res.ok) {
				const reason = await res.text().catch(() => '');
				throw new Error(reason || `HTTP ${res.status}`);
			}
			const data = (await res.json()) as BattleMapViewState & { strokes: BattleMapStroke[] };
			const { strokes: savedStrokes, ...serverViewState } = data;
			await loadImageBlob(serverViewState.id);
			tokens = [];
			ruler = null;
			strokes = savedStrokes ?? [];
			viewState = serverViewState;
			showLibrary = false;
		} catch (e) {
			const reason = e instanceof Error ? e.message : '';
			error = reason ? `Couldn't load map: ${reason}` : "Couldn't load map.";
		} finally {
			libraryBusyId = null;
		}
	}

	async function deleteSavedMap(id: string) {
		if (!confirm('Delete this saved map? This cannot be undone.')) return;
		libraryBusyId = id;
		try {
			await fetch(`/api/battlemap/library?id=${id}`, { method: 'DELETE' });
		} catch {
			/* ignore */
		}
		savedMaps = savedMaps.filter((m) => m.id !== id);
		libraryBusyId = null;
	}

	// Converts a stroke's normalized (0-1) points into the saved map's real pixel dimensions, so
	// the preview SVG's viewBox (which matches the <img>'s true aspect ratio) lines up with it.
	function strokePreviewPointsAttr(points: number[], naturalW: number, naturalH: number): string {
		const out: string[] = [];
		for (let i = 0; i < points.length; i += 2) {
			out.push(`${points[i] * naturalW},${points[i + 1] * naturalH}`);
		}
		return out.join(' ');
	}

	// Guards against out-of-order resolution if two loads are kicked off in quick succession (e.g.
	// picking two different library maps before the first request resolves) — without it, a
	// slower fetch can resolve after a newer one and overwrite/revoke the map that's now current.
	let imageBlobRequestId = 0;
	async function loadImageBlob(id: string) {
		const requestId = ++imageBlobRequestId;
		try {
			const res = await fetch(`/api/battlemap/image?session=${sessionId}&id=${id}`);
			if (!res.ok) return;
			const blob = await res.blob();
			if (requestId !== imageBlobRequestId) return;
			revokeImage();
			imageBlobUrl = URL.createObjectURL(blob);
		} catch {
			/* ignore */
		}
	}

	function loadImageDimensions(url: string): Promise<{ w: number; h: number }> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
			img.onerror = reject;
			img.src = url;
		});
	}

	// A single map image can arrive well over the server's limit (e.g. an unresized phone photo).
	// Re-encode as JPEG, shrinking dimensions a step at a time, until it fits.
	async function shrinkImageIfNeeded(file: File): Promise<Blob> {
		if (file.size <= MAX_IMAGE_BYTES) return file;

		const bitmap = await createImageBitmap(file);
		let scale = 1;
		for (let attempt = 0; attempt < 6; attempt++) {
			const canvas = document.createElement('canvas');
			canvas.width = Math.max(1, Math.round(bitmap.width * scale));
			canvas.height = Math.max(1, Math.round(bitmap.height * scale));
			const ctx = canvas.getContext('2d');
			if (!ctx) break;
			ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
			const blob = await new Promise<Blob | null>((resolve) =>
				canvas.toBlob((b) => resolve(b), 'image/jpeg', JPEG_QUALITY)
			);
			if (blob && blob.size <= MAX_IMAGE_BYTES) return blob;
			scale *= 0.7;
		}
		return file;
	}

	async function uploadImage(
		blob: Blob,
		name: string,
		w: number,
		h: number,
		gridAcross?: number,
		gridDown?: number
	) {
		const headers: Record<string, string> = {
			'X-Map-Name': encodeURIComponent(name),
			'X-Map-Width': String(w),
			'X-Map-Height': String(h),
			'Content-Type': blob.type || 'application/octet-stream'
		};
		if (gridAcross && gridDown) {
			headers['X-Grid-Across'] = String(gridAcross);
			headers['X-Grid-Down'] = String(gridDown);
		}
		const res = await fetch('/api/battlemap/image', {
			method: 'POST',
			headers,
			body: blob
		});
		if (!res.ok) {
			const reason = await res.text().catch(() => '');
			throw new Error(reason || `HTTP ${res.status}`);
		}
		const serverViewState = (await res.json()) as BattleMapViewState;

		revokeImage();
		imageBlobUrl = URL.createObjectURL(blob);
		tokens = [];
		ruler = null;
		strokes = [];
		viewState = serverViewState;
	}

	async function handleFileChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		error = null;

		if (!file.type.startsWith('image/')) {
			error = 'Choose an image file.';
			return;
		}

		uploading = true;
		try {
			const blob = await shrinkImageIfNeeded(file);
			const probeUrl = URL.createObjectURL(blob);
			const { w, h } = await loadImageDimensions(probeUrl);
			URL.revokeObjectURL(probeUrl);
			await uploadImage(blob, file.name, w, h);
		} catch (e) {
			const reason = e instanceof Error ? e.message : '';
			error = reason ? `Upload failed: ${reason}` : 'Upload failed — try again.';
		} finally {
			uploading = false;
			if (fileInput) fileInput.value = '';
		}
	}

	// Renders a plain tan battlemat (like a physical wet/dry-erase mat) client-side, so the DM
	// can start placing tokens on a grid without needing an actual map image. Uploaded through
	// the same path as a picked file — the server treats it like any other map image.
	function drawBlankBattlemat(width: number, height: number): Promise<Blob> {
		return new Promise((resolve, reject) => {
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				reject(new Error('Canvas unavailable'));
				return;
			}

			ctx.fillStyle = '#c9b48a';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Faint speckling for a vinyl-mat texture rather than a flat fill — density scales
			// with area so it looks consistent whether the mat is small or large.
			const speckleCount = Math.max(
				300,
				Math.min(8000, Math.round(((width * height) / (1600 * 1200)) * 2500))
			);
			for (let i = 0; i < speckleCount; i++) {
				const x = Math.random() * canvas.width;
				const y = Math.random() * canvas.height;
				ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
				ctx.beginPath();
				ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
				ctx.fill();
			}

			// Soft vignette so the edges read as a mat, not a flat swatch.
			const grad = ctx.createRadialGradient(
				canvas.width / 2,
				canvas.height / 2,
				canvas.width * 0.2,
				canvas.width / 2,
				canvas.height / 2,
				canvas.width * 0.7
			);
			grad.addColorStop(0, 'rgba(0,0,0,0)');
			grad.addColorStop(1, 'rgba(0,0,0,0.14)');
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			canvas.toBlob(
				(blob) => (blob ? resolve(blob) : reject(new Error('Failed to render'))),
				'image/jpeg',
				0.92
			);
		});
	}

	// Regenerated blank mats are named 'Blank Battlemat' (see uploadImage call below); a real
	// uploaded photo won't collide with that name in practice, so it doubles as a cheap flag for
	// "this map is the auto-generated tan mat, safe to silently redraw on grid-size changes."
	const isBlankMat = $derived(viewState?.name === 'Blank Battlemat');

	// Debounced so typing/adjusting Squares Across then Squares Down doesn't regenerate the mat
	// twice — only the last edit within the window actually redraws the canvas.
	let blankMatResizeTimer: ReturnType<typeof setTimeout> | null = null;
	function scheduleBlankMatResize() {
		if (!isBlankMat) return;
		if (blankMatResizeTimer) clearTimeout(blankMatResizeTimer);
		blankMatResizeTimer = setTimeout(() => {
			blankMatResizeTimer = null;
			useBlankBattlemat();
		}, 600);
	}

	async function useBlankBattlemat() {
		error = null;
		uploading = true;
		try {
			// Reuses the current map's grid (if any) so re-generating after adjusting Squares
			// Across/Down produces a mat that fits that grid exactly, with no dead space.
			const gridAcross = viewState?.gridSquaresAcross ?? DEFAULT_BLANK_GRID_ACROSS;
			const gridDown = viewState?.gridSquaresDown ?? DEFAULT_BLANK_GRID_DOWN;
			const w = Math.min(MAX_MAT_DIMENSION, gridAcross * PX_PER_SQUARE);
			const h = Math.min(MAX_MAT_DIMENSION, gridDown * PX_PER_SQUARE);
			const blob = await drawBlankBattlemat(w, h);
			await uploadImage(blob, 'Blank Battlemat', w, h, gridAcross, gridDown);
		} catch (e) {
			const reason = e instanceof Error ? e.message : '';
			error = reason ? `Couldn't create battlemat: ${reason}` : "Couldn't create battlemat.";
		} finally {
			uploading = false;
		}
	}

	async function pushState(changes: Partial<BattleMapViewState>) {
		if (!viewState) return;
		viewState = { ...viewState, ...changes };
		try {
			await fetch('/api/battlemap/state', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(changes)
			});
		} catch {
			/* fire-and-forget, matches the rest of the app's sync style */
		}
	}

	async function show() {
		await pushState({ visible: true });
		// Backfills strokes for any viewer already connected (e.g. still watching a previous map)
		// — a map loaded from the library sets its saved strokes locally without broadcasting them,
		// to avoid flashing them onto whatever map was showing at load time. Re-sending them now,
		// once this map is actually revealed, is what makes them show up on the player display.
		pushStrokes(strokes);
	}
	function hide() {
		pushState({ visible: false });
	}

	async function removeMap() {
		if (!confirm('Remove this map? Players will stop seeing it.')) return;
		try {
			await fetch('/api/battlemap/image', { method: 'DELETE' });
		} catch {
			/* ignore */
		}
		revokeImage();
		viewState = null;
		tokens = [];
		ruler = null;
		strokes = [];
	}

	// ── Tokens — full-list replace on every call, same simplicity as Document Share's
	// annotation sync (no delta/merge logic). ──
	async function pushTokens(next: BattleMapToken[]) {
		tokens = next;
		try {
			await fetch('/api/battlemap/tokens', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(next)
			});
		} catch {
			/* fire-and-forget */
		}
	}

	function placeToken(combatantId: string) {
		if (tokens.some((t) => t.combatantId === combatantId)) return;
		pushTokens([...tokens, { combatantId, x: 0.5, y: 0.5 }]);
	}

	function removeToken(combatantId: string) {
		pushTokens(tokens.filter((t) => t.combatantId !== combatantId));
	}

	function handleTokenMove(combatantId: string, x: number, y: number) {
		pushTokens(tokens.map((t) => (t.combatantId === combatantId ? { ...t, x, y } : t)));
	}

	// ── Ruler — the same handler fires repeatedly while measuring; a short idle window after
	// the last update fades the line out (both locally and for players watching it live). ──
	let rulerClearTimer: ReturnType<typeof setTimeout> | null = null;
	async function pushRuler(next: BattleMapRuler | null) {
		try {
			await fetch('/api/battlemap/ruler', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(next)
			});
		} catch {
			/* fire-and-forget */
		}
	}
	function handleRulerChange(next: BattleMapRuler | null) {
		ruler = next;
		pushRuler(next);
		if (rulerClearTimer) clearTimeout(rulerClearTimer);
		if (next) {
			rulerClearTimer = setTimeout(() => {
				ruler = null;
				pushRuler(null);
			}, 1500);
		}
	}

	// ── Drawing — POST always replaces the full stroke list, same simplicity as Document
	// Share's annotation sync (one call serves throttled live-drawing and the final stroke). ──
	async function pushStrokes(next: BattleMapStroke[]) {
		try {
			await fetch('/api/battlemap/draw', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(next)
			});
		} catch {
			/* fire-and-forget */
		}
	}

	function handleLiveDraw(next: BattleMapStroke[]) {
		pushStrokes(next);
	}

	// Unlike a live pen/line preview (which excludes the in-progress stroke from `strokes` until
	// it's finished), every intermediate erase state IS already final — so, unlike handleLiveDraw,
	// this updates local state immediately rather than just broadcasting.
	function handleErase(next: BattleMapStroke[]) {
		strokes = next;
		pushStrokes(next);
	}

	function handleStrokeComplete(stroke: BattleMapStroke) {
		const next = [...strokes, stroke];
		strokes = next;
		pushStrokes(next);
	}

	function undoStroke() {
		if (strokes.length === 0) return;
		const next = strokes.slice(0, -1);
		strokes = next;
		pushStrokes(next);
	}

	async function clearStrokes() {
		if (strokes.length === 0) return;
		strokes = [];
		try {
			await fetch('/api/battlemap/draw', { method: 'DELETE' });
		} catch {
			/* ignore */
		}
	}

	const unplacedCombatants = $derived(
		combat.combatants.filter((c) => !tokens.some((t) => t.combatantId === c.id))
	);
	const placedCombatants = $derived(
		tokens
			.map((t) => combat.combatants.find((c) => c.id === t.combatantId))
			.filter((c) => c !== undefined)
	);
</script>

<!-- Backdrop -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm"
	onclick={(e) => e.target === e.currentTarget && onclose()}
></div>

<!-- Panel -->
<div
	class="fixed top-[50%] left-[50%] z-[151] flex max-h-[90vh] w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-2xl border border-blue-800/60 bg-gray-900 shadow-2xl lg:max-w-5xl"
>
	<!-- Header -->
	<div
		class="flex shrink-0 items-center justify-between border-b border-gray-700/60 bg-gradient-to-r from-blue-950/60 to-gray-900 px-6 py-4"
	>
		<div class="flex items-center gap-3">
			<i class="fa-duotone fa-light fa-map text-2xl" aria-hidden="true"></i>
			<div>
				<h2 class="text-lg font-black tracking-wider text-blue-300 uppercase">Battle Map</h2>
				<p class="text-xs text-gray-500">Place tokens and measure distance for your players</p>
			</div>
		</div>
		<button
			onclick={onclose}
			aria-label="Close"
			class="rounded-lg p-2 text-gray-500 hover:bg-gray-800 hover:text-white"
			><i class="fa-duotone fa-light fa-xmark" aria-hidden="true"></i></button
		>
	</div>

	<!-- Body -->
	<div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
		{#if !viewState}
			<!-- ── No map prepared ──────────────────────────────────────────────── -->
			<label
				class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-700 px-6 py-12 text-center transition hover:border-blue-600 hover:bg-blue-950/10"
			>
				<input
					bind:this={fileInput}
					type="file"
					accept="image/*"
					class="sr-only"
					onchange={handleFileChange}
					disabled={uploading}
				/>
				{#if uploading}
					<i
						class="fa-duotone fa-light fa-spinner-third animate-spin text-4xl text-gray-500"
						aria-hidden="true"
					></i>
					<span class="text-sm font-semibold text-gray-300">Uploading…</span>
				{:else}
					<i class="fa-duotone fa-light fa-cloud-arrow-up text-4xl text-gray-500" aria-hidden="true"
					></i>
					<span class="text-sm font-semibold text-gray-300">Click to choose a map image</span>
				{/if}
			</label>

			<div class="my-4 flex items-center gap-3 text-xs text-gray-600 uppercase">
				<div class="h-px flex-1 bg-gray-800"></div>
				or
				<div class="h-px flex-1 bg-gray-800"></div>
			</div>

			<button
				onclick={useBlankBattlemat}
				disabled={uploading}
				title="Start with a plain tan grid, like a physical wet/dry-erase battlemat"
				class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
			>
				<i class="fa-duotone fa-light fa-border-all" aria-hidden="true"></i>
				Use a Plain Battlemat
			</button>

			{#if savedMaps.length > 0}
				<button
					onclick={() => (showLibrary = !showLibrary)}
					class="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:border-blue-600 hover:text-blue-300"
				>
					<i class="fa-duotone fa-light fa-folder-open" aria-hidden="true"></i>
					Load From Library ({savedMaps.length})
				</button>
			{/if}
		{:else}
			<!-- ── Prepared map — map preview + primary action on the left, the collapsible
			     sections in a side column on wide screens; stacked below it on narrow ones. ── -->
			<div class="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6">
				<div class="flex min-w-0 flex-col gap-4">
					<div class="flex items-center justify-between gap-3">
						<div class="min-w-0">
							<p class="truncate text-sm font-semibold text-gray-200">{viewState.name}</p>
							<p class="text-xs text-gray-500">
								{viewState.visible ? 'Showing to players' : 'Hidden'}
							</p>
						</div>
						<button
							onclick={removeMap}
							title="Remove this map"
							class="shrink-0 rounded-lg p-2 text-gray-600 transition hover:bg-red-950/40 hover:text-red-400"
						>
							<i class="fa-duotone fa-light fa-trash text-sm" aria-hidden="true"></i>
						</button>
					</div>

					<!-- Preview / interactive grid -->
					<div
						class="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-700 bg-gray-950"
					>
						{#if imageBlobUrl}
							<BattleGridCanvas
								imageUrl={imageBlobUrl}
								naturalWidth={viewState.naturalWidth}
								naturalHeight={viewState.naturalHeight}
								gridSquaresAcross={viewState.gridSquaresAcross}
								gridSquaresDown={viewState.gridSquaresDown}
								feetPerSquare={viewState.feetPerSquare}
								showGrid={viewState.showGrid}
								{tokens}
								combatants={combat.combatants}
								{ruler}
								{strokes}
								{ruleset}
								interactive
								{tool}
								{drawColor}
								{drawWidth}
								{snapLine}
								onTokenMove={handleTokenMove}
								onRulerChange={handleRulerChange}
								onStrokeComplete={handleStrokeComplete}
								onLiveDraw={handleLiveDraw}
								onErase={handleErase}
							/>
						{:else}
							<div class="flex h-full items-center justify-center">
								<i
									class="fa-duotone fa-light fa-spinner-third animate-spin text-3xl text-gray-600"
									aria-hidden="true"
								></i>
							</div>
						{/if}
						{#if viewState.visible}
							<span
								class="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase shadow"
							>
								<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-white"></span> Live
							</span>
						{/if}
					</div>

					<!-- Show / Hide — the primary action, right under the preview -->
					{#if viewState.visible}
						<button
							onclick={hide}
							class="rounded-xl bg-gray-700 py-3 font-black tracking-wider text-white uppercase transition hover:bg-gray-600 active:scale-95"
						>
							<i class="fa-duotone fa-light fa-eye-slash" aria-hidden="true"></i> Hide from Players
						</button>
					{:else}
						<button
							onclick={show}
							class="rounded-xl bg-blue-600 py-3 font-black tracking-wider text-white uppercase transition hover:bg-blue-500 active:scale-95"
						>
							<i class="fa-duotone fa-light fa-eye" aria-hidden="true"></i> Show to Players
						</button>
					{/if}
				</div>

				<!-- ── Everything below is a collapsible section, same header/chevron pattern, so the
			     panel doesn't sprawl past the screen. On narrow screens this stacks below the map
			     preview; at lg+ it sits beside it as its own column. ── -->
				<div class="flex flex-col gap-3">
					<!-- Tools -->
					<div class="overflow-hidden rounded-lg border border-gray-700">
						<button
							onclick={() => (toolsOpen = !toolsOpen)}
							aria-expanded={toolsOpen}
							class="flex w-full items-center justify-between bg-gray-800/60 px-4 py-2.5 text-left transition hover:bg-gray-800"
						>
							<span
								class="flex items-center gap-2 text-xs font-bold tracking-wider text-gray-300 uppercase"
							>
								<i class="fa-duotone fa-light fa-pen-ruler text-blue-400" aria-hidden="true"></i>
								Tools
							</span>
							<i
								class="fa-duotone fa-light {toolsOpen
									? 'fa-chevron-up'
									: 'fa-chevron-down'} text-xs text-gray-500"
								aria-hidden="true"
							></i>
						</button>
						{#if toolsOpen}
							<div class="flex flex-col gap-3 border-t border-gray-700 bg-gray-800/20 px-4 py-3">
								<div
									class="flex items-center gap-1 self-start rounded-lg border border-gray-700 bg-gray-800 p-0.5"
								>
									<button
										onclick={() => (tool = 'move')}
										title="Drag tokens, or drag empty space to pan when zoomed in"
										class="rounded-md px-2.5 py-1.5 text-xs font-semibold transition {tool ===
										'move'
											? 'bg-blue-600 text-white'
											: 'text-gray-400 hover:text-gray-200'}"
									>
										<i class="fa-duotone fa-light fa-arrows-up-down-left-right" aria-hidden="true"
										></i> Move
									</button>
									<button
										onclick={() => (tool = 'measure')}
										title="Click-drag to measure distance"
										class="rounded-md px-2.5 py-1.5 text-xs font-semibold transition {tool ===
										'measure'
											? 'bg-amber-600 text-white'
											: 'text-gray-400 hover:text-gray-200'}"
									>
										<i class="fa-duotone fa-light fa-ruler" aria-hidden="true"></i> Measure
									</button>
									<button
										onclick={() => (tool = 'pen')}
										title="Freehand draw"
										class="rounded-md px-2.5 py-1.5 text-xs font-semibold transition {tool === 'pen'
											? 'bg-red-600 text-white'
											: 'text-gray-400 hover:text-gray-200'}"
									>
										<i class="fa-duotone fa-light fa-pen" aria-hidden="true"></i> Pen
									</button>
									<button
										onclick={() => (tool = 'line')}
										title="Draw a straight line"
										class="rounded-md px-2.5 py-1.5 text-xs font-semibold transition {tool ===
										'line'
											? 'bg-red-600 text-white'
											: 'text-gray-400 hover:text-gray-200'}"
									>
										<i class="fa-duotone fa-light fa-slash" aria-hidden="true"></i> Line
									</button>
									<button
										onclick={() => (tool = 'erase')}
										title="Click or drag over a line to erase just that line"
										class="rounded-md px-2.5 py-1.5 text-xs font-semibold transition {tool ===
										'erase'
											? 'bg-red-600 text-white'
											: 'text-gray-400 hover:text-gray-200'}"
									>
										<i class="fa-duotone fa-light fa-eraser" aria-hidden="true"></i> Erase
									</button>
								</div>

								{#if tool === 'pen' || tool === 'line' || tool === 'erase'}
									<div class="flex flex-wrap items-center gap-3">
										{#if tool === 'pen' || tool === 'line'}
											<div class="flex items-center gap-1.5">
												{#each DRAW_COLORS as c}
													<button
														onclick={() => (drawColor = c)}
														aria-label="Pen color {c}"
														class="h-6 w-6 rounded-full border border-gray-600 ring-2 ring-offset-2 ring-offset-gray-900 transition {drawColor ===
														c
															? 'ring-white'
															: 'ring-transparent'}"
														style="background: {c};"
													></button>
												{/each}
											</div>
											<div
												class="flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-800 p-0.5"
											>
												{#each DRAW_WIDTHS as w}
													<button
														onclick={() => (drawWidth = w.value)}
														class="rounded-md px-2 py-1 text-xs font-semibold transition {drawWidth ===
														w.value
															? 'bg-red-600 text-white'
															: 'text-gray-400 hover:text-gray-200'}"
													>
														{w.label}
													</button>
												{/each}
											</div>
										{/if}
										{#if tool === 'line'}
											<button
												onclick={() => (snapLine = !snapLine)}
												title="Snap line endpoints to the nearest grid intersection"
												class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition {snapLine
													? 'border-red-500 bg-red-950/40 text-red-300'
													: 'border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200'}"
											>
												<i class="fa-duotone fa-light fa-table-cells" aria-hidden="true"></i> Snap to
												Grid
											</button>
										{/if}
										<button
											onclick={undoStroke}
											disabled={strokes.length === 0}
											title="Undo last stroke"
											class="rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-gray-300 transition hover:border-red-700 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
										>
											<i class="fa-duotone fa-light fa-arrow-rotate-left text-sm" aria-hidden="true"
											></i>
										</button>
										<button
											onclick={clearStrokes}
											disabled={strokes.length === 0}
											title="Clear all drawing"
											class="rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-gray-300 transition hover:border-red-700 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
										>
											<i class="fa-duotone fa-light fa-trash text-sm" aria-hidden="true"></i>
										</button>
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Tokens -->
					<div class="overflow-hidden rounded-lg border border-gray-700">
						<button
							onclick={() => (tokensOpen = !tokensOpen)}
							aria-expanded={tokensOpen}
							class="flex w-full items-center justify-between bg-gray-800/60 px-4 py-2.5 text-left transition hover:bg-gray-800"
						>
							<span
								class="flex items-center gap-2 text-xs font-bold tracking-wider text-gray-300 uppercase"
							>
								<i class="fa-duotone fa-light fa-chess-pawn text-emerald-400" aria-hidden="true"
								></i>
								Tokens
								{#if placedCombatants.length > 0}
									<span
										class="rounded-full bg-gray-700 px-1.5 py-0.5 text-[10px] font-bold text-gray-300 normal-case"
									>
										{placedCombatants.length}
									</span>
								{/if}
							</span>
							<i
								class="fa-duotone fa-light {tokensOpen
									? 'fa-chevron-up'
									: 'fa-chevron-down'} text-xs text-gray-500"
								aria-hidden="true"
							></i>
						</button>
						{#if tokensOpen}
							<div class="flex flex-col gap-2 border-t border-gray-700 bg-gray-800/20 px-4 py-3">
								{#if placedCombatants.length > 0}
									<div class="flex flex-wrap gap-1.5">
										{#each placedCombatants as c (c.id)}
											<button
												onclick={() => removeToken(c.id)}
												title="Remove {c.name} from the map"
												class="flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-800 py-1 pr-1 pl-2.5 text-xs text-gray-300 transition hover:border-red-700 hover:text-red-300"
											>
												{c.name}
												<i class="fa-duotone fa-light fa-xmark text-[10px]" aria-hidden="true"></i>
											</button>
										{/each}
									</div>
								{/if}
								{#if unplacedCombatants.length > 0}
									<div class="flex flex-wrap gap-1.5">
										{#each unplacedCombatants as c (c.id)}
											<button
												onclick={() => placeToken(c.id)}
												title="Place {c.name} on the map"
												class="flex items-center gap-1.5 rounded-full border border-dashed border-gray-700 bg-gray-900 px-2.5 py-1 text-xs text-gray-500 transition hover:border-blue-600 hover:text-blue-300"
											>
												<i class="fa-duotone fa-light fa-plus text-[10px]" aria-hidden="true"></i>
												{c.name}
											</button>
										{/each}
									</div>
								{/if}
								{#if placedCombatants.length === 0 && unplacedCombatants.length === 0}
									<p class="py-2 text-center text-xs text-gray-600">
										No combatants in this session.
									</p>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Grid & Calibration -->
					<div class="overflow-hidden rounded-lg border border-gray-700">
						<button
							onclick={() => (gridOpen = !gridOpen)}
							aria-expanded={gridOpen}
							class="flex w-full items-center justify-between bg-gray-800/60 px-4 py-2.5 text-left transition hover:bg-gray-800"
						>
							<span
								class="flex items-center gap-2 text-xs font-bold tracking-wider text-gray-300 uppercase"
							>
								<i class="fa-duotone fa-light fa-table-cells text-amber-400" aria-hidden="true"></i>
								Grid & Calibration
							</span>
							<i
								class="fa-duotone fa-light {gridOpen
									? 'fa-chevron-up'
									: 'fa-chevron-down'} text-xs text-gray-500"
								aria-hidden="true"
							></i>
						</button>
						{#if gridOpen}
							<div
								class="flex flex-wrap items-end gap-3 border-t border-gray-700 bg-gray-800/20 px-4 py-3"
							>
								<label class="flex flex-col gap-1 text-xs text-gray-500 uppercase">
									Squares across
									<input
										type="number"
										min="1"
										max="200"
										value={viewState.gridSquaresAcross}
										onchange={(e) => {
											pushState({ gridSquaresAcross: Number(e.currentTarget.value) || 20 });
											scheduleBlankMatResize();
										}}
										class="w-24 rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
									/>
								</label>
								<label class="flex flex-col gap-1 text-xs text-gray-500 uppercase">
									Squares down
									<input
										type="number"
										min="1"
										max="200"
										value={viewState.gridSquaresDown}
										onchange={(e) => {
											pushState({ gridSquaresDown: Number(e.currentTarget.value) || 20 });
											scheduleBlankMatResize();
										}}
										title="How many square rows the grid covers — squares stay true squares (sized from Squares Across), so this may leave part of the image ungridded rather than stretching cells"
										class="w-24 rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
									/>
								</label>
								<label class="flex flex-col gap-1 text-xs text-gray-500 uppercase">
									Feet / square
									<input
										type="number"
										min="1"
										max="100"
										value={viewState.feetPerSquare}
										onchange={(e) =>
											pushState({ feetPerSquare: Number(e.currentTarget.value) || 5 })}
										class="w-24 rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
									/>
								</label>
								<button
									onclick={() => pushState({ showGrid: !viewState!.showGrid })}
									class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition {viewState.showGrid
										? 'border-blue-600 bg-blue-950/40 text-blue-300'
										: 'border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200'}"
								>
									<i class="fa-duotone fa-light fa-table-cells" aria-hidden="true"></i> Grid
								</button>
							</div>
						{/if}
					</div>

					<!-- Map & Library -->
					<div class="overflow-hidden rounded-lg border border-gray-700">
						<button
							onclick={() => (mapLibraryOpen = !mapLibraryOpen)}
							aria-expanded={mapLibraryOpen}
							class="flex w-full items-center justify-between bg-gray-800/60 px-4 py-2.5 text-left transition hover:bg-gray-800"
						>
							<span
								class="flex items-center gap-2 text-xs font-bold tracking-wider text-gray-300 uppercase"
							>
								<i class="fa-duotone fa-light fa-folder-open text-violet-400" aria-hidden="true"
								></i>
								Map & Library
							</span>
							<i
								class="fa-duotone fa-light {mapLibraryOpen
									? 'fa-chevron-up'
									: 'fa-chevron-down'} text-xs text-gray-500"
								aria-hidden="true"
							></i>
						</button>
						{#if mapLibraryOpen}
							<div class="flex flex-col gap-3 border-t border-gray-700 bg-gray-800/20 px-4 py-3">
								<div class="flex flex-wrap gap-2">
									<label
										class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-blue-600 hover:text-blue-300 {uploading
											? 'pointer-events-none opacity-50'
											: ''}"
									>
										<input
											type="file"
											accept="image/*"
											class="sr-only"
											onchange={handleFileChange}
											disabled={uploading}
										/>
										<i class="fa-duotone fa-light fa-arrows-rotate" aria-hidden="true"></i>
										Replace Map
									</label>
									<button
										onclick={useBlankBattlemat}
										disabled={uploading}
										title="Regenerates a blank mat sized to exactly fit the current Squares Across/Down"
										class="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
									>
										<i class="fa-duotone fa-light fa-border-all" aria-hidden="true"></i>
										Plain Battlemat
									</button>
									<button
										onclick={() => (showSaveForm = !showSaveForm)}
										class="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition {showSaveForm
											? 'border-green-600 bg-green-950/40 text-green-300'
											: 'border-gray-700 bg-gray-800 text-gray-300 hover:border-green-600 hover:text-green-300'}"
									>
										<i class="fa-duotone fa-light fa-floppy-disk" aria-hidden="true"></i>
										Save to Library
									</button>
									<button
										onclick={() => (showLibrary = !showLibrary)}
										class="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition {showLibrary
											? 'border-blue-600 bg-blue-950/40 text-blue-300'
											: 'border-gray-700 bg-gray-800 text-gray-300 hover:border-blue-600 hover:text-blue-300'}"
									>
										<i class="fa-duotone fa-light fa-folder-open" aria-hidden="true"></i>
										Browse Library{savedMaps.length > 0 ? ` (${savedMaps.length})` : ''}
									</button>
								</div>

								{#if showSaveForm}
									<div
										class="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 p-2"
									>
										<input
											type="text"
											bind:value={saveNameInput}
											placeholder="Name this map…"
											maxlength="100"
											onkeydown={(e) => e.key === 'Enter' && saveCurrentMapToLibrary()}
											class="min-w-0 flex-1 rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
										/>
										<button
											onclick={saveCurrentMapToLibrary}
											disabled={!saveNameInput.trim() || savingToLibrary}
											class="shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
										>
											{#if savingToLibrary}
												<i
													class="fa-duotone fa-light fa-spinner-third animate-spin"
													aria-hidden="true"
												></i>
											{:else}
												Save
											{/if}
										</button>
										<button
											onclick={() => (showSaveForm = false)}
											class="shrink-0 rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:text-gray-300"
										>
											Cancel
										</button>
									</div>
								{/if}

								{#if uploading}
									<i
										class="fa-duotone fa-light fa-spinner-third animate-spin self-center text-xl text-gray-500"
										aria-hidden="true"
									></i>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		{#if showLibrary}
			<div class="mt-4 overflow-hidden rounded-lg border border-gray-700">
				<div class="flex items-center justify-between bg-gray-800/60 px-4 py-2.5">
					<span
						class="flex items-center gap-2 text-xs font-bold tracking-wider text-gray-300 uppercase"
					>
						<i class="fa-duotone fa-light fa-folder-open text-violet-400" aria-hidden="true"></i>
						Map Library
					</span>
					<button
						onclick={() => (showLibrary = false)}
						aria-label="Close map library"
						class="text-gray-500 hover:text-white"
					>
						<i class="fa-duotone fa-light fa-xmark text-xs" aria-hidden="true"></i>
					</button>
				</div>
				<div class="border-t border-gray-700 bg-gray-800/20 p-3">
					{#if savedMaps.length === 0}
						<p class="py-4 text-center text-sm text-gray-600">No saved maps yet.</p>
					{:else}
						<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
							{#each savedMaps as m (m.id)}
								<div
									class="group relative flex flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-900"
								>
									<button
										onclick={() => loadSavedMap(m.id)}
										disabled={libraryBusyId === m.id}
										title="Load {m.name} onto the map"
										class="flex flex-col disabled:cursor-not-allowed disabled:opacity-50"
									>
										<div class="relative aspect-video w-full overflow-hidden">
											<img
												src="/api/battlemap/library/image?id={m.id}"
												alt={m.name}
												class="absolute inset-0 h-full w-full object-cover"
											/>
											{#if m.strokes.length > 0}
												<svg
													viewBox="0 0 {m.naturalWidth} {m.naturalHeight}"
													preserveAspectRatio="xMidYMid slice"
													class="pointer-events-none absolute inset-0 h-full w-full"
												>
													{#each m.strokes as s, i (i)}
														{#if s.points.length >= 4}
															<polyline
																points={strokePreviewPointsAttr(
																	s.points,
																	m.naturalWidth,
																	m.naturalHeight
																)}
																fill="none"
																stroke={s.color}
																stroke-width={Math.max(1, s.width * m.naturalWidth)}
																stroke-linecap="round"
																stroke-linejoin="round"
															/>
														{/if}
													{/each}
												</svg>
											{/if}
										</div>
										<span class="truncate p-1.5 text-left text-xs font-semibold text-gray-300">
											{m.name}
										</span>
										<span class="px-1.5 pb-1.5 text-left text-[10px] text-gray-600">
											{m.gridSquaresAcross}×{m.gridSquaresDown} squares
										</span>
									</button>
									{#if libraryBusyId === m.id}
										<div class="absolute inset-0 flex items-center justify-center bg-black/50">
											<i
												class="fa-duotone fa-light fa-spinner-third animate-spin text-lg text-white"
												aria-hidden="true"
											></i>
										</div>
									{/if}
									<button
										onclick={() => deleteSavedMap(m.id)}
										disabled={libraryBusyId === m.id}
										aria-label="Delete {m.name}"
										title="Delete this saved map"
										class="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-gray-400 opacity-0 transition group-hover:opacity-100 hover:text-red-400 disabled:cursor-not-allowed"
									>
										<i class="fa-duotone fa-light fa-xmark text-xs" aria-hidden="true"></i>
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}

		{#if error}
			<p class="mt-3 text-center text-xs text-red-400">{error}</p>
		{/if}
	</div>
</div>
