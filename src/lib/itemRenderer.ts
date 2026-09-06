// Shared utilities for rendering item reference data (weapons, armor, magic items, etc.)
// to human-readable strings/HTML. No Svelte dependency — safe to import from client or server.

import type { Item } from '$lib/types';

const RARITY_COLORS: Record<string, string> = {
	common: 'bg-gray-700 text-gray-300 ring-gray-600',
	uncommon: 'bg-emerald-900/60 text-emerald-300 ring-emerald-700/50',
	rare: 'bg-sky-900/60 text-sky-300 ring-sky-700/50',
	'very rare': 'bg-violet-900/60 text-violet-300 ring-violet-700/50',
	legendary: 'bg-amber-900/60 text-amber-300 ring-amber-700/50',
	artifact: 'bg-rose-900/60 text-rose-300 ring-rose-700/50'
};

/** Tailwind badge classes for a magic item's rarity (falls back to a neutral style). */
export function rarityColor(rarity: string | undefined): string {
	if (!rarity) return 'bg-gray-700 text-gray-300 ring-gray-600';
	return RARITY_COLORS[rarity.toLowerCase()] ?? 'bg-gray-700 text-gray-300 ring-gray-600';
}

export function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

const CATEGORY_LABELS: Record<Item['category'], string> = {
	weapon: 'Weapon',
	armor: 'Armor',
	gear: 'Adventuring Gear',
	tool: 'Tool',
	pack: 'Equipment Pack',
	mount: 'Mount',
	vehicle: 'Vehicle',
	'magic-item': 'Magic Item'
};

export function categoryLabel(category: Item['category']): string {
	return CATEGORY_LABELS[category] ?? category;
}

/** Linkify dice expressions (e.g. "1d100", "2d6+3") in plain text into clickable buttons. */
function linkDice(text: string): string {
	return text.replace(/\b(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?\b/g, (match) => {
		return `<button class="dice-btn" data-dice="${match}">${match}</button>`;
	});
}

/** Inline markdown: **bold**, _italic_, then dice links. */
function renderInline(text: string): string {
	let out = text
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/_(.+?)_/g, '<em>$1</em>');
	out = linkDice(out);
	return out;
}

/** Parse a markdown pipe table block into an HTML <table>. */
function renderTable(block: string): string {
	const lines = block.split('\n').filter((l) => l.trim().length > 0);
	if (lines.length < 2) return `<p>${renderInline(block)}</p>`;
	const cells = (line: string) =>
		line
			.trim()
			.replace(/^\||\|$/g, '')
			.split('|')
			.map((c) => c.trim());
	const header = cells(lines[0]);
	// lines[1] is the "---|---" separator row — skip it
	const rows = lines.slice(2).map(cells);
	const thead = `<thead><tr>${header.map((h) => `<th>${renderInline(h)}</th>`).join('')}</tr></thead>`;
	const tbody = `<tbody>${rows
		.map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join('')}</tr>`)
		.join('')}</tbody>`;
	return `<table>${thead}${tbody}</table>`;
}

/** Render a full item description (plain text with markdown tables/bold/italic) to HTML. */
export function renderDescription(text: string): string {
	if (!text) return '';
	return text
		.split('\n\n')
		.map((block) => {
			if (block.trim().startsWith('|')) return renderTable(block);
			return `<p>${renderInline(block)}</p>`;
		})
		.join('');
}
