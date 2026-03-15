// POST /logout — deletes both auth cookies and redirects to /login.
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ cookies }) => {
	cookies.delete('dm_auth', { path: '/' });
	cookies.delete('dm_guest', { path: '/' });
	redirect(303, '/login');
};
