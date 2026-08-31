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
			/** True when the real logged-in account is the system admin (see $lib/server/admin.ts). */
			isAdmin: boolean;
			/** Auth sessionId of the real logged-in account, ignoring any active impersonation. */
			realSessionId: string | null;
			/** True when the admin is currently viewing/controlling another DM's account. */
			isImpersonating: boolean;
			/** The real admin's email while impersonating (for the "acting as" banner); null otherwise. */
			impersonatingAdminEmail: string | null;
			/** Logged-in player display name (null if guest). */
			playerName: string | null;
			/** Logged-in player avatar URL (null if guest or no avatar). */
			playerAvatarUrl: string | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
