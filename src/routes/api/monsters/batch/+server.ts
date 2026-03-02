import type { RequestHandler } from './$types';
import type { CustomMonster, MonsterDetail } from '$lib/types';
import { getCustomMonsters, addCustomMonster } from '$lib/server/dmModel';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const sessionId = cookies.get('dm_auth');
	if (!sessionId) return new Response('Unauthorized', { status: 401 });

	const body = await request.json().catch(() => null);
	if (!Array.isArray(body)) {
		return Response.json({ error: 'Expected an array of monsters.' }, { status: 400 });
	}

	const existing = await getCustomMonsters(sessionId);
	const existingNames = new Set(existing.map((m) => m.name.toLowerCase()));

	let imported = 0;
	let skipped = 0;

	for (const item of body) {
		if (!item || typeof item.name !== 'string' || !item.name.trim()) {
			skipped++;
			continue;
		}
		const name = item.name.trim();
		if (existingNames.has(name.toLowerCase())) {
			skipped++;
			continue;
		}

		const ac = Number(item.ac);
		const hp = Number(item.hp);
		if (!Number.isFinite(ac) || ac < 1 || !Number.isFinite(hp) || hp < 1) {
			skipped++;
			continue;
		}

		const detail: MonsterDetail | undefined =
			item.detail && typeof item.detail === 'object' ? (item.detail as MonsterDetail) : undefined;

		const monster: CustomMonster = {
			id: crypto.randomUUID(),
			name,
			ac: Math.round(ac),
			hp: Math.round(hp),
			cr: String(item.cr ?? '1').trim().slice(0, 10) || '1',
			monsterType: String(item.monsterType ?? 'Humanoid').slice(0, 50),
			...(typeof item.dexMod === 'number' ? { dexMod: item.dexMod } : {}),
			...(typeof item.source === 'string' && item.source ? { source: item.source.slice(0, 30) } : {}),
			...(detail ? { detail } : {})
		};

		await addCustomMonster(sessionId, monster);
		existingNames.add(name.toLowerCase());
		imported++;
	}

	return Response.json({ imported, skipped });
};
