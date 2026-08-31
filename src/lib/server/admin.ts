// Central definition of who may see the system-wide admin panel (/admin) and impersonate
// other DM accounts for support/debugging. Single hardcoded owner account — promote to an
// env var or a DB-backed role flag if multi-admin support is ever needed.
const ADMIN_EMAIL = 'michael.e.smith.1978@gmail.com';

export function isAdminEmail(email: string | null | undefined): boolean {
	return !!email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
