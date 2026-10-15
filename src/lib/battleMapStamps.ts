// Battle Map stamp catalog — top-down furniture, barriers and terrain the DM can place on the
// map. Each stamp is drawn in a 100x100 viewBox and stretched (preserveAspectRatio="none") to its
// w x h grid-square footprint, so shapes use non-scaling strokes to keep line weight even when a
// long fence or wall is stretched. Static markup only (no user input), safe to render with {@html}.

export interface StampDef {
	id: string;
	label: string;
	category: 'Furniture' | 'Barriers' | 'Terrain';
	// Default footprint in grid squares at rotation 0.
	w: number;
	h: number;
	// Linear stamps (fences, walls) grow only in length when sized up; others scale uniformly.
	linear?: boolean;
	svg: string;
}

const O = 'stroke="#1c1917" stroke-width="2" vector-effect="non-scaling-stroke"';

export const STAMPS: StampDef[] = [
	// ── Furniture ──
	{
		id: 'table',
		label: 'Table',
		category: 'Furniture',
		w: 2,
		h: 1,
		svg: `<rect x="4" y="8" width="92" height="84" rx="4" fill="#a16207" ${O}/><rect x="12" y="18" width="76" height="64" rx="2" fill="none" stroke="#713f12" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`
	},
	{
		id: 'round-table',
		label: 'Round Table',
		category: 'Furniture',
		w: 2,
		h: 2,
		svg: `<ellipse cx="50" cy="50" rx="46" ry="46" fill="#a16207" ${O}/><ellipse cx="50" cy="50" rx="32" ry="32" fill="none" stroke="#713f12" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`
	},
	{
		id: 'chair',
		label: 'Chair',
		category: 'Furniture',
		w: 0.5,
		h: 0.5,
		svg: `<rect x="12" y="20" width="76" height="68" rx="10" fill="#b45309" ${O}/><rect x="12" y="6" width="76" height="22" rx="6" fill="#78350f" ${O}/>`
	},
	{
		id: 'bed',
		label: 'Bed',
		category: 'Furniture',
		w: 1,
		h: 2,
		svg: `<rect x="6" y="3" width="88" height="94" rx="5" fill="#92400e" ${O}/><rect x="12" y="22" width="76" height="70" rx="4" fill="#e7e5e4" ${O}/><rect x="20" y="8" width="60" height="18" rx="6" fill="#f5f5f4" ${O}/><rect x="12" y="50" width="76" height="42" rx="4" fill="#b91c1c" ${O}/>`
	},
	{
		id: 'chest',
		label: 'Chest',
		category: 'Furniture',
		w: 1,
		h: 1,
		svg: `<rect x="10" y="22" width="80" height="56" rx="6" fill="#92400e" ${O}/><rect x="10" y="44" width="80" height="6" fill="#facc15" ${O}/><rect x="44" y="38" width="12" height="18" rx="2" fill="#facc15" ${O}/>`
	},
	{
		id: 'bookshelf',
		label: 'Bookshelf',
		category: 'Furniture',
		w: 2,
		h: 0.5,
		svg: `<rect x="2" y="6" width="96" height="88" rx="3" fill="#78350f" ${O}/><rect x="8" y="22" width="14" height="60" fill="#dc2626"/><rect x="24" y="22" width="12" height="60" fill="#2563eb"/><rect x="38" y="22" width="16" height="60" fill="#16a34a"/><rect x="56" y="22" width="12" height="60" fill="#ca8a04"/><rect x="70" y="22" width="14" height="60" fill="#7c3aed"/>`
	},
	{
		id: 'barrel',
		label: 'Barrel',
		category: 'Furniture',
		w: 1,
		h: 1,
		svg: `<circle cx="50" cy="50" r="40" fill="#a16207" ${O}/><circle cx="50" cy="50" r="28" fill="none" stroke="#451a03" stroke-width="3" vector-effect="non-scaling-stroke"/><circle cx="50" cy="50" r="6" fill="#451a03"/>`
	},
	{
		id: 'crate',
		label: 'Crate',
		category: 'Furniture',
		w: 1,
		h: 1,
		svg: `<rect x="10" y="10" width="80" height="80" fill="#b45309" ${O}/><path d="M10 10 L90 90 M90 10 L10 90" stroke="#78350f" stroke-width="3" vector-effect="non-scaling-stroke"/>`
	},
	{
		id: 'fireplace',
		label: 'Fireplace',
		category: 'Furniture',
		w: 2,
		h: 1,
		svg: `<rect x="2" y="4" width="96" height="92" fill="#57534e" ${O}/><rect x="16" y="24" width="68" height="60" fill="#1c1917" ${O}/><path d="M50 78 C32 66 40 50 50 36 C60 50 68 66 50 78 Z" fill="#f97316"/><path d="M50 78 C42 70 46 62 50 54 C54 62 58 70 50 78 Z" fill="#fde047"/>`
	},
	{
		id: 'rug',
		label: 'Rug',
		category: 'Furniture',
		w: 3,
		h: 2,
		svg: `<rect x="3" y="5" width="94" height="90" rx="4" fill="#991b1b" ${O}/><rect x="12" y="16" width="76" height="68" fill="none" stroke="#fbbf24" stroke-width="2.5" vector-effect="non-scaling-stroke"/>`
	},
	// ── Barriers ──
	{
		id: 'fence',
		label: 'Fence',
		category: 'Barriers',
		w: 1,
		h: 0.3,
		linear: true,
		svg: `<line x1="0" y1="35" x2="100" y2="35" stroke="#92400e" stroke-width="3" vector-effect="non-scaling-stroke"/><line x1="0" y1="68" x2="100" y2="68" stroke="#92400e" stroke-width="3" vector-effect="non-scaling-stroke"/><rect x="8" y="8" width="10" height="84" fill="#a16207" ${O}/><rect x="82" y="8" width="10" height="84" fill="#a16207" ${O}/><rect x="45" y="8" width="10" height="84" fill="#a16207" ${O}/>`
	},
	{
		id: 'wall',
		label: 'Stone Wall',
		category: 'Barriers',
		w: 1,
		h: 0.3,
		linear: true,
		svg: `<rect x="0" y="0" width="100" height="100" fill="#78716c" ${O}/><path d="M33 0 V100 M66 0 V100 M0 50 H100" stroke="#44403c" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`
	},
	{
		id: 'wood-wall',
		label: 'Wooden Wall',
		category: 'Barriers',
		w: 1,
		h: 0.3,
		linear: true,
		svg: `<rect x="0" y="0" width="100" height="100" fill="#92400e" ${O}/><path d="M25 0 V100 M50 0 V100 M75 0 V100" stroke="#451a03" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`
	},
	{
		id: 'door',
		label: 'Door',
		category: 'Barriers',
		w: 1,
		h: 0.3,
		svg: `<rect x="0" y="0" width="100" height="100" fill="#b45309" ${O}/><circle cx="82" cy="50" r="7" fill="#facc15" stroke="#1c1917" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`
	},
	{
		id: 'gate',
		label: 'Gate',
		category: 'Barriers',
		w: 2,
		h: 0.3,
		svg: `<rect x="0" y="0" width="100" height="100" fill="#a16207" ${O}/><path d="M50 0 V100" stroke="#1c1917" stroke-width="2.5" vector-effect="non-scaling-stroke"/><circle cx="42" cy="50" r="5" fill="#facc15"/><circle cx="58" cy="50" r="5" fill="#facc15"/>`
	},
	{
		id: 'portcullis',
		label: 'Portcullis',
		category: 'Barriers',
		w: 2,
		h: 0.3,
		svg: `<rect x="0" y="0" width="100" height="100" fill="#44403c" ${O}/><path d="M12 0 V100 M25 0 V100 M38 0 V100 M50 0 V100 M62 0 V100 M75 0 V100 M88 0 V100" stroke="#a8a29e" stroke-width="2" vector-effect="non-scaling-stroke"/>`
	},
	{
		id: 'window',
		label: 'Window',
		category: 'Barriers',
		w: 1,
		h: 0.3,
		svg: `<rect x="0" y="0" width="100" height="100" fill="#78716c" ${O}/><rect x="8" y="22" width="84" height="56" fill="#7dd3fc" stroke="#1c1917" stroke-width="1.5" vector-effect="non-scaling-stroke"/><line x1="50" y1="22" x2="50" y2="78" stroke="#1c1917" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`
	},
	{
		id: 'pillar',
		label: 'Pillar',
		category: 'Barriers',
		w: 1,
		h: 1,
		svg: `<circle cx="50" cy="50" r="40" fill="#a8a29e" ${O}/><circle cx="50" cy="50" r="26" fill="#d6d3d1" stroke="#78716c" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`
	},
	{
		id: 'stairs',
		label: 'Stairs',
		category: 'Barriers',
		w: 2,
		h: 1,
		svg: `<rect x="2" y="2" width="96" height="96" fill="#a8a29e" ${O}/><path d="M17 2 V98 M32 2 V98 M47 2 V98 M62 2 V98 M77 2 V98" stroke="#57534e" stroke-width="2" vector-effect="non-scaling-stroke"/><path d="M8 50 H92 M80 38 L92 50 L80 62" fill="none" stroke="#1c1917" stroke-width="2" vector-effect="non-scaling-stroke"/>`
	},
	// ── Terrain ──
	{
		id: 'boulder',
		label: 'Boulder',
		category: 'Terrain',
		w: 1,
		h: 1,
		svg: `<path d="M14 62 C10 36 30 14 52 16 C76 14 92 36 86 62 C82 84 56 90 36 86 C22 82 16 74 14 62 Z" fill="#78716c" ${O}/><path d="M32 40 C40 30 54 30 62 38" fill="none" stroke="#a8a29e" stroke-width="3" vector-effect="non-scaling-stroke"/>`
	},
	{
		id: 'tree',
		label: 'Tree',
		category: 'Terrain',
		w: 2,
		h: 2,
		svg: `<circle cx="50" cy="50" r="46" fill="#15803d" ${O}/><circle cx="34" cy="38" r="20" fill="#16a34a"/><circle cx="62" cy="62" r="18" fill="#166534"/><circle cx="50" cy="50" r="6" fill="#451a03"/>`
	},
	{
		id: 'bush',
		label: 'Bush',
		category: 'Terrain',
		w: 1,
		h: 1,
		svg: `<circle cx="34" cy="56" r="26" fill="#16a34a" ${O}/><circle cx="62" cy="44" r="28" fill="#15803d" ${O}/><circle cx="62" cy="68" r="20" fill="#166534" ${O}/>`
	},
	{
		id: 'pit',
		label: 'Pit',
		category: 'Terrain',
		w: 2,
		h: 2,
		svg: `<ellipse cx="50" cy="50" rx="46" ry="46" fill="#0c0a09" ${O}/><ellipse cx="50" cy="50" rx="32" ry="32" fill="#1c1917"/>`
	},
	{
		id: 'water',
		label: 'Water',
		category: 'Terrain',
		w: 2,
		h: 2,
		svg: `<rect x="0" y="0" width="100" height="100" rx="12" fill="#0ea5e9" fill-opacity="0.65" stroke="#0369a1" stroke-width="2" vector-effect="non-scaling-stroke"/><path d="M12 34 Q25 24 38 34 T64 34 T90 34 M12 66 Q25 56 38 66 T64 66 T90 66" fill="none" stroke="#e0f2fe" stroke-width="3" vector-effect="non-scaling-stroke"/>`
	},
	{
		id: 'fire',
		label: 'Campfire',
		category: 'Terrain',
		w: 1,
		h: 1,
		svg: `<circle cx="50" cy="50" r="40" fill="#44403c" ${O}/><path d="M50 82 C26 66 36 46 50 18 C64 46 74 66 50 82 Z" fill="#f97316"/><path d="M50 78 C38 68 44 56 50 42 C56 56 62 68 50 78 Z" fill="#fde047"/>`
	}
];

export const STAMP_CATEGORIES = ['Furniture', 'Barriers', 'Terrain'] as const;

const STAMP_BY_ID = new Map(STAMPS.map((s) => [s.id, s]));

export function getStamp(id: string): StampDef | undefined {
	return STAMP_BY_ID.get(id);
}

// Footprint for a placement: `size` is a length (squares) for linear stamps, a uniform
// multiplier otherwise.
export function stampFootprint(def: StampDef, size: number): { w: number; h: number } {
	return def.linear ? { w: def.w * size, h: def.h } : { w: def.w * size, h: def.h * size };
}
