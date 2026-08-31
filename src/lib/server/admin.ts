// Who may see the system-wide admin panel (/admin) and act on other DM accounts.
//
// There's one hardcoded root admin (below) who can never be locked out or demoted — a safety
// net independent of the database. The root admin can promote other DM accounts to admin via
// the DB-backed `isAdmin` flag (see dmModel.ts setDMAdmin()); only the root admin can grant or
// revoke that flag, so a promoted admin can't mint further admins.
const ROOT_ADMIN_EMAIL = 'michael.e.smith.1978@gmail.com';

export function isRootAdminEmail(email: string | null | undefined): boolean {
	return !!email && email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();
}

/** True if this DM should have admin access: the root admin, or anyone the root admin has
 *  promoted via the DB-backed isAdmin flag. */
export function isAdminDM(dm: { email: string; isAdmin?: boolean }): boolean {
	return isRootAdminEmail(dm.email) || !!dm.isAdmin;
}
