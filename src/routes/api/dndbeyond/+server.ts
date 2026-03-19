// Proxy for D&D Beyond character service — avoids CORS restrictions in the browser.
// GET /api/dndbeyond?id=<numericCharacterId>
// Returns a small parsed object: { name, maxHp, ac, dexMod, passivePerception }
import type { RequestHandler } from './$types';

interface DDBImport {
	name: string;
	maxHp: number;
	ac: number;
	dexMod: number;
	passivePerception: number;
	avatarUrl?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDDBCharacter(data: any): DDBImport {
	// ── All character modifiers (used throughout) ────────────────────────────
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const allMods: any[] = [
		...(data.modifiers?.class ?? []),
		...(data.modifiers?.race ?? []),
		...(data.modifiers?.background ?? []),
		...(data.modifiers?.feat ?? []),
		...(data.modifiers?.item ?? []),
		...(data.modifiers?.condition ?? []),
	];

	// ── Proficiency bonus ────────────────────────────────────────────────────
	// data.proficiencyBonus is absent from the API response; derive from total level.
	const totalLevel = (data.classes ?? []).reduce(
		(sum: number, c: any) => sum + (c.level ?? 0),
		0
	);
	const profBonus: number = data.proficiencyBonus ?? Math.ceil(1 + totalLevel / 4);

	// ── Ability scores ───────────────────────────────────────────────────────
	// stat IDs: 1=STR 2=DEX 3=CON 4=INT 5=WIS 6=CHA
	// Build scores in priority order:
	//   1. data.stats (base point-buy / standard array)
	//   2. data.bonusStats (manual bonus fields, pre-2024 racial bonuses)
	//   3. data.overrideStats (fully overrides the score)
	//   4. data.modifiers.race/background/feat bonuses (2024 species/background bonuses
	//      are stored here rather than in bonusStats)
	// DDB uses both "constitution" and "constitution-score" as subType depending on
	// the source of the bonus (race vs background vs feat vs item). Match both forms.
	const statSubTypes: Record<number, string[]> = {
		1: ['strength', 'strength-score'],
		2: ['dexterity', 'dexterity-score'],
		3: ['constitution', 'constitution-score'],
		4: ['intelligence', 'intelligence-score'],
		5: ['wisdom', 'wisdom-score'],
		6: ['charisma', 'charisma-score'],
	};
	const scores: Record<number, number> = {};
	for (const s of data.stats ?? []) scores[s.id] = s.value ?? 10;
	for (const s of data.bonusStats ?? []) {
		if (s.value != null) scores[s.id] = (scores[s.id] ?? 10) + s.value;
	}
	for (const s of data.overrideStats ?? []) {
		if (s.value != null) scores[s.id] = s.value;
	}
	// Collect IDs that are fully overridden (skip modifier bonuses for those)
	const overriddenIds = new Set(
		(data.overrideStats ?? [])
			.filter((s: any) => s.value != null)
			.map((s: any) => s.id)
	);
	for (const [id, subTypes] of Object.entries(statSubTypes)) {
		const numId = Number(id);
		if (overriddenIds.has(numId)) continue;
		const bonus = allMods
			.filter((m: any) => m.type === 'bonus' && subTypes.includes(m.subType))
			.reduce((sum: number, m: any) => sum + (m.value ?? 0), 0);
		if (bonus !== 0) scores[numId] = (scores[numId] ?? 10) + bonus;
	}

	const mod = (id: number) => Math.floor(((scores[id] ?? 10) - 10) / 2);
	const dexModBase = mod(2);
	const conMod = mod(3);
	const wisMod = mod(5);

	// ── Max HP ───────────────────────────────────────────────────────────────
	// baseHitPoints is hit-dice-only (no CON modifier baked in).
	// The CON modifier × total level must be added to match what D&D Beyond displays.
	const maxHp = Math.max(
		1,
		data.overrideHitPoints ??
			(data.baseHitPoints ?? 0) + conMod * totalLevel + (data.bonusHitPoints ?? 0)
	);

	// ── AC ───────────────────────────────────────────────────────────────────
	// Primary: scan allMods for armor-class bonuses. data.modifiers.item aggregates
	// all equipped/attuned item effects, and class/feat/race may also add flat AC.
	const modAcBonus = allMods
		.filter((m: any) => m.type === 'bonus' && m.subType === 'armor-class')
		.reduce((sum: number, m: any) => sum + (m.value ?? 0), 0);
	// Fallback: scan inventory item definition.modifiers directly, used when
	// data.modifiers is absent or unpopulated (some API versions / new characters).
	const inventoryAcBonus = (data.inventory ?? [])
		.filter((i: any) => i.equipped)
		.flatMap((i: any) => (i.definition?.modifiers ?? []) as any[])
		.filter((m: any) => m.type === 'bonus' && m.subType === 'armor-class')
		.reduce((sum: number, m: any) => sum + (m.value ?? 0), 0);
	// Prefer allMods — avoids double-counting item bonuses that appear in both
	// data.modifiers.item and definition.modifiers.
	const bonusAc = (data.bonusArmorClass ?? 0) + (modAcBonus > 0 ? modAcBonus : inventoryAcBonus);

	let ac: number;
	if (data.overrideArmorClass != null) {
		ac = data.overrideArmorClass + bonusAc;
	} else {
		const equipped = (data.inventory ?? []).filter((i: any) => i.equipped);
		const armors = equipped.filter((i: any) => [1, 2, 3].includes(i.definition?.armorTypeId));
		const hasShield = equipped.some((i: any) => i.definition?.armorTypeId === 4);
		const shieldBonus = hasShield ? 2 : 0;

		// When multiple armor pieces are equipped, pick the one yielding the highest AC
		const armorAcFor = (i: any): number => {
			const base: number = i.definition.armorClass ?? 10;
			const t: number = i.definition.armorTypeId;
			if (t === 1) return base + dexModBase;
			if (t === 2) return base + Math.min(dexModBase, 2);
			return base;
		};
		const armor = armors.length ? armors.reduce((best: any, i: any) => armorAcFor(i) >= armorAcFor(best) ? i : best) : null;

		if (armor) {
			ac = armorAcFor(armor);
		} else {
			// Unarmored — check for Unarmored Defense on primary class
			const primaryClass: string = (
				data.classes?.[0]?.definition?.name ?? ''
			).toLowerCase();
			if (primaryClass === 'barbarian') ac = 10 + dexModBase + mod(3);
			else if (primaryClass === 'monk') ac = 10 + dexModBase + wisMod;
			else ac = 10 + dexModBase;
		}
		ac += shieldBonus + bonusAc;
	}

	// ── Initiative modifier ───────────────────────────────────────────────────
	// 2024 rules add proficiency bonus to initiative; this appears in data.modifiers
	// as subType "initiative". Also handles flat bonuses (e.g. Alert feat variants).
	const initiativeBonus = allMods
		.filter((m: any) => m.subType === 'initiative')
		.reduce((sum: number, m: any) => {
			if (m.type === 'proficiency') return sum + profBonus;
			if (m.type === 'half-proficiency-round-up') return sum + Math.ceil(profBonus / 2);
			if (m.type === 'bonus' && m.value != null) return sum + m.value;
			return sum;
		}, 0);
	const dexMod = dexModBase + initiativeBonus;

	// ── Passive Perception ───────────────────────────────────────────────────
	const hasProfPerc = allMods.some(
		(m) => m.type === 'proficiency' && m.subType === 'perception'
	);
	const hasExpertisePerc = allMods.some(
		(m) => m.type === 'expertise' && m.subType === 'perception'
	);
	const passivePerception =
		10 + wisMod + (hasExpertisePerc ? profBonus * 2 : hasProfPerc ? profBonus : 0);

	return {
		name: data.name ?? 'Unknown',
		maxHp,
		ac: Math.max(1, ac),
		dexMod,
		passivePerception,
		...(data.decorations?.avatarUrl ? { avatarUrl: data.decorations.avatarUrl } : {}),
	};
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	const sessionId = cookies.get('dm_auth');
	if (!sessionId) return new Response('Unauthorized', { status: 401 });

	const id = url.searchParams.get('id');
	if (!id || !/^\d+$/.test(id)) {
		return Response.json({ error: 'Invalid character ID' }, { status: 400 });
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 10_000);

	try {
		const res = await fetch(
			`https://character-service.dndbeyond.com/character/v5/character/${id}`,
			{
				headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible)' },
				signal: controller.signal,
			}
		);
		clearTimeout(timeout);

		if (!res.ok) {
			return Response.json(
				{ error: res.status === 404 ? 'Character not found or not public' : 'D&D Beyond error' },
				{ status: res.status === 404 ? 404 : 502 }
			);
		}

		const json = await res.json();
		if (!json?.data) {
			return Response.json({ error: 'Unexpected response from D&D Beyond' }, { status: 502 });
		}

		return Response.json(parseDDBCharacter(json.data));
	} catch (err: unknown) {
		clearTimeout(timeout);
		const isAbort = err instanceof Error && err.name === 'AbortError';
		return Response.json(
			{ error: isAbort ? 'Request timed out' : 'Network error reaching D&D Beyond' },
			{ status: 502 }
		);
	}
};
