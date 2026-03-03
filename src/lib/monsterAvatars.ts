// Maps monster template names to display emoji and Tailwind colour styles used on
// combatant tokens in the tracker and viewer. Provides getMonsterEmoji() and
// getMonsterStyle() helpers.

/** Per-monster emoji, keyed by the original template name. */
export const MONSTER_EMOJI: Record<string, string> = {
	Bat: '🦇',
	Commoner: '👤',
	Rat: '🐀',
	'Giant Rat': '🐀',
	Kobold: '🦎',
	Stirge: '🐛',
	Bandit: '🗡️',
	Guard: '🛡️',
	Boar: '🐗',
	Cultist: '🔮',
	'Giant Wolf Spider': '🕷️',
	Goblin: '👺',
	Skeleton: '💀',
	Wolf: '🐺',
	Zombie: '💀',
	'Swarm of Rats': '🐀',
	'Black Bear': '🐻',
	Crocodile: '🐊',
	Gnoll: '🐺',
	Hobgoblin: '⚔️',
	Lizardfolk: '🦎',
	Orc: '👹',
	Sahuagin: '🐟',
	'Brown Bear': '🐻',
	Bugbear: '👹',
	'Dire Wolf': '🐺',
	Dryad: '🌿',
	Ghoul: '💀',
	'Giant Spider': '🕷️',
	Harpy: '🦅',
	Hippogriff: '🦅',
	Ankheg: '🦗',
	'Bandit Captain': '⚔️',
	Berserker: '⚔️',
	Ettercap: '🕷️',
	Gargoyle: '🗿',
	Ghast: '💀',
	Ogre: '👹',
	'Sea Hag': '🔮',
	Wererat: '🐀',
	'Will-o-Wisp': '✨',
	Basilisk: '🦎',
	'Displacer Beast': '🐆',
	Doppelganger: '👥',
	'Green Hag': '🌿',
	'Hell Hound': '🐕',
	Knight: '🛡️',
	Manticore: '🦁',
	Mummy: '💀',
	Owlbear: '🦉',
	Veteran: '⚔️',
	Wight: '💀',
	Werewolf: '🐺',
	Banshee: '👻',
	Chuul: '🦀',
	Ettin: '👹',
	Ghost: '👻',
	Lamia: '🐍',
	'Succubus/Incubus': '😈',
	Cyclops: '👁️',
	Medusa: '🐍',
	'Hill Giant': '🏔️',
	Revenant: '💀',
	Troll: '👹',
	'Vampire Spawn': '🦇',
	Wraith: '👻',
	'Mind Flayer': '👁️',
	Oni: '👹',
	'Stone Giant': '🗿',
	'Young Black Dragon': '🐉',
	'Chain Devil': '⛓️',
	'Frost Giant': '❄️',
	Hydra: '🐍',
	'Young Blue Dragon': '🐉',
	'Young Green Dragon': '🐉',
	'Fire Giant': '🔥',
	'Young Red Dragon': '🐉',
	Archmage: '🔮',
	Beholder: '👁️',
	'Storm Giant': '⛈️',
	Vampire: '🦇',
	'Adult Black Dragon': '🐉',
	'Adult Green Dragon': '🐉',
	'Adult Blue Dragon': '🐉',
	'Adult Red Dragon': '🐉',
	Lich: '💀',
	'Ancient Red Dragon': '🐉'
};

/** Fallback emoji per monster type category. */
export const TYPE_EMOJI: Record<string, string> = {
	Beast: '🐾',
	Dragon: '🐉',
	Undead: '💀',
	Humanoid: '⚔️',
	Giant: '🏔️',
	Fiend: '😈',
	Aberration: '👁️',
	Fey: '✨',
	Monstrosity: '🦂',
	Elemental: '🔥',
	Construct: '⚙️',
	Plant: '🌿'
};

/** Ring and background colours per monster type, expressed as Tailwind classes. */
export const TYPE_STYLE: Record<string, { bg: string; ring: string }> = {
	Beast: { bg: 'bg-amber-950', ring: 'ring-amber-600' },
	Dragon: { bg: 'bg-red-950', ring: 'ring-red-500' },
	Undead: { bg: 'bg-gray-950', ring: 'ring-gray-500' },
	Humanoid: { bg: 'bg-stone-900', ring: 'ring-stone-500' },
	Giant: { bg: 'bg-slate-900', ring: 'ring-slate-500' },
	Fiend: { bg: 'bg-orange-950', ring: 'ring-orange-600' },
	Aberration: { bg: 'bg-purple-950', ring: 'ring-purple-600' },
	Fey: { bg: 'bg-teal-950', ring: 'ring-teal-500' },
	Monstrosity: { bg: 'bg-rose-950', ring: 'ring-rose-600' },
	Elemental: { bg: 'bg-yellow-950', ring: 'ring-yellow-500' },
	Construct: { bg: 'bg-cyan-950', ring: 'ring-cyan-600' },
	Plant: { bg: 'bg-green-950', ring: 'ring-green-600' }
};

export function getMonsterEmoji(templateName?: string, monsterType?: string): string {
	if (templateName && MONSTER_EMOJI[templateName]) return MONSTER_EMOJI[templateName];
	if (monsterType && TYPE_EMOJI[monsterType]) return TYPE_EMOJI[monsterType];
	return '👹';
}

export function getMonsterStyle(monsterType?: string): { bg: string; ring: string } {
	return TYPE_STYLE[monsterType ?? ''] ?? { bg: 'bg-gray-900', ring: 'ring-gray-600' };
}
