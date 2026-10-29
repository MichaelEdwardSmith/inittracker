// GET    /api/shops                 — returns the authenticated DM's saved shops.
// POST   /api/shops                 — saves a shop (replaces any shop with the same type + name).
// DELETE /api/shops?name=&type=     — removes a saved shop.
import type { RequestEvent } from '@sveltejs/kit';
import { resolveActingSessionId } from '$lib/server/auth';
import type { SavedShop, SavedShopItem } from '$lib/types';
import {
	getSavedShops,
	upsertSavedShop,
	deleteSavedShop,
	MAX_SAVED_SHOPS
} from '$lib/server/dmModel';

const MAX_ITEMS = 100;

function str(v: unknown, max: number): string {
	return typeof v === 'string' ? v.slice(0, max) : '';
}

function parseShop(body: unknown): SavedShop | null {
	if (!body || typeof body !== 'object') return null;
	const b = body as Record<string, unknown>;
	const name = str(b.name, 100).trim();
	const typeKey = str(b.typeKey, 50).trim();
	const affluenceKey = str(b.affluenceKey, 50).trim();
	if (!name || !typeKey || !affluenceKey || !Array.isArray(b.items) || b.items.length === 0) {
		return null;
	}
	const items: SavedShopItem[] = [];
	for (const raw of b.items.slice(0, MAX_ITEMS)) {
		if (!raw || typeof raw !== 'object') return null;
		const r = raw as Record<string, unknown>;
		const itemName = str(r.name, 200).trim();
		if (!itemName) return null;
		const item: SavedShopItem = {
			name: itemName,
			liked: str(r.liked, 40),
			neutral: str(r.neutral, 40),
			disliked: str(r.disliked, 40)
		};
		const rarity = str(r.rarity, 40);
		if (rarity) item.rarity = rarity;
		items.push(item);
	}
	const shop: SavedShop = { name, typeKey, affluenceKey, items };
	const city = str(b.city, 100).trim();
	if (city) shop.city = city;
	return shop;
}

export async function GET({ cookies }: RequestEvent) {
	const sessionId = await resolveActingSessionId(cookies);
	if (!sessionId) return new Response('Unauthorized', { status: 401 });
	return Response.json(await getSavedShops(sessionId));
}

export async function POST({ request, cookies }: RequestEvent) {
	const sessionId = await resolveActingSessionId(cookies);
	if (!sessionId) return new Response('Unauthorized', { status: 401 });

	const shop = parseShop(await request.json().catch(() => null));
	if (!shop) return Response.json({ error: 'Invalid shop.' }, { status: 400 });

	const ok = await upsertSavedShop(sessionId, shop);
	if (!ok) {
		return Response.json(
			{ error: `You can keep up to ${MAX_SAVED_SHOPS} saved shops. Delete one first.` },
			{ status: 409 }
		);
	}
	return Response.json(shop, { status: 201 });
}

export async function DELETE({ url, cookies }: RequestEvent) {
	const sessionId = await resolveActingSessionId(cookies);
	if (!sessionId) return new Response('Unauthorized', { status: 401 });

	const name = url.searchParams.get('name');
	const type = url.searchParams.get('type');
	if (!name || !type)
		return Response.json({ error: 'name and type are required.' }, { status: 400 });

	await deleteSavedShop(sessionId, name, type);
	return new Response(null, { status: 204 });
}
