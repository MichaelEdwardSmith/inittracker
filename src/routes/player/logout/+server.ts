// GET /player/logout — clears the player_auth cookie and returns to /join.
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ cookies }) => {
	cookies.delete('player_auth', { path: '/' });
	redirect(303, '/join');
};
