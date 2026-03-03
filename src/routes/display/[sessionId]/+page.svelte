<!-- Public player viewer at /display/[sessionId]. Subscribes to the DM's combat state
     via SSE, renders the initiative order with HP bars and conditions (ADV_CONDITIONS hidden),
     and provides a form for players to send messages to the DM. No auth required. -->
<script lang="ts">
	import { conditionColors, sortCombatants, hpPercent, hpBarColor } from '$lib/utils';
	import { getMonsterEmoji, getMonsterStyle } from '$lib/monsterAvatars';
	import { getMonsterDetail } from '$lib/enemies';
	import type { StorageState, Combatant } from '$lib/types';
	import ConditionInfoModal from '$lib/components/ConditionInfoModal.svelte';
	import { fly } from 'svelte/transition';

	let { data } = $props();

	let combatState: StorageState = $state({ combatants: [], currentTurnId: null, round: 1 });
	let connected = $state(false);
	let conditionInfo = $state<string | null>(null);

	// ── Player → DM messaging ───────────────────────────────────────────
	let showMsgModal = $state(false);
	let msgFrom = $state('');
	let msgText = $state('');
	let msgSending = $state(false);
	let msgSent = $state(false);

	async function sendMessage() {
		if (!msgFrom || !msgText.trim()) return;
		msgSending = true;
		try {
			await fetch('/api/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId: data.sessionId, from: msgFrom, text: msgText.trim() }),
			});
			msgSent = true;
			msgText = '';
			setTimeout(() => { msgSent = false; showMsgModal = false; }, 1800);
		} catch {
			// silent — nothing to do
		} finally {
			msgSending = false;
		}
	}

	// ── Initiative rolling ────────────────────────────
	let showInitModal = $state(false);
	let showMobileMenu = $state(false);
	let initCharId = $state('');
	let initMode = $state<'normal' | 'advantage' | 'disadvantage'>('normal');
	let initRoll1 = $state<number | null>(null);
	let initRoll2 = $state<number | null>(null);
	let initSubmitting = $state(false);
	let initSubmitted = $state(false);

	const initSelectedPlayer = $derived(
		players.find((p) => p.id === initCharId) ?? null
	);

	const initResult = $derived.by(() => {
		if (initRoll1 === null) return null;
		const dex = initSelectedPlayer?.dexMod ?? 0;
		if (initMode === 'normal' || initRoll2 === null) return initRoll1 + dex;
		const chosen = initMode === 'advantage'
			? Math.max(initRoll1, initRoll2)
			: Math.min(initRoll1, initRoll2);
		return chosen + dex;
	});

	function rollInitiative() {
		initRoll1 = Math.floor(Math.random() * 20) + 1;
		initRoll2 = initMode !== 'normal' ? Math.floor(Math.random() * 20) + 1 : null;
		initSubmitted = false;
	}

	async function submitInitiative() {
		if (!initCharId || initResult === null) return;
		initSubmitting = true;
		try {
			await fetch('/api/initiative', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId: data.sessionId, playerId: initCharId, initiative: initResult }),
			});
			initSubmitted = true;
			setTimeout(() => { initSubmitted = false; showInitModal = false; }, 1800);
		} catch {
			// silent
		} finally {
			initSubmitting = false;
		}
	}

	function openInitModal() {
		initCharId = players.length === 1 ? players[0].id : '';
		initMode = 'normal';
		initRoll1 = null;
		initRoll2 = null;
		initSubmitted = false;
		showInitModal = true;
	}

	// ── Flash overlay ──────────────────────────────────────────────────
	let flashColor = $state<string | null>(null);
	let flashKey = $state(0);
	let flashTimer: ReturnType<typeof setTimeout> | null = null;

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
		Unconscious:          'rgba( 75,  85,  99, 1)', // gray-600
		'Advantage For':      'rgba( 16, 185, 129, 1)', // emerald-500
		'Advantage Against':  'rgba(225,  29,  72, 1)', // rose-600
		'Disadvantage For':   'rgba(234,  88,  12, 1)', // orange-600
		'Disadvantage Against': 'rgba( 20, 184, 166, 1)'  // teal-500
	};

	// ── Audio ──────────────────────────────────────────────────────────
	let joined = $state(false);
	let audioEnabled = $state(true);
	let audioCtx: AudioContext | null = null;

	function joinSession() {
		audioCtx = new AudioContext();
		if (audioCtx.state === 'suspended') audioCtx.resume();
		joined = true;
	}

	function toggleAudio() {
		audioEnabled = !audioEnabled;
	}

	function playDamageSound(ctx: AudioContext) {
		const t = ctx.currentTime;
		// Low-pitched thud sweep
		const osc = ctx.createOscillator();
		const oscGain = ctx.createGain();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(130, t);
		osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);
		oscGain.gain.setValueAtTime(0.65, t);
		oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
		osc.connect(oscGain);
		oscGain.connect(ctx.destination);
		osc.start(t);
		osc.stop(t + 0.28);
		// Short noise burst (impact transient)
		const bufLen = Math.floor(ctx.sampleRate * 0.07);
		const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
		const nd = noiseBuf.getChannelData(0);
		for (let i = 0; i < bufLen; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
		const noise = ctx.createBufferSource();
		noise.buffer = noiseBuf;
		const nf = ctx.createBiquadFilter();
		nf.type = 'bandpass';
		nf.frequency.value = 1100;
		nf.Q.value = 0.6;
		const ng = ctx.createGain();
		ng.gain.setValueAtTime(0.35, t);
		ng.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
		noise.connect(nf);
		nf.connect(ng);
		ng.connect(ctx.destination);
		noise.start(t);
	}

	function playHealSound(ctx: AudioContext) {
		// Ascending magical chime (C-E-G-C)
		[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
			const t = ctx.currentTime + i * 0.13;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0, t);
			gain.gain.linearRampToValueAtTime(0.22, t + 0.04);
			gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(t);
			osc.stop(t + 0.45);
		});
	}

	function playConditionSound(ctx: AudioContext) {
		// Single resonant bell tone — neutral, mystical
		const t = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'triangle';
		osc.frequency.value = 528;
		gain.gain.setValueAtTime(0, t);
		gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(t);
		osc.stop(t + 0.7);
	}

	function playBattleStartSound(ctx: AudioContext) {
		// Urgent war-horn call: D4 → A4 → D5 → A5 (faster, tense, minor feel)
		const notes = [
			{ freq: 293.66, start: 0.0, dur: 0.09 },
			{ freq: 440.0, start: 0.1, dur: 0.09 },
			{ freq: 587.33, start: 0.2, dur: 0.09 },
			{ freq: 880.0, start: 0.3, dur: 0.55 }
		];
		notes.forEach(({ freq, start, dur }) => {
			const t = ctx.currentTime + start;
			const osc = ctx.createOscillator();
			const filter = ctx.createBiquadFilter();
			const gain = ctx.createGain();
			osc.type = 'square';
			osc.frequency.value = freq;
			filter.type = 'lowpass';
			filter.frequency.value = 900;
			filter.Q.value = 1.2;
			gain.gain.setValueAtTime(0, t);
			gain.gain.linearRampToValueAtTime(0.28, t + 0.015);
			gain.gain.setValueAtTime(0.28, t + dur - 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.07);
			osc.connect(filter);
			filter.connect(gain);
			gain.connect(ctx.destination);
			osc.start(t);
			osc.stop(t + dur + 0.08);
		});
		// Kick-drum thud at the downbeat
		const bufLen = Math.floor(ctx.sampleRate * 0.18);
		const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
		const bd = buf.getChannelData(0);
		for (let i = 0; i < bufLen; i++)
			bd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 1.5);
		const drum = ctx.createBufferSource();
		drum.buffer = buf;
		const df = ctx.createBiquadFilter();
		df.type = 'lowpass';
		df.frequency.value = 180;
		const dg = ctx.createGain();
		dg.gain.setValueAtTime(0.8, ctx.currentTime);
		dg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
		drum.connect(df);
		df.connect(dg);
		dg.connect(ctx.destination);
		drum.start(ctx.currentTime);
	}

	function playFanfareSound(ctx: AudioContext) {
		// Triumphant brass fanfare: G4 → C5 → E5 → G5 (held)
		const notes = [
			{ freq: 392.0, start: 0.0, dur: 0.13 },
			{ freq: 523.25, start: 0.16, dur: 0.13 },
			{ freq: 659.25, start: 0.32, dur: 0.13 },
			{ freq: 783.99, start: 0.48, dur: 0.7 }
		];
		notes.forEach(({ freq, start, dur }) => {
			const t = ctx.currentTime + start;
			const osc = ctx.createOscillator();
			const filter = ctx.createBiquadFilter();
			const gain = ctx.createGain();
			osc.type = 'sawtooth';
			osc.frequency.value = freq;
			filter.type = 'lowpass';
			filter.frequency.value = 1400;
			filter.Q.value = 0.8;
			gain.gain.setValueAtTime(0, t);
			gain.gain.linearRampToValueAtTime(0.38, t + 0.025);
			gain.gain.setValueAtTime(0.38, t + dur - 0.03);
			gain.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.08);
			osc.connect(filter);
			filter.connect(gain);
			gain.connect(ctx.destination);
			osc.start(t);
			osc.stop(t + dur + 0.1);
		});
	}

	function playSwordSound(ctx: AudioContext) {
		const t = ctx.currentTime;
		// Whoosh: noise burst with bandpass sweeping low → high
		const bufLen = Math.floor(ctx.sampleRate * 0.18);
		const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
		const data = buf.getChannelData(0);
		for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
		const noise = ctx.createBufferSource();
		noise.buffer = buf;
		const sweep = ctx.createBiquadFilter();
		sweep.type = 'bandpass';
		sweep.frequency.setValueAtTime(250, t);
		sweep.frequency.exponentialRampToValueAtTime(5000, t + 0.13);
		sweep.Q.value = 1.5;
		const whooshGain = ctx.createGain();
		whooshGain.gain.setValueAtTime(0.55, t);
		whooshGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
		noise.connect(sweep);
		sweep.connect(whooshGain);
		whooshGain.connect(ctx.destination);
		noise.start(t);
		// Metallic ting: triangle wave at the peak of the whoosh
		const osc = ctx.createOscillator();
		const oscGain = ctx.createGain();
		osc.type = 'triangle';
		osc.frequency.setValueAtTime(2900, t + 0.09);
		osc.frequency.exponentialRampToValueAtTime(2100, t + 0.38);
		oscGain.gain.setValueAtTime(0, t + 0.09);
		oscGain.gain.linearRampToValueAtTime(0.28, t + 0.1);
		oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
		osc.connect(oscGain);
		oscGain.connect(ctx.destination);
		osc.start(t + 0.09);
		osc.stop(t + 0.42);
	}

	function playTempHpSound(ctx: AudioContext) {
		// Bright shield-shimmer: C6 + G6 (a fifth apart), quick attack, short decay
		[1046.5, 1567.98].forEach((freq, i) => {
			const t = ctx.currentTime + i * 0.05;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0, t);
			gain.gain.linearRampToValueAtTime(0.18, t + 0.015);
			gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(t);
			osc.stop(t + 0.45);
		});
	}

	function triggerEffect(soundType: 'damage' | 'heal' | 'condition', color: string) {
		if (flashTimer) clearTimeout(flashTimer);
		flashColor = color;
		flashKey++;
		flashTimer = setTimeout(() => {
			flashColor = null;
		}, 750);
		if (audioEnabled && audioCtx) {
			if (soundType === 'damage') playDamageSound(audioCtx);
			else if (soundType === 'heal') playHealSound(audioCtx);
			else playConditionSound(audioCtx);
		}
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
						if (audioEnabled && audioCtx) playBattleStartSound(audioCtx);
					}
					// Combat ends (active → null)
					if (combatState.currentTurnId !== null && newState.currentTurnId === null) {
						if (audioEnabled && audioCtx) playFanfareSound(audioCtx);
					}
					// Turn advances (one combatant → another)
					if (
						combatState.currentTurnId !== null &&
						newState.currentTurnId !== null &&
						combatState.currentTurnId !== newState.currentTurnId
					) {
						if (audioEnabled && audioCtx) playSwordSound(audioCtx);
					}
				}
				firstMessageReceived = true;

				// Detect changes — skip on the very first message (empty initial state)
				if (combatState.combatants.length > 0) {
					let hadDamage = false;
					let hadHeal = false;
					let hadTempHp = false;
					let addedCondition: string | null = null;
					for (const nc of newState.combatants) {
						const oc = combatState.combatants.find((c) => c.id === nc.id);
						if (!oc) continue;
						const oldEff = oc.currentHp + (oc.tempHp ?? 0);
						const newEff = nc.currentHp + (nc.tempHp ?? 0);
						if (newEff < oldEff) hadDamage = true;
						else if (nc.currentHp > oc.currentHp) hadHeal = true;
						if ((nc.tempHp ?? 0) > (oc.tempHp ?? 0)) hadTempHp = true;
						if (!addedCondition) {
							addedCondition = nc.statuses.find((s) => !oc.statuses.includes(s)) ?? null;
						}
					}
					if (hadDamage) triggerEffect('damage', 'rgba(239, 68, 68, 1)');
					else if (hadHeal) triggerEffect('heal', 'rgba(34, 197, 94, 1)');
					else if (hadTempHp) {
						if (audioEnabled && audioCtx) playTempHpSound(audioCtx);
					} else if (addedCondition) {
						const color = conditionFlashColors[addedCondition] ?? 'rgba(168, 85, 247, 1)';
						triggerEffect('condition', color);
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

		return () => source.close();
	});

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

	const sorted = $derived(sortCombatants(combatState.combatants));
	const players = $derived(sorted.filter((c) => c.type === 'player'));
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

	const backgroundGlow = $derived.by(() => {
		if (!current) return '';
		return current.type === 'player'
			? 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(37,99,235,0.12) 0%, transparent 70%)'
			: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(185,28,28,0.14) 0%, transparent 70%)';
	});

	const typeAccent = $derived.by(() => {
		if (!current) return { badge: 'text-gray-400 border-gray-600', label: '' };
		return current.type === 'player'
			? { badge: 'text-blue-300 border-blue-600 bg-blue-950/60', label: 'PLAYER CHARACTER' }
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
					}}
					class="text-xs tracking-widest text-gray-700 uppercase underline-offset-2 hover:text-gray-500 hover:underline"
				>
					Continue without sound
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
			<!-- Desktop-only action buttons -->
			{#if joined}
				<button
					onclick={toggleAudio}
					title={audioEnabled ? 'Mute sounds' : 'Unmute sounds'}
					class="hidden rounded px-2 py-0.5 text-xs transition sm:inline-block {audioEnabled
						? 'text-amber-400 hover:text-amber-300'
						: 'text-gray-600 hover:text-gray-400'}"
				>
					{audioEnabled ? '🔊' : '🔇'}
				</button>
			{/if}
			{#if players.length > 0}
				<button
					onclick={() => { showMsgModal = true; msgSent = false; }}
					class="hidden items-center gap-1.5 rounded border border-gray-700 bg-gray-800/60 px-2.5 py-1 text-xs text-gray-400 transition hover:border-gray-500 hover:text-gray-200 sm:flex"
					title="Send a message to the DM"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
					Message DM
				</button>
				<button
					onclick={openInitModal}
					class="hidden items-center gap-1.5 rounded border border-gray-700 bg-gray-800/60 px-2.5 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300 sm:flex"
					title="Roll initiative for your character"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
					</svg>
					Roll Initiative
				</button>
			{/if}
		</div>
		<div class="flex items-center gap-2 sm:gap-3">
			{#if combatState.currentTurnId}
				<div class="flex items-center gap-2">
					<span class="text-xs tracking-widest text-gray-500 uppercase">Round</span>
					<span class="text-2xl font-black text-amber-400">{combatState.round}</span>
				</div>
			{/if}
			<!-- Desktop-only right buttons -->
			<a
				href="mailto:dm@inittracker.com"
				title="Contact us"
				class="hidden items-center gap-1.5 rounded border border-gray-800 bg-gray-900/60 px-2 py-1 text-xs text-gray-600 transition hover:border-gray-600 hover:text-gray-400 sm:flex"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
				</svg>
				Contact
			</a>
			<button
				onclick={toggleFullscreen}
				title={isFullscreen ? 'Exit full screen' : 'Full screen'}
				class="hidden items-center gap-1.5 rounded border border-gray-800 bg-gray-900/60 px-2 py-1 text-xs text-gray-600 transition hover:border-gray-600 hover:text-gray-400 sm:flex"
			>
				{#if isFullscreen}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"/>
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"/>
					</svg>
				{/if}
			</button>
			<!-- Mobile hamburger -->
			<button
				onclick={() => (showMobileMenu = !showMobileMenu)}
				title="Menu"
				class="flex items-center justify-center rounded border border-gray-800 bg-gray-900/60 p-1.5 text-gray-500 transition hover:border-gray-600 hover:text-gray-300 sm:hidden"
			>
				{#if showMobileMenu}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				{/if}
			</button>
		</div>
		<!-- Mobile dropdown menu -->
		{#if showMobileMenu}
			<div class="absolute top-full left-0 right-0 z-50 border-b border-gray-800 bg-gray-900/97 px-4 py-3 backdrop-blur-sm sm:hidden">
				<div class="flex flex-col gap-2">
					{#if joined}
						<button
							onclick={toggleAudio}
							class="flex items-center gap-3 rounded-lg border border-gray-800 px-3 py-2.5 text-sm transition {audioEnabled ? 'text-amber-400 hover:bg-amber-950/40' : 'text-gray-500 hover:bg-gray-800/60'}"
						>
							<span class="text-base">{audioEnabled ? '🔊' : '🔇'}</span>
							{audioEnabled ? 'Sound On' : 'Sound Off'}
						</button>
					{/if}
					{#if players.length > 0}
						<button
							onclick={() => { showMsgModal = true; msgSent = false; showMobileMenu = false; }}
							class="flex items-center gap-3 rounded-lg border border-gray-800 px-3 py-2.5 text-sm text-gray-400 transition hover:border-gray-600 hover:text-gray-200"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
							</svg>
							Message DM
						</button>
						<button
							onclick={() => { openInitModal(); showMobileMenu = false; }}
							class="flex items-center gap-3 rounded-lg border border-gray-800 px-3 py-2.5 text-sm text-gray-400 transition hover:border-amber-600 hover:text-amber-300"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
							</svg>
							Roll Initiative
						</button>
					{/if}
					<a
						href="mailto:dm@inittracker.com"
						class="flex items-center gap-3 rounded-lg border border-gray-800 px-3 py-2.5 text-sm text-gray-500 transition hover:border-gray-600 hover:text-gray-300"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
						Contact
					</a>
					<button
						onclick={() => { toggleFullscreen(); showMobileMenu = false; }}
						class="flex items-center gap-3 rounded-lg border border-gray-800 px-3 py-2.5 text-sm text-gray-500 transition hover:border-gray-600 hover:text-gray-300"
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
				</div>
			</div>
		{/if}
	</header>
	<!-- Backdrop to close mobile menu when clicking outside -->
	{#if showMobileMenu}
		<div
			class="fixed inset-0 z-40 sm:hidden"
			onclick={() => (showMobileMenu = false)}
			aria-hidden="true"
		></div>
	{/if}

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
			{#if sorted.length > 0}
				<div class="mt-4 flex flex-wrap justify-center gap-3">
					{#each sorted as c}
						<div
							class="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-2"
						>
							{#if c.type === 'enemy'}
								{@const imgUrl = c.imgUrl ?? getMonsterDetail(c.templateName ?? '')?.imgUrl}
								{#if imgUrl}
									<div class="h-6 w-6 shrink-0 overflow-hidden rounded-full ring-1 ring-red-700">
										<img src={imgUrl} alt={c.name} class="h-full w-full object-cover object-top" />
									</div>
								{:else}
									<span class="text-lg leading-none"
										>{getMonsterEmoji(c.templateName, c.monsterType)}</span
									>
								{/if}
							{/if}
							<span
								class="text-xs font-bold {c.type === 'player' ? 'text-blue-400' : 'text-red-400'}"
							>
								{c.initiative ?? '?'}
							</span>
							<span class="text-sm text-gray-300">{c.name}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<!-- Active combatant display -->
		<div class="relative z-10 flex flex-1 overflow-hidden">
			{#key current.id}
				{@const pct = hpPercent(current)}
				{@const showAc = current.type === 'player' || current.showAc === true}
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
				{#if current.type === 'enemy'}
					{@const style = getMonsterStyle(current.monsterType)}
					{@const imgUrl = current.imgUrl ?? getMonsterDetail(current.templateName ?? '')?.imgUrl}
					{#if imgUrl}
						<a
							href={imgUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="mb-6 h-44 w-44 overflow-hidden rounded-full ring-4 ring-offset-4 ring-offset-gray-950 {style.ring} cursor-pointer"
							style="box-shadow: 0 0 48px -8px var(--tw-ring-color);"
						>
							<img src={imgUrl} alt={current.name} class="h-full w-full object-cover object-top" />
						</a>
					{:else}
						{@const emoji = getMonsterEmoji(current.templateName, current.monsterType)}
						<div
							class="mb-6 flex h-44 w-44 items-center justify-center rounded-full ring-4 ring-offset-4 ring-offset-gray-950 {style.bg} {style.ring}"
							style="box-shadow: 0 0 48px -8px var(--tw-ring-color);"
						>
							<span class="select-none" style="font-size: 5rem; line-height: 1;">{emoji}</span>
						</div>
					{/if}
				{:else if current.avatarUrl}
					<div
						class="mb-6 h-44 w-44 overflow-hidden rounded-full ring-4 ring-blue-500 ring-offset-4 ring-offset-gray-950"
						style="box-shadow: 0 0 48px -8px rgba(59,130,246,0.6);"
					>
						<img src={current.avatarUrl} alt={current.name} class="h-full w-full object-cover" />
					</div>
				{/if}

				<!-- Name -->
				<h1
					class="mb-2 text-center leading-none font-black tracking-widest uppercase
					       {current.type === 'player' ? 'text-blue-50' : 'text-red-50'}"
					style="font-size: clamp(1.5rem, calc((100vw - 6rem) / 11), {current.type === 'player'
						? '4.5rem'
						: '3.75rem'}); text-shadow: 0 0 40px {current.type === 'player'
						? 'rgba(96,165,250,0.4)'
						: 'rgba(248,113,113,0.4)'};"
				>
					{current.name}
				</h1>

				<!-- Stats row -->
				<div class="mt-6 flex items-center gap-10">
					{#if current.initiative !== null}
						<div class="text-center">
							<div class="text-xs tracking-widest text-gray-500 uppercase">Initiative</div>
							<div class="text-4xl font-black text-amber-400">{current.initiative}</div>
						</div>
						{#if showAc}
							<div class="h-10 w-px bg-gray-700"></div>
						{/if}
					{/if}
					{#if showAc}
						<div class="text-center">
							<div class="text-xs tracking-widest text-gray-500 uppercase">Armor Class</div>
							<div class="text-4xl font-black text-gray-100">{current.ac}</div>
						</div>
					{/if}
					{#if current.type === 'player'}
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
								{current.currentHp}<span class="text-xl text-gray-600">/{current.maxHp}</span>
							</div>
							{#if (current.tempHp ?? 0) > 0}
								<div class="mt-1 text-lg font-bold text-yellow-400">+{current.tempHp} THP</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- HP bar + THP extension (players only) -->
				{#if current.type === 'player'}
					<div class="relative mt-5 h-4 w-full max-w-2xl rounded-full bg-gray-800 shadow-inner">
						{#if (current.tempHp ?? 0) > 0}
							{@const total = current.maxHp + current.tempHp}
							{@const hpW = (current.currentHp / total) * 100}
							{@const thpW = (current.tempHp / total) * 100}
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
				{/if}

				<!-- Active conditions -->
				{#if current.statuses.length > 0}
					<div class="mt-5 flex flex-wrap justify-center gap-2">
						{#each current.statuses as status}
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
												: 'bg-red-900/60 text-red-400'}"
										>
											{c.type === 'player' ? 'PC' : 'NPC'}
										</span>
										<span class="truncate text-sm font-semibold text-gray-200">{c.name}</span>
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
	<div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
		<div class="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
			<div class="flex items-center justify-between border-b border-gray-800 px-5 py-4">
				<h2 class="text-sm font-bold tracking-widest text-gray-200 uppercase">Message the DM</h2>
				<button onclick={() => (showMsgModal = false)} class="text-gray-600 hover:text-gray-300 transition">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			{#if msgSent}
				<div class="flex flex-col items-center gap-3 px-5 py-10 text-center">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<p class="text-sm font-semibold text-green-400">Message sent!</p>
				</div>
			{:else}
				<div class="flex flex-col gap-4 px-5 py-5">
					<div class="flex flex-col gap-1.5">
						<label for="msg-from" class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Sending as</label>
						<select
							id="msg-from"
							bind:value={msgFrom}
							class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-amber-500 focus:outline-none"
						>
							<option value="" disabled>Select your character…</option>
							{#each players as p}
								<option value={p.name}>{p.name}</option>
							{/each}
						</select>
					</div>
					<div class="flex flex-col gap-1.5">
						<label for="msg-text" class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Message</label>
						<textarea
							id="msg-text"
							bind:value={msgText}
							rows="4"
							placeholder="Type your message…"
							class="resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-amber-500 focus:outline-none"
						></textarea>
					</div>
					<button
						onclick={sendMessage}
						disabled={msgSending || !msgFrom || !msgText.trim()}
						class="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
					>
						{msgSending ? 'Sending…' : 'Send Message'}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Roll Initiative modal -->
{#if showInitModal}
	<div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
		<div class="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
			<div class="flex items-center justify-between border-b border-gray-800 px-5 py-4">
				<h2 class="text-sm font-bold tracking-widest text-amber-400 uppercase">Roll Initiative</h2>
				<button onclick={() => (showInitModal = false)} class="text-gray-600 hover:text-gray-300 transition">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			{#if initSubmitted}
				<div class="flex flex-col items-center gap-3 px-5 py-10 text-center">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<p class="text-sm font-semibold text-amber-400">Initiative submitted!</p>
				</div>
			{:else}
				<div class="flex flex-col gap-5 px-5 py-5">
					<!-- Character select -->
					<div class="flex flex-col gap-1.5">
						<label for="init-char" class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Character</label>
						<select
							id="init-char"
							bind:value={initCharId}
							onchange={() => { initRoll1 = null; initRoll2 = null; }}
							class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-amber-500 focus:outline-none"
						>
							<option value="" disabled>Select your character…</option>
							{#each players as p}
								<option value={p.id}>{p.name}{#if p.dexMod} (DEX {p.dexMod > 0 ? '+' : ''}{p.dexMod}){/if}</option>
							{/each}
						</select>
					</div>
					<!-- Roll mode -->
					<div class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Roll Mode</span>
						<div class="flex gap-2">
							{#each [{ value: 'normal', label: 'Normal' }, { value: 'advantage', label: 'Advantage' }, { value: 'disadvantage', label: 'Disadvantage' }] as opt}
								<label class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition
									{initMode === opt.value
										? opt.value === 'advantage' ? 'border-green-600 bg-green-900/30 text-green-300'
											: opt.value === 'disadvantage' ? 'border-red-600 bg-red-900/30 text-red-300'
											: 'border-amber-600 bg-amber-900/30 text-amber-300'
										: 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'}">
									<input type="radio" bind:group={initMode} value={opt.value} class="sr-only"
										onchange={() => { initRoll1 = null; initRoll2 = null; }} />
									{opt.label}
								</label>
							{/each}
						</div>
					</div>
					<!-- Roll button + result -->
					<div class="flex flex-col items-center gap-3">
						<button
							onclick={rollInitiative}
							disabled={!initCharId}
							class="w-full rounded-lg border border-amber-600/60 bg-amber-950/40 px-4 py-2.5 text-sm font-bold tracking-widest text-amber-300 uppercase transition hover:bg-amber-900/50 disabled:cursor-not-allowed disabled:opacity-40"
						>
							{initMode === 'normal' ? 'Roll d20' : 'Roll 2d20'}
						</button>
						{#if initRoll1 !== null}
							{@const dex = initSelectedPlayer?.dexMod ?? 0}
							<div class="flex flex-col items-center gap-1 text-center">
								{#if initMode !== 'normal' && initRoll2 !== null}
									<div class="flex items-center gap-3">
										{#each [initRoll1, initRoll2] as roll, i}
											{@const isChosen = initMode === 'advantage' ? roll === Math.max(initRoll1, initRoll2) : roll === Math.min(initRoll1, initRoll2)}
											<span class="text-3xl font-black {isChosen ? 'text-amber-400' : 'text-gray-600 line-through'}">{roll}</span>
											{#if i === 0}<span class="text-gray-600">/</span>{/if}
										{/each}
									</div>
								{:else}
									<span class="text-4xl font-black text-amber-400">{initRoll1}</span>
								{/if}
								{#if dex !== 0}
									<div class="text-sm text-gray-400">{dex > 0 ? '+' : ''}{dex} DEX → <span class="font-bold text-white">{initResult}</span></div>
								{/if}
							</div>
						{/if}
					</div>
					<!-- Submit -->
					<button
						onclick={submitInitiative}
						disabled={initRoll1 === null || initSubmitting}
						class="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
					>
						{initSubmitting ? 'Submitting…' : 'Submit Initiative'}{#if initResult !== null} — {initResult}{/if}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<ConditionInfoModal condition={conditionInfo} onclose={() => (conditionInfo = null)} />

<style>
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
		0%, 100% { transform: translate(0, 0) scale(1); }
		25%       { transform: translate(8vw, 6vh) scale(1.06); }
		55%       { transform: translate(3vw, 12vh) scale(0.94); }
		75%       { transform: translate(-3vw, 7vh) scale(1.03); }
	}
	@keyframes orb-drift-2 {
		0%, 100% { transform: translate(0, 0) scale(1); }
		30%       { transform: translate(-7vw, -9vh) scale(1.08); }
		65%       { transform: translate(-2vw, -4vh) scale(0.92); }
	}
	@keyframes orb-drift-3 {
		0%, 100% { transform: translate(-50%, -50%) scale(1); }
		40%       { transform: translate(calc(-50% + 7vw), calc(-50% - 9vh)) scale(1.1); }
		70%       { transform: translate(calc(-50% - 5vw), calc(-50% + 5vh)) scale(0.9); }
	}
	@keyframes orb-drift-4 {
		0%, 100% { transform: translate(0, 0) scale(1); }
		35%       { transform: translate(6vw, 9vh) scale(0.94); }
		68%       { transform: translate(-5vw, 4vh) scale(1.06); }
	}
</style>
