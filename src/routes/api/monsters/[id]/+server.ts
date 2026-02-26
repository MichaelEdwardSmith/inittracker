import type { RequestHandler } from './$types';
import { updateCustomMonster, deleteCustomMonster } from '$lib/server/dmModel';

export const PUT: RequestHandler = async ({ request, cookies, params }) => {
	const sessionId = cookies.get('dm_auth');
	if (!sessionId) return new Response('Unauthorized', { status: 401 });

	const body = await request.json().catch(() => null);
	if (!body || typeof body.name !== 'string' || !body.name.trim()) {
		return Response.json({ error: 'Name is required.' }, { status: 400 });
	}
	if (body.name.length > 100) {
		return Response.json({ error: 'Name must be 100 characters or fewer.' }, { status: 400 });
	}
	const ac = Number(body.ac);
	const hp = Number(body.hp);
	if (!Number.isInteger(ac) || ac < 1) return Response.json({ error: 'AC must be at least 1.' }, { status: 400 });
	if (!Number.isInteger(hp) || hp < 1) return Response.json({ error: 'HP must be at least 1.' }, { status: 400 });

	const imgUrl = typeof body.imgUrl === 'string' && body.imgUrl ? body.imgUrl : undefined;

	await updateCustomMonster(sessionId, params.id, {
		name: body.name.trim(),
		ac,
		hp,
		cr: String(body.cr ?? '1').trim().slice(0, 10) || '1',
		monsterType: String(body.monsterType ?? 'Humanoid').slice(0, 50),
		...(imgUrl !== undefined ? { imgUrl } : { imgUrl: undefined })
	});

	return new Response(null, { status: 204 });
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	const sessionId = cookies.get('dm_auth');
	if (!sessionId) return new Response('Unauthorized', { status: 401 });

	await deleteCustomMonster(sessionId, params.id);
	return new Response(null, { status: 204 });
};
