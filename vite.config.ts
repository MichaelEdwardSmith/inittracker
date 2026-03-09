import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		// The enemies/spells data bundles are large but compress well (~88 kB gzip).
		// Raising the limit avoids a noisy warning without changing actual bundle behaviour.
		chunkSizeWarningLimit: 600
	}
});
