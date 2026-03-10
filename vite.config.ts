import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],

	// @huggingface/transformers uses dynamic import() for WASM files internally.
	// Vite's pre-bundler (esbuild) breaks those relative URL references, so we
	// exclude the package and let it load directly from node_modules.
	optimizeDeps: {
		exclude: ['@huggingface/transformers']
	},

	// Workers must be ES modules so top-level await and native ESM imports work.
	worker: {
		format: 'es'
	},

	build: {
		// The enemies/spells data bundles are large but compress well (~88 kB gzip).
		// Raising the limit avoids a noisy warning without changing actual bundle behaviour.
		chunkSizeWarningLimit: 600
	}
});
