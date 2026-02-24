// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			sessionId: string | null;
			/** Active game session's public 6-char ID. Set after migration in hooks.server.ts. */
			gameSessionId: string | null;
			dmFirstName: string | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
