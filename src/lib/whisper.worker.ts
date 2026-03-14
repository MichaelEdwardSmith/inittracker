/**
 * Whisper speech-recognition worker.
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
// whisper-tiny.en  ~75 MB  — fast first load, good enough for short commands
// whisper-base.en  ~145 MB — noticeably better accuracy if load time is acceptable
const MODEL_ID = 'Xenova/whisper-base.en';

// Typed as any to avoid the overly complex union type the generic produces.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let asr: any = null;

// ── Message handler ───────────────────────────────────────────────────────
self.addEventListener(
	'message',
	async (e: MessageEvent<{ type: string; audio?: Float32Array; initial_prompt?: string }>) => {
		const msg = e.data;

		if (msg.type === 'load') {
			try {
				asr = await pipeline('automatic-speech-recognition', MODEL_ID, {
					dtype: 'fp32', // fp32 is most reliable in browser WASM (fp16 needs WebGPU)
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
				// .en models are English-only — don't pass language/task (multilingual-only options).
				// initial_prompt biases the decoder toward domain vocab (combatant names, D&D terms).
				const opts: Record<string, unknown> = {};
				if (msg.initial_prompt) opts.initial_prompt = msg.initial_prompt;
				const result = await asr(msg.audio, opts);
				const text = (result as { text: string }).text.trim();
				self.postMessage({ type: 'transcript', text });
			} catch (err) {
				self.postMessage({ type: 'error', message: String(err) });
			}
		}
	}
);
