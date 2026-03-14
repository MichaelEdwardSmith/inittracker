// Shared utilities for rendering 5etools spell data to human-readable strings/HTML.
// No Svelte dependency — safe to import from both client and server contexts.

import type { Spell5e } from '$lib/types';

const SCHOOL_NAMES: Record<string, string> = {
	A: 'Abjuration',
	C: 'Conjuration',
	D: 'Divination',
	E: 'Enchantment',
	V: 'Evocation',
	I: 'Illusion',
	N: 'Necromancy',
	T: 'Transmutation'
};

export function formatSchool(abbr: string): string {
	return SCHOOL_NAMES[abbr] ?? abbr;
}

export function formatLevel(n: number): string {
	if (n === 0) return 'Cantrip';
	const suffixes = ['th', 'st', 'nd', 'rd'];
	const v = n % 100;
	const suffix = v >= 11 && v <= 13 ? 'th' : (suffixes[n % 10] ?? 'th');
	return `${n}${suffix}-level`;
}

export function formatTime(time: unknown[]): string {
	if (!time || time.length === 0) return '';
	const t = time[0] as { number?: number; unit?: string; condition?: string };
	const num = t.number ?? 1;
	const unit = (t.unit ?? '').charAt(0).toUpperCase() + (t.unit ?? '').slice(1);
	const base = `${num} ${unit}`;
	return t.condition ? `${base} (${t.condition})` : base;
}

export function formatRange(range: unknown): string {
	const r = range as {
		type?: string;
		distance?: { type?: string; amount?: number };
	};
	if (!r) return '';
	const type = r.type ?? '';
	if (type === 'special') return 'Special';
	if (type === 'sight') return 'Sight';
	if (type === 'unlimited') return 'Unlimited';
	const dist = r.distance;
	if (!dist) return type.charAt(0).toUpperCase() + type.slice(1);
	const distType = dist.type ?? '';
	if (distType === 'self') return 'Self';
	if (distType === 'touch') return 'Touch';
	if (distType === 'sight') return 'Sight';
	if (distType === 'unlimited') return 'Unlimited';
	const amount = dist.amount ?? 0;
	const unit = distType === 'feet' ? (amount === 1 ? 'foot' : 'feet') : distType;
	return `${amount} ${unit}`;
}

export function formatComponents(components: Record<string, unknown>): string {
	const parts: string[] = [];
	if (components.v) parts.push('V');
	if (components.s) parts.push('S');
	if (components.m) {
		const mat = components.m;
		if (typeof mat === 'string') parts.push(`M (${mat})`);
		else if (mat && typeof mat === 'object' && 'text' in mat)
			parts.push(`M (${(mat as { text: string }).text})`);
		else parts.push('M');
	}
	return parts.join(', ');
}

export function formatDuration(duration: unknown[]): string {
	if (!duration || duration.length === 0) return '';
	const d = duration[0] as {
		type?: string;
		duration?: { type?: string; amount?: number; upTo?: boolean };
		concentration?: boolean;
	};
	const prefix = d.concentration ? 'Concentration, up to ' : '';
	const type = d.type ?? '';
	if (type === 'instant') return 'Instantaneous';
	if (type === 'permanent') return 'Until dispelled';
	if (type === 'special') return 'Special';
	if (type === 'timed' && d.duration) {
		const amt = d.duration.amount ?? 1;
		const unit = d.duration.type ?? '';
		const plural = amt !== 1 ? 's' : '';
		return `${prefix}${amt} ${unit}${plural}`;
	}
	return type.charAt(0).toUpperCase() + type.slice(1);
}

export function isConcentration(duration: unknown[]): boolean {
	if (!duration || duration.length === 0) return false;
	const d = duration[0] as { concentration?: boolean };
	return !!d.concentration;
}

export function getClasses(spell: Spell5e): string[] {
	const classes = spell.classes as { fromClassList?: { name: string }[] } | undefined;
	if (!classes?.fromClassList) return [];
	return [...new Set(classes.fromClassList.map((c) => c.name))].sort();
}

