import { describe, it, expect } from 'vitest';
import { getLegendaryResistanceInfo } from './enemies';
import { getLegendaryInfo2024 } from './enemies2024';
import type { MonsterDetail2024 } from './types';

describe('getLegendaryResistanceInfo (2014 free-text traits)', () => {
	it('returns null when there is no trait text or no Legendary Resistance', () => {
		expect(getLegendaryResistanceInfo(undefined)).toBeNull();
		expect(
			getLegendaryResistanceInfo('<p><em><strong>Amphibious.</strong></em> Breathes water.</p>')
		).toBeNull();
	});

	it('parses the daily count and extracts only that trait paragraph', () => {
		const traits =
			'<p><strong>Amphibious.</strong> x</p><p><em><strong>Legendary Resistance (3/Day).</strong></em> If it fails a save, it can succeed instead.</p><p><strong>Other.</strong> y</p>';
		const info = getLegendaryResistanceInfo(traits);
		expect(info?.max).toBe(3);
		expect(info?.text).toContain('Legendary Resistance');
		expect(info?.text).not.toContain('Amphibious');
		expect(info?.text).not.toContain('Other.');
	});
});

function detail2024(overrides: Partial<MonsterDetail2024>): MonsterDetail2024 {
	return {
		slug: 'x',
		name: 'X',
		traits: [],
		legendary: { preamble: null, actions: [] },
		...overrides
	} as MonsterDetail2024;
}

describe('getLegendaryInfo2024', () => {
	it('returns nothing for a missing or non-legendary monster', () => {
		expect(getLegendaryInfo2024(undefined)).toEqual({ actions: null, resistance: null });
		expect(getLegendaryInfo2024(detail2024({}))).toEqual({ actions: null, resistance: null });
	});

	it('uses the out-of-lair resistance count', () => {
		const info = getLegendaryInfo2024(
			detail2024({
				traits: [
					{
						name: 'Legendary Resistance (3/Day, or 4/Day in Lair)',
						description: 'If the dragon fails a saving throw, it can choose to succeed instead.'
					}
				]
			})
		);
		expect(info.resistance?.max).toBe(3);
		expect(info.resistance?.text).toContain('succeed instead');
	});

	it('reads legendary action uses from the preamble and renders the actions', () => {
		const info = getLegendaryInfo2024(
			detail2024({
				legendary: {
					preamble: 'Legendary Action Uses: 2 (3 in Lair). Expend a use after another turn.',
					actions: [{ name: 'Lash', description: 'The aboleth makes one Tentacle attack.' }]
				}
			})
		);
		expect(info.actions?.max).toBe(2);
		expect(info.actions?.text).toContain('Legendary Action Uses');
		expect(info.actions?.text).toContain('<strong>Lash.</strong>');
	});

	it('defaults to 3 uses when the preamble has no count', () => {
		const info = getLegendaryInfo2024(
			detail2024({
				legendary: { preamble: null, actions: [{ name: 'Move', description: 'It moves.' }] }
			})
		);
		expect(info.actions?.max).toBe(3);
	});

	it('parses every Legendary Resistance trait in the real 2024 bestiary', async () => {
		const { default: raw } = await import('./data/monsters-2024.json');
		const withLr = (raw as unknown as MonsterDetail2024[]).filter((m) =>
			m.traits.some((t) => /^Legendary Resistance/i.test(t.name))
		);
		expect(withLr.length).toBeGreaterThan(0);
		for (const m of withLr) {
			expect(getLegendaryInfo2024(m).resistance?.max, m.name).toBeGreaterThan(0);
		}
	});
});
