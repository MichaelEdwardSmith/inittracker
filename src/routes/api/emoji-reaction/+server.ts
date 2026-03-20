// POST /api/emoji-reaction — viewer sends an emoji to the DM.
// GET  /api/emoji-reaction?since=<ts> — DM polls for new reactions.
import type { RequestHandler } from './$types';
import { getActiveGameSessionPublicId } from '$lib/server/dmModel';
import { authToGameSession } from '$lib/server/sessionCache';
import { addEmojiReaction, getEmojiReactionsSince } from '$lib/server/emojiStore';

const ALLOWED_EMOJIS = new Set([
	'😂',
	'❤️',
	'👍',
	'👎',
	'😱',
	'🤔',
	'🥳',
	'😭',
	'😤',
	'😍',
	'🤯',
	'🙏',
	'⚔️',
	'🛡️',
	'🎲',
	'💀',
	'👻',
	'🔥',
	'⚡',
	'💪',
	'🏃',
	'🗡️',
	'🐉',
	'✨',
	'🎉',
	'🍺',
	'💯',
	'🌟',
	'🤣',
	'👀'
]);

async function resolveGameSessionId(authSessionId: string): Promise<string | null> {
	let id = authToGameSession.get(authSessionId) ?? null;
	if (!id) {
		id = await getActiveGameSessionPublicId(authSessionId);
		if (id) authToGameSession.set(authSessionId, id);
	}
	return id;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	let body: { emoji: string; sessionId: string; from?: string };
	try {
		body = await request.json();
	} catch {
		return new Response('Invalid JSON', { status: 400 });
	}

	const emoji = typeof body.emoji === 'string' ? body.emoji.trim() : '';
	const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';

	if (!ALLOWED_EMOJIS.has(emoji)) return new Response('Invalid emoji', { status: 400 });
	if (!sessionId) return new Response('Missing sessionId', { status: 400 });

	const from = locals.playerName ?? body.from ?? 'Someone';
	addEmojiReaction(sessionId, from, emoji);

	return Response.json({ ok: true });
};

export const GET: RequestHandler = async ({ url, cookies }) => {
	const authSessionId = cookies.get('dm_auth');
	if (!authSessionId) return new Response('Unauthorized', { status: 401 });

	const gameSessionId = await resolveGameSessionId(authSessionId);
	if (!gameSessionId) return Response.json({ reactions: [] });

	const since = Number(url.searchParams.get('since') ?? 0);
	const reactions = getEmojiReactionsSince(gameSessionId, since);

	return Response.json({ reactions });
};
