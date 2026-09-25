/*import adapter from '@sveltejs/adapter-static';

/!** @type {import('@sveltejs/kit').Config} *!/
const config = {
	kit: {
		adapter: adapter({
			// default options are shown. On some platforms
			// these options are set automatically — see below
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: true
		})
	}
};

export default config;*/

/*import adapter from '@sveltejs/adapter-auto';

/!** @type {import('@sveltejs/kit').Config} *!/
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter()
	}
};

export default config;*/

import adapter from '@sveltejs/adapter-node';

// adapter-node has no build-time body size option — the limit is set at runtime via the
// BODY_SIZE_LIMIT env var (defaults to 512K), which must be set wherever the server process
// is started (e.g. the systemd unit's Environment= directive). See README/deploy notes.

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter()
	}
};

export default config;