/** Render a single 5etools inline tag like {@dice 2d6} to HTML. */
function renderTag(tag: string, content: string): string {
	switch (tag) {
		case 'dice':
		case 'damage':
		case 'scaledice':
		case 'scaledamage': {
			// content may be "2d6|2d6+4" — use first part as display
			const display = content.split('|')[0].trim();
			return `<button class="dice-btn" data-dice="${display}">${display}</button>`;
		}
		case 'condition':
			return `<em>${content}</em>`;
		case 'spell':
			return `<em>${content.split('|')[0]}</em>`;
		case 'b':
			return `<strong>${content}</strong>`;
		case 'i':
			return `<em>${content}</em>`;
		case 'hit': {
			const mod = parseInt(content);
			const sign = mod >= 0 ? '+' : '';
			return `<button class="atk-btn" data-attack="${mod}">${sign}${mod} to hit</button>`;
		}
		case 'dc':
			return `<strong>DC ${content.split('|')[0]}</strong>`;
		case 'chance':
			return `${content.split('|')[0]}%`;
		case 'recharge':
			return `(Recharge ${content})`;
		case 'atk':
			return content === 'mw'
				? 'Melee Weapon Attack'
				: content === 'rw'
					? 'Ranged Weapon Attack'
					: content;
		case 'creature':
		case 'item':
		case 'sense':
		case 'skill':
		case 'action':
		case 'feat':
			return content.split('|')[0];
		default:
			return content.split('|')[0];
	}
}

/** Convert 5etools inline tags in a string to HTML. */
export function renderInline(text: string): string {
	return text.replace(/\{@(\w+) ([^}]*)\}/g, (_, tag: string, content: string) =>
		renderTag(tag, content)
	);
}

/** Recursively render a 5etools entries array to HTML. */
export function renderEntries(entries: unknown[]): string {
	if (!entries) return '';
	return entries
		.map((entry) => {
			if (typeof entry === 'string') {
				return `<p>${renderInline(entry)}</p>`;
			}
			if (typeof entry !== 'object' || entry === null) return '';
			const e = entry as Record<string, unknown>;

			if (e.type === 'entries') {
				const name = e.name ? `<strong>${e.name}.</strong> ` : '';
				const inner = renderEntries((e.entries as unknown[]) ?? []);
				return `<div>${name}${inner}</div>`;
			}
			if (e.type === 'list') {
				const items = (e.items as unknown[]) ?? [];
				const lis = items.map((item) => {
					if (typeof item === 'string') return `<li>${renderInline(item)}</li>`;
					const it = item as Record<string, unknown>;
					if (it.type === 'item') {
						const iname = it.name ? `<strong>${it.name}.</strong> ` : '';
						return `<li>${iname}${renderInline(String(it.entry ?? it.entries ?? ''))}</li>`;
					}
					return `<li>${renderInline(String(item))}</li>`;
				});
				return `<ul>${lis.join('')}</ul>`;
			}
			if (e.type === 'table') {
				const caption = e.caption ? `<caption>${e.caption}</caption>` : '';
				const cols = (e.colLabels as string[] | undefined) ?? [];
				const thead =
					cols.length > 0
						? `<thead><tr>${cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead>`
						: '';
				const rows = ((e.rows as unknown[][]) ?? [])
					.map(
						(row) =>
							`<tr>${row
								.map((cell) => {
									if (typeof cell === 'object' && cell !== null && 'roll' in cell) {
										const r = cell as { roll: { min?: number; max?: number; exact?: number } };
										const rv = r.roll;
										return `<td>${rv.exact !== undefined ? rv.exact : `${rv.min}–${rv.max}`}</td>`;
									}
									return `<td>${renderInline(String(cell))}</td>`;
								})
								.join('')}</tr>`
					)
					.join('');
				return `<table>${caption}${thead}<tbody>${rows}</tbody></table>`;
			}
			if (e.type === 'item') {
				const name = e.name ? `<strong>${e.name}.</strong> ` : '';
				const inner = Array.isArray(e.entries)
					? renderEntries(e.entries as unknown[])
					: renderInline(String(e.entry ?? ''));
				return `<p>${name}${inner}</p>`;
			}
			// Fallback — try to stringify
			return '';
		})
		.join('');
}
