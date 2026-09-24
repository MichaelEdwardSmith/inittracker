<!-- DM document-share modal. Lets the DM pick a local image or PDF, uploads it page-by-page to
     an in-memory-only server slot (never MongoDB — see docShareState.ts), then show/hide it and
     step through pages on the player display. PDFs are rendered to page images client-side via
     pdf.js before upload; the player display only ever receives plain images. Single-slot: a new
     upload replaces whatever was prepared before. -->
<script lang="ts">
	import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
	import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
	import AnnotationCanvas from './AnnotationCanvas.svelte';
	import type { Stroke } from '$lib/docShareTypes';

	GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

	interface Props {
		sessionId: string;
		onclose: () => void;
	}
	let { sessionId, onclose }: Props = $props();

	interface ViewState {
		id: string;
		name: string;
		pageCount: number;
		currentPage: number;
		visible: boolean;
	}

	const MAX_PAGES = 60;
	const PDF_RENDER_SCALE = 2;
	const PDF_JPEG_QUALITY = 0.85;

	let viewState = $state<ViewState | null>(null);
	let pageBlobUrls = $state<(string | null)[]>([]);
	let loadingPreview = $state(false);
	let uploading = $state(false);
	let uploadProgress = $state<{ current: number; total: number } | null>(null);
	let error = $state<string | null>(null);
	let fileInput: HTMLInputElement | undefined = $state();

	// ── Annotations ──────────────────────────────────────────────────────────
	const ANNOTATION_COLORS = ['#ef4444', '#facc15', '#22c55e', '#38bdf8', '#f8fafc'];
	const ANNOTATION_WIDTHS = [
		{ label: 'Thin', value: 0.003 },
		{ label: 'Medium', value: 0.007 },
		{ label: 'Thick', value: 0.014 }
	];
	let pageStrokes = $state<Record<number, Stroke[]>>({});
	let activeColor = $state(ANNOTATION_COLORS[0]);
	let activeWidth = $state(ANNOTATION_WIDTHS[1].value);
	let naturalW = $state(0);
	let naturalH = $state(0);
	const currentStrokes = $derived(viewState ? (pageStrokes[viewState.currentPage] ?? []) : []);

	// ── Resync on open — the doc may already be prepared/shown from an earlier session ──
	$effect(() => {
		(async () => {
			try {
				const res = await fetch(`/api/docshare/state?session=${sessionId}`);
				if (!res.ok) return;
				const state = (await res.json()) as ViewState | null;
				if (!state) return;
				viewState = state;
				pageBlobUrls = Array(state.pageCount).fill(null);
				await loadPageBlob(state.currentPage);
			} catch {
				/* ignore — resync is best-effort */
			}
			try {
				const res = await fetch(`/api/docshare/annotate?session=${sessionId}`);
				if (!res.ok) return;
				const anno = (await res.json()) as {
					docId: string;
					pageStrokes: Record<number, Stroke[]>;
				} | null;
				if (anno && anno.docId === viewState?.id) pageStrokes = anno.pageStrokes;
			} catch {
				/* ignore — resync is best-effort */
			}
		})();
	});

	async function loadPageBlob(page: number) {
		if (!viewState || pageBlobUrls[page]) return;
		loadingPreview = true;
		try {
			const res = await fetch(
				`/api/docshare/page?session=${sessionId}&id=${viewState.id}&page=${page}`
			);
			if (!res.ok) return;
			const blob = await res.blob();
			pageBlobUrls[page] = URL.createObjectURL(blob);
		} catch {
			/* ignore */
		} finally {
			loadingPreview = false;
		}
	}

	// ── PDF → page images (client-side, before anything is uploaded) ──
	async function renderPdfToPageBlobs(file: File): Promise<Blob[]> {
		const buf = await file.arrayBuffer();
		const pdf = await getDocument({ data: buf }).promise;
		const count = Math.min(pdf.numPages, MAX_PAGES);
		const blobs: Blob[] = [];
		for (let i = 1; i <= count; i++) {
			const page = await pdf.getPage(i);
			const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
			const canvas = document.createElement('canvas');
			canvas.width = Math.ceil(viewport.width);
			canvas.height = Math.ceil(viewport.height);
			const ctx = canvas.getContext('2d');
			if (!ctx) continue;
			await page.render({ canvasContext: ctx, viewport, canvas }).promise;
			const blob = await new Promise<Blob | null>((resolve) =>
				canvas.toBlob((b) => resolve(b), 'image/jpeg', PDF_JPEG_QUALITY)
			);
			if (blob) blobs.push(blob);
		}
		return blobs;
	}

	function revokePreviewUrls() {
		for (const u of pageBlobUrls) if (u) URL.revokeObjectURL(u);
	}

	async function handleFileChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		error = null;

		let pages: Blob[];
		try {
			if (file.type === 'application/pdf') {
				pages = await renderPdfToPageBlobs(file);
			} else if (file.type.startsWith('image/')) {
				pages = [file];
			} else {
				error = 'Choose an image or PDF file.';
				return;
			}
		} catch {
			error = 'Could not read that file.';
			return;
		}

		if (pages.length === 0) {
			error = 'No pages found in that file.';
			return;
		}
		if (pages.length > MAX_PAGES) {
			error = `That PDF has more than ${MAX_PAGES} pages — trim it down first.`;
			return;
		}

		revokePreviewUrls();
		pageBlobUrls = Array(pages.length).fill(null);
		pageStrokes = {};

		const docId = crypto.randomUUID();
		const docName = file.name;
		uploading = true;
		uploadProgress = { current: 0, total: pages.length };
		try {
			for (let i = 0; i < pages.length; i++) {
				const blob = pages[i];
				const res = await fetch('/api/docshare/page', {
					method: 'POST',
					headers: {
						'X-Doc-Id': docId,
						'X-Doc-Name': encodeURIComponent(docName),
						'X-Doc-Page': String(i),
						'X-Doc-Page-Count': String(pages.length),
						'Content-Type': blob.type || 'application/octet-stream'
					},
					body: blob
				});
				if (!res.ok) throw new Error('upload failed');
				pageBlobUrls[i] = URL.createObjectURL(blob);
				uploadProgress = { current: i + 1, total: pages.length };
			}
			viewState = {
				id: docId,
				name: docName,
				pageCount: pages.length,
				currentPage: 0,
				visible: false
			};
		} catch {
			error = 'Upload failed partway through — try again.';
			viewState = null;
			pageBlobUrls = [];
		} finally {
			uploading = false;
			uploadProgress = null;
			if (fileInput) fileInput.value = '';
		}
	}

	async function pushState(changes: Partial<Pick<ViewState, 'visible' | 'currentPage'>>) {
		if (!viewState) return;
		const next = { ...viewState, ...changes };
		viewState = next;
		try {
			await fetch('/api/docshare/state', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(changes)
			});
		} catch {
			/* fire-and-forget, matches the rest of the app's sync style */
		}
	}

	function show() {
		pushState({ visible: true });
	}
	function hide() {
		pushState({ visible: false });
	}
	function goToPage(page: number) {
		if (!viewState) return;
		const clamped = Math.max(0, Math.min(page, viewState.pageCount - 1));
		naturalW = 0;
		naturalH = 0;
		pushState({ currentPage: clamped });
		loadPageBlob(clamped);
	}

	async function removeDoc() {
		if (!confirm('Remove this document? Players will stop seeing it.')) return;
		try {
			await fetch('/api/docshare/page', { method: 'DELETE' });
		} catch {
			/* ignore */
		}
		revokePreviewUrls();
		viewState = null;
		pageBlobUrls = [];
		pageStrokes = {};
	}

	// ── Annotation sync — POST always replaces the current page's full stroke list, so the
	// same call serves both throttled live-drawing updates and the final committed stroke. ──
	async function pushStrokes(strokes: Stroke[]) {
		if (!viewState) return;
		try {
			await fetch('/api/docshare/annotate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ docId: viewState.id, page: viewState.currentPage, strokes })
			});
		} catch {
			/* fire-and-forget */
		}
	}

	function handleLiveUpdate(strokes: Stroke[]) {
		pushStrokes(strokes);
	}

	function handleStrokeComplete(stroke: Stroke) {
		if (!viewState) return;
		const page = viewState.currentPage;
		const next = [...(pageStrokes[page] ?? []), stroke];
		pageStrokes = { ...pageStrokes, [page]: next };
		pushStrokes(next);
	}

	function undoStroke() {
		if (!viewState) return;
		const page = viewState.currentPage;
		const current = pageStrokes[page] ?? [];
		if (current.length === 0) return;
		const next = current.slice(0, -1);
		pageStrokes = { ...pageStrokes, [page]: next };
		pushStrokes(next);
	}

	function clearStrokes() {
		if (!viewState) return;
		const page = viewState.currentPage;
		if ((pageStrokes[page] ?? []).length === 0) return;
		pageStrokes = { ...pageStrokes, [page]: [] };
		pushStrokes([]);
	}

	$effect(() => () => revokePreviewUrls());
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
	class="fixed top-[50%] left-[50%] z-[151] flex max-h-[90vh] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-2xl border border-teal-800/60 bg-gray-900 shadow-2xl"
