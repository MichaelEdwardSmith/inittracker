<!-- Full-screen Quick Rules reference for DMs. Left column lists categories;
     right panel shows the selected category's content. -->
<script lang="ts">
	let {
		onclose,
		onAddEncounter
	}: {
		onclose: () => void;
		onAddEncounter?: (monsters: { name: string; count: number }[]) => void;
	} = $props();

	type Category = {
		id: string;
		label: string;
		icon: string;
	};

	const categories: Category[] = [
		{ id: 'actions', label: 'Actions in Combat', icon: '⚔️' },
		{ id: 'bonus', label: 'Bonus Actions', icon: '⚡' },
		{ id: 'movement', label: 'Movement & Position', icon: '👣' },
		{ id: 'conditions', label: 'Conditions', icon: '🩸' },
		{ id: 'concentration', label: 'Concentration', icon: '🧠' },
		{ id: 'death', label: 'Death Saving Throws', icon: '☠' },
		{ id: 'exhaustion', label: 'Exhaustion', icon: '😓' },
		{ id: 'cover', label: 'Cover', icon: '🛡️' },
		{ id: 'light', label: 'Light & Vision', icon: '👁️' },
		{ id: 'resting', label: 'Resting', icon: '🌙' },
		{ id: 'checks', label: 'Ability Check DCs', icon: '🎲' },
		{ id: 'saves', label: 'Common Save DCs', icon: '💀' },
		{ id: 'xp', label: 'Encounter Difficulty', icon: '⚖️' },
		{ id: 'magic', label: 'Magic & Casting', icon: '✨' },
		{ id: 'names', label: 'Name Generator', icon: '📛' },
		{ id: 'weather', label: 'Weather & Travel', icon: '🌦️' },
		{ id: 'shop', label: 'Shop Generator', icon: '🛒' },
		{ id: 'encounter', label: 'Random Encounter', icon: '🎲' }
	];

	let selected = $state('actions');

	// ── Name Generator ───────────────────────────────────────────────────────
	type SyllableDef = {
		kind: 'syllable';
		pre: string[];
		mid?: string[];
		suf: string[];
		midChance?: number;
	};
	type CompoundDef = { kind: 'compound'; a: string[]; b: string[]; sep?: string; prefix?: string };
	type NameDef = SyllableDef | CompoundDef;

	const nameData: Record<string, NameDef> = {
		'human-male': {
			kind: 'syllable',
			pre: [
				'Al',
				'Ar',
				'Bal',
				'Bran',
				'Car',
				'Cor',
				'Dan',
				'Ed',
				'Gar',
				'Gor',
				'Hal',
				'Har',
				'Ian',
				'Jar',
				'Kel',
				'Lan',
				'Lar',
				'Mar',
				'Nal',
				'Par',
				'Ran',
				'Ser',
				'Sten',
				'Tor',
				'Ulf',
				'Val',
				'Wil'
			],
			mid: ['dan', 'gar', 'mar', 'ren', 'bar', 'fen', 'ker', 'nor', 'tar', 'wal'],
			suf: [
				'ric',
				'ald',
				'win',
				'an',
				'on',
				'in',
				'or',
				'en',
				'mar',
				'dar',
				'ford',
				'ton',
				'rel',
				'bert',
				'mund',
				'brand',
				'rick',
				'ward',
				'wick'
			]
		},
		'human-female': {
			kind: 'syllable',
			pre: [
				'Aer',
				'Bri',
				'Cass',
				'Del',
				'El',
				'Em',
				'Eva',
				'Gwen',
				'Isla',
				'Kar',
				'Lara',
				'Mar',
				'Mor',
				'Nai',
				'Rosa',
				'Ser',
				'Syl',
				'Una',
				'Val',
				'Wyn'
			],
			mid: ['a', 'li', 'ra', 'ri', 'na', 'la', 'ni', 'ma', 'sa', 've'],
			suf: [
				'a',
				'ia',
				'ina',
				'ena',
				'wyn',
				'lyn',
				'ara',
				'ira',
				'ela',
				'isa',
				'ella',
				'ane',
				'ette',
				'bel',
				'dra'
			],
			midChance: 0.2
		},
		elf: {
			kind: 'syllable',
			pre: [
				'Aer',
				'Ael',
				'Cal',
				'Cel',
				'Cor',
				'El',
				'Fae',
				'Gal',
				'Gil',
				'Ith',
				'Kael',
				'Lith',
				'Mir',
				'Nar',
				'Nil',
				'Quel',
				'Riv',
				'Sil',
				'Sol',
				'Tal',
				'Thal',
				'Var',
				'Zel'
			],
			mid: ['a', 'i', 'u', 'e', 'ae', 'ie', 'ua', 'ei'],
			suf: [
				'iel',
				'ion',
				'ath',
				'ara',
				'uvar',
				'anor',
				'aniel',
				'wen',
				'thor',
				'riel',
				'las',
				'mir',
				'dan',
				'rin',
				'ros',
				'el',
				'ias'
			],
			midChance: 0.4
		},
		dwarf: {
			kind: 'syllable',
			pre: [
				'Baf',
				'Bal',
				'Bar',
				'Bom',
				'Dal',
				'Dor',
				'Dur',
				'Far',
				'Gar',
				'Gim',
				'Gor',
				'Hal',
				'Har',
				'Kaz',
				'Kel',
				'Kor',
				'Mord',
				'Nor',
				'Orn',
				'Ran',
				'Rok',
				'Thor',
				'Tor',
				'Ulf'
			],
			suf: [
				'in',
				'ak',
				'un',
				'ik',
				'ek',
				'or',
				'ur',
				'ar',
				'im',
				'rim',
				'bur',
				'dok',
				'din',
				'grim',
				'dur',
				'nar',
				'li',
				'ni'
			]
		},
		halfling: {
			kind: 'syllable',
			pre: [
				'Amos',
				'Bar',
				'Bur',
				'Cal',
				'Cob',
				'Del',
				'Dil',
				'Fil',
				'Fin',
				'Hal',
				'Kel',
				'Lil',
				'Lin',
				'Mel',
				'Milo',
				'Ned',
				'Pip',
				'Rol',
				'Sam',
				'Tab',
				'Tim',
				'Tom',
				'Will'
			],
			suf: [
				'bo',
				'ber',
				'by',
				'dle',
				'fie',
				'kin',
				'ley',
				'lin',
				'low',
				'pin',
				'ro',
				'ton',
				'wick',
				'wood',
				'y',
				'din'
			]
		},
		gnome: {
			kind: 'syllable',
			pre: [
				'Alb',
				'Bim',
				'Bink',
				'Bip',
				'Dim',
				'Dip',
				'Elb',
				'Erky',
				'Fiz',
				'Flan',
				'Gim',
				'Glib',
				'Glim',
				'Ink',
				'Jeb',
				'Kelb',
				'Nib',
				'Nim',
				'Pip',
				'Rib',
				'Rim',
				'Snip',
				'Tab',
				'Tim',
				'Wim',
				'Zook'
			],
			suf: [
				'ble',
				'bix',
				'bop',
				'bur',
				'ding',
				'fiz',
				'flax',
				'gle',
				'glim',
				'kin',
				'kle',
				'lix',
				'nix',
				'pin',
				'pip',
				'ple',
				'rim',
				'tle',
				'wick',
				'zle'
			]
		},
		orc: {
			kind: 'syllable',
			pre: [
				'Akh',
				'Arg',
				'Bak',
				'Bol',
				'Brug',
				'Gar',
				'Gog',
				'Grim',
				'Grob',
				'Grul',
				'Grum',
				'Kaz',
				'Krag',
				'Krul',
				'Mag',
				'Mog',
				'Nar',
				'Rag',
				'Rok',
				'Skar',
				'Thak',
				'Thog',
				'Ug',
				'Ulg',
				'Var',
				'Vorg',
				'Zak',
				'Zog'
			],
			suf: [
				'ak',
				'ash',
				'at',
				'dak',
				'gak',
				'gar',
				'gul',
				'kan',
				'kar',
				'mak',
				'muk',
				'nak',
				'ok',
				'rak',
				'rog',
				'rok',
				'ruk',
				'tak',
				'tar',
				'uk',
				'zak'
			]
		},
		tiefling: {
			kind: 'syllable',
			pre: [
				'Bael',
				'Car',
				'Drak',
				'Exam',
				'Fil',
				'Graz',
				'Kar',
				'Lex',
				'Lev',
				'Lorr',
				'Mal',
				'Meph',
				'Mor',
				'Ner',
				'Neth',
				'Par',
				'Ran',
				'Scor',
				'Ser',
				'Sin',
				'Tar',
				'Tel',
				'Vel',
				'Xan',
				'Zan',
				'Zar'
			],
			suf: [
				'iel',
				'ius',
				'ias',
				'ion',
				'ax',
				'ix',
				'oth',
				'uth',
				'ex',
				'us',
				'ara',
				'ath',
				'an',
				'as',
				'os',
				'eus',
				'ias'
			]
		},
		dragonborn: {
			kind: 'syllable',
			pre: [
				'Ach',
				'Arj',
				'Ark',
				'Bala',
				'Brae',
				'Chra',
				'Drak',
				'Dras',
				'Drax',
				'Ghar',
				'Grath',
				'Grax',
				'Kaar',
				'Khal',
				'Krag',
				'Mech',
				'Naer',
				'Nax',
				'Rath',
				'Rax',
				'Rex',
				'Sarx',
				'Skaar',
				'Thar',
				'Thav',
				'Vrak',
				'Vrax',
				'Xan',
				'Zar',
				'Zel'
			],
			suf: [
				'akai',
				'akir',
				'an',
				'ar',
				'arith',
				'ash',
				'ax',
				'axan',
				'el',
				'enth',
				'ix',
				'or',
				'os',
				'rak',
				'rax',
				'thix',
				'ur',
				'vaxis'
			]
		},
		tavern: {
			kind: 'compound',
			prefix: 'The ',
			a: [
				'Golden',
				'Silver',
				'Iron',
				'Rusty',
				'Broken',
				'Laughing',
				'Dancing',
				'Prancing',
				'Wandering',
				'Sleeping',
				'Fallen',
				'Burning',
				'Frosty',
				'Wicked',
				'Lucky',
				'Blind',
				'Mad',
				'Bold',
				'Brave',
				'Weary',
				'Merry',
				'Jolly',
				'Painted',
				'Crimson',
				'Howling'
			],
			b: [
				'Dragon',
				'Sword',
				'Shield',
				'Helm',
				'Axe',
				'Flagon',
				'Goblet',
				'Barrel',
				'Pony',
				'Griffin',
				'Unicorn',
				'Mermaid',
				'Fox',
				'Wolf',
				'Bear',
				'Eagle',
				'Knight',
				'Pilgrim',
				'Raven',
				'Owl',
				'Monk',
				'Serpent',
				'Stag',
				'Boar',
				'Crow'
			],
			sep: ' '
		},
		town: {
			kind: 'compound',
			a: [
				'Ash',
				'Black',
				'Bright',
				'Crest',
				'Dark',
				'East',
				'Far',
				'Fen',
				'Gale',
				'Glen',
				'Gold',
				'Green',
				'Grey',
				'High',
				'Hollow',
				'Iron',
				'Long',
				'Marsh',
				'Mill',
				'Moon',
				'New',
				'North',
				'Oak',
				'Old',
				'Pine',
				'Red',
				'River',
				'Rock',
				'Rose',
				'Silver',
				'South',
				'Stone',
				'Storm',
				'Swift',
				'West',
				'White',
				'Wind',
				'Wood'
			],
			b: [
				'bridge',
				'brook',
				'bury',
				'cliff',
				'dale',
				'den',
				'falls',
				'field',
				'ford',
				'gate',
				'glen',
				'grove',
				'ham',
				'haven',
				'hill',
				'hold',
				'hollow',
				'keep',
				'ley',
				'mead',
				'mere',
				'mill',
				'moor',
				'mouth',
				'peak',
				'ridge',
				'rock',
				'shire',
				'spring',
				'stead',
				'ton',
				'vale',
				'view',
				'watch',
				'well',
				'wick',
				'wood'
			]
		}
	};

	const nameTypeOptions = [
		{ value: 'human-male', label: 'Human (Male)' },
		{ value: 'human-female', label: 'Human (Female)' },
		{ value: 'elf', label: 'Elf' },
		{ value: 'dwarf', label: 'Dwarf' },
		{ value: 'halfling', label: 'Halfling' },
		{ value: 'gnome', label: 'Gnome' },
		{ value: 'orc', label: 'Orc / Half-Orc' },
		{ value: 'tiefling', label: 'Tiefling' },
		{ value: 'dragonborn', label: 'Dragonborn' },
		{ value: 'tavern', label: 'Tavern Name' },
		{ value: 'town', label: 'Town / Village' }
	];

	let nameType = $state('human-male');
	let generatedNames = $state<string[]>([]);
	let generatedSurnames = $state<string[]>([]);
	let selectedFirstName = $state('');
	let selectedLastName = $state('');
	let nameSaveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');

	const nameTypeRace: Record<string, string> = {
		'human-male': 'a Human',
		'human-female': 'a Human',
		elf: 'an Elf',
		dwarf: 'a Dwarf',
		halfling: 'a Halfling',
		gnome: 'a Gnome',
		orc: 'an Orc',
		tiefling: 'a Tiefling',
		dragonborn: 'a Dragonborn'
	};

	async function saveNameToNotes() {
		if (!selectedFirstName) return;
		const fullName = selectedLastName
			? `${selectedFirstName} ${selectedLastName}`
			: selectedFirstName;
		const race = nameTypeRace[nameType];
		const line = `<p>Party met ${fullName}${race ? ', ' + race : ''}</p>`;
		nameSaveStatus = 'saving';
		try {
			const res = await fetch('/api/notes');
			const data: { notes: { id: string; content: string }[] } = res.ok
				? await res.json()
				: { notes: [] };
			if (data.notes.length > 0) {
				const latest = data.notes[0];
				await fetch('/api/notes', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'update', id: latest.id, content: latest.content + line })
				});
			} else {
				await fetch('/api/notes', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'create', content: line })
				});
			}
			nameSaveStatus = 'saved';
			setTimeout(() => {
				nameSaveStatus = 'idle';
			}, 2000);
		} catch {
			nameSaveStatus = 'error';
			setTimeout(() => {
				nameSaveStatus = 'idle';
			}, 2000);
		}
	}

	const surnameData: Record<string, NameDef> = {
		'human-male': {
			kind: 'compound',
			a: [
				'Ash',
				'Black',
				'Bright',
				'Brown',
				'Cross',
				'Drake',
				'Fair',
				'Gold',
				'Good',
				'Grey',
				'Hard',
				'High',
				'Iron',
				'Long',
				'Quick',
				'Red',
				'Rock',
				'Sharp',
				'Silver',
				'Stone',
				'Storm',
				'Strong',
				'Swift',
				'White',
				'Wild',
				'Wood'
			],
			b: [
				'brook',
				'burn',
				'cliff',
				'crest',
				'dale',
				'den',
				'field',
				'ford',
				'gate',
				'grove',
				'ham',
				'hill',
				'hollow',
				'marsh',
				'mead',
				'mere',
				'mill',
				'moor',
				'ridge',
				'rock',
				'shore',
				'side',
				'stead',
				'stone',
				'ton',
				'vale',
				'well',
				'wick',
				'wood'
			]
		},
		'human-female': {
			kind: 'compound',
			a: [
				'Ash',
				'Black',
				'Bright',
				'Brown',
				'Cross',
				'Drake',
				'Fair',
				'Gold',
				'Good',
				'Grey',
				'Hard',
				'High',
				'Iron',
				'Long',
				'Quick',
				'Red',
				'Rock',
				'Sharp',
				'Silver',
				'Stone',
				'Storm',
				'Strong',
				'Swift',
				'White',
				'Wild',
				'Wood'
			],
			b: [
				'brook',
				'burn',
				'cliff',
				'crest',
				'dale',
				'den',
				'field',
				'ford',
				'gate',
				'grove',
				'ham',
				'hill',
				'hollow',
				'marsh',
				'mead',
				'mere',
				'mill',
				'moor',
				'ridge',
				'rock',
				'shore',
				'side',
				'stead',
				'stone',
				'ton',
				'vale',
				'well',
				'wick',
				'wood'
			]
		},
		elf: {
			kind: 'compound',
			a: [
				'Aer',
				'Aiel',
				'Aur',
				'Cal',
				'Dawn',
				'Dusk',
				'Ever',
				'Gal',
				'Gil',
				'Golden',
				'High',
				'Lith',
				'Moon',
				'Night',
				'Silver',
				'Sol',
				'Star',
				'Sun',
				'Tal',
				'Wind'
			],
			b: [
				'bloom',
				'breeze',
				'dance',
				'dawn',
				'dream',
				'glade',
				'gleam',
				'glimmer',
				'grace',
				'leaf',
				'light',
				'mist',
				'river',
				'rose',
				'shade',
				'shimmer',
				'song',
				'star',
				'stream',
				'vale',
				'whisper',
				'wing'
			]
		},
		dwarf: {
			kind: 'compound',
			a: [
				'Anvil',
				'Axe',
				'Battle',
				'Black',
				'Coal',
				'Dark',
				'Deep',
				'Fire',
				'Flint',
				'Forge',
				'Gold',
				'Granite',
				'Grim',
				'Iron',
				'Marble',
				'Rock',
				'Rune',
				'Silver',
				'Steel',
				'Stone',
				'Thunder',
				'War'
			],
			b: [
				'anvil',
				'axe',
				'breaker',
				'crafted',
				'forge',
				'fist',
				'grim',
				'hammer',
				'hand',
				'hold',
				'mace',
				'maker',
				'peak',
				'ring',
				'shield',
				'smith',
				'stone',
				'strike'
			]
		},
		halfling: {
			kind: 'compound',
			a: [
				'Apple',
				'Berry',
				'Bright',
				'Chestnut',
				'Clover',
				'Cotton',
				'Fern',
				'Golden',
				'Green',
				'Honey',
				'Meadow',
				'Merry',
				'Oak',
				'Pebble',
				'Rose',
				'Sandy',
				'Stone',
				'Sweet',
				'Thistle',
				'Thorn',
				'Warm',
				'Wheat',
				'Willow'
			],
			b: [
				'back',
				'barn',
				'bell',
				'berry',
				'bloom',
				'bottom',
				'burrow',
				'bush',
				'cheeks',
				'den',
				'field',
				'foot',
				'ford',
				'grove',
				'hill',
				'home',
				'knoll',
				'leaf',
				'meadow',
				'mound',
				'ridge',
				'root',
				'side',
				'toes',
				'vale',
				'vine',
				'wick',
				'wood'
			]
		},
		gnome: {
			kind: 'compound',
			a: [
				'Bright',
				'Click',
				'Copper',
				'Crack',
				'Fiz',
				'Flash',
				'Flick',
				'Flint',
				'Foam',
				'Gear',
				'Glim',
				'Glint',
				'Jolt',
				'Kink',
				'Pim',
				'Pop',
				'Snap',
				'Spark',
				'Spring',
				'Tick',
				'Tink',
				'Twist',
				'Whirr',
				'Zap',
				'Zip'
			],
			b: [
				'bolt',
				'burst',
				'cog',
				'coil',
				'cork',
				'dial',
				'fizzle',
				'gadget',
				'gear',
				'grinder',
				'kettle',
				'knob',
				'lever',
				'nozzle',
				'pin',
				'pipe',
				'plug',
				'ratchet',
				'rivet',
				'screw',
				'spark',
				'spindle',
				'spring',
				'switch',
				'tick',
				'twist',
				'valve',
				'whistle',
				'widget',
				'wire',
				'wrench'
			]
		},
		orc: {
			kind: 'compound',
			a: [
				'Ash',
				'Battle',
				'Black',
				'Blood',
				'Bone',
				'Broken',
				'Claw',
				'Dark',
				'Death',
				'Fang',
				'Fire',
				'Flesh',
				'Gore',
				'Grim',
				'Iron',
				'Night',
				'Rage',
				'Red',
				'Scar',
				'Shadow',
				'Skull',
				'Steel',
				'Stone',
				'Storm',
				'Thunder',
				'War',
				'Wrath'
			],
			b: [
				'basher',
				'biter',
				'blade',
				'bone',
				'breaker',
				'cleaver',
				'crusher',
				'cutter',
				'fang',
				'fist',
				'grinder',
				'hammer',
				'hide',
				'mauler',
				'render',
				'ripper',
				'scar',
				'shatter',
				'smasher',
				'splitter',
				'stomper',
				'striker',
				'sunder',
				'tooth',
				'trampler',
				'wrecker'
			]
		},
		tiefling: {
			kind: 'compound',
			a: [
				'Bale',
				'Carn',
				'Curs',
				'Dark',
				'Death',
				'Dread',
				'Ember',
				'Flame',
				'Gloom',
				'Hell',
				'Hex',
				'Ill',
				'Mal',
				'Mire',
				'Night',
				'Pain',
				'Plague',
				'Scorn',
				'Shadow',
				'Sin',
				'Soul',
				'Spite',
				'Thorn',
				'Vex',
				'Woe',
				'Wrath'
			],
			b: [
				'bane',
				'blood',
				'born',
				'brand',
				'curse',
				'ember',
				'fire',
				'flame',
				'forge',
				'fury',
				'heart',
				'hex',
				'mark',
				'pyre',
				'rise',
				'scorn',
				'shadow',
				'smite',
				'soul',
				'spite',
				'thorn',
				'tide',
				'torch',
				'vex',
				'wake',
				'woe'
			]
		},
		dragonborn: {
			kind: 'compound',
			a: [
				'Ash',
				'Bitter',
				'Black',
				'Bone',
				'Bright',
				'Claw',
				'Cold',
				'Dark',
				'Drake',
				'Fire',
				'Flame',
				'Frost',
				'Gold',
				'Iron',
				'Night',
				'Scale',
				'Shadow',
				'Silver',
				'Smoke',
				'Storm',
				'Stone',
				'Thunder',
				'Wing'
			],
			b: [
				'ash',
				'bane',
				'bite',
				'blade',
				'born',
				'claw',
				'crest',
				'fang',
				'fire',
				'forge',
				'fury',
				'heart',
				'hide',
				'horn',
				'jaw',
				'maw',
				'rage',
				'roar',
				'scale',
				'scorn',
				'shatter',
				'shield',
				'shine',
				'snarl',
				'strike',
				'talon',
				'thunder',
				'tooth',
				'veil',
				'wrath'
			]
		}
	};

	function generateOneSurname(type: string): string {
		const def = surnameData[type];
		if (!def) return '';
		if (def.kind === 'compound') {
			const name = (def.prefix ?? '') + pickRandom(def.a) + (def.sep ?? '') + pickRandom(def.b);
			return name.charAt(0).toUpperCase() + name.slice(1);
		}
		const mid = def.mid && Math.random() < (def.midChance ?? 0.28) ? pickRandom(def.mid) : '';
		const name = pickRandom(def.pre) + mid + pickRandom(def.suf);
		return name.charAt(0).toUpperCase() + name.slice(1);
	}

	function generateSurnames() {
		generatedSurnames = Array.from({ length: 10 }, () => generateOneSurname(nameType));
	}

	// ── Weather Generator ─────────────────────────────────────────
	const seasonOptions = [
		{ value: 'spring', label: 'Spring' },
		{ value: 'summer', label: 'Summer' },
		{ value: 'autumn', label: 'Autumn' },
		{ value: 'winter', label: 'Winter' }
	];
	const biomeOptions = [
		{ value: 'forest', label: 'Forest' },
		{ value: 'plains', label: 'Plains / Grassland' },
		{ value: 'mountains', label: 'Mountains' },
		{ value: 'desert', label: 'Desert' },
		{ value: 'arctic', label: 'Arctic / Tundra' },
		{ value: 'coastal', label: 'Coastal' },
		{ value: 'swamp', label: 'Swamp / Marsh' },
		{ value: 'jungle', label: 'Jungle / Rainforest' }
	];

	// Base temperature level (0=freezing … 7=scorching) at midday
	const biomeSeasonTemp: Record<string, Record<string, number>> = {
		forest: { spring: 4, summer: 5, autumn: 3, winter: 2 },
		plains: { spring: 4, summer: 6, autumn: 3, winter: 2 },
		mountains: { spring: 3, summer: 5, autumn: 2, winter: 0 },
		desert: { spring: 6, summer: 7, autumn: 5, winter: 3 },
		arctic: { spring: 1, summer: 3, autumn: 1, winter: 0 },
		coastal: { spring: 4, summer: 5, autumn: 3, winter: 2 },
		swamp: { spring: 5, summer: 6, autumn: 4, winter: 3 },
		jungle: { spring: 6, summer: 6, autumn: 6, winter: 5 }
	};
	const tempLabels = [
		'Freezing',
		'Bitter cold',
		'Cold',
		'Cool',
		'Mild',
		'Warm',
		'Hot',
		'Scorching'
	];
	const timeOffsets: Record<string, number> = {
		dawn: -2,
		morning: -1,
		midday: 0,
		evening: -1,
		night: -2
	};

	const conditionPools: Record<string, Record<string, string[]>> = {
		forest: {
			spring: [
				'clear',
				'partly_cloudy',
				'partly_cloudy',
				'light_rain',
				'fog',
				'overcast',
				'light_rain'
			],
			summer: ['clear', 'clear', 'partly_cloudy', 'thunderstorm', 'muggy', 'light_rain'],
			autumn: ['overcast', 'light_rain', 'fog', 'partly_cloudy', 'overcast', 'heavy_rain'],
			winter: ['overcast', 'light_snow', 'clear', 'fog', 'sleet', 'light_snow']
		},
		plains: {
			spring: ['clear', 'partly_cloudy', 'thunderstorm', 'light_rain', 'overcast', 'clear'],
			summer: ['clear', 'clear', 'thunderstorm', 'partly_cloudy', 'haze'],
			autumn: ['clear', 'overcast', 'light_rain', 'fog', 'partly_cloudy'],
			winter: ['overcast', 'light_snow', 'clear', 'blizzard', 'partly_cloudy']
		},
		mountains: {
			spring: ['partly_cloudy', 'overcast', 'light_snow', 'light_rain', 'clear', 'fog'],
			summer: ['clear', 'partly_cloudy', 'thunderstorm', 'clear', 'overcast'],
			autumn: ['overcast', 'heavy_snow', 'sleet', 'fog', 'clear', 'light_snow'],
			winter: ['blizzard', 'heavy_snow', 'overcast', 'clear', 'blizzard']
		},
		desert: {
			spring: ['clear', 'clear', 'sandstorm', 'partly_cloudy', 'clear', 'haze'],
			summer: ['clear', 'clear', 'sandstorm', 'haze', 'clear', 'thunderstorm'],
			autumn: ['clear', 'clear', 'sandstorm', 'partly_cloudy', 'haze'],
			winter: ['clear', 'partly_cloudy', 'overcast', 'light_rain', 'clear']
		},
		arctic: {
			spring: ['overcast', 'light_snow', 'blizzard', 'partly_cloudy', 'fog'],
			summer: ['clear', 'partly_cloudy', 'fog', 'light_rain', 'overcast'],
			autumn: ['overcast', 'heavy_snow', 'blizzard', 'fog', 'light_snow'],
			winter: ['blizzard', 'heavy_snow', 'overcast', 'clear', 'blizzard']
		},
		coastal: {
			spring: ['partly_cloudy', 'fog', 'light_rain', 'overcast', 'clear', 'strong_wind'],
			summer: ['clear', 'partly_cloudy', 'fog', 'clear', 'thunderstorm'],
			autumn: ['overcast', 'heavy_rain', 'fog', 'thunderstorm', 'partly_cloudy'],
			winter: ['overcast', 'heavy_rain', 'fog', 'sleet', 'clear']
		},
		swamp: {
			spring: ['fog', 'light_rain', 'overcast', 'muggy', 'partly_cloudy', 'fog'],
			summer: ['muggy', 'heavy_rain', 'thunderstorm', 'fog', 'overcast'],
			autumn: ['fog', 'overcast', 'light_rain', 'muggy', 'heavy_rain'],
			winter: ['fog', 'overcast', 'sleet', 'cold_rain', 'partly_cloudy']
		},
		jungle: {
			spring: ['heavy_rain', 'light_rain', 'muggy', 'partly_cloudy', 'thunderstorm'],
			summer: ['heavy_rain', 'thunderstorm', 'muggy', 'overcast', 'heavy_rain'],
			autumn: ['heavy_rain', 'muggy', 'partly_cloudy', 'thunderstorm', 'overcast'],
			winter: ['light_rain', 'muggy', 'partly_cloudy', 'overcast', 'light_rain']
		}
	};

	type SlotTexts = {
		dawn: string;
		morning: string;
		midday: string;
		evening: string;
		night: string;
	};
	const conditionSlots: Record<string, SlotTexts> = {
		clear: {
			dawn: '☀️ Clear, stars fading',
			morning: '☀️ Bright sunshine',
			midday: '☀️ Clear blue skies',
			evening: '☀️ Golden hour',
			night: '✨ Clear, starry sky'
		},
		partly_cloudy: {
			dawn: '⛅ Thin clouds at sunrise',
			morning: '⛅ Partly cloudy',
			midday: '⛅ Partly cloudy',
			evening: '⛅ Drifting clouds',
			night: '⛅ Patchy clouds'
		},
		overcast: {
			dawn: '☁️ Leaden skies',
			morning: '☁️ Overcast',
			midday: '☁️ Heavy cloud cover',
			evening: '☁️ Dark and overcast',
			night: '☁️ No stars visible'
		},
		light_rain: {
			dawn: '🌦 Light drizzle',
			morning: '🌦 Patchy showers',
			midday: '🌦 Steady drizzle',
			evening: '🌧 Light rain',
			night: '🌧 Drizzle overnight'
		},
		heavy_rain: {
			dawn: '🌧 Heavy rain',
			morning: '🌧 Downpour',
			midday: '🌧 Persistent heavy rain',
			evening: '🌧 Sheets of rain',
			night: '🌧 Relentless rain'
		},
		thunderstorm: {
			dawn: '⛈ Distant thunder',
			morning: '⛈ Storm building',
			midday: '⛈ Thunderstorm',
			evening: '⛈ Violent storm',
			night: '⛈ Thunder and lightning'
		},
		fog: {
			dawn: '🌫 Dense fog',
			morning: '🌫 Fog lifting slowly',
			midday: '🌫 Patchy fog',
			evening: '🌫 Mist rolling in',
			night: '🌫 Thick fog'
		},
		light_snow: {
			dawn: '🌨 Dusting of snow',
			morning: '🌨 Light flurries',
			midday: '🌨 Light snowfall',
			evening: '🌨 Snowflakes drifting',
			night: '❄️ Light snow overnight'
		},
		heavy_snow: {
			dawn: '❄️ Heavy snow',
			morning: '❄️ Thick snowfall',
			midday: '❄️ Heavy snowstorm',
			evening: '❄️ Blinding snow',
			night: '❄️ Deep snow falling'
		},
		blizzard: {
			dawn: '❄️ Blizzard conditions',
			morning: '❄️ Whiteout',
			midday: '❄️ Blizzard, zero vis.',
			evening: '❄️ Raging blizzard',
			night: '❄️ Blizzard raging'
		},
		sleet: {
			dawn: '🌧 Icy sleet',
			morning: '🌧 Sleet and rain',
			midday: '🌧 Sleet',
			evening: '❄️ Sleet turning to snow',
			night: '❄️ Frozen sleet'
		},
		sandstorm: {
			dawn: '🏜️ Dust rising',
			morning: '🏜️ Sandstorm building',
			midday: '🏜️ Full sandstorm',
			evening: '🏜️ Sand gusts',
			night: '🏜️ Gritty winds'
		},
		haze: {
			dawn: '🌅 Hazy dawn',
			morning: '☀️ Hazy sunshine',
			midday: '☀️ Scorching haze',
			evening: '🌅 Hazy sunset',
			night: '⛅ Hazy night sky'
		},
		muggy: {
			dawn: '💧 Muggy and damp',
			morning: '💧 Humid, oppressive',
			midday: '💧 Stifling heat',
			evening: '⛈ Muggy, storms brewing',
			night: '💧 Hot and humid'
		},
		strong_wind: {
			dawn: '💨 Gusty winds',
			morning: '💨 Strong coastal winds',
			midday: '💨 Powerful gusts',
			evening: '💨 Howling wind',
			night: '💨 Gale-force winds'
		},
		cold_rain: {
			dawn: '🌧 Cold grey rain',
			morning: '🌧 Frigid drizzle',
			midday: '🌧 Cold steady rain',
			evening: '🌧 Bone-chilling rain',
			night: '🌧 Cold rain'
		}
	};

	const conditionBg: Record<string, string> = {
		clear: 'bg-amber-950/20',
		partly_cloudy: 'bg-gray-800/40',
		overcast: 'bg-gray-900/60',
		light_rain: 'bg-blue-950/40',
		heavy_rain: 'bg-blue-950/60',
		thunderstorm: 'bg-indigo-950/60',
		fog: 'bg-gray-800/60',
		light_snow: 'bg-slate-800/50',
		heavy_snow: 'bg-slate-800/70',
		blizzard: 'bg-slate-900/80',
		sleet: 'bg-slate-800/50',
		sandstorm: 'bg-amber-900/40',
		haze: 'bg-amber-900/30',
		muggy: 'bg-green-950/40',
		strong_wind: 'bg-gray-800/40',
		cold_rain: 'bg-blue-950/40'
	};

	const windByCondition: Record<string, string[]> = {
		thunderstorm: ['Strong wind', 'Gusting', 'Gale'],
		blizzard: ['Gale', 'Howling gale', 'Strong wind'],
		sandstorm: ['Strong wind', 'Gusting', 'Gale'],
		heavy_rain: ['Moderate wind', 'Strong wind', 'Gusting'],
		strong_wind: ['Strong wind', 'Gusting', 'Gale'],
		clear: ['Calm', 'Calm', 'Light breeze'],
		fog: ['Calm', 'Calm', 'Light breeze'],
		haze: ['Calm', 'Calm', 'Light breeze']
	};
	const defaultWindPool = [
		'Calm',
		'Light breeze',
		'Light breeze',
		'Moderate wind',
		'Moderate wind',
		'Strong wind'
	];

	const weatherDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const weatherTimeSlots = ['dawn', 'morning', 'midday', 'evening', 'night'] as const;
	const timeSlotLabels: Record<string, string> = {
		dawn: 'Dawn',
		morning: 'Morning',
		midday: 'Midday',
		evening: 'Evening',
		night: 'Night'
	};

	type WeatherSlot = { sky: string; temp: string; wind: string; condition: string };
	type DayWeather = { day: string; slots: Record<string, WeatherSlot> };

	let selectedSeason = $state('spring');
	let selectedBiome = $state('forest');
	let weekWeather = $state<DayWeather[]>([]);

	const biomePaceData: Record<string, { mult: number; reason: string }> = {
		forest: { mult: 0.75, reason: 'Dense undergrowth, no roads' },
		plains: { mult: 1.0, reason: 'Open ground' },
		mountains: { mult: 0.5, reason: 'Steep terrain and altitude' },
		desert: { mult: 0.75, reason: 'Sand, heat, no trails' },
		arctic: { mult: 0.75, reason: 'Snow, ice, and cold' },
		coastal: { mult: 1.0, reason: 'Open shoreline' },
		swamp: { mult: 0.5, reason: 'Deep mud and water crossings' },
		jungle: { mult: 0.5, reason: 'Thick vegetation, no trails' }
	};
	const seasonPaceData: Record<string, { mult: number; reason: string }> = {
		spring: { mult: 0.9, reason: 'Muddy trails and spring floods' },
		summer: { mult: 1.0, reason: 'Clear conditions' },
		autumn: { mult: 0.95, reason: 'Wet ground and shortening days' },
		winter: { mult: 0.75, reason: 'Snow, ice, and bitter cold' }
	};
	const paceMult = $derived(
		(biomePaceData[selectedBiome]?.mult ?? 1) * (seasonPaceData[selectedSeason]?.mult ?? 1)
	);
	const biomeMult = $derived(biomePaceData[selectedBiome]?.mult ?? 1);
	const seasonMult = $derived(seasonPaceData[selectedSeason]?.mult ?? 1);
	const biomeReason = $derived(biomePaceData[selectedBiome]?.reason ?? '');
	const seasonReason = $derived(seasonPaceData[selectedSeason]?.reason ?? '');
	const paceRows = $derived([
		[
			'Fast',
			'400 ft/min',
			(4 * paceMult).toFixed(1) + ' mph',
			Math.round(30 * paceMult) + ' miles',
			'−5 to passive Perception; cannot use Stealth'
		],
		[
			'Normal',
			'300 ft/min',
			(3 * paceMult).toFixed(1) + ' mph',
			Math.round(24 * paceMult) + ' miles',
			'No effect'
		],
		[
			'Slow',
			'200 ft/min',
			(2 * paceMult).toFixed(1) + ' mph',
			Math.round(18 * paceMult) + ' miles',
			'Can move stealthily; able to forage while traveling'
		]
	] as [string, string, string, string, string][]);

	function clamp(n: number, lo: number, hi: number) {
		return Math.max(lo, Math.min(hi, n));
	}

	function generateWeek() {
		const baseTemp = biomeSeasonTemp[selectedBiome]?.[selectedSeason] ?? 4;
		const pool = conditionPools[selectedBiome]?.[selectedSeason] ?? [
			'clear',
			'partly_cloudy',
			'overcast'
		];
		const result: DayWeather[] = [];
		let frontCondition = pickRandom(pool);
		let frontDaysLeft = Math.floor(Math.random() * 3) + 1;
		for (const day of weatherDays) {
			if (frontDaysLeft <= 0) {
				frontCondition = pickRandom(pool);
				frontDaysLeft = Math.floor(Math.random() * 3) + 1;
			}
			frontDaysLeft--;
			const slots: Record<string, WeatherSlot> = {};
			for (const t of weatherTimeSlots) {
				const condition = Math.random() < 0.18 ? pickRandom(pool) : frontCondition;
				const slotTexts = conditionSlots[condition] ?? conditionSlots['clear'];
				const sky = slotTexts[t];
				const tempIdx = clamp(baseTemp + (timeOffsets[t] ?? 0), 0, 7);
				const temp = tempLabels[tempIdx];
				const wPool = windByCondition[condition] ?? defaultWindPool;
				const wind = pickRandom(wPool);
				slots[t] = { sky, temp, wind, condition };
			}
			result.push({ day, slots });
		}
		weekWeather = result;
	}

	function pickRandom<T>(arr: T[]): T {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	function generateOneName(type: string): string {
		const def = nameData[type];
		if (!def) return '';
		if (def.kind === 'compound') {
			return (def.prefix ?? '') + pickRandom(def.a) + (def.sep ?? '') + pickRandom(def.b);
		}
		const mid = def.mid && Math.random() < (def.midChance ?? 0.28) ? pickRandom(def.mid) : '';
		const name = pickRandom(def.pre) + mid + pickRandom(def.suf);
		return name.charAt(0).toUpperCase() + name.slice(1);
	}

	// ── Shop Generator ──────────────────────────────────────────────────────────────────────
	type ShopItemDef = { name: string; price: number; rarity?: string };
	const shopData: Record<string, { label: string; items: ShopItemDef[] }> = {
		general: {
			label: 'General Store',
			items: [
				{ name: 'Torch', price: 0.01 },
				{ name: 'Rations (1 day)', price: 0.5 },
				{ name: 'Rope, hempen (50 ft)', price: 1 },
				{ name: 'Waterskin', price: 0.2 },
				{ name: 'Lantern, hooded', price: 5 },
				{ name: 'Oil (flask)', price: 0.1 },
				{ name: 'Bedroll', price: 1 },
				{ name: 'Backpack', price: 2 },
				{ name: 'Tinderbox', price: 0.5 },
				{ name: 'Crowbar', price: 2 },
				{ name: 'Hammer', price: 1 },
				{ name: 'Pot, iron', price: 2 },
				{ name: 'Shovel', price: 2 },
				{ name: 'Tent (2-person)', price: 2 },
				{ name: 'Mirror, steel', price: 5 },
				{ name: 'Blanket', price: 0.5 },
				{ name: 'Grappling hook', price: 2 },
				{ name: 'Candle (10)', price: 0.1 },
				{ name: 'Chalk (10 pieces)', price: 0.1 },
				{ name: 'Soap', price: 0.02 },
				{ name: 'Sack', price: 0.01 },
				{ name: 'Ball bearings (bag)', price: 1 },
				{ name: 'Signal whistle', price: 0.05 },
				{ name: 'Block and tackle', price: 1 }
			]
		},
		weapon: {
			label: 'Weaponsmith',
			items: [
				{ name: 'Dagger', price: 2 },
				{ name: 'Handaxe', price: 5 },
				{ name: 'Shortsword', price: 10 },
				{ name: 'Longsword', price: 15 },
				{ name: 'Battleaxe', price: 10 },
				{ name: 'Greatsword', price: 50 },
				{ name: 'Greataxe', price: 30 },
				{ name: 'Mace', price: 5 },
				{ name: 'Warhammer', price: 15 },
				{ name: 'Spear', price: 1 },
				{ name: 'Javelin', price: 0.5 },
				{ name: 'Light hammer', price: 2 },
				{ name: 'Quarterstaff', price: 0.2 },
				{ name: 'Pike', price: 5 },
				{ name: 'Rapier', price: 25 },
				{ name: 'Flail', price: 10 },
				{ name: 'Trident', price: 5 },
				{ name: 'Whip', price: 2 },
				{ name: 'Arrows (20)', price: 1 },
				{ name: 'Crossbow bolts (20)', price: 1 },
				{ name: 'Whetstone', price: 0.01 }
			]
		},
		armor: {
			label: 'Armorer',
			items: [
				{ name: 'Padded armor', price: 5 },
				{ name: 'Leather armor', price: 10 },
				{ name: 'Studded leather', price: 45 },
				{ name: 'Ring mail', price: 30 },
				{ name: 'Chain shirt', price: 50 },
				{ name: 'Scale mail', price: 50 },
				{ name: 'Chain mail', price: 75 },
				{ name: 'Breastplate', price: 400 },
				{ name: 'Half plate', price: 750 },
				{ name: 'Shield', price: 10 },
				{ name: 'Helmet', price: 10 },
				{ name: 'Gauntlets', price: 5 },
				{ name: 'Greaves', price: 10 },
				{ name: 'Vambrace (pair)', price: 8 }
			]
		},
		alchemist: {
			label: 'Alchemist',
			items: [
				{ name: 'Potion of Healing', price: 50 },
				{ name: 'Antitoxin', price: 50 },
				{ name: 'Acid (vial)', price: 25 },
				{ name: "Alchemist's fire", price: 50 },
				{ name: 'Holy water (flask)', price: 25 },
				{ name: "Healer's kit", price: 5 },
				{ name: 'Vial (empty)', price: 1 },
				{ name: 'Perfume (vial)', price: 5 },
				{ name: 'Poison, basic (vial)', price: 100 },
				{ name: 'Potion of Climbing', price: 75 },
				{ name: 'Ink (1 oz)', price: 10 },
				{ name: 'Candle (10)', price: 0.1 },
				{ name: 'Soap', price: 0.02 },
				{ name: 'Smokestick', price: 10 },
				{ name: 'Oil of Slipperiness', price: 150 }
			]
		},
		magic: {
			label: 'Magic Shop',
			items: [
				{ name: 'Spell Scroll (cantrip)', price: 25 },
				{ name: 'Spell Scroll (1st level)', price: 75 },
				{ name: 'Spell Scroll (2nd level)', price: 150 },
				{ name: 'Spell Scroll (3rd level)', price: 300 },
				{ name: 'Potion of Healing', price: 50 },
				{ name: 'Potion of Greater Healing', price: 150 },
				{ name: 'Component pouch', price: 25 },
				{ name: 'Arcane focus (crystal)', price: 10 },
				{ name: 'Arcane focus (orb)', price: 20 },
				{ name: 'Arcane focus (wand)', price: 10 },
				{ name: 'Spellbook (blank)', price: 50 },
				{ name: 'Holy symbol (amulet)', price: 5 },
				{ name: 'Druidic focus (staff)', price: 5 },
				{ name: 'Pearl (spell component)', price: 100 },
				{ name: 'Diamond dust (per oz)', price: 300 },
				{ name: 'Identify (service)', price: 20 }
			]
		},
		jeweler: {
			label: 'Jeweler',
			items: [
				{ name: 'Copper bracelet', price: 5 },
				{ name: 'Silver ring', price: 10 },
				{ name: 'Silver necklace', price: 15 },
				{ name: 'Gold ring', price: 25 },
				{ name: 'Onyx pendant', price: 30 },
				{ name: 'Pearl earrings', price: 50 },
				{ name: 'Garnet brooch', price: 60 },
				{ name: 'Jade bracelet', price: 75 },
				{ name: 'Amethyst ring', price: 80 },
				{ name: 'Topaz earrings', price: 90 },
				{ name: 'Sapphire pendant', price: 100 },
				{ name: 'Opal amulet', price: 120 },
				{ name: 'Ruby brooch', price: 150 },
				{ name: 'Emerald necklace', price: 200 },
				{ name: 'Diamond stud', price: 200 }
			]
		},
		tavern: {
			label: 'Tavern & Inn',
			items: [
				{ name: 'Ale (mug)', price: 0.04 },
				{ name: 'Ale (gallon)', price: 0.2 },
				{ name: 'Wine, common (pitcher)', price: 0.2 },
				{ name: 'Wine, fine (bottle)', price: 10 },
				{ name: 'Mead (mug)', price: 0.05 },
				{ name: 'Meal, poor', price: 0.03 },
				{ name: 'Meal, modest', price: 0.3 },
				{ name: 'Meal, fine', price: 5 },
				{ name: 'Room, poor (per night)', price: 0.1 },
				{ name: 'Room, modest (per night)', price: 0.5 },
				{ name: 'Room, comfortable (per night)', price: 2 },
				{ name: 'Stabling (per night)', price: 0.5 },
				{ name: 'Bread, loaf', price: 0.02 },
				{ name: 'Meat, chunk', price: 0.03 },
				{ name: 'Pipe tobacco (pouch)', price: 0.5 }
			]
		},
		book: {
			label: 'Bookshop',
			items: [
				{ name: 'Common book', price: 25 },
				{ name: 'History tome', price: 100 },
				{ name: 'Rare tome', price: 250 },
				{ name: 'Blank journal', price: 10 },
				{ name: 'Ink (1 oz)', price: 10 },
				{ name: 'Ink pen', price: 0.02 },
				{ name: 'Paper (sheet)', price: 0.02 },
				{ name: 'Parchment (sheet)', price: 0.01 },
				{ name: 'Scroll case', price: 1 },
				{ name: 'Map, local area', price: 5 },
				{ name: 'Map, regional', price: 20 },
				{ name: 'Spellbook (blank)', price: 50 },
				{ name: 'Sealing wax', price: 0.05 },
				{ name: 'Star chart', price: 30 }
			]
		},
		herbalist: {
			label: 'Herbalist',
			items: [
				{ name: "Healer's kit", price: 5 },
				{ name: 'Healing salve (minor)', price: 10 },
				{ name: 'Potion of Healing', price: 50 },
				{ name: 'Antitoxin', price: 50 },
				{ name: 'Common herbs (bundle)', price: 0.5 },
				{ name: 'Rare herb (single)', price: 15 },
				{ name: 'Fever bark (strip)', price: 2 },
				{ name: 'Sleep dust (pinch)', price: 5 },
				{ name: 'Wound poultice', price: 3 },
				{ name: 'Dried mushrooms (bundle)', price: 0.5 },
				{ name: 'Eye drops, clarity', price: 8 },
				{ name: 'Calming draught', price: 6 },
				{ name: 'Fortifying tea (pouch)', price: 1 },
				{ name: 'Breath tonic (vial)', price: 4 }
			]
		},
		fletcher: {
			label: 'Fletcher & Bowyer',
			items: [
				{ name: 'Shortbow', price: 25 },
				{ name: 'Longbow', price: 50 },
				{ name: 'Hand crossbow', price: 75 },
				{ name: 'Light crossbow', price: 25 },
				{ name: 'Heavy crossbow', price: 50 },
				{ name: 'Arrows (20)', price: 1 },
				{ name: 'Crossbow bolts (20)', price: 1 },
				{ name: 'Blowgun', price: 10 },
				{ name: 'Blowgun needles (50)', price: 1 },
				{ name: 'Quiver', price: 1 },
				{ name: 'Net', price: 1 },
				{ name: 'Sling', price: 0.1 },
				{ name: 'Sling bullets (20)', price: 0.04 },
				{ name: 'Arrow (silvered)', price: 25 },
				{ name: 'Bowstring (replacement)', price: 0.5 }
			]
		},
		stable: {
			label: 'Stable',
			items: [
				{ name: 'Riding horse', price: 75 },
				{ name: 'Draft horse', price: 50 },
				{ name: 'Warhorse', price: 400 },
				{ name: 'Pony', price: 30 },
				{ name: 'Donkey / Mule', price: 8 },
				{ name: 'Mastiff (guard dog)', price: 25 },
				{ name: 'Saddle, riding', price: 10 },
				{ name: 'Saddle, military', price: 20 },
				{ name: 'Saddle, pack', price: 5 },
				{ name: 'Saddlebags', price: 4 },
				{ name: 'Cart', price: 15 },
				{ name: 'Wagon', price: 35 },
				{ name: 'Bit and bridle', price: 2 },
				{ name: 'Horseshoes (set)', price: 1 },
				{ name: 'Feed (per day)', price: 0.05 }
			]
		}
	};
	const affluenceData: Record<string, { label: string; mult: number; note: string }> = {
		impoverished: { label: 'Impoverished', mult: 0.6, note: 'Scarce goods, desperate prices' },
		poor: { label: 'Poor', mult: 0.8, note: 'Below-market, worn stock' },
		common: { label: 'Common', mult: 1.0, note: 'Standard market prices' },
		prosperous: { label: 'Prosperous', mult: 1.3, note: 'Good selection, modest markup' },
		wealthy: { label: 'Wealthy', mult: 1.6, note: 'Premium stock and pricing' },
		opulent: { label: 'Opulent', mult: 2.2, note: 'Luxury goods, high-end market' }
	};
	const shopItemCount: Record<string, [number, number]> = {
		impoverished: [4, 6],
		poor: [6, 9],
		common: [8, 12],
		prosperous: [10, 14],
		wealthy: [12, 16],
		opulent: [14, 18]
	};
	let shopType = $state('general');
	let shopAffluence = $state('common');
	let shopSaveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');

	async function saveShopToNotes() {
		if (!generatedShopName) return;
		const aff = affluenceData[shopAffluence]?.label.toLowerCase() ?? shopAffluence;
		const type = shopData[shopType]?.label.toLowerCase() ?? shopType;
		const line = `<p>The party went to ${generatedShopName}, a ${aff} ${type}</p>`;
		shopSaveStatus = 'saving';
		try {
			const res = await fetch('/api/notes');
			const data: { notes: { id: string; content: string }[] } = res.ok
				? await res.json()
				: { notes: [] };
			if (data.notes.length > 0) {
				const latest = data.notes[0];
				await fetch('/api/notes', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'update', id: latest.id, content: latest.content + line })
				});
			} else {
				await fetch('/api/notes', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'create', content: line })
				});
			}
			shopSaveStatus = 'saved';
			setTimeout(() => {
				shopSaveStatus = 'idle';
			}, 2000);
		} catch {
			shopSaveStatus = 'error';
			setTimeout(() => {
				shopSaveStatus = 'idle';
			}, 2000);
		}
	}
	type ShopRow = {
		name: string;
		liked: string;
		neutral: string;
		disliked: string;
		rarity?: string;
	};
	let generatedShop = $state<ShopRow[]>([]);
	function formatPrice(gp: number): string {
		if (gp < 0.1) return Math.max(1, Math.round(gp * 100)) + ' cp';
		if (gp < 1) return Math.max(1, Math.round(gp * 10)) + ' sp';
		if (gp < 10) {
			const r = Math.round(gp * 2) / 2;
			return r + ' gp';
		}
		if (gp < 100) return Math.round(gp) + ' gp';
		return Math.round(gp / 5) * 5 + ' gp';
	}
	const shopNames: Record<string, string[]> = {
		general: [
			'The Rusty Anchor',
			'The Golden Sack',
			'The Wandering Barrel',
			'The Old Compass',
			'The Dusty Lantern',
			'The Humble Wagon',
			'The Cracked Pot',
			'The Mended Sack',
			'The Traveling Post',
			'The Wayfarers Nook'
		],
		weapon: [
			'The Iron Edge',
			'The Steel Fang',
			"Grimshaw's Forge",
			'The Sharpened Thorn',
			'The Crimson Anvil',
			'The Forged Blade',
			'Ironclad Arms',
			'The Broken Axe',
			'The Tempered Steel',
			'Bloodmetal Smithy'
		],
		armor: [
			'The Iron Shell',
			'The Plated Boar',
			'Stonehide Armory',
			'The Gilded Guard',
			'The Dented Pauldron',
			'The Buckled Shield',
			'Ironwall Armory',
			'The Crestfallen Forge',
			'The Hammered Plate',
			'Steelbark Armory'
		],
		alchemist: [
			'The Frothing Flask',
			"Mirabelle's Mixtures",
			'The Crackling Vial',
			'The Amber Tincture',
			'Fumes & Fortunes',
			'The Bubbling Cauldron',
			'The Murky Draught',
			'The Unstable Mixture',
			'Ashwick Alchemy',
			'The Simmering Still'
		],
		magic: [
			'The Arcane Alcove',
			'Whispers & Wonders',
			'The Gilded Grimoire',
			'The Shimmering Shelf',
			'Starfall Curios',
			'The Mystic Emporium',
			'The Hidden Sigil',
			'The Silver Rune',
			'The Woven Veil',
			'The Enchanted Threshold'
		],
		jeweler: [
			'The Glittering Gem',
			"Aurelia's Jewels",
			'The Burnished Clasp',
			'The Faceted Crown',
			'The Gilded Locket',
			'Stoneset & Sons',
			'The Sparkling Vein',
			'The Polished Stone',
			'The Diamond Needle',
			'The Golden Finger'
		],
		tavern: [
			'The Prancing Pony',
			'The Drunken Dragon',
			'The Salted Flagon',
			'The Wandering Bard',
			'The Crooked Tankard',
			'The Roaring Hearth',
			'The Tipped Goblet',
			'The Muddy Boot',
			'The Warm Ember',
			'The Gilded Tap'
		],
		book: [
			'The Inky Quill',
			'The Cracked Spine',
			'Vellum & Verse',
			'The Dusty Shelf',
			'The Worn Binding',
			'The Scribed Page',
			'The Faded Tome',
			'The Illuminated Letter',
			'The Paper & Pen',
			'The Chronicle Nook'
		],
		herbalist: [
			'The Green Thumb',
			'The Twisted Root',
			'Briar & Bloom',
			'The Dried Bundle',
			'The Mossy Hollow',
			'The Morning Dew',
			'The Herb & Hearth',
			'The Sprig & Spore',
			'Thornwood Remedies',
			'The Wilting Petal'
		],
		fletcher: [
			'The True Arrow',
			'The Split Shaft',
			'The Quivering Reed',
			'The Notched Bow',
			'The Feathered Flight',
			'Hawkseye Bowery',
			'The Bent Limb',
			'The Taut String',
			'The Iron Nock',
			'Swiftwind Fletching'
		],
		stable: [
			'The Iron Shoe',
			'The Mossy Trough',
			'The Snorting Mare',
			'Brindleback Stables',
			'The Gilded Bridle',
			'The Dusty Saddle',
			'The Warm Stall',
			'The Broken Spur',
			'Swiftfoot Stables',
			'The Clover Patch'
		]
	};
	const rarityColors: Record<string, string> = {
		common: 'text-green-400',
		uncommon: 'text-teal-400',
		rare: 'text-blue-400',
		very_rare: 'text-purple-400',
		legendary: 'text-amber-400'
	};
	const rarityLabels: Record<string, string> = {
		common: 'Common',
		uncommon: 'Uncommon',
		rare: 'Rare',
		very_rare: 'Very Rare',
		legendary: 'Legendary'
	};
	// Magic item pools per shop type, keyed by rarity
	const shopMagicItems: Record<string, ShopItemDef[]> = {
		general: [
			{ name: 'Cloak of Billowing', price: 75, rarity: 'common' },
			{ name: 'Rope of Mending', price: 75, rarity: 'common' },
			{ name: 'Bead of Nourishment', price: 50, rarity: 'common' },
			{ name: 'Pipe of Smoke Monsters', price: 75, rarity: 'common' },
			{ name: 'Sending Stones (pair)', price: 250, rarity: 'uncommon' },
			{ name: 'Immovable Rod', price: 350, rarity: 'uncommon' },
			{ name: 'Bag of Holding', price: 450, rarity: 'uncommon' }
		],
		weapon: [
			{ name: 'Moon-Touched Sword', price: 75, rarity: 'common' },
			{ name: 'Silvered Weapon', price: 100, rarity: 'common' },
			{ name: '+1 Dagger', price: 250, rarity: 'uncommon' },
			{ name: '+1 Shortsword', price: 300, rarity: 'uncommon' },
			{ name: '+1 Longsword', price: 350, rarity: 'uncommon' },
			{ name: '+1 Battleaxe', price: 350, rarity: 'uncommon' },
			{ name: 'Sword of Life Stealing', price: 2500, rarity: 'rare' },
			{ name: 'Sword of Wounding', price: 2500, rarity: 'rare' },
			{ name: 'Flame Tongue', price: 3000, rarity: 'rare' },
			{ name: 'Frost Brand', price: 3500, rarity: 'rare' },
			{ name: '+2 Longsword', price: 4000, rarity: 'rare' },
			{ name: '+3 Longsword', price: 20000, rarity: 'very_rare' },
			{ name: 'Sword of Sharpness', price: 25000, rarity: 'very_rare' },
			{ name: 'Holy Avenger', price: 75000, rarity: 'legendary' },
			{ name: 'Vorpal Sword', price: 75000, rarity: 'legendary' }
		],
		armor: [
			{ name: '+1 Shield', price: 250, rarity: 'uncommon' },
			{ name: '+1 Leather Armor', price: 300, rarity: 'uncommon' },
			{ name: '+1 Chain Mail', price: 350, rarity: 'uncommon' },
			{ name: 'Adamantine Armor', price: 400, rarity: 'uncommon' },
			{ name: 'Mithral Armor', price: 450, rarity: 'uncommon' },
			{ name: '+2 Shield', price: 2500, rarity: 'rare' },
			{ name: '+2 Breastplate', price: 3000, rarity: 'rare' },
			{ name: 'Armor of Resistance', price: 3000, rarity: 'rare' },
			{ name: '+3 Plate Armor', price: 20000, rarity: 'very_rare' },
			{ name: 'Armor of Invulnerability', price: 75000, rarity: 'legendary' }
		],
		alchemist: [
			{ name: 'Potion of Healing (Greater)', price: 150, rarity: 'uncommon' },
			{ name: 'Potion of Fire Breath', price: 150, rarity: 'uncommon' },
			{ name: 'Potion of Invisibility', price: 180, rarity: 'uncommon' },
			{ name: 'Potion of Resistance', price: 200, rarity: 'uncommon' },
			{ name: 'Potion of Water Breathing', price: 200, rarity: 'uncommon' },
			{ name: 'Potion of Healing (Superior)', price: 500, rarity: 'rare' },
			{ name: 'Potion of Invulnerability', price: 1000, rarity: 'rare' },
			{ name: 'Potion of Mind Control', price: 1500, rarity: 'rare' },
			{ name: 'Potion of Healing (Supreme)', price: 5000, rarity: 'very_rare' },
			{ name: 'Potion of Storm Giant Strength', price: 25000, rarity: 'legendary' }
		],
		magic: [
			{ name: 'Clockwork Amulet', price: 75, rarity: 'common' },
			{ name: 'Hat of Disguise', price: 75, rarity: 'common' },
			{ name: 'Wand of Spark', price: 75, rarity: 'common' },
			{ name: 'Bag of Holding', price: 450, rarity: 'uncommon' },
			{ name: 'Boots of Elvenkind', price: 300, rarity: 'uncommon' },
			{ name: 'Cloak of Elvenkind', price: 300, rarity: 'uncommon' },
			{ name: 'Helm of Comprehending Languages', price: 300, rarity: 'uncommon' },
			{ name: 'Pearl of Power', price: 400, rarity: 'uncommon' },
			{ name: 'Ring of Feather Falling', price: 350, rarity: 'uncommon' },
			{ name: 'Wand of Magic Missiles', price: 350, rarity: 'uncommon' },
			{ name: 'Wand of Web', price: 300, rarity: 'uncommon' },
			{ name: 'Winged Boots', price: 450, rarity: 'uncommon' },
			{ name: 'Bag of Tricks (Grey)', price: 750, rarity: 'uncommon' },
			{ name: 'Necklace of Fireballs', price: 1500, rarity: 'rare' },
			{ name: 'Ring of Evasion', price: 2000, rarity: 'rare' },
			{ name: 'Ring of Protection', price: 2000, rarity: 'rare' },
			{ name: 'Ring of the Ram', price: 2500, rarity: 'rare' },
			{ name: 'Staff of Healing', price: 3000, rarity: 'rare' },
			{ name: 'Staff of Fire', price: 4000, rarity: 'rare' },
			{ name: 'Wand of Fireballs', price: 3000, rarity: 'rare' },
			{ name: 'Wand of Lightning Bolts', price: 3000, rarity: 'rare' },
			{ name: 'Portable Hole', price: 4000, rarity: 'rare' },
			{ name: 'Amulet of the Planes', price: 10000, rarity: 'very_rare' },
			{ name: 'Carpet of Flying', price: 15000, rarity: 'very_rare' },
			{ name: 'Crystal Ball', price: 25000, rarity: 'very_rare' },
			{ name: 'Robe of Eyes', price: 20000, rarity: 'very_rare' },
			{ name: 'Staff of the Magi', price: 40000, rarity: 'very_rare' },
			{ name: 'Wand of Polymorph', price: 30000, rarity: 'very_rare' },
			{ name: 'Deck of Many Things', price: 75000, rarity: 'legendary' },
			{ name: 'Ring of Three Wishes', price: 75000, rarity: 'legendary' },
			{ name: 'Sphere of Annihilation', price: 75000, rarity: 'legendary' }
		],
		jeweler: [
			{ name: 'Amulet of Proof vs. Detection', price: 300, rarity: 'uncommon' },
			{ name: 'Periapt of Health', price: 300, rarity: 'uncommon' },
			{ name: 'Ring of Mind Shielding', price: 350, rarity: 'uncommon' },
			{ name: 'Ring of Swimming', price: 300, rarity: 'uncommon' },
			{ name: 'Necklace of Adaptation', price: 400, rarity: 'uncommon' },
			{ name: 'Ring of Evasion', price: 2000, rarity: 'rare' },
			{ name: 'Ring of Protection', price: 2000, rarity: 'rare' },
			{ name: 'Periapt of Wound Closure', price: 2500, rarity: 'uncommon' },
			{ name: 'Amulet of Health', price: 2500, rarity: 'rare' },
			{ name: 'Ring of Regeneration', price: 20000, rarity: 'very_rare' },
			{ name: 'Ring of Spell Storing', price: 25000, rarity: 'very_rare' }
		],
		tavern: [
			{ name: 'Tankard of Sobriety', price: 75, rarity: 'common' },
			{ name: 'Bead of Nourishment', price: 50, rarity: 'common' },
			{ name: 'Pipe of Smoke Monsters', price: 75, rarity: 'common' },
			{ name: 'Sending Stones (pair)', price: 250, rarity: 'uncommon' }
		],
		book: [
			{ name: 'Spell Scroll (4th level)', price: 500, rarity: 'rare' },
			{ name: 'Spell Scroll (5th level)', price: 1000, rarity: 'rare' },
			{ name: 'Manual of Bodily Health', price: 20000, rarity: 'very_rare' },
			{ name: 'Manual of Gainful Exercise', price: 20000, rarity: 'very_rare' },
			{ name: 'Tome of Clear Thought', price: 20000, rarity: 'very_rare' },
			{ name: 'Tome of Leadership and Influence', price: 20000, rarity: 'very_rare' },
			{ name: 'Tome of Understanding', price: 20000, rarity: 'very_rare' }
		],
		herbalist: [
			{ name: 'Potion of Healing (Greater)', price: 150, rarity: 'uncommon' },
			{ name: 'Potion of Animal Friendship', price: 150, rarity: 'uncommon' },
			{ name: 'Potion of Water Breathing', price: 200, rarity: 'uncommon' },
			{ name: "Keoghtom's Ointment", price: 250, rarity: 'uncommon' },
			{ name: 'Periapt of Health', price: 300, rarity: 'uncommon' },
			{ name: 'Potion of Healing (Superior)', price: 500, rarity: 'rare' },
			{ name: 'Potion of Longevity', price: 5000, rarity: 'very_rare' }
		],
		fletcher: [
			{ name: '+1 Arrows (3)', price: 150, rarity: 'uncommon' },
			{ name: 'Bracers of Archery', price: 300, rarity: 'uncommon' },
			{ name: '+1 Longbow', price: 350, rarity: 'uncommon' },
			{ name: '+2 Longbow', price: 3000, rarity: 'rare' },
			{ name: 'Arrow of Slaying', price: 2000, rarity: 'very_rare' }
		],
		stable: [
			{ name: 'Horseshoes of Speed', price: 1500, rarity: 'rare' },
			{ name: 'Horseshoes of a Zephyr', price: 3000, rarity: 'very_rare' }
		]
	};
	// Rarity slots available per affluence
	const magicByAffluence: Record<
		string,
		{ rarity: string; count: [number, number]; chance: number }[]
	> = {
		impoverished: [],
		poor: [{ rarity: 'common', count: [0, 1], chance: 0.25 }],
		common: [
			{ rarity: 'common', count: [1, 2], chance: 1.0 },
			{ rarity: 'uncommon', count: [0, 1], chance: 0.4 }
		],
		prosperous: [
			{ rarity: 'common', count: [1, 2], chance: 1.0 },
			{ rarity: 'uncommon', count: [1, 2], chance: 1.0 },
			{ rarity: 'rare', count: [0, 1], chance: 0.35 }
		],
		wealthy: [
			{ rarity: 'uncommon', count: [1, 3], chance: 1.0 },
			{ rarity: 'rare', count: [1, 2], chance: 1.0 },
			{ rarity: 'very_rare', count: [0, 1], chance: 0.3 }
		],
		opulent: [
			{ rarity: 'rare', count: [2, 3], chance: 1.0 },
			{ rarity: 'very_rare', count: [1, 2], chance: 1.0 },
			{ rarity: 'legendary', count: [0, 1], chance: 0.25 }
		]
	};
	let selectedShopItem = $state<ShopRow | null>(null);
	const itemDescriptions: Record<string, string> = {
		Torch:
			'A wooden stick tipped with oil-soaked cloth. Provides bright light in a 20-ft radius and dim light for an additional 20 ft. Burns for 1 hour.',
		'Rations (1 day)':
			'Dried food — hardtack, jerked meat, dried fruit, and nuts — sufficient for one day of travel. No cooking required.',
		'Rope, hempen (50 ft)':
			'Sturdy hemp rope with 2 hit points. Can be burst with a DC 17 Strength check. Essential for climbing and securing loads.',
		Waterskin:
			'A leather pouch sealed with a stopper. Holds up to 4 pints of liquid — enough for a day of travel in moderate conditions.',
		'Lantern, hooded':
			'Casts bright light in a 30-ft radius and dim light for an additional 30 ft. The hood can be closed to hide the light. Burns 6 hours per flask of oil.',
		'Oil (flask)':
			'Fuels lanterns. Can also be poured on a 5-ft square surface and ignited, dealing 5 fire damage (DC 10 Dex save) for 2 rounds.',
		Bedroll:
			'A padded mat and blanket for sleeping outdoors. Provides modest comfort for a long rest.',
		Backpack:
			'A sturdy leather pack with multiple compartments. Holds up to 30 lbs or 1 cubic foot of gear.',
		Tinderbox:
			'Contains a flint, fire steel, and tinder. Starting a small fire takes 1 action; a larger fire takes 1 minute.',
		Crowbar:
			'A metal pry bar. Grants advantage on Strength checks where it can be used as a lever.',
		Hammer: 'A basic iron hammer for driving pitons, light construction, or utility work.',
		'Pot, iron':
			'A sturdy iron cooking pot, holding roughly 1 gallon. Used for boiling water or preparing camp meals.',
		Shovel: 'A digging tool for excavation, burying items, or setting pit traps.',
		'Tent (2-person)':
			'A simple canvas shelter protecting two people from the elements during a rest.',
		'Mirror, steel':
			'A polished steel hand mirror. Useful for signaling, scouting around corners, or reflecting gaze attacks.',
		Blanket: 'A thick wool blanket providing warmth on cold nights and comfort during rests.',
		'Grappling hook':
			'An iron hook with 3-4 prongs. Thrown and used with rope to scale walls or anchor lines.',
		'Candle (10)': 'Wax candles that shed dim light in a 5-ft radius. Each burns for 1 hour.',
		'Chalk (10 pieces)':
			'Soft white sticks for marking paths, writing on stone, or leaving messages.',
		Soap: 'A bar of tallow soap for cleaning wounds, disguising scent from animals, or general hygiene.',
		Sack: 'A simple burlap sack holding up to 30 lbs or 1 cubic foot.',
		'Ball bearings (bag)':
			'A bag of 1,000 steel ball bearings. Scattered over a 10-ft square, creatures must succeed on a DC 10 Dex save or fall prone.',
		'Signal whistle': 'A small tin whistle producing a shrill sound audible up to 300 feet away.',
		'Block and tackle':
			'A set of pulleys with rope. Halves the force needed to lift heavy objects (doubles lift capacity).',
		Dagger:
			'A light finesse weapon that can be thrown (range 20/60). 1d4 piercing damage. Ideal for rogues, assassins, and as a backup blade.',
		Handaxe:
			'A light thrown weapon (range 20/60). 1d6 slashing damage. Popular among barbarians and fighters as a versatile sidearm.',
		Shortsword: 'A light finesse blade favored by rogues and rangers. 1d6 piercing damage.',
		Longsword:
			'A versatile blade and the most common sword among soldiers and adventurers. 1d8 piercing or slashing (1d10 two-handed).',
		Battleaxe:
			'A single-bladed axe. 1d8 slashing damage (1d10 two-handed). Favored by warriors who prefer raw power.',
		Greatsword:
			'A massive two-handed blade. 2d6 slashing damage. Heavy — requires Str 13+ to wield effectively.',
		Greataxe:
			'A sweeping two-handed axe. 1d12 slashing damage. Heavy. Beloved by barbarians for its cleaving power.',
		Mace: 'A spiked or flanged bludgeoning weapon effective against armored foes. 1d6 bludgeoning damage.',
		Warhammer:
			'A heavy bludgeoning weapon. 1d8 damage (1d10 two-handed). Favored by clerics of war deities.',
		Spear:
			'A versatile thrown weapon (range 20/60). 1d6 piercing (1d8 two-handed). A workhorse weapon throughout the ages.',
		Javelin:
			'A light throwing weapon (range 30/120). 1d6 piercing damage. Used for opening volleys before melee.',
		'Light hammer':
			'A small bludgeoning weapon (thrown 20/60). 1d4 bludgeoning damage. Light, so useful as an off-hand weapon.',
		Quarterstaff:
			'A wooden staff used as a weapon. 1d6 bludgeoning (1d8 two-handed). Iconic weapon of druids and monks.',
		Pike: 'A long polearm with reach. 1d10 piercing damage. Heavy, two-handed. Reach property (attack targets up to 10 ft away).',
		Rapier:
			"An elegant finesse thrusting sword. 1d8 piercing damage. A duelist's weapon of choice.",
		Flail:
			'A spiked ball on a chain. 1d8 bludgeoning damage. The chain can wrap around shields, making it harder to block.',
		Trident:
			'A three-pronged spear (thrown 20/60). 1d6 piercing (1d8 two-handed). Associated with sea gods and gladiators.',
		Whip: "A finesse reach weapon (10 ft). 1d4 slashing damage. Can be used to disarm or trip foes at the DM's discretion.",
		'Arrows (20)':
			'Standard wooden shafts with iron tips, fletched for stability. Ammunition for shortbows and longbows.',
		'Crossbow bolts (20)':
			'Short iron-tipped bolts for use with any crossbow variant. Sturdier than arrows but shorter range.',
		Whetstone:
			'A small abrasive stone for honing blade edges. Keeps weapons sharp and well-maintained.',
		'Padded armor':
			'Quilted cloth and batting. AC 11 + Dex. Disadvantage on Stealth. The lightest armor available — better than nothing.',
		'Leather armor':
			'Hardened chest and shoulder pieces of boiled leather. AC 11 + Dex. No Stealth penalty.',
		'Studded leather':
			'Leather reinforced with close-set metal rivets. AC 12 + Dex. No Stealth penalty. The go-to light armor.',
		'Ring mail':
			'Leather with metal rings sewn in. AC 14. Disadvantage on Stealth. Inferior to chain — rarely used by professionals.',
		'Chain shirt':
			'Interlocking metal rings protecting the torso and upper arms. AC 13 + Dex (max 2). No Stealth penalty.',
		'Scale mail':
			'Overlapping metal scales on a leather backing. AC 14 + Dex (max 2). Disadvantage on Stealth.',
		'Chain mail':
			"A full suit of interlocking metal rings. AC 16. Requires Str 13. Disadvantage on Stealth. A soldier's standard.",
		Breastplate:
			'A fitted metal chest piece with flexible leather protection. AC 14 + Dex (max 2). No Stealth penalty.',
		'Half plate':
			'Metal plates covering most of the body with chainmail beneath. AC 15 + Dex (max 2). Disadvantage on Stealth.',
		Shield:
			'A wooden or metal shield strapped to the forearm. +2 AC. Requires one hand and proficiency.',
		Helmet:
			'A metal helm protecting the head. Often includes a visor, cheek guards, and neck protection.',
		Gauntlets: 'Metal gloves that protect the hands without hampering grip or dexterity.',
		Greaves:
			'Metal shin and leg guards. Provide protection on the lower body without restricting mobility.',
		'Vambrace (pair)':
			'Forearm guards of hardened leather or metal, protecting without restricting wrist flexibility.',
		'Potion of Healing':
			'A red liquid that glimmers when agitated. Drinking it restores 2d4+2 hit points.',
		Antitoxin:
			'A vial of clear liquid. Drinking grants advantage on saving throws against poison for 1 hour.',
		'Acid (vial)':
			'A corrosive liquid. On a hit (thrown up to 20 ft or splashed within 5 ft), deals 2d6 acid damage.',
		"Alchemist's fire":
			'A sticky fluid that ignites on air contact. On a hit it deals 1d4 fire damage per turn until extinguished (DC 10 Dex action).',
		'Holy water (flask)':
			'Blessed water harmful to undead and fiends. Thrown up to 20 ft; 2d6 radiant damage on a failed DC 13 Dex save.',
		"Healer's kit":
			'A leather pouch with bandages, salves, and splints. Lets you stabilize a dying creature automatically. 10 uses.',
		'Vial (empty)':
			'A small glass container with a stopper, holding up to 4 ounces of liquid. Used for storing samples and potions.',
		'Perfume (vial)':
			"A pleasant-smelling liquid. May grant advantage on Charisma checks or mask the wearer's scent from animals.",
		'Poison, basic (vial)':
			'Coat a blade or ammunition. On a hit, the target must succeed on a DC 10 Con save or take 1d4 poison damage.',
		'Potion of Climbing':
			'Grants a climbing speed equal to your walking speed and advantage on Athletics checks to climb for 1 hour.',
		'Ink (1 oz)': 'A small bottle of dark writing ink, sufficient for many pages of script.',
		Smokestick:
			'When ignited, produces thick opaque smoke filling a 10-ft cube for 1 minute. Obscures vision.',
		'Oil of Slipperiness':
			'Applied to surfaces or creatures, it replicates the Grease spell for 8 hours. Alternatively, drinking it grants freedom of movement for 8 hours.',
		'Spell Scroll (cantrip)':
			'A rolled parchment inscribed with a cantrip. Any spellcaster with that cantrip can cast it for free. Others must succeed on a DC 10 Arcana check or the scroll is lost.',
		'Spell Scroll (1st level)':
			'Inscribed with a 1st-level spell. Appropriate class casters can cast it freely; others need DC 11 Arcana check.',
		'Spell Scroll (2nd level)':
			'Inscribed with a 2nd-level spell. DC 12 Arcana check for non-class casters.',
		'Spell Scroll (3rd level)':
			'Inscribed with a 3rd-level spell. DC 13 Arcana check for non-class casters.',
		'Component pouch':
			'A leather belt pouch with compartments for spell components and foci. Replaces any material component that has no listed cost.',
		'Arcane focus (crystal)':
			'A crystal used as a spellcasting focus for arcane casters (wizards, sorcerers, warlocks). Replaces non-costly material components.',
		'Arcane focus (orb)': 'A glass or crystal orb used as a spellcasting focus for arcane casters.',
		'Arcane focus (wand)':
			'A short wooden or metal wand used as a spellcasting focus. Elegant and easily concealed.',
		'Spellbook (blank)':
			'A leather-bound tome with 100 pages of magic-receptive vellum. Every wizard begins with one and expands it throughout their career.',
		'Holy symbol (amulet)':
			"A sacred pendant bearing a deity's symbol. Serves as a spellcasting focus for clerics and paladins.",
		'Druidic focus (staff)':
			'A wooden staff carved with nature symbols, housing mistletoe or holly. Spellcasting focus for druids.',
		'Pearl (spell component)': 'A 100-gp pearl consumed when casting the Identify spell.',
		'Diamond dust (per oz)':
			'Finely powdered diamond consumed as a material component for Revivify, Raise Dead, and similar resurrection spells.',
		'Identify (service)':
			'A resident mage will cast Identify on one item or creature, revealing its magical properties, charges, and attunement requirements.',
		'Copper bracelet':
			"A simple copper band — affordable and easy to find. A common token of friendship or a beginning adventurer's first adornment.",
		'Silver ring':
			'A plain polished silver band. Simple, elegant, and a popular betrothal ring among commoners.',
		'Silver necklace': 'A fine silver chain suitable as a modest gift or light adornment.',
		'Gold ring': 'A solid gold band. A mark of modest wealth and a common pledge of commitment.',
		'Onyx pendant':
			'A smooth black gemstone set in a simple mount. Popular for mourning jewelry and dark-themed fashion.',
		'Pearl earrings':
			'A matched pair of lustrous pearls set in silver drops. Refined and timeless.',
		'Garnet brooch':
			'A deep red gemstone set in a decorative clasp. A fashionable accessory in noble circles.',
		'Jade bracelet':
			'A carved green jade bangle. Associated with luck and longevity in many cultures.',
		'Amethyst ring':
			'A violet gemstone set in silver. In folklore it wards off intoxication — unlikely, but a lovely story.',
		'Topaz earrings':
			'A pair of warm golden gemstone drops. Said to promote confidence and clarity of thought.',
		'Sapphire pendant':
			'A deep blue sapphire on a fine chain. A mark of wealth and refinement, favored by royalty.',
		'Opal amulet':
			'A shimmering multi-colored opal said to contain captured fire. Used as a decorative focus and lucky charm.',
		'Ruby brooch':
			'A vivid red ruby set in gold filigree. A gift fit for nobility and a statement of power.',
		'Emerald necklace':
			'A rich green emerald pendant on a gold chain. Among the most sought-after jewels of the realm.',
		'Diamond stud':
			'A single brilliant-cut diamond earring. The pinnacle of jewelry craftsmanship and wealth.',
		'Ale (mug)':
			'A frothy mug of locally brewed ale. Mildly intoxicating. Common throughout taverns in the realm.',
		'Ale (gallon)':
			'A full gallon of house ale in a sealed jug — enough for a small group or a long evening.',
		'Wine, common (pitcher)':
			'An earthenware pitcher of rough table wine. Drinkable, if not memorable.',
		'Wine, fine (bottle)':
			'A sealed bottle of quality wine from a noted vineyard. Suitable for impressing guests.',
		'Mead (mug)': 'A golden honey-fermented drink — sweet and stronger than it appears.',
		'Meal, poor': 'Hard bread, watery stew, and a cup of water. Filling, if not satisfying.',
		'Meal, modest': 'Bread, a stew with vegetables and small portions of meat, and a small beer.',
		'Meal, fine':
			'A multi-course meal with roasted meats, fresh bread, rich sauces, and fine wine.',
		'Room, poor (per night)':
			'A straw pallet in a shared common room. Drafty and noisy, but a roof overhead.',
		'Room, modest (per night)':
			'A private room with a simple bed, wash basin, and a lock on the door.',
		'Room, comfortable (per night)':
			"A well-furnished room with a featherbed, lit hearth, and a window. A proper night's rest.",
		'Stabling (per night)':
			'Secure stabling for one horse or mount with feed, water, and attention from a groom.',
		'Bread, loaf': 'A fresh-baked loaf of wheat or rye bread. A staple food throughout the land.',
		'Meat, chunk': 'A cut of salted or smoked meat — pork, beef, or game depending on the region.',
		'Pipe tobacco (pouch)':
			'A small pouch of cured tobacco leaves for a pipe. Popular among halflings and veteran soldiers.',
		'Common book':
			"A printed or hand-copied book on a general topic — history, botany, or heraldry. May grant advantage on relevant checks at the DM's discretion.",
		'History tome':
			'A thick illustrated volume covering the history of a region or empire. Thorough research may grant a +2 bonus to relevant History checks.',
		'Rare tome':
			'A scarce or ancient manuscript containing lost knowledge, partial spell research, or unique lore unavailable elsewhere.',
		'Blank journal':
			'A leather-bound blank book with 200 pages of fine vellum — ideal for notes, maps, or a personal chronicle.',
		'Ink pen': 'A metal-nibbed quill pen for use with bottled ink.',
		'Paper (sheet)': 'A sheet of fine writing paper, suitable for letters and records.',
		'Parchment (sheet)':
			'A scraped and dried animal skin, more durable than paper. Used for important documents and maps.',
		'Scroll case':
			'A leather or bone tube for safely storing rolled scrolls and documents. Waterproof and compact.',
		'Map, local area':
			"A hand-drawn map showing roads, settlements, and major landmarks within roughly a day's ride.",
		'Map, regional':
			"A detailed map of the broader region — towns, rivers, mountain ranges, and borders within several weeks' travel.",
		'Sealing wax':
			'A stick of colored wax melted to seal letters and documents. Often pressed with a signet ring.',
		'Star chart':
			'A detailed illustration of constellations and celestial bodies. Useful for navigation, identifying the season, and impressing scholars.',
		'Healing salve (minor)':
			"A thick herbal paste applied to wounds. Reduces minor HP loss or speeds recovery at the DM's discretion.",
		'Common herbs (bundle)':
			'Dried culinary and medicinal herbs. Useful for cooking, herbal recipes, or trading with herbalists.',
		'Rare herb (single)':
			'A single sprig or root of a hard-to-find plant with concentrated medicinal properties.',
		'Fever bark (strip)':
			'Dried bark from the fever tree. Brewed as a tea, it reduces fever and eases infection symptoms.',
		'Sleep dust (pinch)':
			"A fine powder from valerian and nightshade. Inhaled or ingested, induces drowsiness (Con save DC at DM's discretion).",
		'Wound poultice':
			'A pre-made herbal compress for lacerations and bruises. Reduces bleeding and soothes inflammation.',
		'Dried mushrooms (bundle)':
			'Dried fungi for cooking or alchemy. Certain varieties have mild stimulating or narcotic properties.',
		'Eye drops, clarity':
			"A clear liquid applied to the eyes to sharpen vision temporarily. May grant advantage on Perception checks for 1 hour at DM's discretion.",
		'Calming draught':
			"A soothing herbal blend. May provide advantage on saves against fear at the DM's discretion.",
		'Fortifying tea (pouch)':
			'Dried herbs brewed into a strengthening tea. Popular with soldiers and laborers before hard work.',
		'Breath tonic (vial)':
			'A mentholated liquid for clearing airways. Useful for those suffering from cold, smoke, or illness.',
		Shortbow: 'A small, curved bow. Range 80/320. 1d6 piercing damage. Ammunition: arrows.',
		Longbow:
			'A tall stave bow requiring Str 13+. Range 150/600. 1d8 piercing damage. Heavy. The premier ranged weapon for soldiers.',
		'Hand crossbow':
			'A compact one-handed crossbow. Range 30/120. 1d6 piercing damage. Light — can be used in the off hand.',
		'Light crossbow':
			'A standard two-handed crossbow. Range 80/320. 1d8 piercing damage. Good for those lacking proficiency with bows.',
		'Heavy crossbow':
			'A powerful two-handed crossbow. Range 100/400. 1d10 piercing damage. Heavy property.',
		Blowgun:
			'A long tube for propelling needles by breath. Range 25/100. 1 piercing damage. Loading property. Needles are often coated in poison.',
		'Blowgun needles (50)':
			'Thin metal needles for a blowgun. Effective delivery system for contact poisons.',
		Quiver: 'A leather cylinder worn on the back or hip, holding up to 20 arrows or bolts.',
		Net: 'A weighted throwing net. On a hit, a Large or smaller creature is restrained. Escape requires a DC 10 Strength check or cutting free.',
		Sling:
			'A simple cloth pouch on two cords. Hurls stones or lead bullets. Range 30/120. 1d4 bludgeoning damage. Ammunition not expended on a miss.',
		'Sling bullets (20)':
			'Small lead balls sized for a sling. Heavier than stones for more consistent damage.',
		'Arrow (silvered)':
			'An arrow tipped with pure silver. Bypasses resistance and immunity to piercing from non-silvered weapons. Effective against lycanthropes and certain undead.',
		'Bowstring (replacement)':
			'A waxed hemp or linen string for replacing a snapped or worn bowstring. Any experienced archer carries spares.',
		'Riding horse':
			'A well-tempered horse suited for travel. Speed 60 ft. Carries up to 480 lbs. Cannot make attacks.',
		'Draft horse':
			'A large, powerful horse for pulling carts and plows. Speed 40 ft. Carries up to 540 lbs.',
		Warhorse:
			'A trained combat mount. Speed 60 ft. Can attack (1d6+4 hooves). Carries 540 lbs. Requires proficiency with Martial weapons to ride in combat.',
		Pony: 'A smaller horse. Speed 40 ft. Carries up to 225 lbs. Well suited for small folk and narrow mountain trails.',
		'Donkey / Mule':
			'A hardy, stubborn pack animal. Speed 40 ft. Carries up to 420 lbs. Handles rough terrain better than horses.',
		'Mastiff (guard dog)':
			'A large, trained dog. Speed 40 ft. Attacks for 1d6+3 piercing. Grants advantage on Perception checks. Can be trained to guard, track, or assist.',
		'Saddle, riding':
			'A leather saddle for long journeys. Grants advantage on checks to remain in the saddle.',
		'Saddle, military':
			'A reinforced saddle that lets a rider wield weapons effectively in combat. Advantage on checks to stay mounted.',
		'Saddle, pack':
			'A simple frame and strap system for carrying cargo on a pack animal — no riding comfort.',
		Saddlebags: "A pair of leather bags hanging across a mount's flanks. Holds 20 lbs in each bag.",
		Cart: 'A two-wheeled wooden vehicle pulled by one horse. Carries up to 200 lbs of cargo.',
		Wagon:
			'A four-wheeled covered vehicle pulled by two horses. Carries up to 400 lbs. Suitable for long journeys with supplies.',
		'Bit and bridle':
			'The metal bit and head harness used to steer and control a mount. Required for all trained riding.',
		'Horseshoes (set)':
			'A set of four iron horseshoes. Essential for horses traveling on hard, rocky, or paved surfaces.',
		'Feed (per day)': "A day's supply of hay, oats, and water for one horse or similar mount.",
		'Moon-Touched Sword':
			'In darkness, the blade emits moonlight, shedding dim light in a 15-ft radius. No attunement required — a subtle enchantment prized by scouts.',
		'Silvered Weapon':
			'A weapon coated in pure silver. Bypasses resistance and immunity to non-silvered attacks. Essential against lycanthropes and certain undead.',
		'Cloak of Billowing':
			'Speak the command word and this cloak billows dramatically regardless of the wind. Purely cosmetic — but wonderfully theatrical. No attunement.',
		'Rope of Mending':
			'A 60-ft hempen rope that can magically rejoin itself when cut, simply by speaking the command word. No attunement required.',
		'Bead of Nourishment':
			'A small flavorless bead that sustains a Medium creature for one full day when swallowed. No attunement required.',
		'Pipe of Smoke Monsters':
			'Puffing this pipe produces smoke in the shape of a creature (Tiny to Medium) of your choice. Purely cosmetic. No attunement.',
		'Clockwork Amulet':
			'Once per day when making an attack roll, you may choose not to roll and instead treat the d20 as a 10. No attunement required.',
		'Hat of Disguise':
			'Allows you to cast Disguise Self at will while wearing it. The disguise is purely illusory. Requires attunement.',
		'Wand of Spark':
			'Produces a small spark — enough to ignite tinder, light a candle, or impress easily. Effectively a minor prestidigitation wand.',
		'Tankard of Sobriety':
			'Any liquid poured into this ordinary-looking tankard loses all intoxicating properties when consumed. Useful for staying sharp at the table.',
		'Sending Stones (pair)':
			'Two matched stones. Once per day, speak up to 25 words into one — the holder of the other hears it instantly, regardless of distance.',
		'Immovable Rod':
			'Press the button and this iron rod becomes fixed in place, immovable by any force under 8,000 lbs. Press again to release. 3 uses per day.',
		'Bag of Holding':
			'A cloth bag that holds up to 500 lbs / 64 cubic feet regardless of external size. Creatures inside begin to suffocate after 10 minutes. No attunement.',
		'Boots of Elvenkind':
			'Your footsteps make no sound, granting advantage on Stealth checks that rely on sound. Requires attunement.',
		'Cloak of Elvenkind':
			'Advantage on Stealth checks. Creatures relying on sight have disadvantage on Perception checks to find you. Requires attunement.',
		'Helm of Comprehending Languages':
			'Cast Comprehend Languages at will while wearing this helm. All written and spoken languages become readable and audible. No attunement.',
		'Pearl of Power':
			'Once per day as a bonus action, recover one expended spell slot of up to 3rd level. Requires attunement by a spellcaster.',
		'Ring of Feather Falling':
			'When you fall while wearing this ring, you descend at 60 ft/round and take no falling damage. Requires attunement.',
		'Wand of Magic Missiles':
			'7 charges. Expend 1-3 charges to cast Magic Missile as a 1st-3rd level spell. Regains 1d6+1 charges at dawn. No attunement.',
		'Wand of Web':
			'7 charges. Cast Web (save DC 15) using 1 charge. Regains 1d6+1 charges at dawn. Requires attunement by a spellcaster.',
		'Winged Boots':
			'Sprout feathery or bat-like wings for up to 4 hours per day (in 1-minute increments), gaining a flying speed equal to your walking speed. Requires attunement.',
		'Bag of Tricks (Grey)':
			'Pull a small furry object from the bag and throw it up to 20 ft. It transforms into a random beast (1d8 on table) that obeys commands for 1 minute. 3 uses per dawn.',
		'Amulet of Proof vs. Detection':
			'You are hidden from divination magic while wearing this amulet. You cannot be targeted by such magic or perceived through magical scrying sensors. Requires attunement.',
		'Periapt of Health':
			'You are immune to contracting diseases while wearing this periapt. Diseases already afflicting you are suppressed, not cured. No attunement.',
		'Ring of Mind Shielding':
			'Immune to magic that senses emotions, reads thoughts, or detects whether you are lying. Your alignment cannot be detected. Requires attunement.',
		'Ring of Swimming': 'Grants a swimming speed of 40 feet. No attunement required.',
		'Necklace of Adaptation':
			'Breathe normally in any environment and have advantage on saves against harmful gases, vapors, and extreme atmospheric conditions. Requires attunement.',
		'Bracers of Archery':
			'Gain proficiency with longbows and shortbows, and a +2 bonus to damage rolls with them. Requires attunement.',
		'+1 Dagger':
			'A needle-sharp enchanted blade. +1 bonus to attack rolls and damage rolls. Holds an edge that never dulls.',
		'+1 Shortsword':
			'A well-balanced magical shortsword. +1 bonus to attack rolls and damage rolls.',
		'+1 Longsword':
			'A finely crafted magical blade. +1 bonus to attack rolls and damage rolls. Hums faintly when drawn.',
		'+1 Battleaxe':
			'An enchanted battleaxe. +1 bonus to attack rolls and damage rolls. The edge glows faintly in starlight.',
		'+1 Shield':
			"A magically reinforced shield. +3 AC total (shield's +2 plus the enchantment). Lighter than it appears.",
		'+1 Leather Armor': 'Supple enchanted leather that moves with the body. AC 12 + Dex modifier.',
		'+1 Chain Mail':
			'Enchanted mail with no gaps in its rings. AC 17. Requires Str 13. Disadvantage on Stealth.',
		'Adamantine Armor':
			'Reinforced with adamantine, one of the hardest substances known. Any critical hit against the wearer becomes a normal hit instead. Requires attunement.',
		'Mithral Armor':
			'Lightweight and flexible mithral construction. Does not impose disadvantage on Stealth checks. No Bulky property. No attunement.',
		'+1 Arrows (3)':
			'Three arrows bearing minor enchantments. +1 bonus to attack rolls and damage rolls. Once fired they lose their magic.',
		'+1 Longbow': 'An enchanted longbow. +1 bonus to attack rolls and damage rolls.',
		'Periapt of Wound Closure':
			'You stabilize automatically when reduced to 0 HP, and your hit dice heal double when spent on a short rest. Requires attunement.',
		'Necklace of Fireballs':
			'A string of beads (1d6+3 beads). Throw one or more beads up to 60 ft — they explode as a Fireball (3d6 + 2d6 per extra bead). No attunement.',
		'Ring of Evasion':
			'3 charges. When you fail a Dexterity saving throw, use your reaction to succeed instead. Regains 1d3 charges at dawn. Requires attunement.',
		'Ring of Protection':
			'+1 bonus to AC and saving throws. A reliable enchantment worn by veterans and nobles alike. Requires attunement.',
		'Ring of the Ram':
			'3 charges. Hit a target within 60 ft for 2d10 force damage (1 charge) and push it 5 ft. More charges increase damage and push distance. Requires attunement.',
		'Staff of Healing':
			'10 charges. Cast Cure Wounds (1-4 charges), Lesser Restoration (2), or Mass Cure Wounds (5). Regains 1d6+4 charges at dawn. Requires attunement by a cleric, druid, or paladin.',
		'Staff of Fire':
			'10 charges. Cast Burning Hands (1), Fireball (3), or Wall of Fire (4). Regains 1d6+4 charges at dawn. Requires attunement by a druid, sorcerer, warlock, or wizard.',
		'Wand of Fireballs':
			'7 charges. Cast Fireball at 3rd level (DC 15) for 1 charge, or at higher levels by spending more. Regains 1d6+1 at dawn. Requires attunement by a spellcaster.',
		'Wand of Lightning Bolts':
			'7 charges. Cast Lightning Bolt at 3rd level (DC 15) for 1 charge, higher levels by spending more. Regains 1d6+1 at dawn. Requires attunement by a spellcaster.',
		'Portable Hole':
			'A 6-ft-diameter circle of black cloth. Laid flat on a solid surface it creates an extradimensional space 10 ft deep. Folding the cloth seals the hole — and anything inside. No attunement.',
		'Flame Tongue':
			'While drawn and you speak the command word, the blade ignites for 1 minute dealing +2d6 fire damage. Sheds 40 ft bright light and 40 ft dim light. Requires attunement.',
		'Frost Brand':
			'Deals +1d6 cold damage on a hit. When drawn in freezing temperatures it sheds light. When drawn within 30 ft it suppresses nonmagical flames. Requires attunement.',
		'Sword of Life Stealing':
			'On a natural 20 against a living creature, the target takes 10 extra necrotic damage and you gain 10 temporary HP. Requires attunement.',
		'Sword of Wounding':
			'A creature hit by this weapon cannot regain HP until the start of your next turn. This effect stacks with multiple hits. Requires attunement.',
		'+2 Shield':
			'A potently enchanted shield. +4 AC total. Solid, lighter than mundane equivalents. Requires attunement.',
		'+2 Breastplate':
			'A masterwork enchanted breastplate. AC 16 + Dex (max 2). Noticeably lighter and more protective than mundane equivalents. Requires attunement.',
		'Armor of Resistance':
			"Resistance to one type of damage (determined when found or crafted). The specific protection is usually visible in the armor's ornamentation. Requires attunement.",
		'+2 Longbow':
			'A finely enchanted longbow. +2 bonus to attack rolls and damage rolls. The wood never warps.',
		'Amulet of Health':
			'Your Constitution score is 19 while wearing this amulet, if not already higher. Requires attunement.',
		'Spell Scroll (4th level)':
			'Inscribed with a 4th-level spell. Appropriate class casters can use it freely; others need a DC 14 Arcana check.',
		'Spell Scroll (5th level)':
			'Inscribed with a 5th-level spell. DC 15 Arcana check for non-class casters. Even partial knowledge can be valuable.',
		'Horseshoes of Speed':
			"These iron horseshoes increase your mount's speed by 30 ft. Requires attunement by the horse.",
		'Potion of Healing (Greater)':
			'A shimmering red liquid. Restores 4d4+4 hit points when consumed.',
		'Potion of Fire Breath':
			'After drinking, you can exhale fire in a 30-ft cone (4d6 fire damage, DC 13 Dex save for half) up to 3 times within 1 hour.',
		'Potion of Invisibility':
			'Drink to become invisible for 1 hour. Effect ends if you attack or cast a spell.',
		'Potion of Resistance':
			'Gain resistance to one type of damage for 1 hour. The specific type varies by potion.',
		'Potion of Water Breathing':
			'Breathe underwater for 1 hour. The liquid is bubbly and smells faintly of brine.',
		'Potion of Healing (Superior)':
			'A deep crimson potion, almost glowing. Restores 8d4+8 hit points.',
		'Potion of Invulnerability':
			'Gain resistance to all damage for 1 minute. Smells of iron and looks like liquefied metal.',
		'Potion of Mind Control':
			'Replicates Dominate Monster or Dominate Person — the specific target type depends on the variant.',
		"Keoghtom's Ointment":
			'A glass jar with 1d4+1 doses of sweet-smelling unguent. Each dose removes one curse, disease, or poison and restores 2d8+2 HP.',
		'Arrow of Slaying':
			'A special arrow that deals an extra 6d10 piercing damage to creatures of a specific type on a hit (DC 17 Con save halves). Single use.',
		'Potion of Animal Friendship':
			'Cast Animal Friendship (DC 13) targeting up to 3 beasts for 1 hour without expending a spell slot.',
		'Amulet of the Planes':
			'Name a location on another plane and make a DC 15 Intelligence check — success transports you there instantly; failure sends you to a random location. Requires attunement.',
		'Carpet of Flying':
			'A flying carpet carrying up to 800 lbs. Command it verbally to move up to its fly speed. Size determines capacity and speed (3×5 ft through 5×7 ft). No attunement.',
		'Crystal Ball':
			'A 6-inch glass sphere. Use an action to cast Scrying (Wis save DC 17) targeting a creature you know. Requires attunement.',
		'Robe of Eyes':
			'Covered in eye-like patterns. Grants 120-ft darkvision, advantage on Perception, and 360-degree vision. Blinded by Daylight or Light spells. Requires attunement.',
		'Staff of the Magi':
			'A powerful artifact with 50 charges. Casts dozens of spells and can absorb spells cast at you. Can be broken for a devastating Retributive Strike. Requires attunement by sorcerer, warlock, or wizard.',
		'Wand of Polymorph':
			'7 charges. Cast Polymorph (Wis save DC 15) using 1 charge. Regains 1d6+1 charges at dawn. Requires attunement by a spellcaster.',
		'+3 Longsword':
			'A legendary magical blade. +3 bonus to attack rolls and damage rolls. Hums with contained power — sometimes visible as a faint glow.',
		'+3 Plate Armor':
			'The finest magical armor. AC 21. Requires Str 15. Disadvantage on Stealth. Moves with its wearer almost as if alive.',
		'Ring of Regeneration':
			'You regain 1d6 HP every 10 minutes as long as you have at least 1 HP. Severed limbs regrow over 1d6+1 days. Requires attunement.',
		'Ring of Spell Storing':
			'Stores up to 5 levels of spells. Any attuned creature can cast a stored spell. Spells are placed by touching the ring. Requires attunement.',
		'Manual of Bodily Health':
			'Reading over 48 hours (in 6-day periods) permanently increases Constitution score and maximum by 2. The book then loses its magic for 100 years.',
		'Manual of Gainful Exercise':
			'Reading over 48 hours permanently increases Strength score and maximum by 2. Then loses magic for 100 years.',
		'Tome of Clear Thought':
			'Reading over 48 hours permanently increases Intelligence score and maximum by 2. Then loses magic for 100 years.',
		'Tome of Leadership and Influence':
			'Reading over 48 hours permanently increases Charisma score and maximum by 2. Then loses magic for 100 years.',
		'Tome of Understanding':
			'Reading over 48 hours permanently increases Wisdom score and maximum by 2. Then loses magic for 100 years.',
		'Horseshoes of a Zephyr':
			"Your mount moves normally over difficult terrain, doesn't provoke opportunity attacks, and can travel 12 hours per day without exhaustion. Requires attunement.",
		'Potion of Healing (Supreme)':
			'Restores 10d4+20 hit points. The pinnacle of healing alchemy — golden and warm to the touch.',
		'Potion of Longevity':
			'Your physical age is reduced by 1d6+6 years (minimum 13). Each use after the first has a 10% cumulative chance of increasing your age instead.',
		'Deck of Many Things':
			'A set of 22 (or 13) cards, each bearing a major arcana. Drawing one triggers a dramatic magical effect — from gaining great power to losing your soul. Approach with extreme caution.',
		'Ring of Three Wishes':
			'Contains 3 charges. Expend a charge to cast Wish. When all charges are spent the ring loses its magic entirely. Use your wishes carefully.',
		'Sphere of Annihilation':
			'A 2-ft-diameter sphere of utter darkness that annihilates everything it touches. Controlled via Arcana checks. Contacting it without control means instant destruction. Requires attunement.',
		'Holy Avenger':
			'A +3 sword dealing +2d10 radiant damage to undead. While attuned, grants you and nearby allies advantage on saves against spells and magical effects. Requires attunement by a paladin.',
		'Vorpal Sword':
			'A +3 sword. On a roll of 20, the target must make a DC 15 Con save or have its head severed — killing it instantly (unless headless creatures are immune). Requires attunement.',
		'Armor of Invulnerability':
			'Resistance to non-magical bludgeoning, piercing, and slashing damage. Once per day, become immune to non-magical damage for 10 minutes. Requires attunement.',
		'Potion of Storm Giant Strength':
			'Strength becomes 29 for 1 hour. Tastes like lightning and sea spray.'
	};
	let generatedShopName = $state('');
	function pickFrom<T>(arr: T[]): T {
		return arr[Math.floor(Math.random() * arr.length)];
	}
	function generateShop() {
		const shop = shopData[shopType];
		const aff = affluenceData[shopAffluence];
		if (!shop || !aff) return;
		// Pick shop name
		const namePool = shopNames[shopType] ?? ['The Shop'];
		generatedShopName = pickFrom(namePool);
		// Pick mundane items
		const [lo, hi] = shopItemCount[shopAffluence] ?? [8, 12];
		const count = lo + Math.floor(Math.random() * (hi - lo + 1));
		const shuffled = [...shop.items].sort(() => Math.random() - 0.5);
		const picked = shuffled.slice(0, Math.min(count, shuffled.length));
		// Pick magic items
		const magicPool = shopMagicItems[shopType] ?? [];
		const magicSlots = magicByAffluence[shopAffluence] ?? [];
		const magicPicked: ShopItemDef[] = [];
		for (const slot of magicSlots) {
			if (Math.random() > slot.chance) continue;
			const pool = magicPool.filter((m) => m.rarity === slot.rarity);
			if (!pool.length) continue;
			const [mlo, mhi] = slot.count;
			const mc = mlo + Math.floor(Math.random() * (mhi - mlo + 1));
			const shuffledMagic = [...pool].sort(() => Math.random() - 0.5);
			shuffledMagic.slice(0, mc).forEach((m) => {
				if (!magicPicked.find((x) => x.name === m.name)) magicPicked.push(m);
			});
		}
		const allItems = [...picked, ...magicPicked];
		generatedShop = allItems.map((item) => {
			const base = item.price * aff.mult;
			return {
				name: item.name,
				liked: formatPrice(base * 0.85),
				neutral: formatPrice(base),
				disliked: formatPrice(base * 1.25),
				rarity: item.rarity
			};
		});
	}

	// ── Random Encounter Generator ──────────────────────────────────────────────
	type EncounterMonsterDef = {
		name: string;
		cr: number;
		xp: number;
		role: string;
		biomes: string[];
		mtype: string;
	};
	type EncounterMonster = { name: string; count: number; xp: number };
	type EncounterResult = {
		title: string;
		scene: string;
		description: string;
		archetype: string;
		monsters: EncounterMonster[];
		rawXp: number;
		adjustedXp: number;
		xpPerPlayer: number;
		multiplier: number;
		tactics: string;
		terrain: string;
		actualDifficulty: string;
	};

	const encounterBiomeOptions = [
		{ value: 'forest', label: 'Forest' },
		{ value: 'plains', label: 'Plains / Grassland' },
		{ value: 'mountains', label: 'Mountains' },
		{ value: 'desert', label: 'Desert' },
		{ value: 'arctic', label: 'Arctic / Tundra' },
		{ value: 'coastal', label: 'Coastal' },
		{ value: 'swamp', label: 'Swamp / Marsh' },
		{ value: 'jungle', label: 'Jungle / Rainforest' },
		{ value: 'underdark', label: 'Underdark' },
		{ value: 'urban', label: 'Urban / City' },
		{ value: 'dungeon', label: 'Dungeon' },
		{ value: 'ruins', label: 'Ruins' }
	];
	const difficultyOptions = [
		{ value: 'easy', label: 'Easy' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'hard', label: 'Hard' },
		{ value: 'deadly', label: 'Deadly' }
	];
	const difficultyColors: Record<string, string> = {
		easy: 'text-green-400 border-green-700/50 bg-green-900/20',
		medium: 'text-yellow-400 border-yellow-700/50 bg-yellow-900/20',
		hard: 'text-orange-400 border-orange-700/50 bg-orange-900/20',
		deadly: 'text-red-400 border-red-700/50 bg-red-900/20'
	};

	// XP thresholds per character per level [easy, medium, hard, deadly]
	const xpPerChar: [number, number, number, number][] = [
		[25, 50, 75, 100],
		[50, 100, 150, 200],
		[75, 150, 225, 400],
		[125, 250, 375, 500],
		[250, 500, 750, 1100],
		[300, 600, 900, 1400],
		[350, 750, 1100, 1700],
		[450, 900, 1400, 2100],
		[550, 1100, 1600, 2400],
		[600, 1200, 1900, 2800],
		[800, 1600, 2400, 3600],
		[1000, 2000, 3000, 4500],
		[1100, 2200, 3400, 5100],
		[1250, 2500, 3800, 5700],
		[1400, 2800, 4300, 6400],
		[1600, 3200, 4800, 7200],
		[2000, 3900, 5900, 8800],
		[2100, 4200, 6300, 9500],
		[2400, 4900, 7300, 10900],
		[2800, 5700, 8500, 12700]
	];
	const diffIdx: Record<string, number> = { easy: 0, medium: 1, hard: 2, deadly: 3 };

	function getXpBudget(level: number, diff: string, size: number): number {
		const row = xpPerChar[Math.min(level, 20) - 1];
		return row[diffIdx[diff] ?? 1] * size;
	}
	function getActualDifficulty(adjustedXp: number, level: number, size: number): string {
		const row = xpPerChar[Math.min(level, 20) - 1];
		const pp = adjustedXp / size;
		if (pp >= row[3]) return 'deadly';
		if (pp >= row[2]) return 'hard';
		if (pp >= row[1]) return 'medium';
		if (pp >= row[0]) return 'easy';
		return 'trivial';
	}
	function monsterMult(count: number, size: number): number {
		let m =
			count >= 15 ? 4 : count >= 11 ? 3 : count >= 7 ? 2.5 : count >= 3 ? 2 : count === 2 ? 1.5 : 1;
		if (size <= 2) m *= 1.5;
		else if (size >= 6) m *= 0.5;
		return m;
	}

	// Monster pool: name, cr, xp, role (solo/leader/minion/swarm), biomes[], mtype
	const monsterPool: EncounterMonsterDef[] = [
		// ── Tier 1 (CR 0–3) ──────────────────────────────────────────────────
		{
			name: 'Rat',
			cr: 0,
			xp: 10,
			role: 'swarm',
			biomes: ['urban', 'dungeon', 'ruins', 'swamp'],
			mtype: 'beast'
		},
		{
			name: 'Giant Rat',
			cr: 0.125,
			xp: 25,
			role: 'minion',
			biomes: ['urban', 'dungeon', 'ruins', 'swamp', 'forest'],
			mtype: 'beast'
		},
		{
			name: 'Kobold',
			cr: 0.125,
			xp: 25,
			role: 'minion',
			biomes: ['dungeon', 'mountains', 'forest', 'ruins'],
			mtype: 'humanoid'
		},
		{
			name: 'Bandit',
			cr: 0.125,
			xp: 25,
			role: 'minion',
			biomes: ['forest', 'plains', 'urban', 'ruins', 'coastal'],
			mtype: 'humanoid'
		},
		{
			name: 'Guard',
			cr: 0.125,
			xp: 25,
			role: 'minion',
			biomes: ['urban', 'dungeon', 'ruins'],
			mtype: 'humanoid'
		},
		{
			name: 'Goblin',
			cr: 0.25,
			xp: 50,
			role: 'minion',
			biomes: ['forest', 'plains', 'dungeon', 'ruins', 'mountains'],
			mtype: 'humanoid'
		},
		{
			name: 'Skeleton',
			cr: 0.25,
			xp: 50,
			role: 'minion',
			biomes: ['dungeon', 'ruins', 'desert', 'underdark'],
			mtype: 'undead'
		},
		{
			name: 'Zombie',
			cr: 0.25,
			xp: 50,
			role: 'minion',
			biomes: ['dungeon', 'ruins', 'swamp', 'underdark'],
			mtype: 'undead'
		},
		{
			name: 'Drow',
			cr: 0.25,
			xp: 50,
			role: 'minion',
			biomes: ['underdark', 'dungeon'],
			mtype: 'humanoid'
		},
		{
			name: 'Wolf',
			cr: 0.25,
			xp: 50,
			role: 'minion',
			biomes: ['forest', 'plains', 'arctic', 'mountains'],
			mtype: 'beast'
		},
		{
			name: 'Shadow',
			cr: 0.5,
			xp: 100,
			role: 'minion',
			biomes: ['dungeon', 'ruins', 'underdark', 'swamp'],
			mtype: 'undead'
		},
		{
			name: 'Orc',
			cr: 0.5,
			xp: 100,
			role: 'minion',
			biomes: ['plains', 'mountains', 'forest', 'arctic'],
			mtype: 'humanoid'
		},
		{
			name: 'Thug',
			cr: 0.5,
			xp: 100,
			role: 'minion',
			biomes: ['urban', 'dungeon', 'ruins'],
			mtype: 'humanoid'
		},
		{
			name: 'Hobgoblin',
			cr: 0.5,
			xp: 100,
			role: 'minion',
			biomes: ['forest', 'plains', 'mountains', 'dungeon'],
			mtype: 'humanoid'
		},
		{
			name: 'Lizardfolk',
			cr: 0.5,
			xp: 100,
			role: 'minion',
			biomes: ['swamp', 'jungle', 'coastal'],
			mtype: 'humanoid'
		},
		{
			name: 'Gnoll',
			cr: 0.5,
			xp: 100,
			role: 'minion',
			biomes: ['plains', 'desert', 'ruins'],
			mtype: 'humanoid'
		},
		{
			name: 'Worg',
			cr: 0.5,
			xp: 100,
			role: 'minion',
			biomes: ['forest', 'plains', 'mountains'],
			mtype: 'monstrosity'
		},
		{
			name: 'Black Bear',
			cr: 0.5,
			xp: 100,
			role: 'minion',
			biomes: ['forest', 'mountains'],
			mtype: 'beast'
		},
		{
			name: 'Crocodile',
			cr: 0.5,
			xp: 100,
			role: 'minion',
			biomes: ['swamp', 'jungle', 'coastal'],
			mtype: 'beast'
		},
		{ name: 'Sahuagin', cr: 0.5, xp: 100, role: 'minion', biomes: ['coastal'], mtype: 'humanoid' },
		{
			name: 'Giant Bat',
			cr: 0.25,
			xp: 50,
			role: 'minion',
			biomes: ['dungeon', 'underdark', 'mountains', 'ruins'],
			mtype: 'beast'
		},
		{
			name: 'Piercer',
			cr: 0.5,
			xp: 100,
			role: 'minion',
			biomes: ['dungeon', 'underdark', 'caves'],
			mtype: 'monstrosity'
		},
		{
			name: 'Winged Kobold',
			cr: 0.25,
			xp: 50,
			role: 'minion',
			biomes: ['dungeon', 'mountains', 'ruins'],
			mtype: 'humanoid'
		},
		{
			name: 'Intellect Devourer',
			cr: 2,
			xp: 450,
			role: 'minion',
			biomes: ['underdark', 'dungeon'],
			mtype: 'aberration'
		},
		{
			name: 'Specter',
			cr: 1,
			xp: 200,
			role: 'minion',
			biomes: ['dungeon', 'ruins', 'underdark'],
			mtype: 'undead'
		},
		{
			name: 'Ghoul',
			cr: 1,
			xp: 200,
			role: 'minion',
			biomes: ['dungeon', 'ruins', 'underdark', 'swamp'],
			mtype: 'undead'
		},
		{
			name: 'Giant Spider',
			cr: 1,
			xp: 200,
			role: 'minion',
			biomes: ['forest', 'dungeon', 'jungle', 'underdark', 'ruins'],
			mtype: 'beast'
		},
		{
			name: 'Bugbear',
			cr: 1,
			xp: 200,
			role: 'leader',
			biomes: ['forest', 'dungeon', 'mountains', 'ruins'],
			mtype: 'humanoid'
		},
		{
			name: 'Harpy',
			cr: 1,
			xp: 200,
			role: 'minion',
			biomes: ['mountains', 'coastal', 'plains', 'ruins'],
			mtype: 'monstrosity'
		},
		{
			name: 'Yuan-ti Pureblood',
			cr: 1,
			xp: 200,
			role: 'minion',
			biomes: ['jungle', 'desert', 'ruins', 'dungeon'],
			mtype: 'humanoid'
		},
		{ name: 'Spy', cr: 1, xp: 200, role: 'leader', biomes: ['urban'], mtype: 'humanoid' },
		{
			name: 'Dire Wolf',
			cr: 1,
			xp: 200,
			role: 'leader',
			biomes: ['forest', 'plains', 'arctic', 'mountains'],
			mtype: 'beast'
		},
		{
			name: 'Ghast',
			cr: 2,
			xp: 450,
			role: 'leader',
			biomes: ['dungeon', 'ruins', 'underdark', 'swamp'],
			mtype: 'undead'
		},
		{
			name: 'Bandit Captain',
			cr: 2,
			xp: 450,
			role: 'leader',
			biomes: ['forest', 'plains', 'urban', 'ruins', 'coastal'],
			mtype: 'humanoid'
		},
		{
			name: 'Gnoll Pack Lord',
			cr: 2,
			xp: 450,
			role: 'leader',
			biomes: ['plains', 'desert', 'ruins'],
			mtype: 'humanoid'
		},
		{
			name: 'Lizardfolk Shaman',
			cr: 2,
			xp: 450,
			role: 'leader',
			biomes: ['swamp', 'jungle', 'coastal'],
			mtype: 'humanoid'
		},
		{ name: 'Merrow', cr: 2, xp: 450, role: 'solo', biomes: ['coastal'], mtype: 'monstrosity' },
		{
			name: 'Grick',
			cr: 2,
			xp: 450,
			role: 'solo',
			biomes: ['underdark', 'dungeon', 'ruins', 'mountains'],
			mtype: 'monstrosity'
		},
		{
			name: 'Ogre',
			cr: 2,
			xp: 450,
			role: 'solo',
			biomes: ['plains', 'mountains', 'forest', 'swamp'],
			mtype: 'giant'
		},
		{
			name: 'Quaggoth',
			cr: 2,
			xp: 450,
			role: 'minion',
			biomes: ['underdark', 'dungeon'],
			mtype: 'humanoid'
		},
		{
			name: 'Giant Hyena',
			cr: 1,
			xp: 200,
			role: 'minion',
			biomes: ['plains', 'desert'],
			mtype: 'beast'
		},
		{
			name: 'Giant Constrictor',
			cr: 2,
			xp: 450,
			role: 'solo',
			biomes: ['jungle', 'swamp', 'desert'],
			mtype: 'beast'
		},
		{
			name: 'Green Hag',
			cr: 3,
			xp: 700,
			role: 'solo',
			biomes: ['forest', 'swamp', 'ruins'],
			mtype: 'fey'
		},
		{
			name: 'Hobgoblin Captain',
			cr: 3,
			xp: 700,
			role: 'leader',
			biomes: ['forest', 'plains', 'mountains', 'dungeon'],
			mtype: 'humanoid'
		},
		{
			name: 'Veteran',
			cr: 3,
			xp: 700,
			role: 'leader',
			biomes: ['urban', 'plains', 'ruins'],
			mtype: 'humanoid'
		},
		{
			name: 'Wight',
			cr: 3,
			xp: 700,
			role: 'leader',
			biomes: ['dungeon', 'ruins', 'underdark', 'arctic'],
			mtype: 'undead'
		},
		{
			name: 'Owlbear',
			cr: 3,
			xp: 700,
			role: 'solo',
			biomes: ['forest', 'mountains'],
			mtype: 'monstrosity'
		},
		{
			name: 'Manticore',
			cr: 3,
			xp: 700,
			role: 'solo',
			biomes: ['plains', 'desert', 'mountains'],
			mtype: 'monstrosity'
		},
		{
			name: 'Basilisk',
			cr: 3,
			xp: 700,
			role: 'solo',
			biomes: ['dungeon', 'ruins', 'mountains', 'plains'],
			mtype: 'monstrosity'
		},
		{
			name: 'Yeti',
			cr: 3,
			xp: 700,
			role: 'solo',
			biomes: ['arctic', 'mountains'],
			mtype: 'monstrosity'
		},
		{
			name: 'Yuan-ti Malison',
			cr: 3,
			xp: 700,
			role: 'leader',
			biomes: ['jungle', 'desert', 'ruins', 'dungeon'],
			mtype: 'humanoid'
		},
		{
			name: 'Giant Scorpion',
			cr: 3,
			xp: 700,
			role: 'solo',
			biomes: ['desert', 'ruins'],
			mtype: 'beast'
		},
		{
			name: 'Mummy',
			cr: 3,
			xp: 700,
			role: 'solo',
			biomes: ['desert', 'ruins', 'dungeon'],
			mtype: 'undead'
		},
		// ── Tier 2 (CR 4–9) ──────────────────────────────────────────────────
		{
			name: 'Orc War Chief',
			cr: 4,
			xp: 1100,
			role: 'leader',
			biomes: ['plains', 'mountains', 'forest', 'arctic'],
			mtype: 'humanoid'
		},
		{
			name: 'Chuul',
			cr: 4,
			xp: 1100,
			role: 'solo',
			biomes: ['underdark', 'swamp', 'coastal', 'dungeon'],
			mtype: 'aberration'
		},
		{
			name: 'Ettin',
			cr: 4,
			xp: 1100,
			role: 'solo',
			biomes: ['plains', 'mountains', 'forest'],
			mtype: 'giant'
		},
		{
			name: 'Werewolf',
			cr: 3,
			xp: 700,
			role: 'solo',
			biomes: ['forest', 'plains', 'urban'],
			mtype: 'humanoid'
		},
		{
			name: 'Drow Elite Warrior',
			cr: 5,
			xp: 1800,
			role: 'leader',
			biomes: ['underdark', 'dungeon'],
			mtype: 'humanoid'
		},
		{
			name: 'Troll',
			cr: 5,
			xp: 1800,
			role: 'solo',
			biomes: ['forest', 'mountains', 'swamp', 'arctic', 'dungeon'],
			mtype: 'giant'
		},
		{
			name: 'Bulette',
			cr: 5,
			xp: 1800,
			role: 'solo',
			biomes: ['plains', 'desert', 'mountains'],
			mtype: 'monstrosity'
		},
		{
			name: 'Night Hag',
			cr: 5,
			xp: 1800,
			role: 'solo',
			biomes: ['dungeon', 'ruins', 'underdark', 'swamp'],
			mtype: 'fiend'
		},
		{
			name: 'Wraith',
			cr: 5,
			xp: 1800,
			role: 'leader',
			biomes: ['dungeon', 'ruins', 'underdark'],
			mtype: 'undead'
		},
		{
			name: 'Vampire Spawn',
			cr: 5,
			xp: 1800,
			role: 'minion',
			biomes: ['dungeon', 'ruins', 'urban'],
			mtype: 'undead'
		},
		{ name: 'Giant Shark', cr: 5, xp: 1800, role: 'solo', biomes: ['coastal'], mtype: 'beast' },
		{
			name: 'Giant Crocodile',
			cr: 5,
			xp: 1800,
			role: 'solo',
			biomes: ['swamp', 'jungle', 'coastal'],
			mtype: 'beast'
		},
		{
			name: 'Sahuagin Baron',
			cr: 5,
			xp: 1800,
			role: 'leader',
			biomes: ['coastal'],
			mtype: 'humanoid'
		},
		{
			name: 'Roper',
			cr: 5,
			xp: 1800,
			role: 'solo',
			biomes: ['dungeon', 'underdark', 'mountains'],
			mtype: 'monstrosity'
		},
		{
			name: 'Gorgon',
			cr: 5,
			xp: 1800,
			role: 'solo',
			biomes: ['plains', 'mountains', 'ruins'],
			mtype: 'monstrosity'
		},
		{
			name: 'Chimera',
			cr: 6,
			xp: 2300,
			role: 'solo',
			biomes: ['plains', 'mountains', 'coastal', 'ruins'],
			mtype: 'monstrosity'
		},
		{
			name: 'Cyclops',
			cr: 6,
			xp: 2300,
			role: 'solo',
			biomes: ['plains', 'mountains', 'coastal', 'ruins'],
			mtype: 'giant'
		},
		{
			name: 'Medusa',
			cr: 6,
			xp: 2300,
			role: 'solo',
			biomes: ['ruins', 'dungeon', 'desert'],
			mtype: 'monstrosity'
		},
		{
			name: 'Wyvern',
			cr: 6,
			xp: 2300,
			role: 'solo',
			biomes: ['mountains', 'coastal', 'plains'],
			mtype: 'dragon'
		},
		{
			name: 'Young Black Dragon',
			cr: 7,
			xp: 2900,
			role: 'solo',
			biomes: ['swamp', 'jungle', 'dungeon'],
			mtype: 'dragon'
		},
		{
			name: 'Mind Flayer',
			cr: 7,
			xp: 2900,
			role: 'leader',
			biomes: ['underdark', 'dungeon'],
			mtype: 'aberration'
		},
		{ name: 'Stone Giant', cr: 7, xp: 2900, role: 'solo', biomes: ['mountains'], mtype: 'giant' },
		{
			name: 'Young White Dragon',
			cr: 6,
			xp: 2300,
			role: 'solo',
			biomes: ['arctic', 'mountains'],
			mtype: 'dragon'
		},
		{
			name: 'Young Green Dragon',
			cr: 8,
			xp: 3900,
			role: 'solo',
			biomes: ['forest', 'jungle'],
			mtype: 'dragon'
		},
		{
			name: 'Hydra',
			cr: 8,
			xp: 3900,
			role: 'solo',
			biomes: ['swamp', 'coastal', 'dungeon'],
			mtype: 'monstrosity'
		},
		{
			name: 'Frost Giant',
			cr: 8,
			xp: 3900,
			role: 'solo',
			biomes: ['arctic', 'mountains'],
			mtype: 'giant'
		},
		{
			name: 'Young Blue Dragon',
			cr: 9,
			xp: 5000,
			role: 'solo',
			biomes: ['desert', 'plains', 'coastal'],
			mtype: 'dragon'
		},
		{
			name: 'Fire Giant',
			cr: 9,
			xp: 5000,
			role: 'solo',
			biomes: ['mountains', 'dungeon'],
			mtype: 'giant'
		},
		// ── Tier 3 (CR 10–16) ────────────────────────────────────────────────
		{
			name: 'Young Red Dragon',
			cr: 10,
			xp: 5900,
			role: 'solo',
			biomes: ['mountains', 'dungeon', 'ruins'],
			mtype: 'dragon'
		},
		{
			name: 'Aboleth',
			cr: 10,
			xp: 5900,
			role: 'solo',
			biomes: ['underdark', 'dungeon', 'coastal'],
			mtype: 'aberration'
		},
		{
			name: 'Roc',
			cr: 11,
			xp: 7200,
			role: 'solo',
			biomes: ['mountains', 'coastal', 'plains'],
			mtype: 'monstrosity'
		},
		{
			name: 'Djinni',
			cr: 11,
			xp: 7200,
			role: 'solo',
			biomes: ['desert', 'plains', 'coastal'],
			mtype: 'elemental'
		},
		{
			name: 'Efreet',
			cr: 11,
			xp: 7200,
			role: 'solo',
			biomes: ['desert', 'mountains', 'dungeon'],
			mtype: 'elemental'
		},
		{
			name: 'Adult White Dragon',
			cr: 13,
			xp: 10000,
			role: 'solo',
			biomes: ['arctic', 'mountains'],
			mtype: 'dragon'
		},
		{
			name: 'Vampire',
			cr: 13,
			xp: 10000,
			role: 'solo',
			biomes: ['dungeon', 'ruins', 'urban'],
			mtype: 'undead'
		},
		{
			name: 'Beholder',
			cr: 13,
			xp: 10000,
			role: 'solo',
			biomes: ['dungeon', 'underdark'],
			mtype: 'aberration'
		},
		{
			name: 'Storm Giant',
			cr: 13,
			xp: 10000,
			role: 'solo',
			biomes: ['coastal', 'mountains', 'arctic'],
			mtype: 'giant'
		},
		{
			name: 'Adult Green Dragon',
			cr: 15,
			xp: 13000,
			role: 'solo',
			biomes: ['forest', 'jungle'],
			mtype: 'dragon'
		},
		{
			name: 'Adult Blue Dragon',
			cr: 16,
			xp: 15000,
			role: 'solo',
			biomes: ['desert', 'plains', 'coastal'],
			mtype: 'dragon'
		},
		// ── Tier 4 (CR 17–24+) ───────────────────────────────────────────────
		{
			name: 'Adult Red Dragon',
			cr: 17,
			xp: 18000,
			role: 'solo',
			biomes: ['mountains', 'dungeon', 'ruins'],
			mtype: 'dragon'
		},
		{
			name: 'Dragon Turtle',
			cr: 17,
			xp: 18000,
			role: 'solo',
			biomes: ['coastal'],
			mtype: 'dragon'
		},
		{
			name: 'Lich',
			cr: 21,
			xp: 33000,
			role: 'solo',
			biomes: ['dungeon', 'ruins', 'underdark'],
			mtype: 'undead'
		},
		{
			name: 'Ancient White Dragon',
			cr: 20,
			xp: 25000,
			role: 'solo',
			biomes: ['arctic', 'mountains'],
			mtype: 'dragon'
		},
		{
			name: 'Ancient Green Dragon',
			cr: 22,
			xp: 41000,
			role: 'solo',
			biomes: ['forest', 'jungle'],
			mtype: 'dragon'
		},
		{
			name: 'Ancient Red Dragon',
			cr: 24,
			xp: 62000,
			role: 'solo',
			biomes: ['mountains', 'dungeon', 'ruins'],
			mtype: 'dragon'
		}
	];

	function getEncounterTier(level: number): number {
		return level <= 4 ? 1 : level <= 10 ? 2 : level <= 16 ? 3 : 4;
	}
	function getCrRange(tier: number): [number, number] {
		if (tier === 1) return [0.125, 3];
		if (tier === 2) return [1, 10];
		if (tier === 3) return [5, 17];
		return [12, 25];
	}

	const biomeScenes: Record<string, string[]> = {
		forest: [
			'The path winds through ancient oaks, canopy filtering green light onto gnarled roots and ferns. Birdsong has gone quiet.',
			'Mist clings low among the pines. Footprints in the soft earth lead off the trail — and then stop.',
			'A clearing breaks the treeline. Bones of some large creature lie scattered among the wildflowers.'
		],
		plains: [
			'The grassland stretches to the horizon. Dry wind bends the tall grass in slow waves — and something moves against the wind.',
			'The road cuts through open farmland. Cart tracks end abruptly. A crow circles overhead.',
			'A lone dead tree stands in the middle of the plains, its bark scored with old claw marks.'
		],
		mountains: [
			'The mountain pass narrows between sheer cliff faces. Loose stones skitter down from somewhere above.',
			'Thin air and biting cold at altitude. The trail disappears around a boulder — and a shadow moves.',
			'An old watchtower, half-collapsed, overlooks the switchback trail below. Something watches from the arrow loops.'
		],
		desert: [
			'Heat shimmers off the cracked flats. Vultures circle. The ruins of a way-station loom ahead.',
			'Sand dunes give way to a rocky plateau. Tracks wind between the stones — recent, and more than one set.',
			'A dry riverbed cuts through sandstone bluffs. The silence here is absolute — unnaturally so.'
		],
		arctic: [
			'Biting wind scours the tundra. Snow has been disturbed ahead — a wide swathe, as if something large dragged itself through.',
			'The frozen lake catches pale sunlight. Cracks web the ice near the far shore. A dark shape moves beneath.',
			'Ice-rimed ruins protrude from the snowpack. Frost-covered bones line the approach.'
		],
		coastal: [
			'Waves crash against black rock below the cliff path. Sea spray and the smell of salt fill the air — and something else: blood.',
			"Tide pools glint in the afternoon light. The fisherman's hut ahead is dark, its door hanging open.",
			'A sea cave yawns in the cliff face. The sound of the tide mixes with a low, rhythmic clicking from inside.'
		],
		swamp: [
			'Black water reflects a sky the color of pewter. Something slides off a log into the murk ahead.',
			"Cypress knees and tangles of root make every step treacherous. A green glow pulses beneath the water's surface.",
			'The smell hits first — decay and stagnant water. The old village ahead has been abandoned longer than the moss on its walls.'
		],
		jungle: [
			'The canopy closes overhead, blocking the sky. Heat and humidity press down like a fist. Something screams in the distance.',
			"Brilliant flowers and buzzing insects mask the sounds of movement in the undergrowth — until it's too close.",
			'A massive tree has fallen, opening a shaft of light. Ancient stonework is visible beneath the tangle of roots.'
		],
		underdark: [
			'Phosphorescent fungi cast cold blue light across the cavern floor. The drip of water echoes in impossible distances.',
			'The tunnel opens into a vast underground space. Far below, lights move in slow procession — torches, or something else.',
			'A worked stone archway, half-collapsed, leads deeper. Carved warnings in an old language flank the door.'
		],
		urban: [
			'The alley between the warehouses is a dead end — too late, the party realizes they were herded here.',
			'The market square is strangely empty for this hour. Shutters are closed. A distant bell begins to toll.',
			'Rain slicks the cobblestones of the old quarter. A figure at the corner vanishes as the party approaches.'
		],
		dungeon: [
			'Torchlight gutters in a draft from ahead. The map shows a door here — but the door is already open.',
			'The chamber is large enough that the far wall is invisible. The floor is strewn with old adventuring gear — and bones.',
			'A collapsed section of ceiling created a rubble field. Movement comes from the shadows beyond it.'
		],
		ruins: [
			"The old keep's great hall has been swallowed by vines and weather. The floor is treacherous — and occupied.",
			"Crumbling walls and overgrown courtyards. Someone has built recent fires here. They haven't been out long.",
			'Faded frescoes depict a civilization that no longer exists. Whatever claimed this place since is stirring.'
		]
	};

	const archetypeTemplates: Record<
		string,
		{ names: string[]; descriptions: string[]; tactics: string[] }
	> = {
		solo: {
			names: ['Apex Predator', 'The Lone Terror', 'Territorial Encounter', 'Single Threat'],
			descriptions: [
				'{MONSTERS} has claimed this territory. It is aggressive, well-fed, and has had practice dealing with intruders.',
				"A single {MONSTERS} blocks the path. It moves with a predator's confidence, sizing up the weakest party members first.",
				'{MONSTERS} emerges from concealment — it was already aware of the party, and chose its moment carefully.'
			],
			tactics: [
				'Focuses attacks on whoever is dealing the most damage. Uses its full action economy and any legendary actions without hesitation.',
				'Opens at range or with a powerful strike, then retreats to a defensible position. Will not fight to the death if below 25% HP.',
				'Targets spellcasters and ranged attackers first. Uses terrain to break line of sight between attacks.'
			]
		},
		pack: {
			names: ['Pack Ambush', 'Hunting Group', 'Coordinated Attack', 'Pack Tactics'],
			descriptions: [
				'{MONSTERS} emerge from multiple directions simultaneously, cutting off easy retreat.',
				'Working in near-silence, {MONSTERS} have circled around the party. They attack together on a signal.',
				'{MONSTERS} have been tracking the party for some time. They chose this ground carefully.'
			],
			tactics: [
				'Pack tactics: multiple attackers on the same target. They try to isolate the squishiest party member.',
				'Half attack while half circle to flank. They attempt to knock prone before piling on.',
				"They don't retreat — but if 60% of the group falls, a Wisdom DC 10 morale check may scatter survivors."
			]
		},
		mixed: {
			names: ['Raiding Party', 'Led Assault', 'Commander & Troops', 'Mixed Warband'],
			descriptions: [
				'{LEADER} commands {MINIONS} from a protected position while sending them as shock troops.',
				'{LEADER} drives {MINIONS} forward — they are expendable muscle. The real threat hangs back and watches for openings.',
				'{MINIONS} hit the front line while {LEADER} prepares a more devastating follow-up strike.'
			],
			tactics: [
				'The leader holds back for 1-2 rounds, letting minions absorb initial blows and reveal party positioning.',
				'Minions focus one target to drop them fast; the leader attacks whoever responds to help.',
				'If the leader is killed or incapacitated, minions make a DC 12 Wisdom save or break and flee.'
			]
		},
		ambush: {
			names: ['Ambush!', 'Surprise Attack', 'Prepared Trap', 'Sprung Ambush'],
			descriptions: [
				'{MONSTERS} have been waiting here. The attack is triggered by a tripwire, a signal, or simply patient patience.',
				'Too late — the signs were there, but {MONSTERS} have already moved to cut off retreat. The party is surprised.',
				'{MONSTERS} attack from concealment, choosing the most vulnerable moment. First round: advantage on all attacks.'
			],
			tactics: [
				'Ambushers have advantage on attacks in the surprise round. They focus fire to drop one character immediately.',
				'Half the group attacks from range while the other half rushes the back line to prevent escape.',
				"If the ambush fails (party wasn't surprised), one group attempts to disengage and reset; the other holds."
			]
		},
		swarm: {
			names: ['Overwhelming Numbers', 'The Swarm', 'Horde Encounter', 'Endless Wave'],
			descriptions: [
				'{MONSTERS} pour from every crevice and shadow. There are too many to count at a glance.',
				'The ground itself seems to move. {MONSTERS} converge from all directions in a chittering, snarling mass.',
				"{MONSTERS} don't coordinate — they simply overwhelm by volume. Some will die. Most will reach you."
			],
			tactics: [
				'Area-of-effect spells are devastating here. The swarm prioritizes engulfing melee characters to prevent retreat.',
				'No tactics — pure pressure. Each creature attacks the nearest target. They do not flee.',
				'Killing the largest or most aggressive members may trigger a DC 10 Wisdom save to scatter the rest.'
			]
		}
	};

	const biomeTerrain: Record<string, string[]> = {
		forest: [
			'Dense undergrowth: difficult terrain 10 ft off-path. Trees provide half cover.',
			'Ancient fallen log bisects the clearing (Athletics DC 12 to vault; half cover when prone behind it).',
			'Low fog: visibility limited to 30 ft. Perception checks at disadvantage beyond that range.'
		],
		plains: [
			'Open ground: no cover, no difficult terrain. Ranged attacks unimpeded in all directions.',
			'Tall grass (3+ ft): difficult terrain. Small creatures have half cover; prone creatures are fully hidden.',
			'Gentle rise to the north: the high ground grants +1 to ranged attack rolls.'
		],
		mountains: [
			'Loose scree: DC 13 Athletics to move at full speed. Failure = prone.',
			'Cliff edge within 30 ft: creatures moved or knocked prone near the edge must save (DC 14 Acrobatics) or fall.',
			'Boulder field: provides 3/4 cover but costs 2 ft of movement per 1 ft traveled through the rocks.'
		],
		desert: [
			'Deep sand: difficult terrain throughout. Constitution saves (DC 12) every hour for non-adapted creatures.',
			'Sandstone pillars: plentiful 3/4 cover but line-of-sight is broken in all directions.',
			'Sinkholes: 3 random 5-ft squares are sinkholes (DC 14 Perception to notice). Fall = 15 ft, 5d6 bludgeoning.'
		],
		arctic: [
			'Packed ice: difficult terrain. Creatures who dash or are knocked back must succeed DC 12 Acrobatics or fall prone.',
			'Blinding glare: Perception checks at disadvantage when looking toward the sun. Sunglasses or hoods negate.',
			'Thin ice patch: up to 20 ft diameter. Each 10 ft of movement requires DC 10 Acrobatics or breaks through (2d6 cold, restrained).'
		],
		coastal: [
			'Wet rocks: difficult terrain, DC 12 Acrobatics to avoid falling prone when moving quickly.',
			'Tidal surge: every 3 rounds, a wave sweeps a 10-ft swath (DC 13 Strength save or pushed 10 ft, prone).',
			'Sea cave alcoves: plentiful half cover. The cave entrance is difficult terrain due to wave action.'
		],
		swamp: [
			'Knee-deep water: difficult terrain throughout. Sheathed weapons must be drawn as an action.',
			'Submerged hazard: 3 random squares hide submerged roots/debris (DC 13 Perception). Step = DC 12 Dex or fall prone.',
			'Fog bank: 30-ft radius of heavy fog. All creatures within are lightly obscured. Perception heavily disadvantaged.'
		],
		jungle: [
			'Canopy so thick it blocks direct sunlight: perpetual dim light conditions.',
			'Vines and undergrowth: difficult terrain throughout. Perception checks at disadvantage beyond 20 ft.',
			'Unstable ground: soft earth and roots. Large creatures have disadvantage on Dexterity saves.'
		],
		underdark: [
			'Stalactites overhead: ranged attacks that miss the target must check if they strike a stalactite (1 in 6 chance of triggering a ceiling collapse in that square).',
			'Phosphorescent pools: 10-ft radius of dim bioluminescent light. Creatures in them are visible even in magical darkness.',
			'Uneven cavern floor: difficult terrain. DC 12 Perception to spot drop-offs and sudden pits.'
		],
		urban: [
			'Alley choke points: two-wide passages at three locations. Area-of-effect spells risk hitting bystanders.',
			'Rooftops accessible via DC 12 Athletics (10 ft up). Ranged attackers on roofs gain half cover and elevation.',
			'Market debris: overturned stalls and crates provide half cover every 15 ft throughout the area.'
		],
		dungeon: [
			'Low ceiling (8 ft): Large creatures are squeezed. Flying creatures cannot fly.',
			'Pressure plates: 2 random squares are trapped (DC 14 Perception). Trigger = 20 ft cone of darts (2d4 piercing, DC 14 Dex save).',
			'Darkness: only light sources the party carries illuminate the fight. Creatures beyond their radius are hidden.'
		],
		ruins: [
			'Unstable flooring: each round each creature has 1-in-6 chance of stepping through (DC 13 Dex save or fall 10 ft).',
			'Collapsed walls: abundant 3/4 cover but also chokepoints — 5-ft passages between rubble piles.',
			'Overgrowth: vines and undergrowth reduce movement by half throughout. Fire spreads easily here.'
		]
	};

	let encounterBiome = $state('forest');
	let partySize = $state(4);
	let partyLevel = $state(5);
	let encounterDifficulty = $state('medium');
	let generatedEncounter = $state<EncounterResult | null>(null);

	const biomeEncounterLabel: Record<string, string> = {
		forest: 'Forest',
		plains: 'Plains',
		mountains: 'Mountains',
		desert: 'Desert',
		arctic: 'Arctic',
		coastal: 'Coastal',
		swamp: 'Swamp',
		jungle: 'Jungle',
		underdark: 'Underdark',
		urban: 'Urban',
		dungeon: 'Dungeon',
		ruins: 'Ruins'
	};

	function generateEncounter() {
		const tier = getEncounterTier(partyLevel);
		const [crMin, crMax] = getCrRange(tier);
		const budget = getXpBudget(partyLevel, encounterDifficulty, partySize);

		// Filter monsters by biome, CR range, and XP cap so over-budget monsters are excluded
		let candidates = monsterPool.filter(
			(m) =>
				m.biomes.includes(encounterBiome) &&
				m.cr >= crMin * 0.4 &&
				m.cr <= crMax * 1.5 &&
				m.xp <= budget * 1.5
		);
		if (!candidates.length)
			candidates = monsterPool.filter(
				(m) => m.cr >= crMin * 0.4 && m.cr <= crMax * 1.5 && m.xp <= budget * 1.5
			);
		if (!candidates.length)
			candidates = monsterPool.filter((m) => m.biomes.includes(encounterBiome));
		if (!candidates.length) candidates = [...monsterPool];

		const leaders = candidates.filter((m) => m.role === 'leader' || m.role === 'solo');
		const minions = candidates.filter((m) => m.role === 'minion');
		const solos = candidates.filter((m) => m.role === 'solo');
		const swarmy = candidates.filter((m) => m.role === 'swarm' || m.role === 'minion');

		// Helper: pick the monster whose XP is closest to a target value, with slight randomness
		function closestXp<T extends { xp: number }>(pool: T[], target: number): T {
			const ranked = [...pool].sort((a, b) => Math.abs(a.xp - target) - Math.abs(b.xp - target));
			return ranked[Math.floor(Math.random() * Math.min(3, ranked.length))];
		}

		// Pick viable archetypes
		const archetypes: string[] = [];
		if (solos.length) archetypes.push('solo');
		if (minions.length >= 2) archetypes.push('pack', 'swarm');
		if (leaders.length && minions.length) archetypes.push('mixed');
		archetypes.push('ambush'); // always viable
		const archetype = pickFrom(archetypes);

		let encounterMonsters: EncounterMonster[] = [];

		if (archetype === 'solo') {
			// Prefer solos with at least 30% of budget; find closest match
			const viable = solos.filter((m) => m.xp >= budget * 0.3);
			const pool = viable.length ? viable : solos;
			const m = pool.reduce((best, cur) =>
				Math.abs(cur.xp - budget) < Math.abs(best.xp - budget) ? cur : best
			);
			encounterMonsters = [{ name: m.name, count: 1, xp: m.xp }];
		} else if (archetype === 'pack') {
			// Target ~5 monsters; pick minion whose XP best fits that count
			const targetXpEach = budget / (5 * monsterMult(5, partySize));
			const m = closestXp(minions, targetXpEach);
			let count = 3;
			for (let c = 3; c <= 10; c++) {
				if (m.xp * c * monsterMult(c, partySize) >= budget * 0.75) {
					count = c;
					break;
				}
				count = c;
			}
			encounterMonsters = [{ name: m.name, count: Math.min(count, 10), xp: m.xp }];
		} else if (archetype === 'mixed') {
			const leader = pickFrom(leaders);
			const minionPool = minions.filter((m) => m.xp <= leader.xp * 1.5);
			const minionBudget = budget * 0.55;
			const targetMinionXp = minionBudget / (4 * monsterMult(4, partySize));
			const minion = closestXp(minionPool.length ? minionPool : minions, targetMinionXp);
			const minionCount = Math.max(
				2,
				Math.min(6, Math.round(minionBudget / (minion.xp * monsterMult(4, partySize))))
			);
			encounterMonsters = [
				{ name: leader.name, count: 1, xp: leader.xp },
				{ name: minion.name, count: minionCount, xp: minion.xp }
			];
		} else if (archetype === 'swarm') {
			// Target ~8 monsters; pick swarmer whose XP best fits
			const targetXpEach = budget / (8 * monsterMult(8, partySize));
			const m = closestXp(swarmy, targetXpEach);
			const count = Math.max(
				6,
				Math.min(15, Math.round(budget / (m.xp * monsterMult(8, partySize))))
			);
			encounterMonsters = [{ name: m.name, count, xp: m.xp }];
		} else {
			// ambush
			// Target ~3 monsters; pick candidate whose XP best fits
			const targetXpEach = budget / (3 * monsterMult(3, partySize));
			const m = closestXp(candidates, targetXpEach);
			const count = Math.max(
				2,
				Math.min(5, Math.round(budget / (m.xp * monsterMult(3, partySize))))
			);
			encounterMonsters = [{ name: m.name, count, xp: m.xp }];
		}

		const totalCount = encounterMonsters.reduce((s, m) => s + m.count, 0);
		const rawXp = encounterMonsters.reduce((s, m) => s + m.xp * m.count, 0);
		const mult = monsterMult(totalCount, partySize);
		const adjXp = Math.round(rawXp * mult);

		const scene = pickFrom(biomeScenes[encounterBiome] ?? biomeScenes['plains']);
		const archTmpl = archetypeTemplates[archetype];
		const monsterLine = encounterMonsters.map((m) => `${m.count}\xd7 ${m.name}`).join(' + ');
		const rawDesc = pickFrom(archTmpl.descriptions);
		const description = rawDesc
			.replace('{MONSTERS}', monsterLine)
			.replace('{LEADER}', encounterMonsters[0]?.name ?? '')
			.replace(
				'{MINIONS}',
				encounterMonsters
					.slice(1)
					.map((m) => `${m.count}\xd7 ${m.name}`)
					.join(' + ') || monsterLine
			);
		const tactics = pickFrom(archTmpl.tactics);
		const terrain = pickFrom(biomeTerrain[encounterBiome] ?? biomeTerrain['plains']);

		generatedEncounter = {
			title: `${biomeEncounterLabel[encounterBiome] ?? encounterBiome} — ${pickFrom(archTmpl.names)}`,
			scene,
			description,
			archetype,
			monsters: encounterMonsters,
			rawXp,
			adjustedXp: adjXp,
			xpPerPlayer: Math.round(rawXp / partySize),
			multiplier: mult,
			tactics,
			terrain,
			actualDifficulty: getActualDifficulty(adjXp, partyLevel, partySize)
		};
	}
	function generateNames() {
		generatedNames = Array.from({ length: 10 }, () => generateOneName(nameType));
	}
