import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],

	// @huggingface/transformers uses dynamic import() for WASM files internally.
	// Vite's pre-bundler (esbuild) breaks those relative URL references, so we
	// exclude the package and let it load directly from node_modules.
	optimizeDeps: {
		exclude: ['@huggingface/transformers', '@3d-dice/dice-box-threejs']
	},

	// Workers must be ES modules so top-level await and native ESM imports work.
	worker: {
		format: 'es'
	},

	build: {
		// The enemies/spells data bundles are large but compress well (~88 kB gzip). The 3D dice
		// roller (three.js) and on-device voice transcription (@huggingface/transformers) chunks
		// are bigger still (~275 kB / ~135 kB gzip) but are already dynamically imported/worker-only,
		// so they never load until those features are used. Raising the limit avoids noisy warnings
		// for chunks that are already off the critical path, without changing actual bundle behaviour.
		chunkSizeWarningLimit: 1000
	}
});
