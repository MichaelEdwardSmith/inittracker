// D&D 5e Individual Treasure loot generation utilities.
import type { LootItem } from './types';

function dice(count: number, sides: number): number {
	let total = 0;
	for (let i = 0; i < count; i++) {
		total += Math.floor(Math.random() * sides) + 1;
	}
	return total;
}

export function parseCrNumeric(cr: string): number {
	if (cr === '1/8') return 0.125;
	if (cr === '1/4') return 0.25;
	if (cr === '1/2') return 0.5;
	const n = parseFloat(cr);
	return isNaN(n) ? 0 : n;
}

function coins(name: string, amount: number): LootItem | null {
	if (amount <= 0) return null;
	return { id: crypto.randomUUID(), name, quantity: amount };
}

function gems(name: string, count: number): LootItem[] {
	if (count <= 0) return [];
	return Array.from({ length: count }, () => ({ id: crypto.randomUUID(), name, quantity: 1 }));
}

export function generateLoot(cr: string): LootItem[] {
	const crNum = parseCrNumeric(cr);
	const roll = dice(1, 100);
	const items: (LootItem | null)[] = [];

	if (crNum <= 4) {
		// CR 0–4
		if (roll <= 30) {
			items.push(coins('Copper Pieces', dice(5, 6)));
		} else if (roll <= 60) {
			items.push(coins('Silver Pieces', dice(4, 6)));
		} else if (roll <= 70) {
			items.push(coins('Electrum Pieces', dice(3, 6)));
		} else if (roll <= 95) {
			items.push(coins('Gold Pieces', dice(3, 6)));
		} else {
			items.push(coins('Platinum Pieces', dice(1, 6)));
		}
	} else if (crNum <= 10) {
		// CR 5–10
		if (roll <= 30) {
			items.push(coins('Copper Pieces', dice(4, 6) * 100));
			items.push(coins('Electrum Pieces', dice(1, 6) * 10));
		} else if (roll <= 60) {
			items.push(coins('Silver Pieces', dice(6, 6) * 10));
			items.push(coins('Gold Pieces', dice(2, 6) * 10));
		} else if (roll <= 70) {
			items.push(coins('Electrum Pieces', dice(3, 6) * 10));
			items.push(coins('Gold Pieces', dice(2, 6) * 10));
		} else if (roll <= 95) {
			items.push(coins('Gold Pieces', dice(4, 6) * 10));
			items.push(coins('Platinum Pieces', dice(1, 6)));
		} else {
			items.push(coins('Electrum Pieces', dice(2, 6) * 10));
			items.push(coins('Gold Pieces', dice(3, 6) * 10));
			items.push(coins('Platinum Pieces', dice(1, 6)));
		}
	} else if (crNum <= 16) {
		// CR 11–16
		if (roll <= 20) {
			items.push(coins('Silver Pieces', dice(4, 6) * 100));
			items.push(coins('Gold Pieces', dice(1, 6) * 100));
		} else if (roll <= 35) {
			items.push(coins('Gold Pieces', dice(1, 6) * 100));
			items.push(...gems('Gem (10 gp)', dice(3, 6)));
		} else if (roll <= 75) {
			items.push(coins('Gold Pieces', dice(2, 6) * 100));
			items.push(...gems('Gem (10 gp)', dice(3, 6)));
		} else {
			items.push(coins('Gold Pieces', dice(2, 6) * 100));
			items.push(...gems('Art Object (25 gp)', dice(2, 6)));
		}
	} else {
		// CR 17+
		if (roll <= 15) {
			items.push(coins('Electrum Pieces', dice(2, 6) * 1000));
			items.push(coins('Gold Pieces', dice(8, 6) * 100));
		} else if (roll <= 55) {
			items.push(coins('Gold Pieces', dice(1, 6) * 1000));
			items.push(coins('Platinum Pieces', dice(1, 6) * 100));
		} else if (roll <= 70) {
			items.push(coins('Gold Pieces', dice(1, 6) * 1000));
			items.push(coins('Platinum Pieces', dice(1, 6) * 100));
			items.push(...gems('Gem (250 gp)', dice(3, 6)));
		} else {
			items.push(coins('Gold Pieces', dice(2, 6) * 1000));
			items.push(coins('Platinum Pieces', dice(1, 6) * 100));
			items.push(...gems('Art Object (750 gp)', dice(2, 6)));
		}
	}

	return items.filter((i): i is LootItem => i !== null);
}
