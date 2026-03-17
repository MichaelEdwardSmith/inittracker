// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			sessionId: string | null;
			/** Active game session's public 6-char ID. Set after migration in hooks.server.ts. */
			gameSessionId: string | null;
			/** D&D edition for the active game session. */
			ruleset: '2014' | '2024';
			dmFirstName: string | null;
			dmEmail: string | null;
			isGuest: boolean;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
