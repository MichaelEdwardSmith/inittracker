<!-- Voice command listener for the DM dashboard.
     Uses @huggingface/transformers (Whisper) running in a Web Worker for
     offline, API-free speech recognition. Audio is captured via MediaRecorder,
     silence-gated by a VAD loop, resampled to 16 kHz via OfflineAudioContext,
     then transcribed in the worker. Recognised commands call combat store
     actions directly; unknown "tracker" phrases fall back to the AI endpoint.
     Renders its own mic toggle button plus a brief feedback toast. -->
<script lang="ts">
	import { browser } from '$app/environment';
	import { combat } from '$lib/store.svelte';
	import { triggerRoll } from '$lib/diceOverlay.svelte';
	import VoiceCommandsHelpModal from './VoiceCommandsHelpModal.svelte';

	// ── Props ─────────────────────────────────────────────────────────────────
	const { mobile = false }: { mobile?: boolean } = $props();

	// ── Help modal (shown once per session on first activation) ───────────────
	const HELP_SEEN_KEY = 'voice-commands-help-seen';
	let showHelp = $state(false);

	// ── Status ───────────────────────────────────────────────────────────────
	type Status = 'idle' | 'loading' | 'ready' | 'listening' | 'processing';
	let status = $state<Status>('idle');
	let loadPct = $state(0); // 0-100 while model downloads

	// ── Toast ─────────────────────────────────────────────────────────────────
	let toast = $state<string | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | null = null;

	function showToast(msg: string, duration = 2500) {
		if (toastTimer) clearTimeout(toastTimer);
		toast = msg;
		toastTimer = setTimeout(() => (toast = null), duration);
	}

	// ── Hardcoded command matching ────────────────────────────────────────────
	const COMMANDS: Array<{ pattern: RegExp; label: string; action: () => void }> = [
		{
			pattern: /tracker\s+start\s+combat/i,
			label: 'Start Combat',
			action: () => {
				if (!combat.isInCombat) combat.startCombat();
			}
		},
		{
			// "end" is frequently misheard as "and", "in", or "an" by speech engines
			pattern: /tracker\s+(end|and|in|an)\s+combat/i,
			label: 'End Combat',
			action: () => {
				if (combat.isInCombat) combat.endCombat();
			}
		},
		{
			pattern: /tracker\s+next/i,
			label: 'Next Turn',
			action: () => {
				if (combat.isInCombat) combat.nextTurn();
			}
		},
		{
			pattern: /tracker\s+previous/i,
			label: 'Previous Turn',
			action: () => {
				if (combat.isInCombat) combat.prevTurn();
			}
		}
	];

	// ── Dice roll command parsing ─────────────────────────────────────────────
	const WORD_NUMS: Record<string, number> = {
		one: 1,
		two: 2,
		three: 3,
		four: 4,
		five: 5,
		six: 6,
		seven: 7,
		eight: 8,
		nine: 9,
		ten: 10,
		eleven: 11,
		twelve: 12,
		thirteen: 13,
		fourteen: 14,
		fifteen: 15,
		sixteen: 16,
		seventeen: 17,
		eighteen: 18,
		nineteen: 19,
		twenty: 20,
		hundred: 100
	};

	function parseRollCommand(lower: string): (() => void) | null {
		if (!/\broll\b/.test(lower)) return null;

		// Convert number words → digits so "two D20" → "2 d20".
		const normalized = lower.replace(
			/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|hundred)\b/g,
			(w) => String(WORD_NUMS[w])
		);

		// Optional leading "a/an", optional count, then d/dee/the, then sides,
		// then optional plus/minus modifier.
		const m = normalized.match(
			/\broll\s+(?:a\s+)?(?:(\d+)\s*)?(?:d|dee|the)\s*(\d+)(?:\s*(?:plus|\+)\s*(\d+)|\s*(?:minus|-)\s*(\d+))?/
		);
		if (!m) return null;

		const count = parseInt(m[1] ?? '1') || 1;
		const sides = parseInt(m[2]);
		if (!sides || sides < 2 || count < 1 || count > 100) return null;

		const modifier = m[3] ? parseInt(m[3]) : m[4] ? -parseInt(m[4]) : 0;

		return () => {
			if (sides === 100) {
				triggerRoll('1d100+1d10', ([tensRoll, onesRoll]) => {
					const tens = tensRoll % 100;
					const ones = onesRoll % 10;
					const total = tens === 0 && ones === 0 ? 100 : tens + ones;
					const modStr = modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : '';
					const finalTotal = total + modifier;
					showToast(
						`🎲 d100: [${String(tens).padStart(2, '0')}, ${ones}]${modStr} = ${finalTotal}`,
						6000
					);
				});
			} else {
				const modStr = modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : '';
				const expr = `${count}d${sides}${modStr}`;
				triggerRoll(`${count}d${sides}`, (rolls) => {
					const total = rolls.reduce((s, r) => s + r, 0) + modifier;
					const rollsStr = count > 1 ? ` [${rolls.join(', ')}]` : '';
					showToast(`🎲 ${expr}:${rollsStr} = ${total}`, 6000);
				});
			}
		};
	}

	// ── Dynamic HP / temp-HP command parsing ─────────────────────────────────
	function findCombatantByName(lower: string) {
		const candidates = combat.combatants.filter((c) => c.type === 'player' || c.type === 'enemy');
		let best: (typeof candidates)[0] | null = null;
		let bestLen = 0;
		for (const c of candidates) {
			const name = c.name.toLowerCase();
			if (lower.includes(name) && name.length > bestLen) {
				best = c;
				bestLen = name.length;
			}
		}
		return best;
	}

	function parseHpCommand(lower: string): (() => void) | null {
		const isTemp = /\btemp(orary)?\b/.test(lower);
		const isDamage =
			!isTemp &&
			/\bdamage\b|\bdeals?\b|\bhurt(s|ed)?\b|\bwound(s|ed)?\b|\btakes?\b|\bloses?\b|\bsuffers?\b|\bhit\s+for\b/.test(
				lower
			);
		const isHeal =
			!isTemp &&
			!isDamage &&
			(/\bheal(s|ed|ing)?\b|\brestore(s|d)?\b|\brecover(s|ed)?\b|\bgains?\b/.test(lower) ||
				/\b(hp|hit\s*points?|health)\b/.test(lower));

		if (!isTemp && !isDamage && !isHeal) return null;

		// Find the combatant first, then extract the number from the string with
		// the combatant name removed — prevents a number in the name (e.g. "Lich 2")
		// from being mistaken for the HP amount.
		const target = findCombatantByName(lower);
		if (!target) return null;

		const withoutName = lower.replace(target.name.toLowerCase(), ' ');
		const numMatch = withoutName.match(/\b(\d+)\b/);
		if (!numMatch) return null;
		const amount = parseInt(numMatch[1]);
		if (!amount || amount <= 0) return null;

		if (isTemp) {
			return () => {
				combat.setTempHp(target.id, amount);
				showToast(`🛡 ${target.name} +${amount} temp HP`);
			};
		}
		if (isDamage) {
			return () => {
				combat.adjustHp(target.id, -amount);
				showToast(`⚔ ${target.name} takes ${amount} damage`);
			};
		}
		return () => {
			combat.adjustHp(target.id, amount);
			showToast(`💚 ${target.name} healed ${amount} HP`);
		};
	}

	// ── AI fallback — fuzzy name matching via /api/voice-command ───────────
	async function callAiFallback(transcript: string): Promise<boolean> {
		try {
			const combatants = combat.combatants
				.filter((c) => c.type === 'player' || c.type === 'enemy')
				.map((c) => ({
					id: c.id,
					name: c.name,
					type: c.type,
					currentHp: c.currentHp,
					maxHp: c.maxHp
				}));
			const res = await fetch('/api/voice-command', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ transcript, combatants })
			});
			if (!res.ok) return false;
			const data = await res.json();
			if (data.action === 'damage' && data.targetId && data.amount) {
				combat.adjustHp(data.targetId, -data.amount);
				showToast(`⚔ ${data.targetName} takes ${data.amount} damage`);
				return true;
			}
			if (data.action === 'heal' && data.targetId && data.amount) {
				combat.adjustHp(data.targetId, data.amount);
				showToast(`💚 ${data.targetName} healed ${data.amount} HP`);
				return true;
			}
		} catch {
			/* silent fail */
		}
		return false;
	}

	// ── Transcript dispatcher ─────────────────────────────────────────────────
	function handleTranscript(text: string) {
		const transcript = text.trim();
		if (!transcript) return;
		console.log('[Whisper] heard:', transcript);

		// Strip punctuation and collapse spaces early — Whisper often inserts
		// commas/periods (e.g. "Tracker, start combat.") that break word-boundary matches.
		const lower = transcript
			.toLowerCase()
			.replace(/[',.\-]/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

		// Ignore anything that doesn't contain the wake word.
		if (!/tracker/i.test(lower)) return;

		// Static commands first — tested against cleaned text so punctuation doesn't block them.
		for (const cmd of COMMANDS) {
			if (cmd.pattern.test(lower)) {
				cmd.action();
				showToast(`✓ ${cmd.label}`);
				return;
			}
		}

		const rollAction = parseRollCommand(lower);
		if (rollAction) {
			rollAction();
			return;
		}

		const hpAction = parseHpCommand(lower);
		if (hpAction) {
			hpAction();
			return;
		}

		// Fall back to AI for fuzzy name matching and phrasing variations.
		callAiFallback(transcript).then((handled) => {
			if (!handled) showToast('❓ Command not understood');
		});
	}

	// ── Whisper worker ────────────────────────────────────────────────────────
	let worker: Worker | null = null;

	function initWorker() {
		worker = new Worker(new URL('../whisper.worker.ts', import.meta.url), { type: 'module' });
		worker.addEventListener('message', (e: MessageEvent<Record<string, unknown>>) => {
			const msg = e.data;
			if (msg.type === 'loading') {
				status = 'loading';
				loadPct = (msg.pct as number) ?? 0;
			} else if (msg.type === 'ready') {
				status = 'ready';
				showToast('🎤 Whisper ready — listening', 2500);
				startListening();
			} else if (msg.type === 'transcript') {
				handleTranscript(String(msg.text ?? ''));
				if (status === 'processing') status = 'listening';
			} else if (msg.type === 'error') {
				showToast(`⚠ ${msg.message}`);
				if (status === 'processing') status = 'listening';
			}
		});
	}

	// ── Audio capture + VAD ───────────────────────────────────────────────────
	let audioCtx: AudioContext | null = null;
	let analyser: AnalyserNode | null = null;
	let phraseRecorder: MediaRecorder | null = null; // one recorder per phrase
	let micStream: MediaStream | null = null;
	let vadHandle: ReturnType<typeof setInterval> | null = null;
	let silenceTimer: ReturnType<typeof setTimeout> | null = null;
	let speaking = false;
	let speechStart = 0;

	// RMS threshold (0–1). Raise if background noise causes false triggers.
	const SPEECH_RMS = 0.008;
	const SILENCE_MS = 1500; // ms of quiet that ends a phrase
	const MIN_SPEECH_MS = 350; // ignore sounds shorter than this

	/** Start a fresh MediaRecorder for a single phrase. Each instance produces
	 *  a self-contained WebM blob (header + audio) that decodeAudioData can parse. */
	function startPhraseRecorder() {
		if (!micStream) return;
		const phraseChunks: Blob[] = [];
		phraseRecorder = new MediaRecorder(micStream);
		const mimeType = phraseRecorder.mimeType;
		phraseRecorder.ondataavailable = (e) => {
			if (e.data.size > 0) phraseChunks.push(e.data);
		};
		phraseRecorder.onstop = () => {
			processAudio(new Blob(phraseChunks, { type: mimeType }));
		};
		phraseRecorder.start(); // no timeslice — all data arrives cleanly on stop
	}

	function stopPhraseRecorder(discard = false) {
		if (!phraseRecorder) return;
		if (discard) {
			phraseRecorder.ondataavailable = null;
			phraseRecorder.onstop = null;
		}
		phraseRecorder.stop();
		phraseRecorder = null;
	}

	async function startListening() {
		try {
			micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
		} catch {
			showToast('⚠ Microphone access denied');
			status = 'ready';
			return;
		}

		audioCtx = new AudioContext();
		// Some browsers start the context suspended even after a user gesture.
		if (audioCtx.state === 'suspended') await audioCtx.resume();

		const source = audioCtx.createMediaStreamSource(micStream);
		analyser = audioCtx.createAnalyser();
		analyser.fftSize = 1024;
		source.connect(analyser); // do NOT connect to destination — no mic playback

		const timeDomain = new Float32Array(analyser.fftSize);
		status = 'listening';
		// VAD: poll RMS every 50 ms.
		vadHandle = setInterval(() => {
			if (!analyser) return;
			analyser.getFloatTimeDomainData(timeDomain);
			let sum = 0;
			for (let i = 0; i < timeDomain.length; i++) sum += timeDomain[i] * timeDomain[i];
			const rms = Math.sqrt(sum / timeDomain.length);

			if (rms > SPEECH_RMS) {
				if (!speaking) {
					speaking = true;
					speechStart = Date.now();
					startPhraseRecorder(); // fresh recorder = valid WebM header
				}
				if (silenceTimer) {
					clearTimeout(silenceTimer);
					silenceTimer = null;
				}
			} else if (speaking) {
				if (!silenceTimer) {
					silenceTimer = setTimeout(() => {
						silenceTimer = null;
						speaking = false;
						const elapsed = Date.now() - speechStart;
						if (elapsed > MIN_SPEECH_MS) {
							stopPhraseRecorder(); // triggers onstop → processAudio
						} else {
							stopPhraseRecorder(true); // too short — discard
						}
					}, SILENCE_MS);
				}
			}
		}, 50);
	}

	function stopListening() {
		if (vadHandle) {
			clearInterval(vadHandle);
			vadHandle = null;
		}
		if (silenceTimer) {
			clearTimeout(silenceTimer);
			silenceTimer = null;
		}
		stopPhraseRecorder(true);
		analyser = null;
		audioCtx?.close();
		audioCtx = null;
		micStream?.getTracks().forEach((t) => t.stop());
		micStream = null;
		speaking = false;
		status = 'ready';
	}

	async function processAudio(blob: Blob) {
		if (!worker || blob.size === 0 || status === 'processing') return;
		status = 'processing';

		// Decode compressed audio to raw PCM.
		const decodeCtx = new AudioContext();
		let audioBuffer: AudioBuffer;
		try {
			audioBuffer = await decodeCtx.decodeAudioData(await blob.arrayBuffer());
		} catch {
			await decodeCtx.close();
			status = 'listening';
			return;
		}
		await decodeCtx.close();

		// Resample to 16 kHz mono using OfflineAudioContext.
		const frames = Math.ceil(audioBuffer.duration * 16000);
		const offCtx = new OfflineAudioContext(1, frames, 16000);
		const src = offCtx.createBufferSource();
		src.buffer = audioBuffer;
		src.connect(offCtx.destination);
		src.start(0);
		const resampled = await offCtx.startRendering();
		const float32 = new Float32Array(resampled.getChannelData(0));

		// Build a domain-specific prompt so Whisper biases toward combatant names and D&D terms.
		const names = combat.combatants
			.filter((c) => c.type === 'player' || c.type === 'enemy')
			.map((c) => c.name)
			.join(', ');
		const initial_prompt = `D&D combat tracker voice command. Wake word: tracker. Combatants: ${names}. Commands: tracker next, tracker start combat, tracker end combat, roll d20, damage, heal.`;
		worker.postMessage({ type: 'transcribe', audio: float32, initial_prompt }, [float32.buffer]);
	}

	// ── Toggle ────────────────────────────────────────────────────────────────
	function toggle() {
		if (!browser) return;

		// Show the help modal the first time per browser session.
		if (!sessionStorage.getItem(HELP_SEEN_KEY)) {
			sessionStorage.setItem(HELP_SEEN_KEY, '1');
			showHelp = true;
			// Proceed with activation so the model starts loading behind the modal.
		}

		if (status === 'idle') {
			// First click: load the model then auto-start listening.
			initWorker();
			status = 'loading';
			showToast('⏳ Downloading Whisper model (first-time only)…', 120_000);
			worker!.postMessage({ type: 'load' });
		} else if (status === 'ready') {
			startListening();
		} else if (status === 'listening' || status === 'processing') {
			stopListening();
		}
		// 'loading' — ignore clicks while model is downloading
	}

	$effect(() => () => {
		stopListening();
		worker?.terminate();
		worker = null;
	});
</script>

<!-- Mic toggle button -->
{#if browser}
	{#if mobile}
		<!-- Full-width hamburger-menu style -->
		<button
			onclick={toggle}
			disabled={status === 'loading'}
			class="flex w-full items-center gap-3 border-t border-gray-700 px-4 py-2.5 text-left text-sm transition
				{status === 'listening' || status === 'processing'
				? 'text-amber-400 hover:bg-gray-700'
				: status === 'loading'
					? 'cursor-wait text-blue-400'
					: 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
		>
			{#if status === 'listening'}
				<span class="relative flex h-4 w-4 shrink-0 items-center justify-center">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"
					></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
				</span>
			{:else if status === 'processing'}
				<span class="relative flex h-4 w-4 shrink-0 items-center justify-center">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"
					></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
				</span>
			{:else if status === 'loading'}
				<span class="relative flex h-4 w-4 shrink-0 items-center justify-center">
					<span
						class="absolute inline-flex h-full w-full animate-spin rounded-full border border-blue-400 border-t-transparent"
					></span>
				</span>
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
						d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
					/>
				</svg>
			{/if}
			{#if status === 'loading'}
				{loadPct > 0 ? `Voice — Loading ${loadPct}%` : 'Voice — Loading…'}
			{:else if status === 'listening'}
				Voice — Listening
			{:else if status === 'processing'}
				Voice — Transcribing
			{:else}
				Voice Commands
			{/if}
		</button>
	{:else}
		<!-- Compact header pill style -->
		<button
			onclick={toggle}
			disabled={status === 'loading'}
			title={status === 'idle'
				? 'Enable voice commands (Whisper AI, runs locally)'
				: status === 'loading'
					? `Downloading Whisper model… ${loadPct}%`
					: status === 'listening'
						? 'Voice listening — click to stop'
						: status === 'processing'
							? 'Transcribing…'
							: 'Start voice commands'}
			class="relative flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-semibold transition
				{status === 'listening' || status === 'processing'
				? 'border-amber-600/70 bg-amber-900/30 text-amber-400 hover:bg-amber-900/50'
				: status === 'loading'
					? 'cursor-wait border-blue-700/50 bg-blue-900/20 text-blue-400'
					: 'border-gray-700 bg-gray-800/60 text-gray-400 hover:border-gray-500 hover:text-gray-200'}"
		>
			{#if status === 'listening'}
				<span class="relative flex h-2 w-2">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"
					></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
				</span>
			{:else if status === 'processing'}
				<span class="relative flex h-2 w-2">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"
					></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
				</span>
			{:else if status === 'loading'}
				<span class="relative flex h-3 w-3">
					<span
						class="absolute inline-flex h-full w-full animate-spin rounded-full border border-blue-400 border-t-transparent"
					></span>
				</span>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-3.5 w-3.5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
					/>
				</svg>
			{/if}
			{#if status === 'loading'}
				{loadPct > 0 ? `${loadPct}%` : 'Loading…'}
			{:else}
				Voice
			{/if}
		</button>
	{/if}
{/if}

<!-- Help modal — first-time activation only -->
{#if showHelp}
	<VoiceCommandsHelpModal onclose={() => (showHelp = false)} />
{/if}

<!-- Command feedback toast -->
{#if toast}
	<div
		class="pointer-events-none fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 rounded-full border border-amber-600/50 bg-gray-900/95 px-5 py-2 text-sm font-semibold text-amber-300 shadow-2xl backdrop-blur"
		role="status"
		aria-live="polite"
	>
		{toast}
	</div>
{/if}
