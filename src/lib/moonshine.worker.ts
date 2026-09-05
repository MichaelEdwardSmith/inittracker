/**
 * Moonshine speech-recognition worker.
 * Runs @huggingface/transformers in a Web Worker so the heavy ONNX inference
 * never blocks the main thread.
 *
 * Message protocol (inbound):
 *   { type: 'load' }
 *   { type: 'transcribe', audio: Float32Array }   — 16 kHz mono PCM
 *
 * Message protocol (outbound):
 *   { type: 'loading', pct: number }              — 0-100 download progress
 *   { type: 'ready' }
 *   { type: 'transcript', text: string }
 *   { type: 'error', message: string }
 */
import { pipeline, env } from '@huggingface/transformers';

// ── Environment setup ─────────────────────────────────────────────────────
// Single-threaded WASM: numThreads > 1 requires SharedArrayBuffer which needs
// COOP + COEP headers this project does not set.
(env.backends.onnx.wasm as Record<string, unknown>).numThreads = 1;

// Never try file:// or localhost model paths — always fetch from HuggingFace Hub.
env.allowLocalModels = false;

// ── Model ────────────────────────────────────────────────────────────────
// Moonshine replaces the whisper-base.en model this worker used previously.
// It's purpose-built for short, real-time voice commands (vs. Whisper's
// general-purpose long-form transcription) and Hugging Face benchmarks it as
// both faster and more accurate than Whisper on exactly that kind of audio.
const MODEL_ID = 'onnx-community/moonshine-base-ONNX';

// fp32 encoder + q8 decoder mirrors Hugging Face's official WASM config for
// this model (see the transformers.js-examples/moonshine-web reference
// implementation) — q4 is reserved for their WebGPU path, which this project
// doesn't use (no COOP/COEP headers set, so only single-threaded WASM works).
const DTYPE = { encoder_model: 'fp32', decoder_model_merged: 'q8' } as const;

// Typed as any to avoid the overly complex union type the generic produces.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let asr: any = null;

// ── Message handler ───────────────────────────────────────────────────────
self.addEventListener(
	'message',
	async (e: MessageEvent<{ type: string; audio?: Float32Array }>) => {
		const msg = e.data;

		if (msg.type === 'load') {
			try {
				asr = await pipeline('automatic-speech-recognition', MODEL_ID, {
					device: 'wasm',
					dtype: DTYPE,
					progress_callback: (p: Record<string, unknown>) => {
						if (typeof p.progress === 'number') {
							self.postMessage({ type: 'loading', pct: Math.round(p.progress) });
						}
					}
				});
				self.postMessage({ type: 'ready' });
			} catch (err) {
				self.postMessage({ type: 'error', message: String(err) });
			}
			return;
		}

		if (msg.type === 'transcribe' && msg.audio) {
			if (!asr) {
				self.postMessage({ type: 'error', message: 'Model not loaded yet' });
				return;
			}
			try {
				// sampling_rate is not in the TS types but the model expects 16 kHz PCM —
				// we enforce that in the main thread via OfflineAudioContext before sending.
				// Unlike Whisper, Moonshine has no prompt-biasing option, so domain
				// vocabulary (combatant names) relies entirely on the fuzzy name match in
				// VoiceCommands.svelte's findCombatantByName() rather than on this model.
				const result = await asr(msg.audio);
				const text = (result as { text: string }).text.trim();
				self.postMessage({ type: 'transcript', text });
			} catch (err) {
				self.postMessage({ type: 'error', message: String(err) });
			}
		}
	}
);
