// Adds a hover tooltip (native `title`) spelling out common abbreviations — AC, HP, CR, DC, the
// six ability scores, etc. — anywhere they appear as short UI text. One global observer instead
// of hand-tagging every label, so labels added later (or rendered dynamically) are covered too.
// Elements that already have their own `title` (or sit inside one) are left alone.

const ABBREVIATIONS: Record<string, string> = {
	'Max HP': 'Maximum Hit Points',
	'Temp HP': 'Temporary Hit Points',
	THP: 'Temporary Hit Points',
	HP: 'Hit Points',
	AC: 'Armor Class',
	CR: 'Challenge Rating',
	XP: 'Experience Points',
	DC: 'Difficulty Class',
	STR: 'Strength',
	DEX: 'Dexterity',
	CON: 'Constitution',
	INT: 'Intelligence',
	WIS: 'Wisdom',
	CHA: 'Charisma',
	Init: 'Initiative',
	Lvl: 'Level',
	DM: 'Dungeon Master',
	NPC: 'Non-Player Character',
	PC: 'Player Character',
	AoE: 'Area of Effect',
	Prof: 'Proficiency Bonus',
	Spd: 'Speed',
	GP: 'Gold Pieces',
	SP: 'Silver Pieces',
	CP: 'Copper Pieces',
	EP: 'Electrum Pieces'
};

const TOKEN_RE = new RegExp(
	`(?<![A-Za-z])(${Object.keys(ABBREVIATIONS)
		.sort((a, b) => b.length - a.length)
		.join('|')})(?![A-Za-z])`,
	'g'
);

const SKIP_SELECTOR =
	'script,style,textarea,input,select,option,canvas,svg,[contenteditable="true"]';
const MAX_OWN_TEXT = 40; // labels only — long prose isn't tagged
const MAX_CLIPPED_TEXT = 200;
const CLIP_ATTR = 'data-clip-auto';
const AUTO_ATTR = 'data-abbr-auto';

function ownText(el: Element): string {
	let text = '';
	for (const node of el.childNodes)
		if (node.nodeType === Node.TEXT_NODE) text += (node as Text).data;
	return text.trim();
}

function tag(el: Element) {
	if (el.matches(SKIP_SELECTOR) || el.closest(SKIP_SELECTOR)) return;
	const auto = el.hasAttribute(AUTO_ATTR);
	if (!auto && (el.hasAttribute('title') || el.parentElement?.closest('[title]'))) return;

	const text = ownText(el);
	const found: string[] = [];
	if (text && text.length <= MAX_OWN_TEXT) {
		for (const m of text.matchAll(TOKEN_RE)) if (!found.includes(m[1])) found.push(m[1]);
	}
	if (found.length) {
		const title = found.map((a) => `${a} — ${ABBREVIATIONS[a]}`).join('\n');
		el.setAttribute('title', title);
		el.setAttribute(AUTO_ATTR, '');
	} else if (auto) {
		el.removeAttribute('title');
		el.removeAttribute(AUTO_ATTR);
	}
}

function scan(root: Node) {
	if (root.nodeType === Node.TEXT_NODE) {
		if (root.parentElement) tag(root.parentElement);
		return;
	}
	if (root.nodeType !== Node.ELEMENT_NODE) return;
	tag(root as Element);
	for (const el of (root as Element).querySelectorAll('*')) tag(el);
}

// Names (players, enemies, sessions, …) that are cut off with an ellipsis / line-clamp get their
// full text as a tooltip. Checked lazily on hover, since clipping depends on the current layout.
function tagClipped(e: MouseEvent) {
	// Only the nearest ellipsis/line-clamp element around the hovered node counts — climbing
	// further would tag an enclosing card with its entire text.
	let el = e.target as Element | null;
	for (let depth = 0; el && depth < 4 && el !== document.body; depth++, el = el.parentElement) {
		if (!(el instanceof HTMLElement) || el.matches(SKIP_SELECTOR)) continue;
		const style = getComputedStyle(el);
		if (style.textOverflow !== 'ellipsis' && !style.webkitLineClamp) continue;
		const clipped = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
		const text = el.textContent?.trim();
		if (el.hasAttribute('title') && !el.hasAttribute(CLIP_ATTR)) return;
		if (clipped && text && text.length <= MAX_CLIPPED_TEXT) {
			el.setAttribute('title', text);
			el.setAttribute(CLIP_ATTR, '');
		} else if (el.hasAttribute(CLIP_ATTR)) {
			el.removeAttribute('title');
			el.removeAttribute(CLIP_ATTR);
		}
		return;
	}
}

/** Starts the observer; returns a cleanup function. Browser-only. */
export function startAbbrTooltips(): () => void {
	const pending = new Set<Node>();
	let frame = 0;

	const flush = () => {
		frame = 0;
		for (const node of pending) if (node.isConnected) scan(node);
		pending.clear();
	};
	const queue = (node: Node) => {
		pending.add(node);
		if (!frame) frame = requestAnimationFrame(flush);
	};

	const observer = new MutationObserver((mutations) => {
		for (const m of mutations) {
			if (m.type === 'characterData') queue(m.target);
			else m.addedNodes.forEach(queue);
		}
	});
	observer.observe(document.body, { childList: true, subtree: true, characterData: true });
	queue(document.body);
	document.addEventListener('mouseover', tagClipped, { passive: true });

	return () => {
		document.removeEventListener('mouseover', tagClipped);
		observer.disconnect();
		if (frame) cancelAnimationFrame(frame);
	};
}