>
	<!-- Header -->
	<div
		class="flex shrink-0 items-center justify-between border-b border-gray-700/60 bg-gradient-to-r from-teal-950/60 to-gray-900 px-6 py-4"
	>
		<div class="flex items-center gap-3">
			<i class="fa-duotone fa-light fa-file-image text-2xl" aria-hidden="true"></i>
			<div>
				<h2 class="text-lg font-black tracking-wider text-teal-300 uppercase">Document Share</h2>
				<p class="text-xs text-gray-500">Show an image or PDF handout to your players</p>
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
			<!-- ── No document prepared ──────────────────────────────────────────── -->
			<label
				class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-700 px-6 py-12 text-center transition hover:border-teal-600 hover:bg-teal-950/10"
			>
				<input
					bind:this={fileInput}
					type="file"
					accept="image/*,application/pdf"
					class="sr-only"
					onchange={handleFileChange}
					disabled={uploading}
				/>
				<i class="fa-duotone fa-light fa-cloud-arrow-up text-4xl text-gray-500" aria-hidden="true"
				></i>
				<span class="text-sm font-semibold text-gray-300">Click to choose a file</span>
				<span class="text-xs text-gray-600">Image or PDF, up to {MAX_PAGES} pages</span>
			</label>

			{#if uploading}
				<div class="mt-4 flex flex-col gap-1.5">
					<div class="h-2 w-full overflow-hidden rounded-full bg-gray-800">
						<div
							class="h-full rounded-full bg-teal-500 transition-all duration-300"
							style="width: {uploadProgress
								? (uploadProgress.current / uploadProgress.total) * 100
								: 0}%;"
						></div>
					</div>
					<span class="text-center text-xs text-gray-500">
						{#if uploadProgress && uploadProgress.total > 1}
							Rendering &amp; uploading page {uploadProgress.current} of {uploadProgress.total}…
						{:else}
							Uploading…
						{/if}
					</span>
				</div>
			{/if}
		{:else}
			<!-- ── Prepared document ──────────────────────────────────────────────── -->
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between gap-3">
					<div class="min-w-0">
						<p class="truncate text-sm font-semibold text-gray-200">{viewState.name}</p>
						<p class="text-xs text-gray-500">
							{viewState.pageCount} page{viewState.pageCount !== 1 ? 's' : ''} ·
							{viewState.visible ? 'Showing to players' : 'Hidden'}
						</p>
					</div>
					<button
						onclick={removeDoc}
						title="Remove this document"
						class="shrink-0 rounded-lg p-2 text-gray-600 transition hover:bg-red-950/40 hover:text-red-400"
					>
						<i class="fa-duotone fa-light fa-trash text-sm" aria-hidden="true"></i>
					</button>
				</div>

				<!-- Preview -->
				<div
					class="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-gray-700 bg-gray-950"
				>
					{#if pageBlobUrls[viewState.currentPage]}
						<img
							src={pageBlobUrls[viewState.currentPage]}
							alt="Page {viewState.currentPage + 1} preview"
							class="h-full w-full object-contain"
							onload={(e) => {
								naturalW = (e.currentTarget as HTMLImageElement).naturalWidth;
								naturalH = (e.currentTarget as HTMLImageElement).naturalHeight;
							}}
						/>
						{#if naturalW > 0}
							<AnnotationCanvas
								naturalWidth={naturalW}
								naturalHeight={naturalH}
								strokes={currentStrokes}
								interactive
								{activeColor}
								{activeWidth}
								onStrokeComplete={handleStrokeComplete}
								onLiveUpdate={handleLiveUpdate}
							/>
						{/if}
					{:else if loadingPreview}
						<i
							class="fa-duotone fa-light fa-spinner-third animate-spin text-3xl text-gray-600"
							aria-hidden="true"
						></i>
					{:else}
						<i class="fa-duotone fa-light fa-image text-3xl text-gray-700" aria-hidden="true"></i>
					{/if}
					{#if viewState.visible}
						<span
							class="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase shadow"
						>
							<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-white"></span> Live
						</span>
					{/if}
				</div>

				<!-- Annotation toolbar -->
				<div class="flex flex-wrap items-center justify-center gap-3">
					<div class="flex items-center gap-1.5">
						{#each ANNOTATION_COLORS as c}
							<button
								onclick={() => (activeColor = c)}
								aria-label="Pen color {c}"
								class="h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-gray-900 transition {activeColor ===
								c
									? 'ring-white'
									: 'ring-transparent'}"
								style="background: {c};"
							></button>
						{/each}
					</div>
					<div class="flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-800 p-0.5">
						{#each ANNOTATION_WIDTHS as w}
							<button
								onclick={() => (activeWidth = w.value)}
								class="rounded-md px-2 py-1 text-xs font-semibold transition {activeWidth ===
								w.value
									? 'bg-teal-600 text-white'
									: 'text-gray-400 hover:text-gray-200'}"
							>
								{w.label}
							</button>
						{/each}
					</div>
					<button
						onclick={undoStroke}
						disabled={currentStrokes.length === 0}
						title="Undo last stroke"
						class="rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-gray-300 transition hover:border-teal-600 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-30"
					>
						<i class="fa-duotone fa-light fa-arrow-rotate-left text-sm" aria-hidden="true"></i>
					</button>
					<button
						onclick={clearStrokes}
						disabled={currentStrokes.length === 0}
						title="Clear this page's annotations"
						class="rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-gray-300 transition hover:border-red-700 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
					>
						<i class="fa-duotone fa-light fa-eraser text-sm" aria-hidden="true"></i>
					</button>
				</div>

				<!-- Page navigation -->
				{#if viewState.pageCount > 1}
					<div class="flex items-center justify-center gap-3">
						<button
							onclick={() => goToPage(viewState!.currentPage - 1)}
							disabled={viewState.currentPage === 0}
							aria-label="Previous page"
							class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-gray-300 transition hover:border-teal-600 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-30"
						>
							<i class="fa-duotone fa-light fa-chevron-left" aria-hidden="true"></i>
						</button>
						<span class="min-w-[5rem] text-center text-sm text-gray-400">
							Page {viewState.currentPage + 1} / {viewState.pageCount}
						</span>
						<button
							onclick={() => goToPage(viewState!.currentPage + 1)}
							disabled={viewState.currentPage >= viewState.pageCount - 1}
							aria-label="Next page"
							class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-gray-300 transition hover:border-teal-600 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-30"
						>
							<i class="fa-duotone fa-light fa-chevron-right" aria-hidden="true"></i>
						</button>
					</div>
				{/if}

				<!-- Show / Hide -->
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
						class="rounded-xl bg-teal-600 py-3 font-black tracking-wider text-white uppercase transition hover:bg-teal-500 active:scale-95"
					>
						<i class="fa-duotone fa-light fa-eye" aria-hidden="true"></i> Show to Players
					</button>
				{/if}

				<label
					class="cursor-pointer self-center text-xs font-semibold text-gray-500 underline decoration-dotted transition hover:text-teal-400"
				>
					<input
						type="file"
						accept="image/*,application/pdf"
						class="sr-only"
						onchange={handleFileChange}
						disabled={uploading}
					/>
					Replace with a different file
				</label>

				{#if uploading}
					<div class="flex flex-col gap-1.5">
						<div class="h-2 w-full overflow-hidden rounded-full bg-gray-800">
							<div
								class="h-full rounded-full bg-teal-500 transition-all duration-300"
								style="width: {uploadProgress
									? (uploadProgress.current / uploadProgress.total) * 100
									: 0}%;"
							></div>
						</div>
						<span class="text-center text-xs text-gray-500">
							{#if uploadProgress && uploadProgress.total > 1}
								Rendering &amp; uploading page {uploadProgress.current} of {uploadProgress.total}…
							{:else}
								Uploading…
							{/if}
						</span>
					</div>
				{/if}
			</div>
		{/if}

		{#if error}
			<p class="mt-3 text-center text-xs text-red-400">{error}</p>
		{/if}
	</div>
</div>
