import type { RequestHandler } from './$types';
import type { CustomMonster } from '$lib/types';
import {
	getCustomMonsters,
	addCustomMonster
} from '$lib/server/dmModel';

export const GET: RequestHandler = async ({ cookies }) => {
	const sessionId = cookies.get('dm_auth');
	if (!sessionId) return new Response('Unauthorized', { status: 401 });

	const monsters = await getCustomMonsters(sessionId);
	return Response.json(monsters);
};

export const POST: RequestHandler = async ({ request, cookies }) => {
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

	const cr = String(body.cr ?? '1').trim().slice(0, 10) || '1';
	const monsterType = String(body.monsterType ?? 'Humanoid').slice(0, 50);

	const imgUrl = typeof body.imgUrl === 'string' && body.imgUrl ? body.imgUrl : undefined;

	const monster: CustomMonster = {
		id: crypto.randomUUID(),
		name: body.name.trim(),
		ac,
		hp,
		cr,
		monsterType,
		...(imgUrl ? { imgUrl } : {})
	};

	await addCustomMonster(sessionId, monster);
	return Response.json(monster, { status: 201 });
};
