<!-- Full-screen audio mixer overlay for the DM.
     Starts with 5 channels; more can be added via the "+ Add a Channel" card.
     Automatically splits into two equal-height rows when channels overflow one row.
     Each channel has file upload, vertical fader, play/stop, solo, mute, editable label, and delete.
     Master volume at the top. Labels, volumes, and count persisted to localStorage.
     Audio keeps playing when the mixer is closed (parent wraps in a hidden div instead of {#if}). -->
<script lang="ts">
	import { browser } from '$app/environment';
	import { untrack } from 'svelte';

	let { onclose }: { onclose: () => void } = $props();

	// ── Marquee action — scrolls overflowing label text back and forth ─────────
	function scrollMarquee(node: HTMLInputElement) {
		let rafId: number;
		let pos = 0;
		let dir = 1;
		let lastTime = 0;
		let pauseUntil = 0;
		const SPEED_PX_S = 30; // px per second
		const PAUSE_MS = 1500; // pause at each end

		function tick(timestamp: number) {
			if (lastTime === 0) lastTime = timestamp;
			const dt = (timestamp - lastTime) / 1000;
			lastTime = timestamp;

			if (document.activeElement !== node) {
				const max = node.scrollWidth - node.clientWidth;
				if (max > 0) {
					if (timestamp >= pauseUntil) {
						pos += dir * SPEED_PX_S * dt;
						if (pos >= max) {
							pos = max;
							dir = -1;
							pauseUntil = timestamp + PAUSE_MS;
						} else if (pos <= 0) {
							pos = 0;
							dir = 1;
							pauseUntil = timestamp + PAUSE_MS;
						}
						node.scrollLeft = pos;
					}
				}
			}
			rafId = requestAnimationFrame(tick);
		}

		function onFocus() {
			pos = 0;
			node.scrollLeft = 0;
			lastTime = 0;
			pauseUntil = 0;
		}
		function onBlur() {
			pos = 0;
			dir = 1;
			lastTime = 0;
			pauseUntil = 0;
		}

		rafId = requestAnimationFrame(tick);
		node.addEventListener('focus', onFocus);
		node.addEventListener('blur', onBlur);

		return {
			destroy() {
				cancelAnimationFrame(rafId);
				node.removeEventListener('focus', onFocus);
				node.removeEventListener('blur', onBlur);
			}
		};
	}

	const DEFAULT_COUNT = 5;
	const STORAGE_KEY = 'dm-mixer-settings';
	const CHANNEL_W = 118; // px — must match w-[118px] in template
	const GAP = 12; // px — gap-3
	const PAD = 32; // px — p-4 on each side of the channel area

	interface Channel {
		id: string; // stable UUID — IndexedDB key for the saved file handle
		label: string;
		fileName: string | null;
		// Set when the handle was restored but permission hasn't been granted yet
		// (requires a user gesture to call requestPermission).
		pendingHandle: FileSystemFileHandle | null;
		persistFailed: boolean; // fallback: true when ArrayBuffer save hits quota
		volume: number;
		muted: boolean;
		solo: boolean;
		playing: boolean;
	}

	// File System Access API available in Chrome/Edge — stores a tiny handle
	// reference instead of the full file content, so quota is never an issue.
	const hasFSA = browser && 'showOpenFilePicker' in window;

	// ── IndexedDB helpers ─────────────────────────────────────────────────────
	const IDB_NAME = 'dm-mixer-files';
	const IDB_STORE = 'files';

	function openFreshIDB(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const req = indexedDB.open(IDB_NAME, 1);
			req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
	}

	async function idbPut(key: string, value: unknown): Promise<boolean> {
		let db: IDBDatabase | null = null;
		try {
			db = await openFreshIDB();
			await new Promise<void>((res, rej) => {
				const tx = db!.transaction(IDB_STORE, 'readwrite');
				const req = tx.objectStore(IDB_STORE).put(value, key);
				req.onerror = (e) => {
					e.preventDefault();
					rej(req.error);
				};
				tx.oncomplete = () => res();
				tx.onabort = () => rej(tx.error ?? new Error('IDB transaction aborted'));
			});
			return true;
		} catch (err) {
			console.warn('[Mixer] idbPut failed:', err);
			return false;
		} finally {
			db?.close();
		}
	}

	type IdbEntry =
		| { kind: 'handle'; handle: FileSystemFileHandle; name: string }
		| { kind: 'blob'; blob: Blob; name: string };

	async function idbLoad(key: string): Promise<IdbEntry | null> {
		let db: IDBDatabase | null = null;
		try {
			db = await openFreshIDB();
			const raw = await new Promise<Record<string, unknown> | null>((resolve) => {
				const tx = db!.transaction(IDB_STORE, 'readonly');
				const req = tx.objectStore(IDB_STORE).get(key);
				req.onsuccess = () => resolve((req.result as Record<string, unknown>) ?? null);
				req.onerror = () => resolve(null);
			});
			if (!raw) return null;
			if (raw.handle)
				return {
					kind: 'handle',
					handle: raw.handle as FileSystemFileHandle,
					name: raw.name as string
				};
			if (raw.buffer instanceof ArrayBuffer)
				return {
					kind: 'blob',
					blob: new Blob([raw.buffer], { type: raw.type as string }),
					name: raw.name as string
				};
			if (raw.blob instanceof Blob)
				return { kind: 'blob', blob: raw.blob as Blob, name: raw.name as string };
			return null;
		} catch (err) {
			console.warn('[Mixer] idbLoad failed:', err);
			return null;
		} finally {
			db?.close();
		}
	}

	async function idbDelete(key: string) {
		let db: IDBDatabase | null = null;
		try {
			db = await openFreshIDB();
			await new Promise<void>((res) => {
				const tx = db!.transaction(IDB_STORE, 'readwrite');
				tx.objectStore(IDB_STORE).delete(key);
				tx.oncomplete = () => res();
				tx.onabort = () => res();
			});
		} catch {
			/* silent */
		} finally {
			db?.close();
		}
	}

	// ── File System Access API path (Chrome/Edge) ─────────────────────────────
	// Opens the OS file picker, stores a tiny handle reference in IDB.
	async function showFilePicker(i: number) {
		try {
			type FSAPicker = { showOpenFilePicker: (o?: unknown) => Promise<FileSystemFileHandle[]> };
			const [handle] = await (window as unknown as FSAPicker).showOpenFilePicker({
				types: [{ description: 'Audio', accept: { 'audio/*': [] } }],
				multiple: false
			});
			await applyHandle(i, handle, /* saveToIdb */ true);
		} catch {
			/* user cancelled */
		}
	}

	// Reads the file from a handle, wires up the audio element, optionally saves.
	async function applyHandle(i: number, handle: FileSystemFileHandle, saveToIdb: boolean) {
		try {
			const file = await handle.getFile();
			const a = audios[i];
			const wasPlaying = channels[i].playing;
			a.pause();
			if (a.src.startsWith('blob:')) URL.revokeObjectURL(a.src);
			a.src = URL.createObjectURL(file);
			a.load();
			channels[i].fileName = file.name;
			channels[i].pendingHandle = null;
			channels[i].persistFailed = false;
			channels[i].playing = false;
			if (wasPlaying) {
				a.play().catch(() => {});
				channels[i].playing = true;
			}
			applyVol(i);
			if (saveToIdb) {
				const ok = await idbPut(channels[i].id, { handle, name: file.name });
				channels[i].persistFailed = !ok;
				saveSettings();
			}
		} catch (err) {
			console.warn('[Mixer] applyHandle failed:', err);
		}
	}

	// Called when user clicks "Tap to restore" on a channel with a pending handle.
	// Must be called from a user-gesture context so requestPermission is allowed.
	async function restoreFromHandle(i: number) {
		const handle = channels[i].pendingHandle;
		if (!handle) return;
		try {
			type WithPerm = { requestPermission(o: { mode: string }): Promise<PermissionState> };
			const perm = await (handle as unknown as WithPerm).requestPermission({ mode: 'read' });
			if (perm === 'granted') await applyHandle(i, handle, /* saveToIdb */ false);
		} catch (err) {
			console.warn('[Mixer] restoreFromHandle failed:', err);
		}
	}

	// ── Fallback path (Firefox / non-FSA browsers) — store ArrayBuffer in IDB ─
	function handleFile(i: number, e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const a = audios[i];
		const wasPlaying = channels[i].playing;
		a.pause();
		if (a.src.startsWith('blob:')) URL.revokeObjectURL(a.src);
		a.src = URL.createObjectURL(file);
		a.load();
		channels[i].fileName = file.name;
		channels[i].pendingHandle = null;
		channels[i].persistFailed = false;
		channels[i].playing = false;
		if (wasPlaying) {
			a.play().catch(() => {});
			channels[i].playing = true;
		}
		applyVol(i);
		saveSettings();
		idbPut(channels[i].id, { buffer: null, name: file.name, _needsBuffer: true });
		// Read the ArrayBuffer async and then overwrite with the real entry.
		file.arrayBuffer().then((buffer) =>
			idbPut(channels[i].id, { buffer, type: file.type || 'audio/mpeg', name: file.name }).then(
				(ok) => {
					channels[i].persistFailed = !ok;
				}
			)
		);
	}

	// ── Persistence ───────────────────────────────────────────────────────────
	function loadSaved(): {
		ids?: string[];
		labels?: string[];
		volumes?: number[];
		master?: number;
		count?: number;
	} {
		if (!browser) return {};
		try {
			return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
		} catch {
			return {};
		}
	}

	function saveSettings() {
		if (!browser) return;
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				count: channels.length,
				ids: channels.map((c) => c.id),
				labels: channels.map((c) => c.label),
				volumes: channels.map((c) => c.volume),
				master: masterVolume
			})
		);
	}

	const saved = loadSaved();
	const initCount = saved.count ?? DEFAULT_COUNT;

	// ── State ─────────────────────────────────────────────────────────────────
	let masterVolume = $state(saved.master ?? 0.8);
	let channels = $state<Channel[]>(
		Array.from({ length: initCount }, (_, i) => ({
			id: saved.ids?.[i] ?? crypto.randomUUID(),
			label: saved.labels?.[i] ?? `Channel ${i + 1}`,
			fileName: null,
			pendingHandle: null,
			persistFailed: false,
			volume: saved.volumes?.[i] ?? 0.8,
			muted: false,
			solo: false,
			playing: false
		}))
	);

	// ── Audio objects — parallel array to channels, managed imperatively ──────
	// remainingTimes[i] = seconds left in clip (null = no file loaded)
	let remainingTimes = $state<(number | null)[]>(Array(initCount).fill(null));

	function formatTime(s: number): string {
		const total = Math.max(0, Math.floor(s));
		const hh = Math.floor(total / 3600);
		const mm = Math.floor((total % 3600) / 60);
		const ss = total % 60;
		return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
	}

	// Attach timeupdate + loadedmetadata listeners. Uses indexOf so the index
	// stays correct even after channels are added or removed.
	function setupAudioListeners(a: HTMLAudioElement) {
		a.onloadedmetadata = () => {
			const idx = audios.indexOf(a);
			if (idx >= 0 && isFinite(a.duration)) remainingTimes[idx] = a.duration;
		};
		a.ontimeupdate = () => {
			const idx = audios.indexOf(a);
			if (idx >= 0 && isFinite(a.duration)) remainingTimes[idx] = a.duration - a.currentTime;
		};
	}

	const audios: HTMLAudioElement[] = browser
		? Array.from({ length: initCount }, () => {
				const a = new Audio();
				a.loop = true;
				setupAudioListeners(a);
				return a;
			})
		: [];

	// ── Restore saved files from IndexedDB on mount ───────────────────────────
	let _filesRestored = false;
	$effect(() => {
		if (!browser || _filesRestored) return;
		_filesRestored = true;
		const ids = channels.map((c) => c.id);
		(async () => {
			for (let i = 0; i < ids.length; i++) {
				try {
					const entry = await idbLoad(ids[i]);
					if (!entry || !audios[i]) continue;

					if (entry.kind === 'handle') {
						// Check permission without requiring a user gesture.
						type WithQuery = { queryPermission(o: { mode: string }): Promise<PermissionState> };
						const perm = await (entry.handle as unknown as WithQuery).queryPermission({
							mode: 'read'
						});
						if (perm === 'granted') {
							await applyHandle(i, entry.handle, /* saveToIdb */ false);
						} else {
							// Permission needs re-granting — show the "Tap to restore" UI.
							channels[i].fileName = entry.name;
							channels[i].pendingHandle = entry.handle;
						}
					} else {
						audios[i].src = URL.createObjectURL(entry.blob);
						audios[i].load();
						channels[i].fileName = entry.name;
						applyVol(i);
					}
				} catch (err) {
					console.warn(`[Mixer] Failed to restore channel ${i}:`, err);
				}
			}
		})();
	});

	const anySolo = $derived(channels.some((c) => c.solo));

	// Measured height of each channel's fader track — updated by bind:clientHeight
	let faderHeights = $state<number[]>(Array(initCount).fill(0));
	let masterFaderHeight = $state(0);

	// ── Two-row layout detection ──────────────────────────────────────────────
	let containerWidth = $state(0);

	// Total width needed for all channels + add button in a single row
	const singleRowWidth = $derived(
		(channels.length + 1) * (CHANNEL_W + GAP) + CHANNEL_W // +1 for master channel; last term = add button
	);
	const twoRows = $derived(containerWidth > 0 && singleRowWidth > containerWidth - PAD);
	const row1Count = $derived(Math.ceil(channels.length / 2));
	const isMobile = $derived(containerWidth > 0 && containerWidth < 768);

	// When the layout flips between single and double row, channel strip heights change.
	// Reset faderHeights to 0 so bind:clientHeight remeasures them cleanly.
	$effect(() => {
		twoRows; // reactive dependency — only runs when twoRows changes
		untrack(() => {
			faderHeights = Array(channels.length).fill(0);
			masterFaderHeight = 0;
		});
	});

	// ── Volume helpers ────────────────────────────────────────────────────────
	function effectiveVol(i: number): number {
		const ch = channels[i];
		if (ch.muted) return 0;
		if (anySolo && !ch.solo) return 0;
		return Math.max(0, Math.min(1, masterVolume * ch.volume));
	}

	function applyVol(i: number) {
		if (audios[i]) audios[i].volume = effectiveVol(i);
	}

	function applyAllVols() {
		for (let i = 0; i < channels.length; i++) applyVol(i);
	}

	// ── Channel actions ───────────────────────────────────────────────────────

	function fadeOutAndStop(i: number, duration = 400) {
		const a = audios[i];
		const startVol = a.volume;
		const steps = 20;
		const stepMs = duration / steps;
		let step = 0;
		const timer = setInterval(() => {
			step++;
			a.volume = Math.max(0, startVol * (1 - step / steps));
			if (step >= steps) {
				clearInterval(timer);
				a.pause();
				a.volume = effectiveVol(i);
				channels[i].playing = false;
			}
		}, stepMs);
	}

	function togglePlay(i: number) {
		const ch = channels[i];
		const a = audios[i];
		if (!ch.fileName) return;
		if (ch.playing) {
			fadeOutAndStop(i);
		} else {
			applyVol(i);
			a.play().catch(() => {});
			channels[i].playing = true;
		}
	}

	function toggleMute(i: number) {
		channels[i].muted = !channels[i].muted;
		applyAllVols();
	}

	function toggleSolo(i: number) {
		channels[i].solo = !channels[i].solo;
		applyAllVols();
	}

	function setChannelVol(i: number, v: number) {
		channels[i].volume = v;
		applyVol(i);
		saveSettings();
	}

	function stopAll() {
		channels.forEach((ch, i) => {
			if (ch.playing) fadeOutAndStop(i);
		});
	}

	function setMaster(v: number) {
		masterVolume = v;
		applyAllVols();
		saveSettings();
	}

	function renameChannel(i: number, name: string) {
		channels[i].label = name.trim() || `Channel ${i + 1}`;
		saveSettings();
	}

	// ── Add / remove channels ─────────────────────────────────────────────────
	function addChannel() {
		const n = channels.length + 1;
		channels.push({
			id: crypto.randomUUID(),
			label: `Channel ${n}`,
			fileName: null,
			pendingHandle: null,
			persistFailed: false,
			volume: 0.8,
			muted: false,
			solo: false,
			playing: false
		});
		faderHeights.push(0);
		remainingTimes.push(null);
		if (browser) {
			const a = new Audio();
			a.loop = true;
			setupAudioListeners(a);
			audios.push(a);
		}
		saveSettings();
	}

	function removeChannel(i: number) {
		const channelId = channels[i].id;
		const a = audios[i];
		if (a) {
			a.pause();
			a.ontimeupdate = null;
			a.onloadedmetadata = null;
			if (a.src.startsWith('blob:')) URL.revokeObjectURL(a.src);
			audios.splice(i, 1);
		}
		channels.splice(i, 1);
		faderHeights.splice(i, 1);
		remainingTimes.splice(i, 1);
		idbDelete(channelId);
		saveSettings();
	}

	// ── Close / keyboard ──────────────────────────────────────────────────────
	function close() {
		onclose();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	// ── Cleanup on destroy ────────────────────────────────────────────────────
	$effect(() => () => {
		audios.forEach((a) => {
			a.pause();
			if (a.src.startsWith('blob:')) URL.revokeObjectURL(a.src);
		});
	});
</script>

<svelte:window onkeydown={onKeydown} />

<!-- ── Channel strip snippet (reused in both single-row and two-row layouts) ── -->
{#snippet strip(ch: Channel, i: number)}
	<div
		class="flex w-[118px] shrink-0 flex-col gap-2.5 rounded-xl border border-gray-700/80 bg-gray-900 px-3 py-3 shadow-lg"
	>
		<!-- Label + delete row -->
		<div class="flex items-center gap-1">
			<input
				type="text"
				value={ch.label}
				onchange={(e) => renameChannel(i, (e.target as HTMLInputElement).value)}
				use:scrollMarquee
				class="min-w-0 flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-center text-xs font-bold text-amber-300 transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 focus:outline-none"
			/>
			<button
				onclick={() => removeChannel(i)}
				title="Remove channel"
				class="shrink-0 rounded p-0.5 text-gray-600 transition hover:bg-red-900/40 hover:text-red-400"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-3.5 w-3.5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2.5"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Playing indicator dot -->
		<div class="flex justify-center">
			{#if ch.playing}
				<span class="relative flex h-2.5 w-2.5">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
					></span>
					<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
				</span>
			{:else}
				<span class="h-2.5 w-2.5 rounded-full bg-gray-700"></span>
			{/if}
		</div>

		<!-- File upload -->
		{#if hasFSA}
			{#if ch.pendingHandle}
				<!-- Handle loaded but needs permission re-grant (new browser session) -->
				<button
					onclick={() => restoreFromHandle(i)}
					class="block w-full rounded border border-dashed border-amber-600/60 bg-amber-950/20 px-2 py-2 text-center transition hover:border-amber-500 hover:bg-amber-900/30"
					title="Click to restore — browser needs permission to re-read this file"
				>
					<span
						class="block w-full truncate text-[10px] leading-tight text-amber-400/80"
						title={ch.fileName ?? ''}>🔒 {ch.fileName}</span
					>
				</button>
			{:else}
				<button
					onclick={() => showFilePicker(i)}
					class="block w-full rounded border border-dashed border-gray-600 bg-gray-800/50 px-2 py-2 text-center transition hover:border-amber-600 hover:bg-amber-900/10"
				>
					{#if ch.fileName}
						<span
							class="block w-full truncate text-[10px] leading-tight text-amber-300"
							title={ch.fileName}>{ch.fileName}</span
						>
					{:else}
						<span class="text-[10px] text-gray-500">Upload audio</span>
					{/if}
				</button>
			{/if}
		{:else}
			<!-- Fallback for Firefox / non-FSA browsers -->
			<label class="block cursor-pointer">
				<input type="file" accept="audio/*" class="sr-only" onchange={(e) => handleFile(i, e)} />
				<div
					class="rounded border border-dashed border-gray-600 bg-gray-800/50 px-2 py-2 text-center transition hover:border-amber-600 hover:bg-amber-900/10"
				>
					{#if ch.fileName}
						<span
							class="block w-full truncate text-[10px] leading-tight text-amber-300"
							title={ch.fileName}>{ch.fileName}</span
						>
					{:else}
						<span class="text-[10px] text-gray-500">Upload audio</span>
					{/if}
				</div>
			</label>
			{#if ch.persistFailed}
				<div
					class="rounded border border-amber-700/50 bg-amber-950/50 px-1.5 py-0.5 text-center text-[9px] leading-tight text-amber-400"
					title="File too large for browser storage — plays this session only"
				>
					⚠ won't persist
				</div>
			{/if}
		{/if}

		<!-- Time remaining -->
		<div
			class="text-center font-mono text-[10px] tabular-nums {remainingTimes[i] != null
				? 'text-gray-400'
				: 'text-gray-700'}"
		>
			{remainingTimes[i] != null ? formatTime(remainingTimes[i]!) : '--:--:--'}
		</div>

		{#if isMobile}
			<!-- ── Volume number input (mobile) ──────────────────────────────── -->
			<div class="flex flex-col items-center gap-1.5 py-1">
				<span class="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">Vol</span>
				<div class="flex items-center gap-1">
					<button
						onclick={() => setChannelVol(i, Math.max(0, ch.volume - 0.01))}
						class="flex h-7 w-7 items-center justify-center rounded border border-gray-700 bg-gray-800 text-gray-400 transition hover:border-gray-500 hover:text-white active:bg-gray-700"
						>−</button
					>
					<input
						type="number"
						min="0"
						max="100"
						step="1"
						value={Math.round(ch.volume * 100)}
						oninput={(e) =>
							setChannelVol(
								i,
								Math.max(0, Math.min(100, parseInt((e.target as HTMLInputElement).value) || 0)) /
									100
							)}
						class="w-12 rounded border border-gray-700 bg-gray-800 py-1 text-center font-mono text-xs text-amber-300 focus:border-amber-500 focus:outline-none"
					/>
					<button
						onclick={() => setChannelVol(i, Math.min(1, ch.volume + 0.01))}
						class="flex h-7 w-7 items-center justify-center rounded border border-gray-700 bg-gray-800 text-gray-400 transition hover:border-gray-500 hover:text-white active:bg-gray-700"
						>+</button
					>
				</div>
			</div>
		{:else}
			<!-- ── Vertical fader (desktop) ───────────────────────────────────── -->
			<div class="flex flex-1 flex-col items-center gap-1">
				<span class="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">Vol</span>
				<div
					class="relative flex flex-1 items-center justify-center self-stretch overflow-hidden"
					bind:clientHeight={faderHeights[i]}
				>
					{#if faderHeights[i] > 0}
						<div class="relative" style="width: 28px; height: {faderHeights[i]}px;">
							<input
								type="range"
								min="0"
								max="1"
								step="0.01"
								value={ch.volume}
								oninput={(e) => setChannelVol(i, parseFloat((e.target as HTMLInputElement).value))}
								class="fader absolute"
								style="
									width: {faderHeights[i]}px;
									height: 28px;
									top: {(faderHeights[i] - 28) / 2}px;
									left: -{(faderHeights[i] - 28) / 2}px;
									transform: rotate(-90deg);
									transform-origin: center;
									cursor: pointer;
								"
							/>
						</div>
					{/if}
				</div>
				<span class="font-mono text-[10px] text-gray-400">{Math.round(ch.volume * 100)}%</span>
			</div>
		{/if}

		<!-- Play / Stop -->
		<button
			onclick={() => togglePlay(i)}
			disabled={!ch.fileName}
			title={ch.fileName ? (ch.playing ? 'Stop' : 'Play') : 'Upload a file first'}
			class="flex items-center justify-center gap-1 rounded border py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-30
				{ch.playing
				? 'border-green-700/70 bg-green-900/30 text-green-400 hover:bg-green-900/50'
				: 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500 hover:text-white'}"
		>
			{#if ch.playing}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-3 w-3"
					viewBox="0 0 24 24"
					fill="currentColor"
				>
					<rect x="6" y="6" width="12" height="12" rx="1.5" />
				</svg>
				Stop
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-3 w-3"
					viewBox="0 0 24 24"
					fill="currentColor"
				>
					<path d="M8 5v14l11-7z" />
				</svg>
				Play
			{/if}
		</button>

		<!-- Solo + Mute -->
		<div class="flex gap-1.5">
			<button
				onclick={() => toggleSolo(i)}
				title="Solo"
				class="flex-1 rounded border py-1 text-[11px] font-black tracking-wide uppercase transition
					{ch.solo
					? 'border-amber-500/70 bg-amber-900/40 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
					: 'border-gray-700 bg-gray-800 text-gray-500 hover:border-amber-700 hover:text-amber-500'}"
				>S</button
			>
			<button
				onclick={() => toggleMute(i)}
				title="Mute"
				class="flex-1 rounded border py-1 text-[11px] font-black tracking-wide uppercase transition
					{ch.muted
					? 'border-red-600/70 bg-red-900/40 text-red-400 shadow-[0_0_8px_rgba(220,38,38,0.3)]'
					: 'border-gray-700 bg-gray-800 text-gray-500 hover:border-red-800 hover:text-red-500'}"
				>M</button
			>
		</div>

		<!-- Channel number -->
		<div class="text-center text-[10px] font-semibold tracking-widest text-gray-600 uppercase">
			CH {i + 1}
		</div>
	</div>
{/snippet}

<!-- ── Master channel strip ────────────────────────────────────────────────── -->
{#snippet masterStrip()}
	<div
		class="flex w-[118px] shrink-0 flex-col gap-2.5 rounded-xl border border-amber-700/40 bg-gray-900 px-3 py-3 shadow-lg"
	>
		<!-- Label (non-editable) -->
		<div
			class="rounded border border-amber-700/40 bg-gray-800 px-2 py-1 text-center text-xs font-bold tracking-widest text-amber-400 uppercase"
		>
			Master
		</div>

		{#if isMobile}
			<!-- Volume number input (mobile) -->
			<div class="flex flex-col items-center gap-1.5 py-1">
				<span class="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">Vol</span>
				<div class="flex items-center gap-1">
					<button
						onclick={() => setMaster(Math.max(0, masterVolume - 0.01))}
						class="flex h-7 w-7 items-center justify-center rounded border border-gray-700 bg-gray-800 text-gray-400 transition hover:border-gray-500 hover:text-white active:bg-gray-700"
						>−</button
					>
					<input
						type="number"
						min="0"
						max="100"
						step="1"
						value={Math.round(masterVolume * 100)}
						oninput={(e) =>
							setMaster(
								Math.max(0, Math.min(100, parseInt((e.target as HTMLInputElement).value) || 0)) /
									100
							)}
						class="w-12 rounded border border-gray-700 bg-gray-800 py-1 text-center font-mono text-xs text-amber-300 focus:border-amber-500 focus:outline-none"
					/>
					<button
						onclick={() => setMaster(Math.min(1, masterVolume + 0.01))}
						class="flex h-7 w-7 items-center justify-center rounded border border-gray-700 bg-gray-800 text-gray-400 transition hover:border-gray-500 hover:text-white active:bg-gray-700"
						>+</button
					>
				</div>
			</div>
		{:else}
			<!-- Vertical fader (desktop) -->
			<div class="flex flex-1 flex-col items-center gap-1">
				<span class="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">Vol</span>
				<div
					class="relative flex flex-1 items-center justify-center self-stretch overflow-hidden"
					bind:clientHeight={masterFaderHeight}
				>
					{#if masterFaderHeight > 0}
						<div class="relative" style="width: 28px; height: {masterFaderHeight}px;">
							<input
								type="range"
								min="0"
								max="1"
								step="0.01"
								value={masterVolume}
								oninput={(e) => setMaster(parseFloat((e.target as HTMLInputElement).value))}
								class="fader absolute"
								style="
									width: {masterFaderHeight}px;
									height: 28px;
									top: {(masterFaderHeight - 28) / 2}px;
									left: -{(masterFaderHeight - 28) / 2}px;
									transform: rotate(-90deg);
									transform-origin: center;
									cursor: pointer;
								"
							/>
						</div>
					{/if}
				</div>
				<span class="font-mono text-[10px] text-amber-400">{Math.round(masterVolume * 100)}%</span>
			</div>
		{/if}

		<!-- Stop All -->
		<button
			onclick={stopAll}
			title="Fade out and stop all playing channels"
			class="flex items-center justify-center gap-1 rounded border border-red-700/60 bg-red-900/30 py-1.5 text-xs font-semibold text-red-400 transition hover:border-red-500 hover:bg-red-900/50 hover:text-red-300"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-3 w-3"
				viewBox="0 0 24 24"
				fill="currentColor"
			>
				<rect x="6" y="6" width="12" height="12" rx="1.5" />
			</svg>
			Stop All
		</button>
	</div>
{/snippet}

<!-- ── Add Channel button snippet ─────────────────────────────────────────── -->
{#snippet addButton()}
	<button
		onclick={addChannel}
		class="flex w-[118px] shrink-0 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-700 bg-transparent text-gray-600 transition hover:border-amber-700/60 hover:text-amber-600"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-7 w-7"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="1.5"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
		</svg>
		<span class="text-center text-xs leading-tight font-semibold">Add a<br />Channel</span>
	</button>
{/snippet}

<div
	class="fixed inset-0 z-50 flex flex-col bg-gray-950 text-white"
	role="dialog"
	aria-label="Audio Mixer"
>
	<!-- ── Header ──────────────────────────────────────────────────────────── -->
	<header
		class="flex shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-3"
	>
		<div class="flex items-center gap-3">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 text-amber-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
				/>
			</svg>
			<h2 class="text-lg font-bold tracking-widest text-amber-400 uppercase">Audio Mixer</h2>
		</div>

		<button
			onclick={close}
			title="Close mixer (Esc)"
			class="rounded border border-gray-700 bg-gray-800 p-1.5 text-gray-400 transition hover:border-red-700 hover:text-red-400"
		>
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
		</button>
	</header>

	<!-- ── Channel area ────────────────────────────────────────────────────── -->
	<div class="flex flex-1 flex-col gap-3 overflow-hidden p-4" bind:clientWidth={containerWidth}>
		{#if twoRows}
			<!-- Two rows: channels split evenly, add button at end of row 2 -->
			<div class="flex min-h-0 flex-1 gap-3">
				{@render masterStrip()}
				{#each channels.slice(0, row1Count) as ch, li}
					{@render strip(ch, li)}
				{/each}
			</div>
			<div class="flex min-h-0 flex-1 gap-3">
				{#each channels.slice(row1Count) as ch, li}
					{@render strip(ch, li + row1Count)}
				{/each}
				{@render addButton()}
			</div>
		{:else}
			<!-- Single row -->
			<div class="flex h-full gap-3">
				{@render masterStrip()}
				{#each channels as ch, i}
					{@render strip(ch, i)}
				{/each}
				{@render addButton()}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Fader track */
	.fader {
		appearance: none;
		-webkit-appearance: none;
		background: transparent;
	}
	.fader::-webkit-slider-runnable-track {
		height: 3px;
		background: #374151;
		border-radius: 2px;
	}
	.fader::-moz-range-track {
		height: 3px;
		background: #374151;
		border-radius: 2px;
	}

	/* Fader handle — white rectangle.
	   Slider is rotated -90deg: CSS width = visual height, CSS height = visual width. */
	.fader::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 6px;
		height: 26px;
		background: #ffffff;
		border-radius: 3px;
		cursor: pointer;
		margin-top: -11.5px;
		box-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
	}
	.fader::-moz-range-thumb {
		width: 6px;
		height: 26px;
		background: #ffffff;
		border: none;
		border-radius: 3px;
		cursor: pointer;
		box-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
	}
	.fader:focus-visible::-webkit-slider-thumb {
		outline: 2px solid #f59e0b;
		outline-offset: 1px;
	}
</style>
