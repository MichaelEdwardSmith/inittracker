// POST /logout — deletes the dm_auth cookie and redirects to /login.
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ cookies }) => {
	cookies.delete('dm_auth', { path: '/' });
	redirect(303, '/login');
};