</script>

<!-- Backdrop -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex flex-col bg-gray-950"
	onkeydown={(e) => e.key === 'Escape' && onclose()}
>
	<!-- Header -->
	<div class="flex shrink-0 items-center gap-3 border-b border-gray-800 bg-gray-900 px-6 py-3">
		<span class="text-xl">📖</span>
		<h2 class="text-lg font-black tracking-widest text-amber-400 uppercase">Quick Reference</h2>
		<p class="ml-2 hidden text-xs text-gray-500 sm:block">D&amp;D 5e combat reference</p>
		<button
			onclick={onclose}
			class="ml-auto rounded-lg border border-gray-700 p-1.5 text-gray-400 transition hover:border-gray-500 hover:text-white"
			title="Close"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<!-- Body -->
	<div class="flex min-h-0 flex-1">
		<!-- Left nav -->
		<nav class="w-52 shrink-0 overflow-y-auto border-r border-gray-800 bg-gray-900/60 py-3">
			{#each categories as cat}
				<button
					onclick={() => (selected = cat.id)}
					class="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition
					       {selected === cat.id
						? 'bg-amber-900/30 font-semibold text-amber-300'
						: 'text-gray-400 hover:bg-gray-800 hover:text-white'}"
				>
					<span class="text-base leading-none">{cat.icon}</span>
					{cat.label}
				</button>
			{/each}
		</nav>

		<!-- Right content panel -->
		<div class="min-w-0 flex-1 overflow-y-auto px-8 py-6">
			<!-- ── Actions in Combat ────────────────────────────────── -->
			{#if selected === 'actions'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Actions in Combat
				</h3>
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="w-36 pb-2 text-left font-semibold text-gray-400">Action</th>
							<th class="pb-2 text-left font-semibold text-gray-400">Effect</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each [['Attack', 'Make one attack (more with Extra Attack). Replace one attack with a grapple or shove.'], ['Dash', 'Double your movement for the turn.'], ['Disengage', "Your movement doesn't provoke opportunity attacks this turn."], ['Dodge', 'Attacks against you have disadvantage. DEX saves have advantage. Benefit lost if incapacitated or speed drops to 0.'], ['Help', 'Give an ally advantage on their next ability check or one attack roll against a creature within 5 ft of you.'], ['Hide', 'Make a Stealth check. You become hidden if you beat the DC.'], ['Ready', 'Choose an action and a trigger. React to execute the action when the trigger occurs (before your next turn).'], ['Search', 'Devote attention to finding something — Perception or Investigation check.'], ['Use an Object', 'Interact with a second object (first is free) or use a special item property.'], ['Cast a Spell', 'Cast any spell with a casting time of 1 action.'], ['Use Class Feature', 'Activate a feature that requires an action (e.g. Second Wind, Divine Smite prep).'], ['Improvise', 'Attempt any reasonable action not listed. DM sets the rules on the fly.']] as [action, desc]}
							<tr>
								<td class="py-2 pr-4 align-top font-semibold text-white">{action}</td>
								<td class="py-2 text-gray-300">{desc}</td>
							</tr>
						{/each}
					</tbody>
				</table>

				<!-- ── Bonus Actions ────────────────────────────────────── -->
			{:else if selected === 'bonus'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Bonus Actions
				</h3>
				<div
					class="mb-4 rounded-lg border border-amber-800/40 bg-amber-900/10 px-4 py-3 text-sm text-amber-200"
				>
					You may only take <strong>one bonus action per turn</strong>. A bonus action can only be
					taken when a feature, spell, or ability specifically grants one.
				</div>
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="w-48 pb-2 text-left font-semibold text-gray-400">Source</th>
							<th class="pb-2 text-left font-semibold text-gray-400">Bonus Action</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each [['Two-Weapon Fighting', 'Attack with your off-hand light weapon (no ability modifier to damage).'], ['Spell (bonus action)', "Cast any spell with a casting time of 1 bonus action. Can't cast another non-cantrip spell on the same turn."], ['Rogue — Cunning Action', 'Dash, Disengage, or Hide.'], ['Druid — Wild Shape', "Transform into a beast you've seen."], ['Monk — Flurry of Blows', 'Spend 1 ki: two unarmed strikes.'], ['Monk — Patient Defense', 'Spend 1 ki: take Dodge action as bonus.'], ['Monk — Step of the Wind', 'Spend 1 ki: Disengage or Dash; jump distance doubled.'], ['Paladin — Divine Smite', 'Expend a spell slot after hitting to add radiant damage.'], ["Warlock — Hex / Hunter's Mark", 'Cast at normal casting time; move the curse/mark as bonus action.']] as [src, desc]}
							<tr>
								<td class="py-2 pr-4 align-top font-semibold text-white">{src}</td>
								<td class="py-2 text-gray-300">{desc}</td>
							</tr>
						{/each}
					</tbody>
				</table>

				<!-- ── Movement & Position ──────────────────────────────── -->
			{:else if selected === 'movement'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Movement &amp; Position
				</h3>
				<div class="space-y-6 text-sm">
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">General Rules</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>• Move up to your speed. You can split movement before and after your action.</li>
							<li>
								• <strong class="text-white">Difficult terrain</strong> costs 2 ft of movement per 1 ft
								traveled.
							</li>
							<li>
								• <strong class="text-white">Standing from prone</strong> costs half your speed.
							</li>
							<li>
								• <strong class="text-white">Crawling</strong> (while prone) costs 1 extra foot per foot
								moved.
							</li>
							<li>
								• <strong class="text-white">Climbing / Swimming</strong> costs 1 extra foot per foot
								unless you have a climb/swim speed.
							</li>
							<li>
								• <strong class="text-white">Jumping</strong> — long jump: STR score in feet (running
								start); high jump: 3 + STR modifier in feet.
							</li>
						</ul>
					</section>
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Opportunity Attacks</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>
								• Triggered when a hostile creature <strong class="text-white"
									>leaves your reach</strong
								> without Disengaging.
							</li>
							<li>• Reaction: make one melee attack against the creature.</li>
							<li>
								• Teleportation and being moved by another creature does <em>not</em> trigger OAs.
							</li>
						</ul>
					</section>
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Squeezing Through Tight Spaces</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>• A creature can squeeze through a space one size smaller than itself.</li>
							<li>• Costs 1 extra foot per foot moved.</li>
							<li>
								• Disadvantage on attack rolls and DEX saves; attacks against you have advantage.
							</li>
						</ul>
					</section>
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Space &amp; Size</h4>
						<table class="w-full">
							<thead>
								<tr class="border-b border-gray-700">
									<th class="pb-2 text-left font-semibold text-gray-400">Size</th>
									<th class="pb-2 text-left font-semibold text-gray-400">Space</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800">
								{#each [['Tiny', '2½ × 2½ ft'], ['Small', '5 × 5 ft'], ['Medium', '5 × 5 ft'], ['Large', '10 × 10 ft'], ['Huge', '15 × 15 ft'], ['Gargantuan', '20 × 20 ft or larger']] as [size, space]}
									<tr>
										<td class="py-1.5 pr-4 font-semibold text-white">{size}</td>
										<td class="py-1.5 text-gray-300">{space}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</section>
				</div>

				<!-- ── Conditions ───────────────────────────────────────── -->
			{:else if selected === 'conditions'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Conditions
				</h3>
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="w-32 pb-2 text-left font-semibold text-gray-400">Condition</th>
							<th class="pb-2 text-left font-semibold text-gray-400">Key Effect</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each [['Blinded', "Can't see. Attacks against it have advantage; its attacks have disadvantage. Auto-fail checks requiring sight."], ['Charmed', "Can't attack the charmer. Charmer has advantage on social ability checks against it."], ['Deafened', "Can't hear. Auto-fail checks requiring hearing."], ['Exhausted', 'See Exhaustion table. Removed by long rest (one level per rest).'], ['Frightened', "Disadvantage on ability checks and attacks while source is in line of sight. Can't willingly move closer to source."], ['Grappled', 'Speed = 0. Ends if grappler is incapacitated or if creature is moved out of reach.'], ['Incapacitated', "Can't take actions or reactions."], ['Invisible', "Can't be seen normally. Attacks against it have disadvantage; its attacks have advantage. Location still detectable by noise."], ['Paralyzed', "Incapacitated; can't move or speak. Auto-fail STR/DEX saves. Attacks against it have advantage. Hits within 5 ft are critical hits."], ['Petrified', "Transformed to stone; incapacitated; can't move or speak; unaware of surroundings. Resistance to all damage; immune to poison/disease. Auto-fail STR/DEX saves. Attacks have advantage."], ['Poisoned', 'Disadvantage on attack rolls and ability checks.'], ['Prone', 'Can only crawl or stand up (costs half speed). Disadvantage on attack rolls. Melee attacks against it have advantage; ranged attacks have disadvantage.'], ['Restrained', 'Speed = 0. Attacks against it have advantage; its attacks have disadvantage. Disadvantage on DEX saves.'], ['Stunned', "Incapacitated; can't move; can only speak falteringly. Auto-fail STR/DEX saves. Attacks against it have advantage."], ['Unconscious', "Incapacitated; can't move or speak; unaware of surroundings. Drops held items; falls prone. Auto-fail STR/DEX saves. Attacks have advantage; hits within 5 ft are critical."]] as [cond, desc]}
							<tr>
								<td class="py-2 pr-4 align-top font-semibold text-white">{cond}</td>
								<td class="py-2 text-gray-300">{desc}</td>
							</tr>
						{/each}
					</tbody>
				</table>

				<!-- ── Concentration ────────────────────────────────────── -->
			{:else if selected === 'concentration'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Concentration
				</h3>
				<div class="space-y-4 text-sm text-gray-300">
					<p>
						Maintaining a concentration spell requires focus. Only <strong class="text-white"
							>one concentration spell</strong
						> may be active at a time — casting a second automatically ends the first.
					</p>
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Concentration Breaks When…</h4>
						<ul class="space-y-1.5">
							<li>
								• <strong class="text-white">Damage taken</strong> — CON saving throw DC = max(10, ½ damage
								taken). Round down.
							</li>
							<li>
								• <strong class="text-white">Multiple hits same turn</strong> — separate save for each
								hit.
							</li>
							<li>• <strong class="text-white">Incapacitated or killed.</strong></li>
							<li>
								• <strong class="text-white">DM discretion</strong> — e.g. knocked prone by a large wave,
								crashing through a window.
							</li>
						</ul>
					</section>
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">CON Save DC Quick Reference</h4>
						<table class="w-full max-w-xs">
							<thead>
								<tr class="border-b border-gray-700">
									<th class="pb-2 text-left font-semibold text-gray-400">Damage Taken</th>
									<th class="pb-2 text-left font-semibold text-gray-400">DC</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800">
								{#each [['1–19', '10'], ['20–21', '10'], ['22–23', '11'], ['24–25', '12'], ['26–27', '13'], ['28–29', '14'], ['30–31', '15'], ['40–41', '20'], ['50+', '25']] as [dmg, dc]}
									<tr>
										<td class="py-1.5 pr-4 text-white">{dmg}</td>
										<td class="py-1.5 font-bold text-amber-300">{dc}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</section>
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Keeping Concentration</h4>
						<ul class="space-y-1.5">
							<li>
								• <strong class="text-white">War Caster feat</strong>: advantage on CON saves to
								maintain concentration.
							</li>
							<li>
								• <strong class="text-white">Resilient (Constitution) feat</strong>: proficiency on
								CON saves.
							</li>
							<li>• Concentration spells still require verbal/somatic components to cast.</li>
						</ul>
					</section>
				</div>

				<!-- ── Death Saving Throws ──────────────────────────────── -->
			{:else if selected === 'death'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Death Saving Throws
				</h3>
				<div class="space-y-4 text-sm text-gray-300">
					<p>
						When a creature drops to <strong class="text-white">0 HP</strong>, it falls unconscious
						and begins making death saving throws at the start of each of its turns. No ability
						modifier applies.
					</p>
					<table class="w-full max-w-sm">
						<thead>
							<tr class="border-b border-gray-700">
								<th class="pb-2 text-left font-semibold text-gray-400">Roll</th>
								<th class="pb-2 text-left font-semibold text-gray-400">Result</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each [['Nat 1', '2 failures'], ['2–9', '1 failure'], ['10–19', '1 success'], ['Nat 20', 'Regain 1 HP; stand up immediately']] as [roll, result]}
								<tr>
									<td class="py-1.5 pr-4 font-semibold text-white">{roll}</td>
									<td class="py-1.5 text-gray-300">{result}</td>
								</tr>
							{/each}
						</tbody>
					</table>
					<ul class="space-y-1.5">
						<li>
							• <strong class="text-white">3 successes</strong> — stabilized (unconscious but no longer
							dying).
						</li>
						<li>• <strong class="text-white">3 failures</strong> — dead.</li>
						<li>
							• <strong class="text-white">Taking damage at 0 HP</strong> — 1 failure (critical hit =
							2 failures).
						</li>
						<li>
							• <strong class="text-white">Massive damage</strong> — if damage from a single hit equals
							or exceeds max HP, instant death.
						</li>
						<li>• Stabilized creatures regain 1 HP after 1d4 hours if not healed first.</li>
						<li>• Successes and failures reset when the creature regains any HP.</li>
					</ul>
				</div>

				<!-- ── Exhaustion ───────────────────────────────────────── -->
			{:else if selected === 'exhaustion'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Exhaustion
				</h3>
				<p class="mb-4 text-sm text-gray-300">
					Effects are cumulative. A long rest removes <strong class="text-white">one level</strong> of
					exhaustion (requires food and water).
				</p>
				<table class="w-full max-w-md text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="w-16 pb-2 text-left font-semibold text-gray-400">Level</th>
							<th class="pb-2 text-left font-semibold text-gray-400">Effect</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each [['1', 'Disadvantage on ability checks'], ['2', 'Speed halved'], ['3', 'Disadvantage on attack rolls and saving throws'], ['4', 'Hit point maximum halved'], ['5', 'Speed reduced to 0'], ['6', 'Death']] as [lvl, effect]}
							<tr>
								<td class="py-2 pr-4 text-lg font-black text-amber-300">{lvl}</td>
								<td class="py-2 text-gray-300 {lvl === '6' ? 'font-semibold text-red-400' : ''}"
									>{effect}</td
								>
							</tr>
						{/each}
					</tbody>
				</table>
				<p class="mt-4 text-xs text-gray-500">
					Common sources: forced march, swimming in armor, starvation, some spells and monster
					abilities.
				</p>

				<!-- ── Cover ────────────────────────────────────────────── -->
			{:else if selected === 'cover'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Cover</h3>
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="w-44 pb-2 text-left font-semibold text-gray-400">Type</th>
							<th class="w-24 pb-2 text-left font-semibold text-gray-400">Bonus</th>
							<th class="pb-2 text-left font-semibold text-gray-400">Examples</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each [['Half Cover', '+2 AC &amp; DEX saves', 'Low wall, large furniture, another creature'], ['Three-Quarters Cover', '+5 AC &amp; DEX saves', 'Portcullis, arrow slit, thick tree trunk'], ['Full Cover', "Can't be targeted", 'Completely hidden behind a solid barrier']] as [type, bonus, examples]}
							<tr>
								<td class="py-2 pr-4 align-top font-semibold text-white">{type}</td>
								<td class="py-2 pr-4 align-top font-bold text-amber-300">{@html bonus}</td>
								<td class="py-2 text-gray-400">{examples}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<p class="mt-4 text-sm text-gray-400">
					A target has cover based on the <strong class="text-white"
						>most obstructing obstacle</strong
					> between attacker and target. Cover only applies if the obstacle is between the attacker's
					position and the target — draw a line from the attacker to the target to determine.
				</p>

				<!-- ── Light & Vision ───────────────────────────────────── -->
			{:else if selected === 'light'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Light &amp; Vision
				</h3>
				<div class="space-y-5 text-sm">
					<table class="w-full">
						<thead>
							<tr class="border-b border-gray-700">
								<th class="w-44 pb-2 text-left font-semibold text-gray-400">Light Level</th>
								<th class="pb-2 text-left font-semibold text-gray-400">Effect</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each [['Bright Light', 'Normal vision for all creatures.'], ['Dim Light', 'Lightly obscured. Disadvantage on Perception checks relying on sight.'], ['Darkness', 'Heavily obscured. Creatures effectively blinded unless they have Darkvision or Truesight.']] as [light, effect]}
								<tr>
									<td class="py-2 pr-4 align-top font-semibold text-white">{light}</td>
									<td class="py-2 text-gray-300">{effect}</td>
								</tr>
							{/each}
						</tbody>
					</table>
					<table class="w-full">
						<thead>
							<tr class="border-b border-gray-700">
								<th class="w-44 pb-2 text-left font-semibold text-gray-400">Vision Type</th>
								<th class="pb-2 text-left font-semibold text-gray-400">What It Does</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each [['Darkvision', 'Treat darkness as dim light (can see in B&amp;W) up to range. Dim light still treated as dim light.'], ['Blindsight', 'Perceive surroundings without relying on sight up to range. Unaffected by invisibility or darkness.'], ['Tremorsense', 'Detect vibrations; can sense creatures in contact with the same ground up to range.'], ['Truesight', 'See in magical darkness, see invisible creatures, see into the Ethereal Plane, and detect illusions/shapechangers up to range.']] as [type, desc]}
								<tr>
									<td class="py-2 pr-4 align-top font-semibold text-white">{type}</td>
									<td class="py-2 text-gray-300">{@html desc}</td>
								</tr>
							{/each}
						</tbody>
					</table>
					<div>
						<h4 class="mb-2 font-semibold text-gray-200">Obscurement</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>
								• <strong class="text-white">Lightly obscured</strong> (dim light, patchy fog, foliage):
								disadvantage on Perception checks relying on sight.
							</li>
							<li>
								• <strong class="text-white">Heavily obscured</strong> (darkness, dense fog, thick foliage):
								effectively blinded.
							</li>
						</ul>
					</div>
				</div>

				<!-- ── Resting ───────────────────────────────────────────── -->
			{:else if selected === 'resting'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Resting</h3>
				<div class="space-y-5 text-sm text-gray-300">
					<section class="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
						<h4 class="mb-2 font-black text-gray-100">
							Short Rest <span class="ml-2 font-normal text-gray-500">— 1+ hour</span>
						</h4>
						<ul class="space-y-1.5">
							<li>
								• Spend any number of <strong class="text-white">Hit Dice</strong>: roll each + CON
								modifier; regain that many HP.
							</li>
							<li>
								• Recover class features that refresh on a short rest (e.g. Warlock spell slots,
								Monk ki, Fighter Action Surge &amp; Second Wind).
							</li>
							<li>• Can be interrupted — requires 1 uninterrupted hour to benefit.</li>
						</ul>
					</section>
					<section class="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
						<h4 class="mb-2 font-black text-gray-100">
							Long Rest <span class="ml-2 font-normal text-gray-500">— 8 hours (6+ sleeping)</span>
						</h4>
						<ul class="space-y-1.5">
							<li>• Regain <strong class="text-white">all HP</strong>.</li>
							<li>
								• Regain <strong class="text-white">spent Hit Dice</strong> up to half your maximum (minimum
								1).
							</li>
							<li>
								• Regain <strong class="text-white">all spell slots</strong> and expended class features.
							</li>
							<li>
								• Remove <strong class="text-white">one level of exhaustion</strong> (if fed and watered).
							</li>
							<li>
								• Can take a long rest only <strong class="text-white">once per 24 hours</strong>.
							</li>
							<li>• More than 1 hour of combat or strenuous activity interrupts the rest.</li>
						</ul>
					</section>
				</div>

				<!-- ── Ability Check DCs ─────────────────────────────────── -->
			{:else if selected === 'checks'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Ability Check DCs
				</h3>
				<table class="mb-6 w-full max-w-xs text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="pb-2 text-left font-semibold text-gray-400">Difficulty</th>
							<th class="pb-2 text-left font-semibold text-gray-400">DC</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each [['Very Easy', '5'], ['Easy', '10'], ['Medium', '15'], ['Hard', '20'], ['Very Hard', '25'], ['Nearly Impossible', '30']] as [diff, dc]}
							<tr>
								<td class="py-1.5 pr-4 text-white">{diff}</td>
								<td class="py-1.5 text-lg font-black text-amber-300">{dc}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<div class="space-y-3 text-sm text-gray-300">
					<p>
						<strong class="text-white">Contested checks:</strong> both sides roll their relevant ability.
						Higher total wins. Ties go to the creature that initiated the contest.
					</p>
					<p>
						<strong class="text-white">Passive checks</strong> (e.g. Passive Perception) = 10 + all modifiers
						(including proficiency and advantage/disadvantage ±5).
					</p>
					<p>
						<strong class="text-white">Group checks:</strong> everyone rolls — if at least half the group
						succeeds, the group succeeds.
					</p>
				</div>

				<!-- ── Common Save DCs ───────────────────────────────────── -->
			{:else if selected === 'saves'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Common Save DCs
				</h3>
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="w-56 pb-2 text-left font-semibold text-gray-400">Save</th>
							<th class="pb-2 text-left font-semibold text-gray-400">DC Formula</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each [['Spell save DC', '8 + proficiency bonus + spellcasting ability modifier'], ['Concentration save', 'max(10, ½ damage taken) — round down'], ['Grapple (escape)', "Grappler's Athletics vs. your Athletics or Acrobatics"], ['Shove (resist)', "Attacker's Athletics vs. your Athletics or Acrobatics"], ['Trap / environmental', 'Varies — typically DC 10–20 based on trap tier'], ['Poison (generic)', 'Typically DC 10–15; varies by source']] as [save, formula]}
							<tr>
								<td class="py-2 pr-4 align-top font-semibold text-white">{save}</td>
								<td class="py-2 text-gray-300">{formula}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<div class="mt-5 space-y-2 text-sm text-gray-300">
					<h4 class="font-semibold text-gray-200">Spell Save DC by Modifier &amp; Proficiency</h4>
					<table class="w-full max-w-sm">
						<thead>
							<tr class="border-b border-gray-700">
								<th class="pb-1 text-left font-semibold text-gray-400">Modifier</th>
								{#each ['+2', '+3', '+4', '+5', '+6'] as prof}
									<th class="pb-1 text-center font-semibold text-gray-400">Prof {prof}</th>
								{/each}
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each [['+1', 11, 12, 13, 14, 15], ['+2', 12, 13, 14, 15, 16], ['+3', 13, 14, 15, 16, 17], ['+4', 14, 15, 16, 17, 18], ['+5', 15, 16, 17, 18, 19]] as [mod, ...dcs]}
								<tr>
									<td class="py-1 pr-2 font-semibold text-white">{mod}</td>
									{#each dcs as dc}
										<td class="py-1 text-center text-amber-200">{dc}</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- ── Encounter Difficulty ──────────────────────────────── -->
			{:else if selected === 'xp'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Encounter Difficulty
				</h3>
				<div class="space-y-5 text-sm">
					<div>
						<h4 class="mb-2 font-semibold text-gray-200">XP Thresholds per Character Level</h4>
						<table class="w-full max-w-lg">
							<thead>
								<tr class="border-b border-gray-700">
									<th class="w-16 pb-2 text-left font-semibold text-gray-400">Level</th>
									<th class="pb-2 text-right font-semibold text-gray-400">Easy</th>
									<th class="pb-2 text-right font-semibold text-gray-400">Medium</th>
									<th class="pb-2 text-right font-semibold text-gray-400">Hard</th>
									<th class="pb-2 text-right font-semibold text-gray-400">Deadly</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800 text-gray-300">
								{#each [[1, 25, 50, 75, 100], [2, 50, 100, 150, 200], [3, 75, 150, 225, 400], [4, 125, 250, 375, 500], [5, 250, 500, 750, 1100], [6, 300, 600, 900, 1400], [7, 350, 750, 1100, 1700], [8, 450, 900, 1400, 2100], [9, 550, 1100, 1600, 2400], [10, 600, 1200, 1900, 2800], [11, 800, 1600, 2400, 3600], [12, 1000, 2000, 3000, 4500], [13, 1100, 2200, 3400, 5100], [14, 1250, 2500, 3800, 5700], [15, 1400, 2800, 4300, 6400], [16, 1600, 3200, 4800, 7200], [17, 2000, 3900, 5900, 8800], [18, 2100, 4200, 6300, 9500], [19, 2400, 4900, 7300, 10900], [20, 2800, 5700, 8500, 12700]] as [lvl, easy, med, hard, deadly]}
									<tr>
										<td class="py-1 pr-4 font-bold text-amber-300">{lvl}</td>
										<td class="py-1 text-right">{easy}</td>
										<td class="py-1 text-right">{med}</td>
										<td class="py-1 text-right text-orange-300">{hard}</td>
										<td class="py-1 text-right text-red-400">{deadly}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					<div>
						<h4 class="mb-2 font-semibold text-gray-200">Monster Count Multiplier</h4>
						<table class="w-full max-w-xs">
							<thead>
								<tr class="border-b border-gray-700">
									<th class="pb-2 text-left font-semibold text-gray-400">Monsters</th>
									<th class="pb-2 text-left font-semibold text-gray-400">Multiplier</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800 text-gray-300">
								{#each [['1', '×1'], ['2', '×1.5'], ['3–6', '×2'], ['7–10', '×2.5'], ['11–14', '×3'], ['15+', '×4']] as [n, mult]}
									<tr>
										<td class="py-1.5 pr-4 text-white">{n}</td>
										<td class="py-1.5 font-bold text-amber-300">{mult}</td>
									</tr>
								{/each}
							</tbody>
						</table>
						<p class="mt-2 text-xs text-gray-500">
							Compare total adjusted XP against the <em>party's</em> thresholds (sum each character's
							threshold). Small parties (≤2) move one bracket up; large parties (≥6) move one bracket
							down.
						</p>
					</div>
				</div>

				<!-- ── Magic & Casting ─────────────────────────────────── -->
			{:else if selected === 'magic'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Magic &amp; Casting
				</h3>
				<div class="space-y-6 text-sm">
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Casting Times</h4>
						<table class="w-full">
							<thead
								><tr class="border-b border-gray-700"
									><th class="w-36 pb-2 text-left font-semibold text-gray-400">Time</th><th
										class="pb-2 text-left font-semibold text-gray-400">Notes</th
									></tr
								></thead
							>
							<tbody class="divide-y divide-gray-800">
								{#each [['Action', 'Standard. Most spells use this.'], ['Bonus Action', 'If you cast a bonus-action spell, your action that turn can only be used to cast a cantrip (2014 rules).'], ['Reaction', "On another creature's turn in response to a specific trigger defined in the spell (e.g. Shield, Counterspell)."], ['1 Minute +', 'Must use your action every turn during casting; concentration required throughout. Interruption = slot lost.'], ['Ritual (+10 min)', 'No spell slot expended. Takes 10 extra minutes. Cannot be used in combat for an instant result.']] as [time, note]}
									<tr
										><td class="py-2 pr-4 align-top font-semibold text-white">{time}</td><td
											class="py-2 text-gray-300">{note}</td
										></tr
									>
								{/each}
							</tbody>
						</table>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Ritual Casting</h4>
						<table class="w-full">
							<thead
								><tr class="border-b border-gray-700"
									><th class="w-36 pb-2 text-left font-semibold text-gray-400">Class</th><th
										class="pb-2 text-left font-semibold text-gray-400">Requirement</th
									></tr
								></thead
							>
							<tbody class="divide-y divide-gray-800">
								{#each [['Wizard', 'Any ritual tag spell in spellbook — no preparation required. Spellbook must be on hand.'], ['Cleric / Druid', 'Must have the spell prepared that day.'], ['Bard', 'Must know the spell.'], ['Ranger / Paladin', 'Cannot ritual cast by default.'], ['Ritual Caster feat', 'Any class; grants a ritual book with two spells; more can be added. No preparation required.']] as [cls, req]}
									<tr
										><td class="py-2 pr-4 align-top font-semibold text-white">{cls}</td><td
											class="py-2 text-gray-300">{req}</td
										></tr
									>
								{/each}
							</tbody>
						</table>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Spell Components</h4>
						<table class="w-full">
							<thead
								><tr class="border-b border-gray-700"
									><th class="w-28 pb-2 text-left font-semibold text-gray-400">Component</th><th
										class="pb-2 text-left font-semibold text-gray-400">Requirement &amp; Bypass</th
									></tr
								></thead
							>
							<tbody class="divide-y divide-gray-800">
								{#each [['V — Verbal', 'Must speak aloud at normal volume. Blocked by Silence spell, gag, or inability to speak.'], ['S — Somatic', 'Precise hand gesture; one free hand required. War Caster feat bypasses this restriction.'], ['M — Material', 'Item must be on hand. No-cost, non-consumed materials: substitute with component pouch (25 gp) or spellcasting focus. If the component has a listed gp cost or is consumed by the spell, the actual item is required — no substitutes.']] as [comp, rule]}
									<tr
										><td class="py-2 pr-4 align-top font-bold text-amber-300">{comp}</td><td
											class="py-2 text-gray-300">{rule}</td
										></tr
									>
								{/each}
							</tbody>
						</table>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">
							Spell Ranges &amp; Ranged Attacks in Melee
						</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>
								• <strong class="text-white">Self</strong> — affects only the caster or originates from
								them.
							</li>
							<li>
								• <strong class="text-white">Touch</strong> — must touch the target. Melee spell attack
								roll against an unwilling creature.
							</li>
							<li>
								• <strong class="text-white">Ranged</strong> — if a hostile creature is within 5 ft
								of you and can see you, you have <strong class="text-white">disadvantage</strong> on ranged
								spell attack rolls. Does not apply to saving-throw spells.
							</li>
						</ul>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Areas of Effect</h4>
						<table class="w-full">
							<thead
								><tr class="border-b border-gray-700"
									><th class="w-24 pb-2 text-left font-semibold text-gray-400">Shape</th><th
										class="pb-2 text-left font-semibold text-gray-400">How it works</th
									></tr
								></thead
							>
							<tbody class="divide-y divide-gray-800">
								{#each [['Cone', 'Widens from origin point. Width = distance from origin. 15-ft cone is ~3 squares wide at its far edge.'], ['Cube', 'Origin on a face; extends inward. 10-ft cube = 2×2 grid squares.'], ['Cylinder', 'Has a radius and height. Origin at center of circular base; origin point is included.'], ['Line', 'Straight path from origin with a length and width (typically 5 ft wide = 1 square).'], ['Sphere', 'Extends from origin in all directions. Origin included. 20-ft radius = 4 squares from center.']] as [shape, desc]}
									<tr
										><td class="py-2 pr-4 align-top font-semibold text-white">{shape}</td><td
											class="py-2 text-gray-300">{desc}</td
										></tr
									>
								{/each}
							</tbody>
						</table>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Spell Attack Rolls vs. Saving Throws</h4>
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
								<p class="mb-1 font-semibold text-white">Spell Attack Roll</p>
								<p class="mb-2 font-mono text-xs text-amber-300">d20 + ability mod + proficiency</p>
								<ul class="space-y-1 text-xs text-gray-300">
									<li>• Compare result to target AC</li>
									<li>• Nat 20 = critical hit (double dice)</li>
									<li>• Examples: Fire Bolt, Inflict Wounds</li>
								</ul>
							</div>
							<div class="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
								<p class="mb-1 font-semibold text-white">Saving Throw</p>
								<p class="mb-2 font-mono text-xs text-amber-300">
									DC = 8 + ability mod + proficiency
								</p>
								<ul class="space-y-1 text-xs text-gray-300">
									<li>• Target rolls d20 + their modifier vs. DC</li>
									<li>• Success: usually half damage; some spells have no effect</li>
									<li>• Failure: full effect</li>
								</ul>
							</div>
						</div>
						<p class="mt-2 text-xs text-gray-500">
							Spellcasting ability: INT (Wizard) · WIS (Cleric, Druid, Ranger) · CHA (Sorcerer,
							Warlock, Bard, Paladin)
						</p>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Spell Slots &amp; Upcasting</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>
								• <strong class="text-white">Cantrips (level 0)</strong> — no slot required; unlimited
								uses. Scale at character levels 5, 11, and 17.
							</li>
							<li>
								• <strong class="text-white">Upcasting</strong> — cast a spell with a higher-level slot;
								the spell uses that level for its effects. Only spells with an "At Higher Levels" clause
								benefit.
							</li>
							<li>
								• <strong class="text-white">Warlock slots</strong> — always cast at the caster's highest
								slot level; restored on a short rest.
							</li>
							<li>• Most full casters restore all slots on a long rest.</li>
						</ul>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Counterspell &amp; Dispel Magic</h4>
						<table class="w-full">
							<thead
								><tr class="border-b border-gray-700"
									><th class="w-36 pb-2 text-left font-semibold text-gray-400">Spell</th><th
										class="pb-2 text-left font-semibold text-gray-400">How it works</th
									></tr
								></thead
							>
							<tbody class="divide-y divide-gray-800">
								<tr>
									<td class="py-2 pr-4 align-top font-semibold text-white">Counterspell</td>
									<td class="space-y-0.5 py-2 text-gray-300">
										<div>
											Reaction · 60 ft · Trigger: a creature within range begins casting a spell.
										</div>
										<div>
											<strong class="text-white">3rd level or lower</strong> → automatic counter, no check.
										</div>
										<div>
											<strong class="text-white">4th level+</strong> → Spellcasting Ability check, DC
											= 10 + spell level. Upcast to match or exceed the spell level for an automatic counter.
										</div>
									</td>
								</tr>
								<tr>
									<td class="py-2 pr-4 align-top font-semibold text-white">Dispel Magic</td>
									<td class="space-y-0.5 py-2 text-gray-300">
										<div>Action · 120 ft · Target one creature, object, or magical effect.</div>
										<div>
											<strong class="text-white">3rd level or lower</strong> → automatically ends, no
											check.
										</div>
										<div>
											<strong class="text-white">4th level+</strong> → Spellcasting Ability check, DC
											= 10 + spell level. Upcast to match or exceed the spell level for an automatic end.
										</div>
									</td>
								</tr>
							</tbody>
						</table>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Combining Magical Effects</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>
								• <strong class="text-white">Different spells stack</strong> — effects from different
								spells add together while both are active.
							</li>
							<li>
								• <strong class="text-white">Same spell does not stack</strong> — if cast multiple times
								on the same target, only the most potent effect applies (e.g. two Bless spells → one set
								of bonus dice).
							</li>
							<li>
								• A spell bonus may still stack with a non-spell bonus from a class feature or item
								— DM judgment applies.
							</li>
						</ul>
					</section>
				</div>

				<!-- ── Name Generator ───────────────────────────────────── -->
			{:else if selected === 'names'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Name Generator
				</h3>
				<div class="flex flex-col gap-6">
					<!-- Controls -->
					<div class="flex flex-wrap items-center gap-3">
						<select
							bind:value={nameType}
							onchange={() => {
								generatedNames = [];
								generatedSurnames = [];
								selectedFirstName = '';
								selectedLastName = '';
							}}
							class="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
						>
							{#each nameTypeOptions as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
						<button
							onclick={generateNames}
							class="rounded-lg bg-amber-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-amber-500 active:scale-95"
						>
							First Names
						</button>
						<button
							onclick={generateSurnames}
							disabled={!surnameData[nameType]}
							class="rounded-lg bg-gray-700 px-5 py-2 text-sm font-bold text-gray-200 transition hover:bg-gray-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
						>
							Surnames
						</button>
					</div>

					{#if generatedNames.length === 0 && generatedSurnames.length === 0}
						<p class="text-sm text-gray-500">
							Select a type and click a button to generate 10 names.
						</p>
					{:else}
						<div
							class="grid gap-6 {generatedNames.length > 0 && generatedSurnames.length > 0
								? 'sm:grid-cols-2'
								: ''}"
						>
							{#if generatedNames.length > 0}
								<div>
									<p class="mb-2 text-xs font-bold tracking-widest text-gray-500 uppercase">
										First Names
									</p>
									<div class="flex flex-col gap-1.5">
										{#each generatedNames as name}
											<button
												onclick={() => {
													selectedFirstName = selectedFirstName === name ? '' : name;
												}}
												class="w-full rounded-lg border px-4 py-2.5 text-left text-sm font-semibold transition {selectedFirstName ===
												name
													? 'border-amber-500 bg-amber-900/30 text-amber-200'
													: 'border-gray-700 bg-gray-900/60 text-white hover:border-gray-500'}"
											>
												{name}
											</button>
										{/each}
									</div>
								</div>
							{/if}
							{#if generatedSurnames.length > 0}
								<div>
									<p class="mb-2 text-xs font-bold tracking-widest text-gray-500 uppercase">
										Surnames
									</p>
									<div class="flex flex-col gap-1.5">
										{#each generatedSurnames as name}
											<button
												onclick={() => {
													selectedLastName = selectedLastName === name ? '' : name;
												}}
												class="w-full rounded-lg border px-4 py-2.5 text-left text-sm font-semibold transition {selectedLastName ===
												name
													? 'border-amber-500 bg-amber-900/30 text-amber-200'
													: 'border-gray-700 bg-gray-900/60 text-white hover:border-gray-500'}"
											>
												{name}
											</button>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}

					{#if selectedFirstName}
						<div
							class="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900/60 px-4 py-3"
						>
							<span class="flex-1 text-sm text-gray-300">
								Party met <strong class="text-white"
									>{selectedFirstName}{selectedLastName ? ' ' + selectedLastName : ''}</strong
								>{nameTypeRace[nameType] ? ', ' + nameTypeRace[nameType] : ''}
							</span>
							<button
								onclick={saveNameToNotes}
								disabled={nameSaveStatus === 'saving'}
								class="rounded-lg px-4 py-1.5 text-xs font-bold transition active:scale-95 disabled:opacity-50 {nameSaveStatus ===
								'saved'
									? 'bg-green-700 text-white'
									: nameSaveStatus === 'error'
										? 'bg-red-700 text-white'
										: 'bg-amber-600 text-white hover:bg-amber-500'}"
							>
								{nameSaveStatus === 'saved'
									? 'Saved!'
									: nameSaveStatus === 'error'
										? 'Error'
										: 'Save to Notes'}
							</button>
						</div>
					{/if}
				</div>

				<!-- ── Weather & Travel ───────────────────────────────── -->
			{:else if selected === 'weather'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
					Weather &amp; Travel
				</h3>
				<div class="flex flex-col gap-8">
					<!-- Controls -->
					<div class="flex flex-wrap items-center gap-4">
						<div class="flex flex-col gap-1">
							<label
								class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
								for="weather-season">Season</label
							>
							<select
								id="weather-season"
								bind:value={selectedSeason}
								class="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
							>
								{#each seasonOptions as opt}<option value={opt.value}>{opt.label}</option>{/each}
							</select>
						</div>
						<div class="flex flex-col gap-1">
							<label
								class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
								for="weather-biome">Biome</label
							>
							<select
								id="weather-biome"
								bind:value={selectedBiome}
								class="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
							>
								{#each biomeOptions as opt}<option value={opt.value}>{opt.label}</option>{/each}
							</select>
						</div>
						<button
							onclick={generateWeek}
							class="mt-5 rounded-lg bg-amber-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-amber-500 active:scale-95"
						>
							Generate Week
						</button>
					</div>

					<!-- 7-day weather table -->
					{#if weekWeather.length > 0}
						<div class="overflow-x-auto rounded-xl border border-gray-700">
							<table class="min-w-full border-collapse text-xs">
								<thead>
									<tr class="border-b border-gray-700 bg-gray-900">
										<th class="sticky left-0 z-10 w-20 bg-gray-900 px-3 py-2 text-left"></th>
										{#each weekWeather as dw}
											<th class="px-3 py-2 text-center font-bold tracking-wider text-amber-400"
												>{dw.day}</th
											>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each weatherTimeSlots as t}
										<tr class="border-b border-gray-800/60">
											<td
												class="sticky left-0 z-10 border-r border-gray-800 bg-gray-900 px-3 py-2.5 text-[10px] font-bold tracking-widest whitespace-nowrap text-gray-400 uppercase"
												>{timeSlotLabels[t]}</td
											>
											{#each weekWeather as dw}
												{@const slot = dw.slots[t]}
												<td
													class="px-2.5 py-2 align-top {conditionBg[slot.condition] ??
														'bg-gray-800/30'}"
												>
													<div class="leading-snug font-medium whitespace-nowrap text-white">
														{slot.sky}
													</div>
													<div class="mt-0.5 text-[10px] whitespace-nowrap text-gray-400">
														{slot.temp} · {slot.wind}
													</div>
												</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<p class="text-sm text-gray-500">
							Select a season and biome, then click Generate Week.
						</p>
					{/if}

					<!-- Travel Pace -->
					<section>
						<h4 class="mb-3 text-sm font-black tracking-widest text-amber-400 uppercase">
							Travel Pace
						</h4>
						{#if paceMult !== 1}
							<div
								class="mb-3 space-y-0.5 rounded-lg border border-amber-700/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-300"
							>
								<p class="font-bold">
									Pace adjusted for current conditions (×{paceMult.toFixed(2)})
								</p>
								{#if biomeMult !== 1}<p class="text-amber-400/70">
										Biome ×{biomeMult} — {biomeReason}
									</p>{/if}
								{#if seasonMult !== 1}<p class="text-amber-400/70">
										Season ×{seasonMult} — {seasonReason}
									</p>{/if}
							</div>
						{/if}
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-gray-700">
									<th class="w-20 pb-2 text-left font-semibold text-gray-400">Pace</th>
									<th class="pb-2 text-left font-semibold text-gray-400">Speed</th>
									<th class="pb-2 text-left font-semibold text-gray-400">Per Hour</th>
									<th class="pb-2 text-left font-semibold text-gray-400">Per Day</th>
									<th class="pb-2 text-left font-semibold text-gray-400">Effect</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800">
								{#each paceRows as [pace, ftmin, mph, mpd, effect]}
									<tr>
										<td
											class="py-2 pr-4 font-bold {pace === 'Fast'
												? 'text-red-400'
												: pace === 'Slow'
													? 'text-green-400'
													: 'text-white'}">{pace}</td
										>
										<td class="py-2 pr-4 text-gray-300 tabular-nums">{ftmin}</td>
										<td class="py-2 pr-4 text-gray-300 tabular-nums">{mph}</td>
										<td class="py-2 pr-4 font-semibold text-amber-300 tabular-nums">{mpd}</td>
										<td class="py-2 text-gray-400">{effect}</td>
									</tr>
								{/each}
							</tbody>
						</table>
						<div class="mt-4 space-y-2 text-sm text-gray-400">
							<p>
								<strong class="text-white">Difficult terrain</strong> — halve all distances (Fast: {Math.round(
									15 * paceMult
								)} mi, Normal: {Math.round(12 * paceMult)} mi, Slow: {Math.round(9 * paceMult)} mi/day).
							</p>
							<p>
								<strong class="text-white">Forced march</strong> — after 8 hours, each extra hour requires
								a CON save (DC 10 + 1 per hour past 8). Fail = 1 level of exhaustion.
							</p>
							<p>
								<strong class="text-white">Galloping mount</strong> — a mount can gallop at 2× fast pace
								(~8 mi/hr) for up to 1 hour before needing rest.
							</p>
							<p>
								<strong class="text-white">Stealth (slow pace)</strong> — each member rolls Stealth; group
								check = lowest individual roll.
							</p>
						</div>
					</section>

					<!-- Navigation -->
					<section>
						<h4 class="mb-3 text-sm font-black tracking-widest text-amber-400 uppercase">
							Navigation
						</h4>
						<p class="mb-3 text-sm text-gray-400">
							One party member acts as Navigator. The DM may call for a <strong class="text-white"
								>Wisdom (Survival)</strong
							> check. On a fail, the party travels the wrong direction and must spend 1d6 hours reorienting.
						</p>
						<table class="w-full max-w-lg text-sm">
							<thead>
								<tr class="border-b border-gray-700">
									<th class="pb-2 text-left font-semibold text-gray-400">Terrain</th>
									<th class="w-12 pb-2 text-left font-semibold text-gray-400">DC</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800">
								{#each [['Grassland, meadow, or farmland', '5'], ['Arctic, desert, hills, or open sea with clear skies', '10'], ['Forest, jungle, swamp, mountains, or open sea (overcast)', '15']] as [terrain, dc]}
									<tr>
										<td class="py-1.5 pr-4 text-gray-300">{terrain}</td>
										<td class="py-1.5 text-lg font-black text-amber-300">{dc}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</section>
				</div>
			{/if}

			{#if selected === 'shop'}
				<div class="space-y-6 text-sm">
					<div class="mb-4 flex flex-wrap items-baseline gap-3">
						<h3 class="text-base font-black tracking-widest text-amber-400 uppercase">
							Shop Generator
						</h3>
						{#if generatedShopName}
							<span class="text-lg font-bold text-white">— {generatedShopName}</span>
						{/if}
					</div>
					<div class="flex flex-wrap items-end gap-4">
						<div class="flex flex-col gap-1">
							<label
								for="shop-type"
								class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
								>Shop Type</label
							>
							<select
								id="shop-type"
								bind:value={shopType}
								onchange={() => (generatedShop = [])}
								class="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
							>
								{#each Object.entries(shopData) as [key, shop]}<option value={key}
										>{shop.label}</option
									>{/each}
							</select>
						</div>
						<div class="flex flex-col gap-1">
							<label
								for="shop-affluence"
								class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
								>Town Affluence</label
							>
							<select
								id="shop-affluence"
								bind:value={shopAffluence}
								onchange={() => (generatedShop = [])}
								class="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
							>
								{#each Object.entries(affluenceData) as [key, aff]}<option value={key}
										>{aff.label}</option
									>{/each}
							</select>
						</div>
						<button
							onclick={generateShop}
							class="rounded-lg bg-amber-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-amber-500 active:scale-95"
							>Stock Shop</button
						>
					</div>
					{#if affluenceData[shopAffluence]}
						<p class="text-xs text-gray-500 italic">{affluenceData[shopAffluence].note}</p>
					{/if}
					{#if generatedShop.length > 0}
						<div class="overflow-x-auto rounded-xl border border-gray-700">
							<table class="w-full text-sm">
								<thead>
									<tr class="border-b border-gray-700 bg-gray-800/60">
										<th class="px-4 py-2.5 text-left font-semibold text-gray-300">Item</th>
										<th class="px-4 py-2.5 text-center font-semibold text-green-400">😊 Friendly</th
										>
										<th class="px-4 py-2.5 text-center font-semibold text-gray-300">😐 Neutral</th>
										<th class="px-4 py-2.5 text-center font-semibold text-red-400">😠 Hostile</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-800">
									{#each generatedShop as row, i}
										<tr
											onclick={() => (selectedShopItem = row)}
											class="cursor-pointer {i % 2 === 0
												? 'bg-gray-900/40'
												: ''} transition-colors hover:bg-gray-700/60"
										>
											<td class="px-4 py-2.5">
												<span class="text-gray-200">{row.name}</span>
												{#if row.rarity}
													<span
														class="ml-1.5 rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-widest uppercase {rarityColors[
															row.rarity
														] ?? 'text-gray-400'} border-current/30 bg-current/10"
														>{rarityLabels[row.rarity] ?? row.rarity}</span
													>
												{/if}
											</td>
											<td class="px-4 py-2.5 text-center font-semibold text-green-300 tabular-nums"
												>{row.liked}</td
											>
											<td class="px-4 py-2.5 text-center text-gray-300 tabular-nums"
												>{row.neutral}</td
											>
											<td class="px-4 py-2.5 text-center font-semibold text-red-300 tabular-nums"
												>{row.disliked}</td
											>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
						<p class="text-xs text-gray-600">
							Friendly: −15% · Neutral: base · Hostile: +25% · Click any item for details
						</p>
					{:else}
						<p class="text-sm text-gray-500">
							Select a shop type and town affluence, then click Stock Shop.
						</p>
					{/if}
					{#if selectedShopItem}
						<!-- Item detail overlay -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
							onclick={() => (selectedShopItem = null)}
							onkeydown={(e) => e.key === 'Escape' && (selectedShopItem = null)}
						>
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<div
								class="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
								onclick={(e) => e.stopPropagation()}
							>
								<!-- Header -->
								<div class="mb-4 flex items-start gap-3">
									<div class="flex-1">
										<h4 class="text-base font-bold text-white">{selectedShopItem.name}</h4>
										{#if selectedShopItem.rarity}
											<span
												class="mt-1 inline-block rounded border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase {rarityColors[
													selectedShopItem.rarity
												] ?? 'text-gray-400'} border-current/30 bg-current/10"
												>{rarityLabels[selectedShopItem.rarity] ?? selectedShopItem.rarity}</span
											>
										{:else}
											<span
												class="mt-1 inline-block text-[10px] font-bold tracking-widest text-gray-500 uppercase"
												>Mundane Item</span
											>
										{/if}
									</div>
									<button
										onclick={() => (selectedShopItem = null)}
										aria-label="Close item detail"
										class="rounded-lg border border-gray-700 p-1.5 text-gray-400 transition hover:border-gray-500 hover:text-white"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="2"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M6 18L18 6M6 6l12 12"
											/></svg
										>
									</button>
								</div>
								<!-- Prices -->
								<div class="mb-4 flex gap-5 rounded-lg bg-gray-800/60 px-4 py-3">
									<div class="text-center">
										<p class="text-[10px] font-bold tracking-widest text-green-400 uppercase">
											😊 Friendly
										</p>
										<p class="mt-0.5 font-semibold text-green-300 tabular-nums">
											{selectedShopItem.liked}
										</p>
									</div>
									<div class="text-center">
										<p class="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
											😐 Neutral
										</p>
										<p class="mt-0.5 text-gray-300 tabular-nums">{selectedShopItem.neutral}</p>
									</div>
									<div class="text-center">
										<p class="text-[10px] font-bold tracking-widest text-red-400 uppercase">
											😠 Hostile
										</p>
										<p class="mt-0.5 font-semibold text-red-300 tabular-nums">
											{selectedShopItem.disliked}
										</p>
									</div>
								</div>
								<!-- Description -->
								<p class="text-sm leading-relaxed text-gray-300">
									{itemDescriptions[selectedShopItem.name] ?? 'No description available.'}
								</p>
							</div>
						</div>
					{/if}

					{#if generatedShopName}
						<div
							class="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900/60 px-4 py-3"
						>
							<span class="flex-1 text-sm text-gray-300">
								The party went to <strong class="text-white">{generatedShopName}</strong>, a {affluenceData[
									shopAffluence
								]?.label.toLowerCase()}
								{shopData[shopType]?.label.toLowerCase()}
							</span>
							<button
								onclick={saveShopToNotes}
								disabled={shopSaveStatus === 'saving'}
								class="rounded-lg px-4 py-1.5 text-xs font-bold transition active:scale-95 disabled:opacity-50 {shopSaveStatus ===
								'saved'
									? 'bg-green-700 text-white'
									: shopSaveStatus === 'error'
										? 'bg-red-700 text-white'
										: 'bg-amber-600 text-white hover:bg-amber-500'}"
							>
								{shopSaveStatus === 'saved'
									? 'Saved!'
									: shopSaveStatus === 'error'
										? 'Error'
										: 'Save to Notes'}
							</button>
						</div>
					{/if}
				</div>
			{/if}

			{#if selected === 'encounter'}
				<div class="space-y-6 text-sm">
					<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">
						Random Encounter Generator
					</h3>

					<!-- Controls -->
					<div class="flex flex-wrap items-end gap-4">
						<div class="flex flex-col gap-1">
							<label
								for="enc-biome"
								class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
								>Biome / Terrain</label
							>
							<select
								id="enc-biome"
								bind:value={encounterBiome}
								class="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
							>
								{#each encounterBiomeOptions as opt}<option value={opt.value}>{opt.label}</option
									>{/each}
							</select>
						</div>
						<div class="flex flex-col gap-1">
							<label
								for="enc-size"
								class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
								>Party Size</label
							>
							<select
								id="enc-size"
								bind:value={partySize}
								class="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
							>
								{#each [1, 2, 3, 4, 5, 6, 7, 8] as n}<option value={n}
										>{n} player{n !== 1 ? 's' : ''}</option
									>{/each}
							</select>
						</div>
						<div class="flex flex-col gap-1">
							<label
								for="enc-level"
								class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
								>Party Level</label
							>
							<select
								id="enc-level"
								bind:value={partyLevel}
								class="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
							>
								{#each Array.from({ length: 20 }, (_, i) => i + 1) as lv}<option value={lv}
										>Level {lv}</option
									>{/each}
							</select>
						</div>
						<div class="flex flex-col gap-1">
							<label
								for="enc-diff"
								class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
								>Difficulty</label
							>
							<select
								id="enc-diff"
								bind:value={encounterDifficulty}
								class="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
							>
								{#each difficultyOptions as opt}<option value={opt.value}>{opt.label}</option
									>{/each}
							</select>
						</div>
						<button
							onclick={generateEncounter}
							class="rounded-lg bg-amber-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-amber-500 active:scale-95"
							>Generate</button
						>
					</div>

					{#if generatedEncounter}
						{@const enc = generatedEncounter}
						<div class="space-y-4 rounded-xl border border-gray-700 bg-gray-900/60 p-5">
							<!-- Title + difficulty badge -->
							<div class="flex flex-wrap items-center gap-2">
								<h4 class="text-sm font-black tracking-wide text-white">{enc.title}</h4>
								<span
									class="rounded border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase {difficultyColors[
										enc.actualDifficulty
									] ?? 'border-gray-700 text-gray-400'}">{enc.actualDifficulty}</span
								>
							</div>

							<!-- Scene -->
							<p
								class="border-l-2 border-amber-700/50 pl-3 text-xs leading-relaxed text-gray-400 italic"
							>
								{enc.scene}
							</p>

							<!-- Description -->
							<p class="text-sm leading-relaxed text-gray-300">{enc.description}</p>

							<!-- Monsters -->
							<div>
								<p class="mb-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
									Monsters
								</p>
								<div class="space-y-1">
									{#each enc.monsters as m}
										<div class="flex items-center gap-2">
											<span class="w-6 text-center font-black text-amber-400">{m.count}×</span>
											<span class="font-semibold text-white">{m.name}</span>
											<span class="text-xs text-gray-500 tabular-nums"
												>{m.xp} XP each · {m.xp * m.count} total</span
											>
										</div>
									{/each}
								</div>
							</div>

							<!-- XP breakdown -->
							<div
								class="flex flex-wrap gap-4 rounded-lg bg-gray-800/60 px-4 py-3 text-xs tabular-nums"
							>
								<div>
									<span class="text-gray-500">Raw XP </span><span
										class="font-semibold text-gray-200">{enc.rawXp}</span
									>
								</div>
								<div>
									<span class="text-gray-500">Multiplier </span><span
										class="font-semibold text-gray-200">×{enc.multiplier.toFixed(1)}</span
									>
								</div>
								<div>
									<span class="text-gray-500">Adjusted XP </span><span
										class="font-bold text-amber-300">{enc.adjustedXp}</span
									>
								</div>
								<div>
									<span class="text-gray-500">Per Player </span><span
										class="font-semibold text-gray-200">{enc.xpPerPlayer}</span
									>
								</div>
							</div>

							<!-- Tactics -->
							<div>
								<p class="mb-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
									Tactics
								</p>
								<p class="text-sm leading-relaxed text-gray-300">{enc.tactics}</p>
							</div>

							<!-- Terrain -->
							<div>
								<p class="mb-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
									Terrain Feature
								</p>
								<p class="text-sm leading-relaxed text-gray-300">{enc.terrain}</p>
							</div>

							<div class="mt-1 flex flex-wrap gap-2">
								<button
									onclick={generateEncounter}
									class="rounded-lg border border-gray-700 px-4 py-1.5 text-xs font-bold text-gray-400 transition hover:border-amber-700 hover:text-amber-400"
									>Roll Again</button
								>
								{#if onAddEncounter}
									<button
										onclick={() =>
											onAddEncounter!(enc.monsters.map((m) => ({ name: m.name, count: m.count })))}
										class="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-600 active:scale-95"
										>Add to Initiative</button
									>
								{/if}
							</div>
						</div>
					{:else}
						<p class="text-sm text-gray-500">
							Configure the party details above and click Generate to create a random encounter.
						</p>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
