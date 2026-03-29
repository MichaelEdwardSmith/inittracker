<!-- Full-screen Generators modal for DMs. Left column lists generator categories;
     right panel shows the selected generator. -->
<script lang="ts">
	import { browser } from '$app/environment';

	let {
		onclose,
		onAddEncounter,
		onOpenDungeon,
		onOpenTown,
		onOpenInn
	}: {
		onclose: () => void;
		onAddEncounter?: (monsters: { name: string; count: number }[]) => void;
		onOpenDungeon?: () => void;
		onOpenTown?: () => void;
		onOpenInn?: () => void;
	} = $props();

	type Category = {
		id: string;
		label: string;
		icon: string;
	};

	const categories: Category[] = [
		{ id: 'weather', label: 'Weather & Travel', icon: '🌦️' },
		{ id: 'encounter', label: 'Random Encounter', icon: '🎲' },
		{ id: 'wilderness', label: 'Wilderness Encounter', icon: '🌲' },
		{ id: 'names', label: 'Name Generator', icon: '📛' },
		{ id: 'town', label: 'Town Generator', icon: '🏘️' },
		{ id: 'shop', label: 'Shop Generator', icon: '🛒' },
		{ id: 'inn', label: 'Inn Generator', icon: '🍺' },
		{ id: 'dungeon', label: 'Dungeon Generator', icon: '🗺️' },
		{ id: 'wizard', label: "Wizard's Tower", icon: '🔮' },
		{ id: 'cult', label: 'Cult / Secret Society', icon: '🕯️' },
		{ id: 'guild', label: "Thieves' Guild", icon: '🗡️' },
		{ id: 'caravan', label: 'Trade Caravan', icon: '🐎' },
		{ id: 'blackmarket', label: 'Black Market', icon: '🪙' },
		{ id: 'noble', label: 'Noble House', icon: '🏰' },
		{ id: 'graveyard', label: 'Graveyard / Crypt', icon: '⚰️' },
		{ id: 'npc', label: 'NPC Generator', icon: '🧙' }
	];

	let selected = $state('weather');

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

	// ── Weather Event Generator ──────────────────────────────────────────────
	interface WeatherEvent {
		name: string;
		intensity: 'minor' | 'moderate' | 'severe' | 'catastrophic';
		duration: string;
		onset: string;
		description: string;
		mechanics: string[];
		aftermath: string;
	}

	let weatherEvent = $state<WeatherEvent | null>(null);

	const EVENT_POOLS: Record<
		string,
		Record<
			string,
			{
				name: string;
				onset: string;
				description: string;
				mechanics: string[];
				aftermath: string;
				intensity: WeatherEvent['intensity'];
			}[]
		>
	> = {
		spring: {
			forest: [
				{
					name: 'Flash Flood',
					intensity: 'severe',
					onset: 'Heavy rain builds over 2 hours before riverbeds overflow without warning.',
					description:
						'Torrential rain has swollen every stream and ditch. Trails become rivers of mud, low crossings flood in minutes, and the sound of rushing water drowns out normal communication.',
					mechanics: [
						'Movement halved on all ground',
						'Streams and rivers impassable without DC 14 Athletics',
						'Ranged attacks at disadvantage',
						'Foraging impossible'
					],
					aftermath:
						'Waters recede over 4–6 hours. Fallen trees block trails. Mudslides have reshaped slopes. Good foraging as disturbed earth exposes roots and tubers.'
				},
				{
					name: 'Sudden Hailstorm',
					intensity: 'moderate',
					onset:
						'Sky turns green-yellow over 30 minutes, then marble-sized hail falls without further warning.',
					description:
						'Hailstones the size of marbles hammer the canopy and anything exposed. Horses and pack animals panic. Leather and cloth offer no real protection.',
					mechanics: [
						'1d4 bludgeoning damage per round without cover',
						'Mounts must DC 12 Animal Handling or bolt',
						'Visibility 30 ft',
						'Fires extinguished'
					],
					aftermath:
						'Ice melts within an hour. Animals are skittish for the rest of the day. Hail strips young leaves and exposes nests.'
				},
				{
					name: 'Late Frost',
					intensity: 'minor',
					onset: 'Temperature plummets at dusk with no warning. Ground freezes by midnight.',
					description:
						'An unseasonal freeze turns the world brittle overnight. Morning reveals frost-burned blossoms and frozen puddles. Small creeks ice over at the edges.',
					mechanics: [
						'CON save DC 10 each watch without cold weather gear or fire',
						'Forage checks at disadvantage (plants damaged)',
						'Trails slick — DC 12 Acrobatics on steep ground'
					],
					aftermath:
						'Thaws by midday. Some trail sections remain muddy. Insects temporarily absent — unusually quiet woods.'
				},
				{
					name: 'Thunderstorm',
					intensity: 'moderate',
					onset:
						'Clouds build through the morning. Thunder heard in the distance for an hour before the storm arrives.',
					description:
						'A proper spring thunderstorm — dramatic, loud, and soaking. Lightning strikes high ground and lone trees. The forest channels wind into unexpected gusts between the trunks.',
					mechanics: [
						'Heavy rain: disadvantage on Perception (hearing)',
						'Lightning: DC 13 DEX save for anyone under a lone tree when it strikes (1/hour chance)',
						'Ranged attacks at disadvantage',
						'DC 13 Survival to navigate without landmarks'
					],
					aftermath:
						'Clears in 1d4 hours. Ozone smell lingers. Fallen branches and fresh mud. Navigation easier as landmarks washed clean.'
				}
			],
			plains: [
				{
					name: 'Severe Thunderstorm',
					intensity: 'severe',
					onset: 'Wall of cloud advancing from the west, visible for an hour before arrival.',
					description:
						'Nothing between the party and the sky. Lightning strikes the plains with extraordinary frequency. A single bolt near the party sends a shockwave felt in the chest. Nowhere to hide.',
					mechanics: [
						'Lightning: DC 15 DEX save or 4d10 lightning (1/30 min on open ground)',
						'Wind 40+ mph: disadvantage on ranged attacks, flying creatures grounded',
						'Visibility 60 ft',
						'Metal armour: disadvantage on saves vs. lightning'
					],
					aftermath:
						'Storm passes in 1d3 hours. Scorched grass in a wide radius. Any metal objects left out may be magnetized or damaged.'
				},
				{
					name: 'Tornado Warning',
					intensity: 'catastrophic',
					onset:
						'Sky turns green. Absolute silence. Then a roar like a waterfall from the southwest.',
					description:
						'A funnel cloud drops from the sky and tears a quarter-mile path across the plains. The suction pulls loose objects into the air. Anything not sheltered or tied down is gone.',
					mechanics: [
						'Without shelter: DC 18 STR save or flung 2d6 × 10 ft, 4d6 bludgeoning',
						'With shelter (ditch, stone structure): DC 13 CON save or stunned 1 round',
						'All unsecured equipment and mounts: DC 15 STR save or lost',
						'Lasts 1d6 minutes in one location'
					],
					aftermath:
						'Path of destruction 1/4 mile wide. Debris for miles. Livestock and wildlife scattered. Potential to find unusual items carried from miles away.'
				},
				{
					name: 'Dust Storm',
					intensity: 'moderate',
					onset: 'A brown wall on the horizon moving fast. 10 minutes warning at most.',
					description:
						'A rolling wall of dust and grit scours everything in its path. Breathing is difficult. Eyes water. The world turns brown and textureless. Orientation becomes impossible without a compass.',
					mechanics: [
						'Visibility 5 ft',
						'CON save DC 12 each hour or gain 1 level of exhaustion',
						'Navigation impossible without compass and DC 15 Survival',
						'Perception (sight) checks automatically fail'
					],
					aftermath:
						'Grit in everything. Food and water supplies may be compromised. Landscape features shifted or buried. Tracks completely obscured.'
				}
			],
			mountains: [
				{
					name: 'Spring Avalanche',
					intensity: 'catastrophic',
					onset: 'Loud crack from above. Then nothing. Then the roar.',
					description:
						'Warming temperatures have destabilized the snowpack above. A slab the size of a great hall tears loose and accelerates downslope, carrying trees and boulders in its mass.',
					mechanics: [
						'DC 18 DEX save or 8d10 bludgeoning and buried',
						'Buried: suffocation rules apply (PHB), DC 15 STR to dig out per round',
						'Path width 200 ft, length up to 1 mile',
						'Sound audible 5 miles — may attract attention'
					],
					aftermath:
						'Trail completely blocked. New debris field takes days to navigate. Fresh snow surface is unstable for 24 hours. Exposed rock may reveal cave entrances.'
				},
				{
					name: 'Sudden Blizzard',
					intensity: 'severe',
					onset:
						'Temperature drops 20 degrees in 30 minutes. Snow begins gently, becomes a whiteout in an hour.',
					description:
						'A spring blizzard in the high passes is worse than a winter one — the snow is wet and heavy, clings to everything, and the melt-freeze cycle creates treacherous ice on every surface.',
					mechanics: [
						'Visibility 10 ft',
						'Movement halved',
						'CON save DC 14 per hour without shelter or fire',
						'All exposed checks at disadvantage'
					],
					aftermath:
						'May persist 1d4 days. Heavy wet snow collapses shelters not built for it. Reveals tracks perfectly once it stops — both yours and others.'
				},
				{
					name: 'Mountain Fog',
					intensity: 'minor',
					onset: 'Fog rolls in from below the tree line as temperatures equalise at dawn.',
					description:
						'Dense cloud sits in the passes, reducing visibility to arm length. Sound carries oddly — voices seem distant, footsteps are muffled. The temperature difference between fog and clear air is disorienting.',
					mechanics: [
						'Visibility 10 ft in affected areas',
						'Navigation: DC 14 Survival or veer off course',
						'Sound: advantage on Stealth, disadvantage on Perception (sight)',
						'Lasts until midday or until wind picks up'
					],
					aftermath:
						'Clears suddenly when wind arrives. Wet surfaces everywhere. Moss and lichen visibly swollen with moisture.'
				}
			],
			desert: [
				{
					name: 'Sandstorm',
					intensity: 'severe',
					onset: 'A brown wall visible on the horizon for 20 minutes.',
					description:
						'The air turns solid with moving sand. Exposed skin is flayed. Breathing requires a cloth covering. Landmarks disappear. Compass needles spin as static electricity builds.',
					mechanics: [
						'Visibility 0 ft',
						'CON save DC 14 each hour or 1 level of exhaustion',
						'All sight-based Perception automatically fail',
						'Navigation impossible',
						'1d4 piercing damage per round without full cover'
					],
					aftermath:
						'Sand in all containers not sealed. New dunes have formed — old paths may be buried. Exposed rock cleaned smooth. Animal tracks erased entirely.'
				},
				{
					name: 'Haboob',
					intensity: 'moderate',
					onset: 'Towering wall of dust 1,000 ft high advances at 35 mph. Visible 30 minutes out.',
					description:
						'A haboob rolls like a tidal wave of earth, blocking the sun and turning noon to midnight. The leading edge is a wall of grit that scours everything it touches.',
					mechanics: [
						'Visibility 0 ft for 1d6 hours',
						'CON save DC 12 per hour without cover',
						'Static electricity: metal objects spark; advantage on saves vs. lightning for 12 hours after',
						'All food and water must be checked for contamination afterward'
					],
					aftermath:
						'Fresh sand dunes repositioned. Some buried structures may be partially exposed. Others newly buried.'
				}
			],
			arctic: [
				{
					name: 'Whiteout Blizzard',
					intensity: 'severe',
					onset: 'Wind picks up within minutes. Temperature drops fast.',
					description:
						'Wind-driven snow creates total whiteout conditions. The horizon disappears. Sky and ground merge into a single blank white. Sound is absorbed. Cold is immediate and absolute.',
					mechanics: [
						'Visibility 0 ft',
						'Movement halved',
						'CON save DC 15 per hour without shelter',
						'Navigation impossible',
						'Tracks erased within 10 minutes'
					],
					aftermath:
						'New snow 2–4 feet deep. Paths buried. Perfect tracking conditions for fresh movement once storm ends.'
				},
				{
					name: 'Ice Storm',
					intensity: 'moderate',
					onset: 'Temperature rises slightly, then freezing rain begins coating everything.',
					description:
						'Freezing rain encases the world in a shell of clear ice. Every surface becomes glass. Trees crack under the weight. Moving at speed is a near-suicidal act.',
					mechanics: [
						'All ground movement DC 13 Acrobatics or fall prone',
						'Movement halved even on success',
						'1d6 cold damage per hour without shelter',
						'Climbing impossible without crampons'
					],
					aftermath:
						'Ice persists for 1d4 days. Beautiful but treacherous. Trees continue to crack and fall for hours. Animals completely sheltered.'
				}
			],
			swamp: [
				{
					name: 'Monsoon Surge',
					intensity: 'severe',
					onset: 'Rain intensifies over hours. Water levels begin rising visibly.',
					description:
						'The swamp has absorbed all it can. Water rises across the entire basin, submerging paths and shorelines, turning knee-deep crossings into chest-deep swims.',
					mechanics: [
						'All ground movement halved',
						'Swimming required for 30% of terrain',
						'DC 13 CON save per hour of wet cold (temp drops at night)',
						'Visibility 30 ft in rain'
					],
					aftermath:
						'Waters may take 1d4 days to recede. New channels form. Old paths vanish. Creatures displaced from deeper water move into new areas.'
				},
				{
					name: 'Fog Blanket',
					intensity: 'minor',
					onset: 'Fog rises from the water surface at dusk. By midnight it is impenetrable.',
					description:
						'Swamp fog is unlike any other — it smells of rotting vegetation and carries heat, sitting heavy and warm against the skin. Sound travels in impossible ways. Lights create halos but illuminate nothing.',
					mechanics: [
						'Visibility 10 ft',
						'Navigation DC 15 Survival',
						"Will-o'-wisp encounters: roll twice, take worse result",
						'Disadvantage on all Perception (sight)'
					],
					aftermath:
						'Burns off by mid-morning. Everything is damp. Insects immediately active. Unusual silence then sudden noise as the swamp comes back to life.'
				}
			],
			coast: [
				{
					name: 'Coastal Storm',
					intensity: 'severe',
					onset: 'Swell builds for 12 hours before storm makes landfall.',
					description:
						'A coastal storm drives waves forty feet up the cliffs and floods the beach entirely. The wind is strong enough to strip leaves from trees. Any vessel in the open water is in serious danger.',
					mechanics: [
						'Coastal areas flooded to 20 ft above normal tide',
						'Wind: disadvantage on ranged attacks, flying grounded',
						'Vessels: DC 16 Survival (Seamanship) to avoid running aground',
						'Navigation on shore: DC 14 Survival'
					],
					aftermath:
						'Significant debris on beaches. Sea caves may be newly accessible or previously accessible ones blocked. Excellent foraging for washed-up materials.'
				}
			]
		},
		summer: {
			forest: [
				{
					name: 'Wildfire',
					intensity: 'catastrophic',
					onset:
						'Smoke visible on the horizon. Wind shifts toward the party. The fire crests a ridge above them.',
					description:
						'A crown fire moves faster than a running horse through dry summer forest. Embers fly ahead of the main blaze, starting spot fires in the path of retreat. The heat is intense enough to char at fifty feet.',
					mechanics: [
						'Move away from fire each round or take 4d10 fire damage',
						'DC 15 CON save per round in smoke zone or incapacitated',
						'No safe cover within the fire zone',
						'Exits: any clear direction perpendicular to wind'
					],
					aftermath:
						'Blackened forest for miles. Ash makes tracking impossible. New growth in 1 week. Animals flee the zone — area is eerily quiet for days.'
				},
				{
					name: 'Heat Lightning Storm',
					intensity: 'moderate',
					onset: 'No rain. Just thunder and lightning from a hot, clear-seeming sky.',
					description:
						'Dry thunderstorm — lightning with no rain. The forest floor crackles with static. Hair stands on end. The smell of ozone is constant. Lightning strikes without the shelter of rain to suppress fires.',
					mechanics: [
						'Lightning: DC 13 DEX save (1/hour near trees)',
						'Fire risk: roll after each strike; on 1 in 6, spot fire starts',
						'Extreme heat: DC 12 CON save per hour without shade and water',
						'Ranged attacks at disadvantage in storm'
					],
					aftermath:
						'Several small fires may have started. Smoke haze for miles. Navigation by landmark unreliable. Animals agitated and unpredictable for the rest of the day.'
				},
				{
					name: 'Drought Conditions',
					intensity: 'minor',
					onset:
						'Water sources have been shrinking for days. The largest stream is now ankle-deep.',
					description:
						'An extended dry period has reduced this normally lush forest to something brittle and tinder-dry. Streams are reduced to trickles. Usual foraging sources have failed. Wildlife congregates near the last reliable water.',
					mechanics: [
						'Water sources: DC 14 Survival to find any beyond marked sources',
						'Foraging: disadvantage on all checks',
						'Fire: any open flame is a significant risk — DC 13 to prevent spread in dry undergrowth'
					],
					aftermath:
						'Ongoing until rain arrives. Creatures near water sources may include unexpected predators. First rain after drought creates a sudden riot of plant growth.'
				}
			],
			plains: [
				{
					name: 'Heatwave',
					intensity: 'moderate',
					onset: 'Temperature rises above normal for days. No relief at night.',
					description:
						'A sustained heatwave turns the plains into a furnace. The horizon shimmers. Water evaporates from skins faster than expected. Shadows are precious and rare.',
					mechanics: [
						'CON save DC 13 per hour of travel without shade and water',
						'Fail: 1 level of exhaustion',
						'Forced march: DC increases to 16',
						'Mounts: require double water rations'
					],
					aftermath:
						'Conditions may persist 1d4 days. After a heatwave, the first cool night feels supernatural.'
				}
			],
			mountains: [
				{
					name: 'Afternoon Thunderstorm',
					intensity: 'moderate',
					onset: 'Clear morning. Clouds build after noon. Storm hits by mid-afternoon on schedule.',
					description:
						'Mountain summer thunderstorms run on a reliable schedule — clear mornings, deadly afternoons. This one is on time. Lightning finds high ground, exposed ridges, and lone peaks with lethal reliability.',
					mechanics: [
						'Lightning: DC 14 DEX save on exposed high ground (every 30 min)',
						'Visibility 100 ft in rain',
						'Footing: DC 12 Acrobatics on steep wet rock',
						'Temperature drops 15 degrees in 30 minutes'
					],
					aftermath:
						'Clears by evening. Rock surfaces treacherous until dry. Small rockfalls may have blocked or opened passages.'
				}
			],
			desert: [
				{
					name: 'Extreme Heat Event',
					intensity: 'severe',
					onset: 'Temperature has been climbing for three days. Today it will exceed 120°F.',
					description:
						'The air itself seems hostile. Metal burns to the touch. Shadows offer little relief. Any exertion becomes a medical emergency. The sand surface temperature could cook meat.',
					mechanics: [
						'CON save DC 15 per hour of travel',
						'Fail: 1 level of exhaustion',
						'Water: double consumption required',
						'Without full water ration: auto-fail saves',
						'Animal survival at risk'
					],
					aftermath:
						'Heat may ease by night. Oasis water levels have dropped. Some small animals have died. Unusual mirages and optical effects persist.'
				},
				{
					name: 'Flash Flood in Wadi',
					intensity: 'severe',
					onset: 'No local rain. Distant thunder. Then a sound like a freight train from upstream.',
					description:
						'Rainfall miles away in the mountains sends a wall of water through the dry wadi with no local warning. The flood carries boulders and debris. It fills a dry canyon to ten feet in minutes.',
					mechanics: [
						'DC 16 DEX save or swept away: 4d6 bludgeoning + drowning rules',
						'Wall of water moves at 40 ft per round',
						'Boulder field after flood: difficult terrain',
						'No warning without a DC 16 Perception (hearing)'
					],
					aftermath:
						'Wadi scoured clean. New boulder fields and sand deposits. Water available in pools for 1d4 days after. Unusual items deposited from upstream.'
				}
			],
			arctic: [
				{
					name: 'Arctic Summer Storm',
					intensity: 'moderate',
					onset: 'Wind picks up from the north. Temperature drops despite the season.',
					description:
						'Even in summer the arctic delivers. A sudden storm drops visibility and temperature simultaneously. Snow in the middle of a warm day is disorienting in a way that flat winter cold is not.',
					mechanics: [
						'Visibility 30 ft',
						'Movement halved',
						'CON save DC 12 per hour',
						'Navigation: DC 14 Survival'
					],
					aftermath:
						'Clears within hours. Snow melts by afternoon. A reminder that the arctic has no off-season.'
				}
			],
			swamp: [
				{
					name: 'Tropical Downpour',
					intensity: 'moderate',
					onset: 'Humidity has been building all morning. The break point comes suddenly at noon.',
					description:
						'Rain so heavy it is almost impossible to breathe while facing into it. Every depression fills immediately. The swamp surface becomes a moving sheet of brown water.',
					mechanics: [
						'Visibility 30 ft',
						'All ground movement halved',
						'Disadvantage on Perception (hearing)',
						'Lasts 1d4 hours'
					],
					aftermath:
						'Immediate rise in standing water. Paths that were marginal are now impassable. Intense heat returns within an hour of rain stopping.'
				}
			],
			coast: [
				{
					name: 'Hurricane',
					intensity: 'catastrophic',
					onset: 'Swell builds for 24 hours. Barometric pressure drops rapidly. Birds flee inland.',
					description:
						'A full hurricane makes landfall. Storm surge pushes seawater miles inland. Wind speeds make standing upright impossible. The eye passes with eerie calm before the second wall hits.',
					mechanics: [
						'Wind: any exposed creature DC 16 STR save each round or pushed 15 ft',
						'Storm surge: coastal areas flood 1d6 × 10 ft above normal tide',
						'All structures: DC 18 to remain intact',
						'Eye of storm: 1d6 hours of calm in the middle'
					],
					aftermath:
						'Catastrophic damage. Roads washed out. Entire coastline reshaped. Unusual deep-sea creatures washed ashore. Weeks of cleanup.'
				}
			]
		},
		autumn: {
			forest: [
				{
					name: 'Windstorm',
					intensity: 'moderate',
					onset: 'Wind builds through the day. By evening, gusts are stripping branches.',
					description:
						'An autumn windstorm tears through the trees, felling dead wood and widowmakers that have waited for exactly this moment. The canopy roars and lurches. Moving through forest is dangerous even without enemies.',
					mechanics: [
						'Falling branches: DC 13 DEX save each 10 min or 2d6 bludgeoning',
						'Ranged attacks at disadvantage',
						'Flying impossible',
						'Navigation: DC 12 Survival (familiar landmarks obscured)'
					],
					aftermath:
						'New deadfall everywhere. Some routes impassable. Excellent firewood. Tracks clearly preserved under fallen leaves.'
				},
				{
					name: 'Early Snow',
					intensity: 'minor',
					onset: 'Temperature drops quickly. First flakes by mid-afternoon.',
					description:
						'The first snow of the year, earlier than expected. The leaves are still on the trees, and the wet snow clings to them in enormous clumps that fall without warning as the weight builds.',
					mechanics: [
						'Snow clumps: DC 10 DEX save each 5 min or soaked (disadvantage on stealth)',
						'Movement: three-quarters speed',
						'Navigation: familiar trails look different under fresh snow'
					],
					aftermath:
						'Melts within 1d3 days. Tracking ideal during and after. Animals unusually active — feeding before true winter arrives.'
				}
			],
			plains: [
				{
					name: 'Hard Frost',
					intensity: 'minor',
					onset: 'Clear night, temperature drops below freezing by midnight.',
					description:
						'A hard frost locks the plains in silence. The ground rings like stone underfoot. Every puddle is a mirror of ice. Breath clouds drift in the still air.',
					mechanics: [
						'CON save DC 11 per watch without shelter or fire',
						'Forage: disadvantage on checks',
						'Ice on ponds and streams: 1-inch thickness, DC 14 to cross without breaking'
					],
					aftermath:
						'May persist for days as season turns. Ground freezes harder each night. Excellent tracking conditions.'
				},
				{
					name: 'Autumn Storm',
					intensity: 'moderate',
					onset:
						'Dark clouds rolling in from the northwest. Temperature drops 15 degrees in an hour.',
					description:
						'A classic autumn storm — cold rain mixed with sleet, driven horizontal by the wind. The plains offer no shelter. Everything gets wet.',
					mechanics: [
						'Cold rain: CON save DC 12 per hour',
						'Visibility 60 ft',
						'Movement: three-quarters speed',
						'Fires difficult to start (DC 16 Survival)'
					],
					aftermath:
						'Mud everywhere for 1d4 days. Temperature remains low. Good tracking conditions.'
				}
			],
			mountains: [
				{
					name: 'First Winter Storm',
					intensity: 'severe',
					onset:
						'Cloud cap descends over the summit. Temperature plummets. Snow begins at the pass.',
					description:
						'Winter arrives in the mountains days or weeks before the lowlands. The first real storm of the season is always serious — the snow is wet, the wind is brutal, and the passes that were open in the morning are closed by nightfall.',
					mechanics: [
						'Visibility 10 ft',
						'Movement halved',
						'CON save DC 14 per hour without shelter',
						'Pass closes: DC 18 Survival to navigate',
						'May persist 1d4 days'
					],
					aftermath:
						'Passes may remain closed until spring. Tracks show everything that moved before the snow. Any shelter discovered during storm is genuinely valuable.'
				}
			],
			desert: [
				{
					name: 'Cold Desert Night',
					intensity: 'minor',
					onset: 'Sun sets. Temperature drops 50 degrees in 2 hours.',
					description:
						'The desert has no insulation. The same land that baked at 100°F reaches near-freezing by midnight. The transition is faster than most expect.',
					mechanics: [
						'CON save DC 12 per watch without shelter or fire',
						'Creatures without cold weather gear: disadvantage on CON saves',
						'Condensation: water available from surfaces by morning (DC 14 Survival)'
					],
					aftermath: 'Desert nights get colder each week. Cold-weather hazards persist until dawn.'
				}
			],
			arctic: [
				{
					name: 'Polar Vortex Edge',
					intensity: 'severe',
					onset: 'Wind from the north intensifies rapidly. Temperature drops 40 degrees overnight.',
					description:
						'The polar vortex has dipped south, pushing lethal cold over terrain that was merely harsh before. The air burns to breathe. Metal sticks to skin.',
					mechanics: [
						'CON save DC 16 per hour without full winter gear and shelter',
						'Exposed skin: frostbite in 1 minute (Exhaustion 1)',
						'All liquids freeze outside containers within 10 minutes',
						'Fire: requires DC 15 Survival to start in wind'
					],
					aftermath:
						'May persist 1d6 days. Cold snap often preceded by period of unusual wildlife activity. After: ice forms on all water sources.'
				}
			],
			swamp: [
				{
					name: 'Autumn Mist',
					intensity: 'minor',
					onset: 'Temperature drops overnight. Mist forms on the water surface by dawn.',
					description:
						'The swamp vanishes into mist. Familiar landmarks disappear. The mist muffles sound and distorts distance. Lights in the mist move in impossible ways.',
					mechanics: [
						'Visibility 20 ft',
						'Navigation DC 15 Survival',
						"Will-o'-wisps more likely (DM discretion)",
						'Disadvantage on Perception (sight)'
					],
					aftermath:
						'Burns off by noon. Animals move during mist — unusual tracks. Condensation provides water on every surface.'
				}
			],
			coast: [
				{
					name: 'Autumn Gale',
					intensity: 'moderate',
					onset: 'Barometric pressure drops rapidly over 6 hours.',
					description:
						'An autumn gale drives walls of rain and spray inland. The sea is completely impassable. Even on land, gusts reach 60 mph, turning loose objects into projectiles.',
					mechanics: [
						'Wind: disadvantage on ranged attacks, flying impossible',
						'Debris: DC 12 DEX save each 30 min or 1d6 bludgeoning',
						'Visibility 60 ft',
						'All vessels: anchor or be driven ashore'
					],
					aftermath:
						'Storm wrack deposited across miles of beach. Unusual items washed ashore. Sea calms within 12 hours.'
				}
			]
		},
		winter: {
			forest: [
				{
					name: 'Ice Storm',
					intensity: 'severe',
					onset:
						'Temperature hovers just below freezing. Rain begins. Within an hour, everything is encased in ice.',
					description:
						'Freezing rain coats the forest in glass. Every branch is a weapon waiting to fall. The trees groan and crack under the weight. Walking is nearly impossible. The beauty is absolute and lethal.',
					mechanics: [
						'All movement DC 13 Acrobatics or fall prone',
						'Falling branches: DC 14 DEX save per 10 min or 2d8 bludgeoning',
						'Climbing impossible without crampons',
						'Temperature: CON save DC 13 per hour'
					],
					aftermath:
						'Ice persists 1d4 days. Catastrophic deadfall. Trails completely impassable until ice melts. Tracking impossible on ice surface.'
				},
				{
					name: 'Blizzard',
					intensity: 'severe',
					onset:
						'Cloud cover builds overnight. Snow begins before dawn. Intensity builds through the morning.',
					description:
						'A true blizzard — not merely snow but a whiteout driven by wind. The cold is secondary to the disorientation. Every direction looks the same. The trail disappears within minutes of it being made.',
					mechanics: [
						'Visibility 10 ft',
						'Movement halved',
						'CON save DC 15 per hour without shelter',
						'Navigation impossible without DC 18 Survival',
						'Shelter: DC 14 Survival to construct adequate snow shelter'
					],
					aftermath:
						'2–4 feet of new snow. All trails buried. Perfect tracking once it ends. Deadfall buried. Excellent natural shelter material (snow caves).'
				}
			],
			plains: [
				{
					name: 'Prairie Blizzard',
					intensity: 'catastrophic',
					onset:
						'Temperature drops. Wind increases. Snow begins lightly, then without transition becomes a whiteout.',
					description:
						'With nothing to break the wind, a plains blizzard is among the most dangerous weather events possible. Visibility drops to zero in minutes. People have died fifty feet from shelter they could not find.',
					mechanics: [
						'Visibility 0 ft in open, 10 ft with wind break',
						'Movement halved',
						'CON save DC 16 per hour without shelter',
						'Navigation impossible',
						'Each hour without shelter: auto-fail one death save from cold'
					],
					aftermath:
						'Drifts 6–10 feet in hollows. Roads buried for 1d6 days. Livestock losses significant. Perfect tracking once it passes.'
				},
				{
					name: 'Black Ice',
					intensity: 'moderate',
					onset: 'Rain followed by rapid freeze. Roads glaze overnight.',
					description:
						'The road surface is invisible. Black ice coats stone, dirt, and grass with equal enthusiasm. Everything looks normal until the first step proves it is not.',
					mechanics: [
						'All ground movement: DC 14 Acrobatics or fall prone',
						'Mounted movement: DC 16 Animal Handling per 100 ft',
						'Half movement even on success',
						'Persists until temperature rises above freezing'
					],
					aftermath:
						'May persist multiple days in shadow. Accidents widespread. Wagons jackknifed. Fallen riders common.'
				}
			],
			mountains: [
				{
					name: 'Alpine Blizzard',
					intensity: 'catastrophic',
					onset:
						'Cloud drops below the pass elevation. Visibility drops to ten feet. Temperature falls 30 degrees.',
					description:
						'The high passes become death traps. Wind drives snow horizontally. Ice forms on exposed skin in minutes. The trail is completely invisible. Crevasses, ledges, and drops are undetectable.',
					mechanics: [
						'Visibility 0 ft',
						'Movement: quarter speed',
						'CON save DC 17 per hour without shelter',
						'Navigation impossible',
						'Fall risk: DC 16 Perception to detect hazards'
					],
					aftermath:
						'Passes closed for 1d10 days minimum. Any shelter found becomes a survival priority. New snow may have covered or revealed entrances.'
				},
				{
					name: 'Rime Ice Formation',
					intensity: 'minor',
					onset: 'Fog at freezing temperature over several hours.',
					description:
						'Fog freezes directly onto every surface, creating elaborate crystal formations. The world becomes a sculpture garden of impossible beauty. Every surface is coated in white crystals that shatter at a touch.',
					mechanics: [
						'Movement DC 11 Acrobatics on rock surfaces',
						'Weight: structures may be stressed',
						'Navigation: landmarks look different',
						'DC 13 Survival to avoid walking onto icy overhang'
					],
					aftermath:
						'Rime melts when sun reaches it. Photographic beauty. Surfaces slick until fully dried.'
				}
			],
			desert: [
				{
					name: 'Freezing Night',
					intensity: 'moderate',
					onset: 'Rapid temperature drop after sunset.',
					description:
						'The desert winter night reaches temperatures that would kill an unprepared lowlander without a second thought. The cold arrives faster than anyone expects and the clear sky offers zero insulation.',
					mechanics: [
						'CON save DC 14 per watch without cold gear',
						'Water sources freeze overnight (1 inch)',
						'Fire essential: DC 12 Survival to start in wind',
						'Mounts at risk if not sheltered'
					],
					aftermath:
						'Ice on all water sources until mid-morning. Cold lingers in shade all day. Daytime temperature may reach 60°F — a 70-degree swing in 12 hours.'
				}
			],
			arctic: [
				{
					name: 'Deep Freeze',
					intensity: 'catastrophic',
					onset: 'Temperature already at -30°F. Then it drops further.',
					description:
						'A deep freeze event pushes temperatures to -60°F or below. Metal becomes brittle. Breath freezes before it disperses. Sound carries differently in extreme cold — distant objects seem closer. Exposed flesh freezes in seconds.',
					mechanics: [
						'CON save DC 18 per hour without full winter gear and shelter',
						'Exposed skin: frostbite in 10 seconds (1 level exhaustion)',
						'Metal weapons: shatter on roll of 1 (DC 15 STR save)',
						'Fire: impossible above 30 mph wind without magical means'
					],
					aftermath:
						'The aftermath is more cold. Extreme winter events in the arctic often persist for days. Any water source is now permafrost.'
				},
				{
					name: 'Blizzard',
					intensity: 'severe',
					onset: 'Wind builds from the north. Snow appears from nowhere.',
					description:
						'A full arctic blizzard is survivable only with preparation and shelter. Wind speeds exceed 70 mph. The temperature becomes irrelevant in the face of the windchill. Navigation is impossible even with instruments.',
					mechanics: [
						'Visibility 0 ft',
						'Movement quarter speed',
						'CON save DC 16 per hour',
						'Navigation impossible',
						'Snow cave: DC 14 Survival, provides effective shelter'
					],
					aftermath:
						'New snow 4–6 feet deep. Pressure ridges in sea ice. Any tracks from before the storm are gone.'
				}
			],
			swamp: [
				{
					name: 'Hard Freeze',
					intensity: 'moderate',
					onset: 'Temperature drops below 20°F overnight. Water surfaces freeze by dawn.',
					description:
						'The swamp freezes — partially, unpredictably. Some surfaces can bear weight. Others are a thin crust over open water. The silence is total. Every sound carries. The ice creates unexpected paths and traps the usual ones.',
					mechanics: [
						'Ice thickness varies: DC 13 Perception to assess before stepping',
						'Thin ice: break on roll of 1-3 on d6; full immersion',
						'Movement: DC 12 Acrobatics on ice surfaces',
						'CON save DC 13 per hour without shelter'
					],
					aftermath:
						'Thaw creates worse footing than either ice or open water. Animals that usually retreat to deep water are accessible. Unusual items may be frozen into the ice.'
				}
			],
			coast: [
				{
					name: 'Winter Storm',
					intensity: 'severe',
					onset:
						'Swell builds for 24 hours. Temperature at the coast is 28°F. Rain arrives as sleet.',
					description:
						'A winter storm at the coast is a combination of every hazard: icing, wind, driving sleet, storm surge, and freezing spray that coats every surface. Ships in harbor are in danger at their moorings.',
					mechanics: [
						'All surfaces: ice coating, DC 13 Acrobatics to move',
						'Wind: 60 mph, disadvantage on ranged, flying impossible',
						'Cold: CON save DC 14 per hour',
						'Storm surge: coastal flooding 1d6 × 5 ft above normal tide'
					],
					aftermath:
						'Complete icing of coastal structures. Ships may be damaged at anchor. Unusual sea creatures may have been driven ashore.'
				}
			]
		}
	};

	function generateWeatherEvent() {
		const biome = selectedBiome;
		const season = selectedSeason;
		const pool = EVENT_POOLS[season]?.[biome] ?? EVENT_POOLS[season]?.['forest'] ?? [];
		if (!pool.length) {
			weatherEvent = null;
			return;
		}
		const entry = pool[Math.floor(Math.random() * pool.length)];
		// Duration based on intensity
		const durations: Record<string, string[]> = {
			minor: ['1d4 hours', '2d4 hours', '4–6 hours'],
			moderate: ['1d6 hours', '4–8 hours', 'Half a day'],
			severe: ['1d4 days', '6–24 hours', 'Until the next morning'],
			catastrophic: ['1d6 days', '12–48 hours', 'Several days']
		};
		const dPool = durations[entry.intensity] ?? durations.moderate;
		const duration = dPool[Math.floor(Math.random() * dPool.length)];
		weatherEvent = { ...entry, duration };
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
		const inventoryRows = generatedShop
			.map(
				(row) =>
					`<li>${row.name}${row.rarity ? ` <em>(${rarityLabels[row.rarity] ?? row.rarity})</em>` : ''} — Friendly: ${row.liked} / Neutral: ${row.neutral} / Hostile: ${row.disliked}</li>`
			)
			.join('');
		const inventoryHtml = inventoryRows
			? `<p><strong>Inventory:</strong></p><ul>${inventoryRows}</ul>`
			: '';
		const line = `<p>The party went to <strong>${generatedShopName}</strong>, a ${aff} ${type}</p>${inventoryHtml}`;
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
			// Add to saved shops list so players can revisit
			savedShops = [
				...savedShops,
				{
					name: generatedShopName,
					typeKey: shopType,
					affluenceKey: shopAffluence,
					items: [...generatedShop]
				}
			];
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
	type SavedShop = { name: string; typeKey: string; affluenceKey: string; items: ShopRow[] };
	const SAVED_SHOPS_KEY = 'initiative_saved_shops';
	let savedShops = $state<SavedShop[]>(
		browser
			? (() => {
					try {
						return JSON.parse(localStorage.getItem(SAVED_SHOPS_KEY) ?? '[]');
					} catch {
						return [];
					}
				})()
			: []
	);
	$effect(() => {
		if (browser) localStorage.setItem(SAVED_SHOPS_KEY, JSON.stringify(savedShops));
	});
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
	class="fixed inset-0 z-50 flex flex-col overflow-hidden bg-gray-950"
	onkeydown={(e) => e.key === 'Escape' && onclose()}
>
	<div aria-hidden="true" class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
		<div class="bg-orb orb-1"></div>
		<div class="bg-orb orb-2"></div>
		<div class="bg-orb orb-3"></div>
		<div class="bg-orb orb-4"></div>
	</div>
	<!-- Header -->
	<div class="flex shrink-0 items-center gap-3 border-b border-gray-800 bg-gray-900 px-6 py-3">
		<span class="text-xl">⚙️</span>
		<h2 class="text-lg font-black tracking-widest text-amber-400 uppercase">Generators</h2>
		<p class="ml-2 hidden text-xs text-gray-500 sm:block">D&amp;D 5e content generators</p>
		<button
			onclick={onclose}
			class="ml-auto rounded border border-gray-700 bg-gray-800 p-1.5 text-gray-400 transition hover:border-gray-500 hover:text-white"
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
		<div
			class="min-w-0 flex-1 {[
				'town',
				'inn',
				'dungeon',
				'wilderness',
				'wizard',
				'cult',
				'noble',
				'guild',
				'caravan',
				'blackmarket',
				'graveyard',
				'npc'
			].includes(selected)
				? 'overflow-hidden'
				: 'overflow-y-auto px-8 py-6'}"
		>
			{#if selected === 'names'}
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
			{:else if selected === 'weather'}
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

					<!-- Weather Event Generator -->
					<section>
						<h4 class="mb-3 text-sm font-black tracking-widest text-amber-400 uppercase">
							Weather Event
						</h4>
						<p class="mb-3 text-sm text-gray-400">
							Generate a dramatic weather event for the current season and biome. Uses your Season
							and Biome selections above.
						</p>
						<button
							onclick={generateWeatherEvent}
							class="rounded-lg border border-amber-700 bg-amber-900/30 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-800/40"
						>
							Generate Weather Event
						</button>

						{#if weatherEvent}
							<div class="mt-4 rounded-lg border border-gray-700 bg-gray-800/60 p-4">
								<div class="mb-2 flex items-center gap-3">
									<span
										class="rounded px-2 py-0.5 text-xs font-bold tracking-wider uppercase
										{weatherEvent.intensity === 'minor'
											? 'bg-green-900/60 text-green-300'
											: weatherEvent.intensity === 'moderate'
												? 'bg-yellow-900/60 text-yellow-300'
												: weatherEvent.intensity === 'severe'
													? 'bg-orange-900/60 text-orange-300'
													: 'bg-red-900/60 text-red-300'}"
									>
										{weatherEvent.intensity}
									</span>
									<span class="text-base font-bold text-white">{weatherEvent.name}</span>
								</div>
								<div class="mb-3 flex gap-4 text-xs text-gray-400">
									<span
										><span class="font-semibold text-gray-300">Duration:</span>
										{weatherEvent.duration}</span
									>
								</div>
								<p class="mb-2 text-xs font-semibold text-amber-400/80 italic">
									{weatherEvent.onset}
								</p>
								<p class="mb-3 text-sm text-gray-300">{weatherEvent.description}</p>
								{#if weatherEvent.mechanics.length}
									<div class="mb-3">
										<p class="mb-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
											Mechanics
										</p>
										<ul class="space-y-0.5">
											{#each weatherEvent.mechanics as m}
												<li class="text-xs text-gray-400">• {m}</li>
											{/each}
										</ul>
									</div>
								{/if}
								<div>
									<p class="mb-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
										Aftermath
									</p>
									<p class="text-xs text-gray-400">{weatherEvent.aftermath}</p>
								</div>
							</div>
						{/if}
					</section>
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
					{#if savedShops.length > 0}
						<div class="mt-2 space-y-3">
							<p class="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
								Previously Visited Shops
							</p>
							{#each savedShops as shop, i}
								<div class="flex rounded-xl border border-gray-700 bg-gray-900/60">
									<button
										onclick={() => {
											generatedShopName = shop.name;
											shopType = shop.typeKey;
											shopAffluence = shop.affluenceKey;
											generatedShop = [...shop.items];
										}}
										class="flex min-w-0 flex-1 items-center gap-3 rounded-tl-xl rounded-bl-xl px-4 py-3 text-left transition hover:bg-gray-700/40"
									>
										<span class="flex-1">
											<strong class="text-white">{shop.name}</strong>
											<span class="ml-2 text-xs text-gray-400">
												{affluenceData[shop.affluenceKey]?.label}
												{shopData[shop.typeKey]?.label}
											</span>
										</span>
										<span class="text-xs text-gray-500">{shop.items.length} items</span>
									</button>
									<button
										onclick={() => (savedShops = savedShops.filter((_, j) => j !== i))}
										aria-label="Remove {shop.name}"
										class="rounded-tr-xl rounded-br-xl border-l border-gray-700 px-3 py-3 text-gray-500 transition hover:bg-red-900/40 hover:text-red-400"
										>&#x2715;</button
									>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
			{#if selected === 'encounter'}
				<div class="space-y-6 text-sm">
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
			{#if selected === 'town'}
				{#await import('$lib/components/TownGeneratorModal.svelte')}
					<div class="flex h-full items-center justify-center text-sm text-gray-500">
						Loading...
					</div>
				{:then { default: TownGen }}
					<TownGen onclose={() => (selected = '')} embedded />
				{/await}
			{/if}
			{#if selected === 'inn'}
				{#await import('$lib/components/InnGeneratorModal.svelte')}
					<div class="flex h-full items-center justify-center text-sm text-gray-500">
						Loading...
					</div>
				{:then { default: InnGen }}
					<InnGen onclose={() => (selected = '')} embedded />
				{/await}
			{/if}
			{#if selected === 'dungeon'}
				{#await import('$lib/components/DonjonDungeonModal.svelte')}
					<div class="flex h-full items-center justify-center text-sm text-gray-500">
						Loading...
					</div>
				{:then { default: DonjonGen }}
					<DonjonGen onclose={() => (selected = '')} embedded />
				{/await}
			{/if}

			{#if selected === 'wizard'}
				{#await import('$lib/components/WizardTowerModal.svelte')}
					<div class="flex h-full items-center justify-center text-sm text-gray-500">
						Loading...
					</div>
				{:then { default: WizardTower }}
					<WizardTower onclose={() => (selected = '')} embedded />
				{/await}
			{/if}

			{#if selected === 'cult'}
				{#await import('$lib/components/CultGeneratorModal.svelte')}
					<div class="flex h-full items-center justify-center text-sm text-gray-500">
						Loading...
					</div>
				{:then { default: CultGen }}
					<CultGen onclose={() => (selected = '')} embedded />
				{/await}
			{/if}
			{#if selected === 'wilderness'}
				{#await import('$lib/components/WildernessEncounterModal.svelte')}
					<div class="flex h-full items-center justify-center text-sm text-gray-500">
						Loading...
					</div>
				{:then { default: WildernessGen }}
					<WildernessGen onclose={() => (selected = '')} embedded />
				{/await}
			{/if}
			{#if selected === 'noble'}
				{#await import('$lib/components/NobleHouseGeneratorModal.svelte')}
					<div class="flex h-full items-center justify-center text-sm text-gray-500">
						Loading...
					</div>
				{:then { default: NobleHouseGen }}
					<NobleHouseGen onclose={() => (selected = '')} embedded />
				{/await}
			{/if}
			{#if selected === 'guild'}
				{#await import('$lib/components/ThievesGuildModal.svelte')}
					<div class="flex h-full items-center justify-center text-sm text-gray-500">
						Loading...
					</div>
				{:then { default: ThievesGuild }}
					<ThievesGuild onclose={() => (selected = '')} embedded />
				{/await}
			{/if}

			{#if selected === 'caravan'}
				{#await import('$lib/components/TradeCaravanModal.svelte')}
					<div class="flex h-full items-center justify-center text-sm text-gray-500">
						Loading...
					</div>
				{:then { default: TradeCaravan }}
					<TradeCaravan onclose={() => (selected = '')} embedded />
				{/await}
			{/if}

			{#if selected === 'blackmarket'}
				{#await import('$lib/components/BlackMarketModal.svelte')}
					<div class="flex h-full items-center justify-center text-sm text-gray-500">
						Loading...
					</div>
				{:then { default: BlackMarket }}
					<BlackMarket onclose={() => (selected = '')} embedded />
				{/await}
			{/if}

			{#if selected === 'graveyard'}
				{#await import('$lib/components/GraveyardModal.svelte')}
					<div class="flex h-full items-center justify-center text-sm text-gray-500">
						Loading...
					</div>
				{:then { default: GraveyardGen }}
					<GraveyardGen onclose={() => (selected = '')} embedded />
				{/await}
			{/if}

			{#if selected === 'npc'}
				{#await import('$lib/components/NpcGeneratorModal.svelte')}
					<div class="flex h-full items-center justify-center text-sm text-gray-500">
						Loading...
					</div>
				{:then { default: NpcGen }}
					<NpcGen onclose={() => (selected = '')} embedded />
				{/await}
			{/if}
		</div>
	</div>
</div>

<style>
	.bg-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(90px);
	}
	.orb-1 {
		width: min(65vw, 700px);
		height: min(65vw, 700px);
		background: rgba(88, 28, 135, 0.45);
		top: -15%;
		left: -12%;
		animation: orb-drift-1 24s ease-in-out infinite;
	}
	.orb-2 {
		width: min(55vw, 620px);
		height: min(55vw, 620px);
		background: rgba(30, 58, 138, 0.45);
		bottom: -18%;
		right: -10%;
		animation: orb-drift-2 30s ease-in-out infinite;
	}
	.orb-3 {
		width: min(45vw, 520px);
		height: min(45vw, 520px);
		background: rgba(120, 53, 15, 0.35);
		top: 35%;
		left: 42%;
		transform: translate(-50%, -50%);
		animation: orb-drift-3 20s ease-in-out infinite;
	}
	.orb-4 {
		width: min(38vw, 440px);
		height: min(38vw, 440px);
		background: rgba(49, 46, 129, 0.4);
		top: 15%;
		right: 18%;
		animation: orb-drift-4 26s ease-in-out infinite;
	}
	@keyframes orb-drift-1 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		25% {
			transform: translate(8vw, 6vh) scale(1.06);
		}
		55% {
			transform: translate(3vw, 12vh) scale(0.94);
		}
		75% {
			transform: translate(-3vw, 7vh) scale(1.03);
		}
	}
	@keyframes orb-drift-2 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		30% {
			transform: translate(-7vw, -9vh) scale(1.08);
		}
		65% {
			transform: translate(-2vw, -4vh) scale(0.92);
		}
	}
	@keyframes orb-drift-3 {
		0%,
		100% {
			transform: translate(-50%, -50%) scale(1);
		}
		40% {
			transform: translate(calc(-50% + 7vw), calc(-50% - 9vh)) scale(1.1);
		}
		70% {
			transform: translate(calc(-50% - 5vw), calc(-50% + 5vh)) scale(0.9);
		}
	}
	@keyframes orb-drift-4 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		35% {
			transform: translate(6vw, 9vh) scale(0.94);
		}
		68% {
			transform: translate(-5vw, 4vh) scale(1.06);
		}
	}
</style>
