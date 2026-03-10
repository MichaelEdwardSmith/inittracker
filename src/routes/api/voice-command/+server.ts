import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

interface CombatantInfo {
	id: string;
	name: string;
	type: 'player' | 'enemy';
	currentHp: number;
	maxHp: number;
}

export async function POST({ request }: RequestEvent) {
	const { transcript, combatants } = (await request.json()) as {
		transcript: string;
		combatants: CombatantInfo[];
	};

	if (!transcript || !combatants) {
		throw error(400, 'Missing transcript or combatants');
	}

	const combatantList = combatants
		.map((c) => `- "${c.name}" (id: ${c.id}, type: ${c.type}, HP: ${c.currentHp}/${c.maxHp})`)
		.join('\n');

	const response = await client.messages.create({
		model: 'claude-haiku-4-5',
		max_tokens: 256,
		messages: [
			{
				role: 'user',
				content: `You are a D&D 5e combat assistant. Parse this voice command and return a JSON action.

Current combatants:
${combatantList}

Voice command: "${transcript}"

Rules:
- Match the target name to the closest combatant name (fuzzy match, case-insensitive)
- "damage", "hit", "deal", "take", "loses" → action: "damage"
- "heal", "restore", "gains", "recover" → action: "heal"
- If no clear action or no matching combatant, return action: "unknown"
- Amount must be a positive integer

Respond with ONLY valid JSON, no explanation:
{"action": "damage"|"heal"|"unknown", "targetId": "<id or null>", "targetName": "<matched name or null>", "amount": <number or null>}`
			}
		]
	});

	let text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';

	// Strip markdown code fences if present (e.g. ```json ... ```)
	text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

	try {
		const parsed = JSON.parse(text);
		return json(parsed);
	} catch {
		console.error('Voice command: failed to parse AI response:', text);
		return json({ action: 'unknown', targetId: null, targetName: null, amount: null });
	}
}
