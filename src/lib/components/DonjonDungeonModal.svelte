<script lang="ts">
	import { onMount } from 'svelte';
	import { combat } from '$lib/store.svelte';
	import { ENEMY_TEMPLATES, getMonsterDetail } from '$lib/enemies';
	import type { MonsterDetail } from '$lib/types';
	import MonsterInfoModal from '$lib/components/MonsterInfoModal.svelte';
	import jsPDF from 'jspdf';
	import autoTable from 'jspdf-autotable';

	let { onclose, embedded = false }: { onclose: () => void; embedded?: boolean } = $props();

	// ── cell bit flags ──────────────────────────────────────────────────────────
	const BLOCKED = 0x00000001;
	const ROOM = 0x00000002;
	const CORRIDOR = 0x00000004;
	const PERIMETER = 0x00000010;
	const ENTRANCE = 0x00000020;
	const ROOM_ID = 0x0000ffc0;
	const ARCH = 0x00010000;
	const DOOR = 0x00020000;
	const LOCKED = 0x00040000;
	const TRAPPED = 0x00080000;
	const SECRET = 0x00100000;
	const PORTC = 0x00200000;
	const STAIR_DN = 0x00400000;
	const STAIR_UP = 0x00800000;
	const LABEL = 0xff000000;

	const OPENSPACE = ROOM | CORRIDOR;
	const DOORSPACE = ARCH | DOOR | LOCKED | TRAPPED | SECRET | PORTC;
	const ESPACE = ENTRANCE | DOORSPACE | 0xff000000;
	const STAIRS = STAIR_DN | STAIR_UP;
	const BLOCK_CORR = BLOCKED | PERIMETER | CORRIDOR;
	const BLOCK_DOOR = BLOCKED | DOORSPACE;

	// ── direction tables ────────────────────────────────────────────────────────
	const di: Record<string, number> = { north: -1, south: 1, west: 0, east: 0 };
	const dj: Record<string, number> = { north: 0, south: 0, west: -1, east: 1 };
	const allDirs = ['east', 'north', 'south', 'west']; // sorted like Perl's keys %hash
	const opposite: Record<string, string> = {
		north: 'south',
		south: 'north',
		west: 'east',
		east: 'west'
	};

	// ── stairEnd table ──────────────────────────────────────────────────────────
	const stairEnd: Record<string, { walled: number[][]; corridor: number[][]; next: number[] }> = {
		north: {
			walled: [
				[1, -1],
				[0, -1],
				[-1, -1],
				[-1, 0],
				[-1, 1],
				[0, 1],
				[1, 1]
			],
			corridor: [
				[0, 0],
				[1, 0],
				[2, 0]
			],
			next: [1, 0]
		},
		south: {
			walled: [
				[-1, -1],
				[0, -1],
				[1, -1],
				[1, 0],
				[1, 1],
				[0, 1],
				[-1, 1]
			],
			corridor: [
				[0, 0],
				[-1, 0],
				[-2, 0]
			],
			next: [-1, 0]
		},
		west: {
			walled: [
				[-1, 1],
				[-1, 0],
				[-1, -1],
				[0, -1],
				[1, -1],
				[1, 0],
				[1, 1]
			],
			corridor: [
				[0, 0],
				[0, 1],
				[0, 2]
			],
			next: [0, 1]
		},
		east: {
			walled: [
				[-1, -1],
				[-1, 0],
				[-1, 1],
				[0, 1],
				[1, 1],
				[1, 0],
				[1, -1]
			],
			corridor: [
				[0, 0],
				[0, -1],
				[0, -2]
			],
			next: [0, -1]
		}
	};

	// ── closeEnd table ──────────────────────────────────────────────────────────
	const closeEnd: Record<string, { walled: number[][]; close: number[][]; recurse: number[] }> = {
		north: {
			walled: [
				[0, -1],
				[1, -1],
				[1, 0],
				[1, 1],
				[0, 1]
			],
			close: [[0, 0]],
			recurse: [-1, 0]
		},
		south: {
			walled: [
				[0, -1],
				[-1, -1],
				[-1, 0],
				[-1, 1],
				[0, 1]
			],
			close: [[0, 0]],
			recurse: [1, 0]
		},
		west: {
			walled: [
				[-1, 0],
				[-1, 1],
				[0, 1],
				[1, 1],
				[1, 0]
			],
			close: [[0, 0]],
			recurse: [0, -1]
		},
		east: {
			walled: [
				[-1, 0],
				[-1, -1],
				[0, -1],
				[1, -1],
				[1, 0]
			],
			close: [[0, 0]],
			recurse: [0, 1]
		}
	};

	// ── settings ────────────────────────────────────────────────────────────────
	let nRows = $state(39);
	let nCols = $state(39);
	let roomMin = $state(3);
	let roomMax = $state(9);
	let corridorLayout = $state(50); // 0=Labyrinth, 50=Bent, 100=Straight
	let removeDeadends = $state(50);

	type DungeonTheme = 'Crypt' | 'Sewer' | 'Cave' | 'Fortress' | 'Arcane' | 'Fungal';
	let dungeonTheme = $state<DungeonTheme>('Crypt');
	let numFloors = $state(1);
	let includeBossRoom = $state(false);
	let partySize = $state(4);
	let partyLevel = $state(5);
	let difficulty = $state<'Easy' | 'Medium' | 'Hard' | 'Deadly'>('Medium');
	let showMobileOptions = $state(false);
	let showMobileEncounters = $state(false);
	let zoom = $state(1);
	let canvasPixelW = $state(0);
	let canvasPixelH = $state(0);
	let currentFloor = $state(0);
	let floors = $state<Dungeon[]>([]);
	let floorBossRoomIds = $state<number[]>([]); // 0 = none
	let roomCount = $state(0);
	let canvasEl = $state<HTMLCanvasElement | null>(null);
	const TILE = 14;

	// ── dungeon flavor text ──────────────────────────────────────────────────────
	let dungeonName = $state('');
	let dungeonDescription = $state('');

	const NAME_ADJ = [
		'Accursed',
		'Ancient',
		'Blighted',
		'Crimson',
		'Crumbling',
		'Dread',
		'Forsaken',
		'Frozen',
		'Hollow',
		'Iron',
		'Lost',
		'Obsidian',
		'Ruined',
		'Shadowed',
		'Shattered',
		'Silent',
		'Sunken',
		'Twisted',
		'Undying',
		'Wretched'
	];
	const NAME_NOUN = [
		'Catacombs',
		'Chambers',
		'Citadel',
		'Crypts',
		'Depths',
		'Hold',
		'Labyrinth',
		'Ossuary',
		'Sanctum',
		'Tomb',
		'Underhalls',
		'Vaults',
		'Warrens'
	];
	const NAME_SUFFIX = [
		'of the Damned',
		'of Eternal Darkness',
		'of the Fallen',
		'of the Forsaken',
		'of the Undead',
		'of Despair',
		'of Forgotten Kings',
		'of the Restless',
		'of Lost Souls',
		'of the Wretched'
	];

	const MATERIAL = [
		'hewn stone',
		'black granite',
		'crumbling limestone',
		'ancient basalt',
		'mossy fieldstone',
		'dark obsidian',
		'rough-cut sandstone'
	];
	const SMELL = [
		'reeks of rot and stagnant water',
		'carries the stench of sulfur',
		'smells of damp earth and old blood',
		'is heavy with the odor of mold and decay',
		'carries a faint brimstone tinge'
	];
	const SOUND = [
		'dripping echoes through the passages',
		'distant scraping breaks the silence',
		'faint moaning drifts from the depths',
		'the silence is almost total, broken only by your own footsteps',
		'water trickles somewhere unseen'
	];
	const LIGHT = [
		'Torchlight barely penetrates the oppressive dark',
		'Patches of bioluminescent fungus cast a sickly glow',
		'Rusted sconces line the walls, long since burned out',
		'No light reaches here — only magical means provide illumination',
		'Narrow cracks in the ceiling let in thin slivers of dim light'
	];

	function pick<T>(arr: T[]): T {
		return arr[rand(arr.length)];
	}

	function generateFlavorText(): void {
		const adj = pick(NAME_ADJ);
		const noun = pick(NAME_NOUN);
		const suffix = rand(3) === 0 ? ` ${pick(NAME_SUFFIX)}` : '';
		dungeonName = `The ${adj} ${noun}${suffix}`;

		const sizeLabel = nRows < 20 ? 'cramped' : nRows < 40 ? 'sprawling' : 'vast';
		const layoutLabel =
			corridorLayout === 0
				? 'winding, maze-like'
				: corridorLayout === 100
					? 'straight, geometric'
					: 'branching';
		const floorLabel = numFloors === 1 ? 'a single level' : `${numFloors} descending levels`;
		const bossLine = includeBossRoom
			? ' At its deepest point lies a great chamber — the lair of something terrible.'
			: '';

		dungeonDescription =
			`${pick(LIGHT)}. The walls are ${pick(MATERIAL)} and the air ${pick(SMELL)}. ` +
			`The ${layoutLabel} corridors of this ${sizeLabel} complex stretch across ${floorLabel}, ` +
			`sheltering ${roomCount} chambers of varying size.` +
			bossLine +
			` The sound of ${pick(SOUND)}.`;
	}

	// ── encounter tables ─────────────────────────────────────────────────────────
	// area = roomH * roomW where each dimension = cell_count * 10
	// small rooms (≤ ~5×5 cells) → area ≤ 2500; large (≥ 9×9) → area ≥ 8100

	const ENC_SMALL = [
		'2d4 Goblins',
		'1d4 Kobolds',
		'1d6 Giant Rats',
		'1d4 Skeletons',
		'2 Stirges',
		'1d3 Zombies',
		'1 Giant Spider',
		'1d4 Bandits',
		'1d3 Cultists',
		'1 Shadow',
		'2 Wolves',
		'1 Animated Armor',
		'1d3 Darkmantles',
		'1 Swarm of Bats'
	];

	const ENC_MEDIUM = [
		'1d6 Orcs',
		'1d4 Hobgoblins',
		'2d4 Skeletons',
		'1d4 Zombies',
		'1 Ghoul + 1d3 Zombies',
		'1d3 Giant Spiders',
		'1d4 Gnolls',
		'1 Worg + 2 Goblins',
		'1 Mimic',
		'2 Shadows',
		'1d4 Bugbears',
		'1d3 Wights',
		'1d6 Bandits + 1 Bandit Captain',
		'1 Gelatinous Cube'
	];

	const ENC_LARGE = [
		'2d6 Orcs',
		'1 Troll',
		'1 Wight + 2d4 Zombies',
		'2d6 Hobgoblins',
		'1 Ogre + 1d4 Orcs',
		'1 Vampire Spawn',
		'1d4 Wights',
		'1 Werewolf',
		'2 Ogres',
		'1 Mummy',
		'1 Banshee',
		'1 Flameskull + 2d4 Skeletons',
		'1 Roper',
		'1d6 Gricks'
	];

	// ── room description tables (per dungeon theme) ─────────────────────────────
	const ROOM_DESC: Record<
		DungeonTheme,
		{
			openers: string[];
			details: string[];
			bossOpener: string[];
			startOpener: string[];
			treasureDetail: string[];
			encounterDetail: string[];
		}
	> = {
		Crypt: {
			openers: [
				'The low ceiling presses down like a burial shroud.',
				'Carved niches line the walls, each holding a crumbling effigy.',
				'A stone altar occupies the far wall, stained with ancient offerings.',
				'The floor is worn smooth by decades of shuffling feet.',
				'Rows of sealed alcoves climb both walls to the vaulted ceiling.',
				'A smell of cold earth and old stone hangs heavy here.'
			],
			details: [
				'Dust motes drift in the torchlight like slow snow.',
				'A fine crack runs the length of the ceiling, weeping mineral salts.',
				'Someone has scratched tally marks near the door.',
				'The walls are slick with moisture that has no visible source.',
				'Iron sconces jut from the walls, empty for centuries.'
			],
			bossOpener: [
				'A vast burial vault stretches before you, the ceiling lost in shadow above a great sarcophagus.',
				'This chamber is older than the rest — the stonework finer, darker, and deeply cold.'
			],
			startOpener: [
				'Weak light filters through a crack above the entrance, illuminating dust in the still air.',
				'The entry chamber is partially collapsed, rubble piled against one wall.'
			],
			treasureDetail: [
				'A locked iron coffer rests on a plinth in the corner.',
				'Offerings of tarnished coin surround a carved skull set into the wall.'
			],
			encounterDetail: [
				'Bones crunch underfoot — some disturbingly fresh.',
				'The scrape of stone on stone echoes from somewhere nearby.'
			]
		},
		Sewer: {
			openers: [
				'Black water channels cut through the floor, fed by unseen pipes.',
				'The ceiling is low and arched, slick with algae and moisture.',
				'A grate in the floor breathes cold air from somewhere far below.',
				'The walls stream with water that smells of iron and rot.',
				'A partially collapsed section of floor exposes the channel rushing beneath.',
				'Rusted iron brackets once held torches; now they drip.'
			],
			details: [
				'The sound of dripping never quite stops.',
				'Rats scatter into the darkness at your approach.',
				'Green slime colonises the lower half of every wall.',
				'The mortar has eroded in places, leaving gaps that whistle with moving air.',
				'A faint chemical smell mingles with the pervasive damp.'
			],
			bossOpener: [
				'A vast cistern chamber opens before you, the central pool dark and unfathomably deep.',
				'The master vault of the network — a cathedral of dripping stone and black water.'
			],
			startOpener: [
				'A rusted ladder descends from above, your only way back to the surface.',
				'Faint daylight flickers through a slit grate set high in the ceiling.'
			],
			treasureDetail: [
				'A waterproof oilskin bundle has been wedged into a dry niche above the waterline.',
				'Coins and small valuables rest on a shelf clearly placed to stay dry.'
			],
			encounterDetail: [
				'Something large moves beneath the water near the far wall.',
				'A low resonance travels through the pipes overhead.'
			]
		},
		Cave: {
			openers: [
				'Natural columns of flowstone divide the space into shadowed alcoves.',
				'The cave walls are irregular, with deep shadows hiding possible passages.',
				'A thin stream of mineral-rich water traces a pale line across the floor.',
				'The ceiling is a tangle of stalactites, a few broken stumps hinting at past violence.',
				'Crystals embedded in the rock catch the light and scatter it in pale fragments.',
				'The floor here is gritty — a mix of sand and crushed bone.'
			],
			details: [
				'The temperature drops sharply from the passage outside.',
				'A faint wind suggests a hidden opening somewhere above.',
				'The rock underfoot is slippery with mineral deposits.',
				'Ancient scratch marks on the wall might be directions — or warnings.',
				'A shallow depression in the floor holds stagnant brown water.'
			],
			bossOpener: [
				'A monstrous natural cathedral of stone opens before you, its ceiling lost in darkness.',
				'The largest cave you have yet encountered — and the air here is noticeably warmer.'
			],
			startOpener: [
				'The cave mouth narrows behind you; returning will require care.',
				'Faint marks in the rock suggest this entrance has seen many visitors before.'
			],
			treasureDetail: [
				'A leather satchel has been tucked into a crevice and mostly concealed with rubble.',
				'A crude stone chest sealed with clay sits in a dry corner.'
			],
			encounterDetail: [
				'Claw marks on the walls are at a height that suggests nothing human made them.',
				'The smell of musk and old blood hangs in the air ahead.'
			]
		},
		Fortress: {
			openers: [
				'The room was clearly a guardroom once — weapon racks line one wall, stripped bare.',
				'Arrow slits in the outer wall suggest this chamber was designed for defence.',
				'The floor is dressed stone, well-fitted, with iron rings bolted at intervals.',
				'A heavy oak table, half rotted, dominates the centre of the room.',
				'Murder holes in the ceiling are a reminder this fortress expected to be taken.',
				'The walls are dressed grey granite, unadorned and unapologetically functional.'
			],
			details: [
				'The iron door hinges are still sound, though the wood has long gone.',
				'Faded military insignia are still visible on a surviving patch of plaster.',
				'The floor shows worn grooves from years of booted feet.',
				'Cold wind whistles through a broken arrow slit.',
				'A rusted portcullis slot in the ceiling was never used — its mechanism still set.'
			],
			bossOpener: [
				'The great hall — or what remains of it — stretches before you, its banners in tatters.',
				'This was the command chamber; the remains of a war table occupy its centre.'
			],
			startOpener: [
				'The gatehouse entry is defensible but long since abandoned.',
				'The first courtyard gate stands open, its locks rusted solid.'
			],
			treasureDetail: [
				'An iron strongbox has been chained to the floor near the far wall.',
				'A concealed compartment in the floor has been partially pried open.'
			],
			encounterDetail: [
				'The clash of metal echoes from a passage beyond.',
				'Marching footfalls — disciplined, regular — approach from below.'
			]
		},
		Arcane: {
			openers: [
				'Runes etched into the floor pulse with a faint blue light at your approach.',
				'The geometry of this room is subtly wrong — angles that should not meet, do.',
				'A ritual circle, still faintly luminous, occupies the centre of the chamber.',
				'Bookshelves of stone hold rows of crystalline tablets, each inscribed with glowing script.',
				'The air vibrates at a frequency you feel in your back teeth.',
				'Floating motes of cold light drift aimlessly near the ceiling.'
			],
			details: [
				'The temperature is unnaturally constant regardless of the season above.',
				'Any spoken word echoes with a faint harmonic that does not quite match.',
				'The shadows move slightly faster than the light that casts them.',
				'A smell of ozone and burnt copper permeates everything.',
				'Your magical implements feel heavier — or lighter — than they should.'
			],
			bossOpener: [
				'A sanctum of almost incomprehensible arcane complexity unfolds before you.',
				'The ritual chamber at the heart of the complex — the air crackles with barely contained power.'
			],
			startOpener: [
				'The warding circle just inside the entrance still reacts weakly to your presence.',
				'The antechamber served as a test for the uninitiated — simple enough, by design.'
			],
			treasureDetail: [
				'A locked crystalline case holds what appears to be a scroll or small tome.',
				'Rare components fill a sealed alcove, still potent after all this time.'
			],
			encounterDetail: [
				'A magical construct shifts in the shadows, its purpose unclear.',
				'The ritual circle flares briefly — something has been summoned recently.'
			]
		},
		Fungal: {
			openers: [
				'Enormous mushroom caps press against the ceiling, their undersides weeping faint luminescence.',
				'A carpet of spongy white mycelium covers the floor entirely, silencing footfalls.',
				'Bioluminescent spores drift through the air in lazy, disorienting clouds.',
				'Bulbous growths of orange and violet cling to every surface.',
				'The walls are barely visible beneath layers of interlocking fungal growth.',
				'Thick cords of mycelium web the ceiling like a living chandelier.'
			],
			details: [
				'The air is thick with spores — breathing deeply is inadvisable.',
				'A faint humming comes from the largest mushroom cluster; it vibrates under your hand.',
				'The floor is soft and slightly warm, like breathing flesh.',
				'Something that was once a creature has been absorbed entirely into the wall growth.',
				'A faint sweetness underlies the pervasive smell of decay.'
			],
			bossOpener: [
				'The heart of the colony: a vast chamber dominated by a pulsing central mass.',
				'A cathedral of rot — towering growths in every colour, and at the centre, something old and awake.'
			],
			startOpener: [
				'Thin tendrils reach through the entry crack, testing the air beyond.',
				'The outer chamber is only lightly colonised — the fungus has not yet claimed this close to the surface.'
			],
			treasureDetail: [
				'Something valuable is half-buried in mycelium; retrieving it will disturb the network.',
				'A hermetically sealed container rests in a clear patch of floor, deliberately kept away from the growth.'
			],
			encounterDetail: [
				'The nearest mushroom cap pulses rhythmically — a warning signal moving through the colony.',
				'Spore clouds thicken near the far wall, disturbed by something that passed through recently.'
			]
		}
	};

	function getRoomDescription(
		roomId: number,
		enc: string,
		hasTreasure: boolean,
		isBoss: boolean,
		isStart: boolean
	): string {
		const td = ROOM_DESC[dungeonTheme];
		const opener = isBoss
			? td.bossOpener[roomId % td.bossOpener.length]
			: isStart
				? td.startOpener[roomId % td.startOpener.length]
				: td.openers[roomId % td.openers.length];
		const detail = td.details[(roomId * 3 + 1) % td.details.length];
		const extra = hasTreasure
			? td.treasureDetail[roomId % td.treasureDetail.length]
			: enc !== 'Empty'
				? td.encounterDetail[roomId % td.encounterDetail.length]
				: '';
		return extra ? `${opener} ${detail} ${extra}` : `${opener} ${detail}`;
	}

	// ── room name tables (one per opener; index must match openers/bossOpener/startOpener) ──
	const ROOM_NAMES: Record<DungeonTheme, { rooms: string[]; boss: string[]; start: string[] }> = {
		Crypt: {
			rooms: [
				'The Shroud Chamber',
				'The Effigy Hall',
				'The Offering Altar',
				'The Worn Passage',
				'The Alcove Vault',
				'The Stone Hollow'
			],
			boss: ['The Grand Burial Vault', 'The Ancient Sanctum'],
			start: ['The Entry Crack', 'The Collapsed Entry']
		},
		Sewer: {
			rooms: [
				'The Channel Room',
				'The Algae Vault',
				'The Cold Grate',
				'The Rust Weep',
				'The Collapsed Slab',
				'The Drip Chamber'
			],
			boss: ['The Grand Cistern', 'The Master Vault'],
			start: ['The Ladder Drop', 'The Surface Gate']
		},
		Cave: {
			rooms: [
				'The Flowstone Hall',
				'The Shadow Alcove',
				'The Mineral Run',
				'The Stalactite Den',
				'The Crystal Hollow',
				'The Bone Grit Floor'
			],
			boss: ['The Stone Cathedral', 'The Deep Maw'],
			start: ['The Narrow Mouth', 'The Marked Entry']
		},
		Fortress: {
			rooms: [
				'The Old Guardroom',
				'The Arrow Room',
				'The Iron Ring Hall',
				'The Rotted Hall',
				'The Murder Room',
				'The Granite Keep'
			],
			boss: ['The Fallen Great Hall', 'The Command Chamber'],
			start: ['The Gatehouse', 'The Open Gate']
		},
		Arcane: {
			rooms: [
				'The Rune Floor',
				'The Warped Chamber',
				'The Ritual Circle',
				'The Tablet Archive',
				'The Resonance Hall',
				'The Mote Chamber'
			],
			boss: ['The Inner Sanctum', 'The Power Nexus'],
			start: ['The Warding Antechamber', 'The Trial Room']
		},
		Fungal: {
			rooms: [
				'The Mushroom Cap Hall',
				'The Mycelium Floor',
				'The Spore Drift',
				'The Growth Chamber',
				'The Overgrowth',
				'The Mycelium Web'
			],
			boss: ['The Colony Heart', 'The Rot Cathedral'],
			start: ['The Tendril Entry', 'The Outer Chamber']
		}
	};

	function getRoomName(roomId: number, isBoss: boolean, isStart: boolean): string {
		const tn = ROOM_NAMES[dungeonTheme];
		if (isBoss) return tn.boss[roomId % tn.boss.length];
		if (isStart) return tn.start[roomId % tn.start.length];
		return tn.rooms[roomId % tn.rooms.length];
	}

	// ── environmental hazard tables (per dungeon theme) ──────────────────────────
	const HAZARD_TABLE: Record<DungeonTheme, string[]> = {
		Crypt: [
			'The flagstones are unstable; each step produces an ominous crack.',
			'A thin mist of greenish gas seeps through cracks in the mortar.',
			'The air is bitterly cold; breath fogs and metal burns to the touch.',
			'Loose rubble from a partial ceiling collapse covers half the floor.',
			'Foul water drips steadily from above, pooling in the low points.',
			'The room is completely lightless — even darkvision struggles here.'
		],
		Sewer: [
			'Knee-deep black water floods the floor; visibility below the surface is zero.',
			'A cloud of toxic fumes clings to the ceiling; taller creatures breathe it first.',
			'The floor is dangerously slick; any sudden movement risks a fall.',
			'The walls groan and crack — a section feels ready to give way.',
			'Sewage gas has accumulated here; an open flame could ignite it.',
			'Rat swarms have claimed this room; disturbing them will provoke a reaction.'
		],
		Cave: [
			'The ceiling is unstable — any loud noise or heavy blow risks a rockfall.',
			'A deep pit cuts across the room; its bottom is not visible.',
			'Thick supernatural darkness fills the room; darkvision extends only 5 feet.',
			'Razor-sharp crystal formations cover much of the floor.',
			'The air is thin and stale; sustained exertion is harder than usual.',
			'A narrow underground river cuts through one corner; the current is swift.'
		],
		Fortress: [
			'Arrow slits in the walls allow this room to be fired into from adjacent corridors.',
			'The floor has partially collapsed; several sections will not bear full weight.',
			'A portcullis mechanism is visible — it could trap those inside.',
			'Choking smoke from a long-dead fire still lingers near the ceiling.',
			'Murder holes above this room allow something above to act against those below.',
			'The iron door can be barred from the outside; those inside could be sealed in.'
		],
		Arcane: [
			'Wild magic saturates the air — spells cast here have unpredictable effects.',
			'Magical darkness fills the room; it cannot be pierced by any light source.',
			'An antimagic field suppresses all magical effects within.',
			'Gravity is subtly wrong — movement costs double and balance is difficult.',
			'The floor is inscribed with a binding glyph; triggering it is easy to do accidentally.',
			'Time moves strangely here; creatures may act faster or slower than expected.'
		],
		Fungal: [
			'Dense spore clouds fill the air; breathing deeply requires a saving throw.',
			'The floor yields underfoot like soft flesh — movement is halved.',
			'Bioluminescent pulses from the fungal network cause disorientation.',
			'Thick mycelium tangles throughout the room; it counts as difficult terrain.',
			'The colony is aware of intruders here — something has been alerted.',
			'Acidic secretions drip from the ceiling; standing still is not advisable.'
		]
	};

	// ── puzzle tables ────────────────────────────────────────────────────────────
	interface Puzzle {
		type: 'Riddle' | 'Logic' | 'Environmental';
		prompt: string;
		solution: string;
		stakes: string;
	}

	const PUZZLE_TABLE: Record<DungeonTheme, Puzzle[]> = {
		Crypt: [
			{
				type: 'Riddle',
				prompt:
					'Carved into the sarcophagus lid: "I have cities, but no houses live there. I have mountains, but no trees grow. I have water, but no fish swim. I have roads, but no carts travel. What am I?"',
				solution: 'A map. The correct answer must be spoken aloud at the lid to open it.',
				stakes:
					'Failure (wrong answer spoken aloud) triggers a Harm glyph — DC 14 CON save or 3d6 necrotic damage. Success reveals a hidden compartment with treasure.'
			},
			{
				type: 'Logic',
				prompt:
					'Three stone urns sit before a sealed door, each engraved with a symbol: Flame, Skull, Moon. An inscription reads: "The living fear me, the dead use me, and the gods eat me. Only the right urn opens the way."',
				solution:
					'Time. The Skull urn (representing death/time) is correct. Lifting its lid releases the door mechanism.',
				stakes:
					'Opening the wrong urn releases a cloud of choking dust — DC 13 CON save or be Poisoned for 1 minute. The door only opens for the correct urn.'
			},
			{
				type: 'Environmental',
				prompt:
					'The floor of this room is a grid of cracked tiles, each engraved with a small glyph — crown, sword, or coin. A plaque on the wall reads: "Walk the path of the servant, not the master."',
				solution:
					'Step only on coin tiles (servants carry coin, not crown or sword). The safe path traces diagonally across the room.',
				stakes:
					'Each wrong tile collapses, dropping the creature into a 10-ft pit (2d6 bludgeoning). A creature who maps the safe path and crosses earns a reward token left on the far plinth.'
			},
			{
				type: 'Riddle',
				prompt:
					'A weeping stone effigy holds out a bowl filled with dust. Beneath it: "Feed me and I grow. Give me water and I die. What am I?"',
				solution:
					'Fire. Lighting the dust in the bowl with a flame opens a hidden door in the west wall.',
				stakes:
					'Pouring water into the bowl triggers a cold burst — DC 12 CON save or 1d6 cold damage and speed halved for 1 round. Correct answer opens a passage to a bonus chamber.'
			},
			{
				type: 'Logic',
				prompt:
					'Four stone knights stand at each cardinal point. Each holds a weapon: Axe (North), Spear (East), Shield (South), Sword (West). The inscription: "The one who cannot attack must lead."',
				solution:
					'Push the Shield knight (South) forward — it cannot attack, so it "leads." A hidden pressure plate beneath it opens the far door.',
				stakes:
					'Pushing any other knight triggers the three others to animate and attack for one round before resetting. Correct knight opens the door and the knights bow, granting a +1 to the first attack made in the next combat.'
			},
			{
				type: 'Environmental',
				prompt:
					'The room is filled with ankle-deep black water. A raised dais in the center holds an ornate box. Faint light pulses from runes along the walls that seem to track movement.',
				solution:
					'The runes detect rapid movement. Creatures who move at half speed (or crawl) are not tracked and can reach the dais safely. The box contains a key.',
				stakes:
					'Moving at normal speed triggers a Chill Touch bolt from each active rune (one per PC, +5 to hit, 1d8 necrotic). Moving slowly reveals the box is unlocked and contains a useful item.'
			}
		],
		Sewer: [
			{
				type: 'Logic',
				prompt:
					'Three corroded levers protrude from the wall, each labeled with a faded number: I, II, III. The outflow sluice is sealed. Water is rising. A scrawled note on the wall reads: "Only the middle survives alone."',
				solution:
					'Pull lever II (the middle one) alone. Pulling others in combination floods the room faster or jams the gate.',
				stakes:
					'Each wrong combination raises water level by 1 ft (starts at 2 ft; 5 ft = difficult terrain + risk of drowning). Correct lever drains the room and opens the sluice gate.'
			},
			{
				type: 'Riddle',
				prompt:
					'A tarnished plaque on the wall reads: "The more you take, the more you leave behind. What am I?" A hole in the floor is sealed with an iron grate.',
				solution:
					'Footsteps. Speaking the answer aloud causes the grate to click open, revealing a dry tunnel below.',
				stakes:
					'Incorrect answers cause the walls to seep more effluent — the stench is overwhelming (DC 11 CON save or Poisoned until the room is left). Correct answer opens a safe route.'
			},
			{
				type: 'Environmental',
				prompt:
					'Three drainage pipes feed into this chamber. Colored slime — red, yellow, green — flows from each. A central basin has three slots: only the right combination of slimes will dissolve the barrier ahead.',
				solution:
					'Mix red and yellow (produces orange/acidic reaction) — this dissolves the barrier. Green is inert; red alone chars the edges; yellow alone does nothing.',
				stakes:
					'Wrong combinations cause a noxious splash — DC 12 DEX save or 1d6 acid damage and Blinded for 1 round. Correct mix dissolves the barrier, revealing a passage.'
			},
			{
				type: 'Logic',
				prompt:
					'A room with four outflow valves, each bearing a symbol: fish, rat, serpent, eye. The central cistern is draining and a door on the far wall is sealed by water pressure. A faded manual on a pedestal shows diagrams of the valves.',
				solution:
					'Close the fish and rat valves (high-flow), leave the serpent valve open. This maintains enough pressure to hold the door mechanism open. The eye valve is a decoy that triggers an alarm.',
				stakes:
					'Opening the eye valve rings a bell elsewhere in the dungeon, potentially alerting enemies. Correct configuration raises a submerged grate and reveals a chest.'
			}
		],
		Cave: [
			{
				type: 'Environmental',
				prompt:
					'The cave floor is covered in luminous crystals that chime musically when struck. A stalactite formation on the ceiling forms crude letters: "Sing what the cave remembers."',
				solution:
					'The crystals were struck in a pattern previously — a DC 14 Investigation check reveals worn strike marks. Reproducing the sequence (4 crystals in order) opens a fissure in the east wall.',
				stakes:
					'Wrong sequences cause a resonance burst — DC 13 CON save or Deafened for 1 hour. Correct sequence opens the fissure and the crystals go dark and quiet.'
			},
			{
				type: 'Riddle',
				prompt:
					'A stalagmite formation uncannily resembles a hunched figure with an open hand. Scratched in the rock: "Give me what you cannot keep, and I will give you what you cannot make."',
				solution:
					'Place a drop of blood (or any sacrifice of something personal) in the hand. The formation opens, revealing a natural gem cache.',
				stakes:
					'Placing gold or an object triggers a pressure trap — DC 13 DEX save or 2d6 piercing from rockfall. Correct offering reveals a cache of uncut gems worth 3d6 × 10 gp.'
			},
			{
				type: 'Logic',
				prompt:
					'A pool of perfectly still water sits in the center. Four stones ring the pool, each carved with an animal: bear, fish, eagle, wolf. A groove in the cave floor connects the pool to a sealed passage.',
				solution:
					'Submerge the fish stone. It is the only creature native to water — this triggers a hidden lever mechanism beneath the pool, draining it and opening the passage.',
				stakes:
					'Submerging other stones causes the pool to overflow, making the cave floor difficult terrain (shallow water). Submerging fish stone drains the pool, revealing the lever and a piece of equipment left by a previous explorer.'
			}
		],
		Fortress: [
			{
				type: 'Logic',
				prompt:
					'A war room with a large tactical map on the table. Five colored tokens — red, blue, green, white, black — sit in a cup. The door out is sealed and bears the inscription: "Place your forces to defend the keep without any token touching another."',
				solution:
					'Arrange the five tokens on the map so no two share an edge or corner (a variation of the 5-queens-on-a-5x5 problem). One valid arrangement: corners + center-offset.',
				stakes:
					"Each wrong placement attempt causes a crossbow bolt to fire from the wall — +4 to hit, 1d8 piercing. Correct arrangement opens the door and reveals a hidden drawer with officer's orders (useful lore)."
			},
			{
				type: 'Riddle',
				prompt:
					'Above the armory door, chiseled into the keystone: "I have a head and a tail, but no body. What am I?"',
				solution: 'A coin. Inserting a gold coin into the slot above the door unlocks the armory.',
				stakes:
					'Incorrect objects inserted trigger a dart volley — DC 13 DEX save or 1d4 piercing. Correct answer (gold coin inserted) unlocks the armory, which contains standard military equipment.'
			},
			{
				type: 'Environmental',
				prompt:
					'The floor of this guard post is a grid of pressure plates, some marked with the fortress crest. The exit portcullis is raised by weight applied in a specific pattern.',
				solution:
					'Stand on all crest-marked plates simultaneously (requires at least 2 party members to cover all plates). The portcullis rises and locks open.',
				stakes:
					'Triggering non-crest plates drops the portcullis on any creature passing under it — DC 14 DEX save or 2d10 bludgeoning and Restrained. Correct activation raises and locks the portcullis permanently.'
			},
			{
				type: 'Logic',
				prompt:
					'Three prison cells, each with a different prisoner: a thief, a soldier, a mage (all long-dead skeletons, their professions marked by their gear). One cell door has a real key inside it. A sign reads: "The guilty one always lies. The innocent always speaks truth. Ask one question to find the key."',
				solution:
					'Ask any skeleton: "Which cell does another skeleton say has the key?" Then pick the cell NOT indicated. (Classic two-guard logic puzzle variant.) The key unlocks a bonus chamber nearby.',
				stakes:
					'Opening the wrong cell releases a Specter trapped inside. Correct cell yields the key plus a journal with dungeon lore.'
			}
		],
		Arcane: [
			{
				type: 'Logic',
				prompt:
					'Seven glowing orbs orbit a central plinth, each a different color of the spectrum. The plinth inscription: "Order chaos into light. Arrange us as the sky does after rain."',
				solution:
					'Arrange the orbs in rainbow order (red, orange, yellow, green, blue, indigo, violet) around the plinth. This completes a prismatic circuit that opens the sealed door.',
				stakes:
					'Wrong arrangements cause random orbs to discharge — each misplacement: DC 13 DEX save or 1d6 damage of a random energy type. Correct arrangement floods the room with warm light and the door opens.'
			},
			{
				type: 'Riddle',
				prompt:
					'A magic mouth on the wall speaks when a creature enters: "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?"',
				solution:
					'An echo. Speaking the word "echo" (or demonstrating an echo in the chamber) opens a concealed door.',
				stakes:
					'Wrong answers cause the magic mouth to cast Thunderwave (DC 13 STR save, 2d8 thunder, pushed 10 ft). Correct answer silences the mouth and reveals the door.'
			},
			{
				type: 'Environmental',
				prompt:
					'A room of mirrors, each reflecting a different version of the party: past, future, shadow-self. Three mirrors have symbols — sun, moon, star. A plinth in the center has three recesses. The far door is sealed.',
				solution:
					'Smash the shadow-self mirrors (non-symbolic ones) to collect the shards. Place a shard in each recess on the plinth. The door unlocks.',
				stakes:
					'Smashing a symbolic mirror (sun, moon, star) releases the entity within — treat as a Shadow that attacks immediately. Smashing the correct mirrors and filling the plinth opens the door and grants one party member Advantage on their next saving throw.'
			},
			{
				type: 'Logic',
				prompt:
					'A chessboard-like floor with alternating rune tiles. Some tiles glow faintly. A wall inscription: "A knight\'s path covers all. Walk as a knight walks, starting from the lit corner."',
				solution:
					"Trace a knight's tour across the board (L-shaped moves only), starting from the glowing corner tile. Reaching the far corner opens a portal. A DC 16 Intelligence check reveals the correct route.",
				stakes:
					"Stepping on a non-knight-move tile causes an arcane shock — 1d6 lightning and teleported back to start. Completing the knight's tour opens a portal that deposits the party ahead of a long corridor."
			}
		],
		Fungal: [
			{
				type: 'Environmental',
				prompt:
					'Bioluminescent mushrooms of five colors ring the room. Each one pulses in a slow, rhythmic pattern. An ancient pictograph on the wall shows a sequence: blue, blue, red, green, blue.',
				solution:
					'Touch the mushrooms in that exact sequence. This sends a recognition signal through the mycelial network and the colony grants safe passage.',
				stakes:
					'Wrong sequences cause the mushrooms to release a spore burst — DC 12 CON save or Poisoned for 1 minute. Correct sequence causes the colony to retract thorny growths blocking the exit.'
			},
			{
				type: 'Riddle',
				prompt:
					'A massive toadstool bears a carved face that speaks when approached: "I die each morning and am born each night. I have no roots but I feed the world. What am I?"',
				solution:
					'The moon (or moonlight). Speaking "moon" or "moonlight" causes the toadstool to bloom, revealing a hollow interior with treasure.',
				stakes:
					'Wrong answers cause the toadstool to exhale a paralytic mist — DC 13 CON save or Poisoned. Correct answer blooms the cap open, revealing a hollow with useful fungi and a piece of equipment.'
			},
			{
				type: 'Logic',
				prompt:
					'Three fungal growths block separate paths. Each can be destroyed by a specific element shown in pictographs above it: Growth A (fire symbol), Growth B (cold symbol), Growth C (acid symbol). But the party only has one torch, a waterskin, and a vial of oil.',
				solution:
					'Burn the oil for fire (destroys A), pour the waterskin to quench the oil and create cold steam (approximates cold for B), mix remaining damp ash with minerals on the ground for makeshift acid (DC 13 Nature check for C).',
				stakes:
					'Using the wrong element on a growth causes it to release a defensive spore cloud — DC 12 CON save or Blinded for 1 minute. All three cleared opens the main passage and reveals a spore-preserved chest.'
			}
		]
	};

	// ── trap tables ──────────────────────────────────────────────────────────────
	interface TrapData {
		name: string;
		type: 'Mechanical' | 'Magical';
		trigger: string;
		effect: string;
		dc: number;
		save: string;
		detectDC: number;
		detectSkill: string;
	}

	const TRAP_TABLE: TrapData[] = [
		{
			name: 'Poison Dart Trap',
			type: 'Mechanical',
			trigger: 'Pressure plate',
			effect: '2d6 poison damage',
			dc: 15,
			save: 'CON',
			detectDC: 15,
			detectSkill: 'Investigation'
		},
		{
			name: 'Pit Trap',
			type: 'Mechanical',
			trigger: 'False floor panel',
			effect: '2d6 bludgeoning damage (10 ft fall)',
			dc: 13,
			save: 'DEX',
			detectDC: 13,
			detectSkill: 'Investigation'
		},
		{
			name: 'Scything Blade',
			type: 'Mechanical',
			trigger: 'Tripwire',
			effect: '2d10 slashing damage',
			dc: 15,
			save: 'DEX',
			detectDC: 14,
			detectSkill: 'Perception'
		},
		{
			name: 'Arrow Volley',
			type: 'Mechanical',
			trigger: 'Pressure plate',
			effect: '1d10 piercing damage',
			dc: 13,
			save: 'DEX',
			detectDC: 12,
			detectSkill: 'Investigation'
		},
		{
			name: 'Flame Jet',
			type: 'Mechanical',
			trigger: 'Tripwire',
			effect: '3d6 fire damage in 10 ft line',
			dc: 14,
			save: 'DEX',
			detectDC: 13,
			detectSkill: 'Perception'
		},
		{
			name: 'Collapsing Ceiling',
			type: 'Mechanical',
			trigger: 'Pressure plate',
			effect: '4d6 bludgeoning damage',
			dc: 15,
			save: 'DEX',
			detectDC: 16,
			detectSkill: 'Perception'
		},
		{
			name: 'Spike Pit',
			type: 'Mechanical',
			trigger: 'False floor panel',
			effect: '2d6 bludgeoning + 2d6 piercing damage',
			dc: 13,
			save: 'DEX',
			detectDC: 13,
			detectSkill: 'Investigation'
		},
		{
			name: 'Net Launcher',
			type: 'Mechanical',
			trigger: 'Tripwire',
			effect: 'Restrained until DC 10 STR check frees',
			dc: 12,
			save: 'DEX',
			detectDC: 11,
			detectSkill: 'Perception'
		},
		{
			name: 'Sleep Gas Vent',
			type: 'Mechanical',
			trigger: 'Pressure plate',
			effect: 'Unconscious for 1 hour (on fail)',
			dc: 14,
			save: 'CON',
			detectDC: 15,
			detectSkill: 'Investigation'
		},
		{
			name: 'Alarm Bell',
			type: 'Mechanical',
			trigger: 'Tripwire',
			effect: 'Loud bell alerts nearby creatures',
			dc: 12,
			save: 'None',
			detectDC: 10,
			detectSkill: 'Perception'
		},
		{
			name: 'Glyph of Warding — Thunderwave',
			type: 'Magical',
			trigger: 'Opening door',
			effect: '2d8 thunder damage, pushed 10 ft',
			dc: 14,
			save: 'CON',
			detectDC: 15,
			detectSkill: 'Arcana'
		},
		{
			name: 'Glyph of Warding — Hold Person',
			type: 'Magical',
			trigger: 'Opening door',
			effect: 'Paralyzed for 1 minute',
			dc: 15,
			save: 'WIS',
			detectDC: 15,
			detectSkill: 'Arcana'
		},
		{
			name: 'Glyph of Warding — Blindness',
			type: 'Magical',
			trigger: 'Opening door',
			effect: 'Blinded for 1 minute',
			dc: 14,
			save: 'CON',
			detectDC: 14,
			detectSkill: 'Arcana'
		},
		{
			name: 'Arcane Explosion',
			type: 'Magical',
			trigger: 'Pressure rune',
			effect: '4d6 force damage in 10 ft radius',
			dc: 16,
			save: 'DEX',
			detectDC: 17,
			detectSkill: 'Arcana'
		}
	];

	// trapMaps[floorIdx] maps "row,col" → TrapData for TRAPPED and LOCKED cells
	let floorTrapMaps = $state<Map<string, TrapData>[]>([]);

	const LOCK_DCS = [10, 12, 15, 17, 20] as const;

	// Traps that make sense mid-corridor (no "Opening door" trigger)
	const CORRIDOR_TRAP_TABLE: TrapData[] = [
		{
			name: 'Pit Trap',
			type: 'Mechanical',
			trigger: 'False floor panel',
			effect: '2d6 bludgeoning damage (10 ft fall)',
			dc: 13,
			save: 'DEX',
			detectDC: 13,
			detectSkill: 'Investigation'
		},
		{
			name: 'Scything Blade',
			type: 'Mechanical',
			trigger: 'Tripwire',
			effect: '2d10 slashing damage',
			dc: 15,
			save: 'DEX',
			detectDC: 14,
			detectSkill: 'Perception'
		},
		{
			name: 'Arrow Volley',
			type: 'Mechanical',
			trigger: 'Pressure plate',
			effect: '1d10 piercing damage',
			dc: 13,
			save: 'DEX',
			detectDC: 12,
			detectSkill: 'Investigation'
		},
		{
			name: 'Flame Jet',
			type: 'Mechanical',
			trigger: 'Tripwire',
			effect: '3d6 fire damage in 10 ft line',
			dc: 14,
			save: 'DEX',
			detectDC: 13,
			detectSkill: 'Perception'
		},
		{
			name: 'Collapsing Ceiling',
			type: 'Mechanical',
			trigger: 'Pressure plate',
			effect: '4d6 bludgeoning damage',
			dc: 15,
			save: 'DEX',
			detectDC: 16,
			detectSkill: 'Perception'
		},
		{
			name: 'Spike Pit',
			type: 'Mechanical',
			trigger: 'False floor panel',
			effect: '2d6 bludgeoning + 2d6 piercing damage',
			dc: 13,
			save: 'DEX',
			detectDC: 13,
			detectSkill: 'Investigation'
		},
		{
			name: 'Net Launcher',
			type: 'Mechanical',
			trigger: 'Tripwire',
			effect: 'Restrained until DC 10 STR check frees',
			dc: 12,
			save: 'DEX',
			detectDC: 11,
			detectSkill: 'Perception'
		},
		{
			name: 'Sleep Gas Vent',
			type: 'Mechanical',
			trigger: 'Pressure plate',
			effect: 'Unconscious for 1 hour (on fail)',
			dc: 14,
			save: 'CON',
			detectDC: 15,
			detectSkill: 'Investigation'
		},
		{
			name: 'Alarm Bell',
			type: 'Mechanical',
			trigger: 'Tripwire',
			effect: 'Loud bell alerts nearby creatures',
			dc: 12,
			save: 'None',
			detectDC: 10,
			detectSkill: 'Perception'
		},
		{
			name: 'Arcane Explosion',
			type: 'Magical',
			trigger: 'Pressure rune',
			effect: '4d6 force damage in 10 ft radius',
			dc: 16,
			save: 'DEX',
			detectDC: 17,
			detectSkill: 'Arcana'
		},
		{
			name: 'Poison Dart Trap',
			type: 'Mechanical',
			trigger: 'Pressure plate',
			effect: '2d6 poison damage',
			dc: 15,
			save: 'CON',
			detectDC: 15,
			detectSkill: 'Investigation'
		}
	];

	// corridorTrapKeys[floorIdx] = Set of "row,col" keys for corridor traps (for fast render lookup)
	let floorCorridorTrapKeys = $state<Set<string>[]>([]);

	function generateTraps(dungeon: Dungeon): {
		map: Map<string, TrapData>;
		corridorKeys: Set<string>;
	} {
		const map = new Map<string, TrapData>();
		const corridorKeys = new Set<string>();

		for (let r = 0; r <= dungeon.n_rows; r++) {
			for (let c = 0; c <= dungeon.n_cols; c++) {
				const cell = dungeon.cell[r][c];
				if (cell & TRAPPED) {
					map.set(`${r},${c}`, TRAP_TABLE[rand(TRAP_TABLE.length)]);
				} else if (cell & LOCKED) {
					const lockDC = LOCK_DCS[rand(LOCK_DCS.length)];
					map.set(`${r},${c}`, {
						name: 'Locked Door',
						type: 'Mechanical',
						trigger: "Requires a key or Thieves' Tools",
						effect: 'Passage blocked until unlocked or forced',
						dc: 13,
						save: 'STR',
						detectDC: lockDC,
						detectSkill: "Thieves' Tools"
					});
				} else if (cell & CORRIDOR && !(cell & OPENSPACE & ROOM) && rand(40) === 0) {
					// ~2.5% of pure corridor cells get a trap
					const key = `${r},${c}`;
					const trap = CORRIDOR_TRAP_TABLE[rand(CORRIDOR_TRAP_TABLE.length)];
					map.set(key, trap);
					corridorKeys.add(key);
				}
			}
		}
		return { map, corridorKeys };
	}

	interface ActiveTrap {
		trap: TrapData;
		x: number; // screen px
		y: number;
	}
	let activeTrap = $state<ActiveTrap | null>(null);
	interface RoomPopover {
		roomId: number;
		enc: string;
		hasTreasure: boolean;
		isBoss: boolean;
		isStart: boolean;
		anchorEl: HTMLElement;
	}
	let activeRoomPopover = $state<RoomPopover | null>(null);
	function closeRoomPopover() {
		activeRoomPopover = null;
		combat.setDungeonRoomDescription(null);
	}

	let infoMonster = $state<MonsterDetail | null>(null);

	function parseEnc(enc: string): Array<{ prefix: string; name: string; hasCard: boolean }> {
		if (!enc || enc === 'Empty') return [];
		return enc.split('+').map((part) => {
			const trimmed = part.trim();
			const m = trimmed.match(/^(\d+(?:d\d+)?)\s+(.+)$/);
			if (!m) return { prefix: '', name: trimmed, hasCard: false };
			return { prefix: m[1], name: m[2], hasCard: !!findTemplate(m[2]) };
		});
	}

	function handleCanvasClick(e: MouseEvent): void {
		if (!canvasEl || !floors[currentFloor]) return;
		const rect = canvasEl.getBoundingClientRect();
		// canvas may be CSS-scaled; map back to canvas pixel coords
		const scaleX = canvasEl.width / rect.width;
		const scaleY = canvasEl.height / rect.height;
		const col = Math.floor(((e.clientX - rect.left) * scaleX) / TILE);
		const row = Math.floor(((e.clientY - rect.top) * scaleY) / TILE);
		const cell = floors[currentFloor].cell[row]?.[col] ?? 0;
		const trap = floorTrapMaps[currentFloor]?.get(`${row},${col}`);
		if (trap) {
			activeTrap = { trap, x: e.clientX, y: e.clientY };
		} else {
			activeTrap = null;
		}
		if (mapPushed) {
			const s = new Set(floorRevealedCorridors[currentFloor] ?? []);
			let changed = false;
			if (cell & SECRET && cell & OPENSPACE) {
				// Secret door click: reveal just this single cell to players
				s.add(`${row},${col}`);
				changed = true;
			} else if (cell & CORRIDOR && !(cell & ROOM)) {
				if (cell & DOORSPACE) {
					// Door cell: reveal only this single cell
					s.add(`${row},${col}`);
				} else {
					// Plain corridor: reveal the straight segment arms
					for (const k of getCorridorSegment(row, col)) s.add(k);
				}
				changed = true;
			}
			if (changed) {
				floorRevealedCorridors = floorRevealedCorridors.map((v, i) => (i === currentFloor ? s : v));
				syncMapState();
			}
		}
	}

	// ── encounter → initiative helpers ──────────────────────────────────────────
	function rollDice(expr: string): number {
		const m = expr.match(/^(\d+)d(\d+)$/);
		if (!m) return parseInt(expr) || 1;
		let total = 0;
		const count = parseInt(m[1]);
		const sides = parseInt(m[2]);
		for (let i = 0; i < count; i++) total += rand(sides) + 1;
		return total;
	}

	function findTemplate(rawName: string) {
		const lower = rawName.trim().toLowerCase();
		const match = (s: string) => ENEMY_TEMPLATES.find((e) => e.name.toLowerCase() === s);
		return (
			match(lower) ||
			(lower.endsWith('ves') ? match(lower.slice(0, -3) + 'f') : undefined) ||
			(lower.endsWith('ies') ? match(lower.slice(0, -3) + 'y') : undefined) ||
			(lower.endsWith('es') ? match(lower.slice(0, -2)) : undefined) ||
			(lower.endsWith('s') ? match(lower.slice(0, -1)) : undefined)
		);
	}

	function addToInitiative(enc: string): void {
		for (const part of enc.split('+')) {
			const trimmed = part.trim();
			const m = trimmed.match(/^(\d+(?:d\d+)?)\s+(.+)$/);
			if (!m) continue;
			const count = rollDice(m[1]);
			const template = findTemplate(m[2]);
			if (template && count > 0) combat.addEnemies(template, count);
		}
	}

	const ENC_BOSS = [
		'1 Adult Black Dragon',
		'1 Adult Blue Dragon',
		'1 Adult Green Dragon',
		'1 Adult Red Dragon',
		'1 Adult White Dragon',
		'1 Lich',
		'1 Vampire',
		'1 Mummy Lord',
		'1 Balor',
		'1 Pit Fiend',
		'1 Marilith',
		'1 Iron Golem',
		'1 Erinyes + 2 Chain Devil',
		'1 Storm Giant',
		'1 Aboleth',
		'1 Rakshasa',
		'1 Archmage + 2 Wight',
		'1 Ice Devil + 2 Bone Devil',
		'1 Nalfeshnee',
		'1 Adult Copper Dragon'
	];

	// ── treasure tables ─────────────────────────────────────────────────────────
	const TREASURE_SMALL = [
		'1d6 × 5 sp in scattered coins',
		'A small pouch of 2d10 cp',
		'A cracked gemstone worth 10 gp',
		'A tarnished silver ring (5 gp)',
		'1d4 × 10 sp and a crude map',
		'A vial of perfume worth 5 gp',
		'A bone dice set and 3d6 cp',
		'A dented tin flask of fine wine (8 gp)'
	];

	const TREASURE_MEDIUM = [
		'A locked chest: 3d6 × 10 gp',
		'Potion of Healing + 1d6 × 10 gp',
		'A polished gemstone worth 50 gp',
		'2d6 × 10 sp and a silver holy symbol (25 gp)',
		'A spell scroll (1st level) and 1d4 × 10 gp',
		'An ornate dagger (25 gp) and 2d10 gp',
		"A set of thieves' tools and 3d10 gp",
		'Two Potions of Healing'
	];

	const TREASURE_LARGE = [
		'A sturdy chest: 2d6 × 100 gp',
		'Potion of Greater Healing + gemstone (100 gp)',
		'A spell scroll (2nd level) + 1d6 × 50 gp',
		'A fine cloak worth 150 gp and 3d6 × 10 gp',
		'+1 Ammunition (20 pieces) and 4d10 × 10 gp',
		'A rare art object worth 250 gp',
		'Three Potions of Healing and 2d6 × 25 gp',
		'A wand with 1d6 charges (Wand of Magic Detection)'
	];

	const TREASURE_BOSS = [
		'A reinforced chest: 5d6 × 100 gp + 1d4 gemstones (100 gp each)',
		"+1 Weapon of the DM's choice + 3d6 × 100 gp",
		'A legendary art object (2,500 gp) and a spell scroll (4th level)',
		'Bag of Holding containing 1d4 × 500 gp in mixed coins',
		'+1 Shield and three Potions of Superior Healing + 5d6 × 50 gp',
		'Cloak of Protection + 2d4 gemstones (250 gp each)',
		'A spell scroll (5th level) and 4d6 × 100 gp in gold ingots',
		'Wand of Fireballs (1d6+1 charges) + 3d6 × 100 gp'
	];

	// treasure[floorIdx] = array indexed by room id (1-based; '' = no treasure)
	let floorTreasure = $state<string[][]>([]);
	let floorHazards = $state<Record<number, string>[]>([]);
	let floorVisitedRooms = $state<Set<number>[]>([]);
	let floorRevealedCorridors = $state<Set<string>[]>([]);
	let mapPushed = $state(false);

	function generateTreasure(dungeon: Dungeon, bossRoomId = 0): string[] {
		const result: string[] = [''];
		for (let id = 1; id <= dungeon.n_rooms; id++) {
			const room = dungeon.room[id];
			if (!room) {
				result.push('');
				continue;
			}
			if (id === bossRoomId) {
				result.push(TREASURE_BOSS[rand(TREASURE_BOSS.length)]);
				continue;
			}
			if (rand(4) !== 0) {
				result.push('');
				continue;
			} // 25% chance
			const tileCells = (room.south - room.north + 1) * (room.east - room.west + 1);
			let table: string[];
			if (tileCells <= 25) table = TREASURE_SMALL;
			else if (tileCells <= 64) table = TREASURE_MEDIUM;
			else table = TREASURE_LARGE;
			result.push(table[rand(table.length)]);
		}
		return result;
	}

	// puzzles[floorIdx] = sparse map: roomId → Puzzle (only empty rooms, ~20%)
	let floorPuzzles = $state<Record<number, Puzzle>[]>([]);
	let expandedPuzzleSolutions = $state<Set<string>>(new Set());

	function generatePuzzles(
		dungeon: Dungeon,
		encounters: string[],
		bossRoomId = 0,
		floorIndex = 0
	): Record<number, Puzzle> {
		const table = PUZZLE_TABLE[dungeonTheme];
		const result: Record<number, Puzzle> = {};
		for (let id = 1; id <= dungeon.n_rooms; id++) {
			if (floorIndex === 0 && id === 1) continue; // skip start room
			if (id === bossRoomId) continue; // no puzzles in boss room
			if (encounters[id] !== 'Empty') continue; // only empty rooms
			if (Math.random() < 0.22) result[id] = table[rand(table.length)];
		}
		return result;
	}

	// encounters[floorIdx] = array indexed by room id (1-based; index 0 unused)
	let floorEncounters = $state<string[][]>([]);

	function generateHazards(
		dungeon: Dungeon,
		bossRoomId = 0,
		floorIndex = 0
	): Record<number, string> {
		const table = HAZARD_TABLE[dungeonTheme];
		const result: Record<number, string> = {};
		for (let id = 1; id <= dungeon.n_rooms; id++) {
			if (floorIndex === 0 && id === 1) continue; // skip start room
			const prob = id === bossRoomId ? 0.45 : 0.22;
			if (Math.random() < prob) result[id] = table[rand(table.length)];
		}
		return result;
	}

	function generateEncounters(dungeon: Dungeon, bossRoomId = 0): string[] {
		const result: string[] = ['']; // index 0 placeholder
		for (let id = 1; id <= dungeon.n_rooms; id++) {
			const room = dungeon.room[id];
			if (!room) {
				result.push('');
				continue;
			}
			if (id === bossRoomId) {
				result.push(ENC_BOSS[rand(ENC_BOSS.length)]);
				continue;
			}
			// ~50% empty rooms
			if (rand(2) === 0) {
				result.push('Empty');
				continue;
			}
			const tileCells = (room.south - room.north + 1) * (room.east - room.west + 1);
			let table: string[];
			if (tileCells <= 25) table = ENC_SMALL;
			else if (tileCells <= 64) table = ENC_MEDIUM;
			else table = ENC_LARGE;
			result.push(table[rand(table.length)]);
		}
		return result;
	}

	// ── RNG (seeded) ────────────────────────────────────────────────────────────
	// Simple mulberry32 PRNG so we could optionally seed it.
	// For this POC we just use Math.random() like Perl's srand(time()).
	function rand(n: number): number {
		return Math.floor(Math.random() * n);
	}

	// ── shuffle (mirrors Perl's shuffle — assigns random keys then sorts) ───────
	function shuffle<T>(arr: T[]): T[] {
		const indices = arr.map((_, i) => i);
		const weights = indices.map(() => rand(100));
		indices.sort((a, b) => weights[a] - weights[b]);
		return indices.map((i) => arr[i]);
	}

	// ── door type ───────────────────────────────────────────────────────────────
	function doorType(): number {
		const i = rand(110);
		if (i < 15) return ARCH;
		if (i < 60) return DOOR;
		if (i < 75) return LOCKED;
		if (i < 90) return TRAPPED;
		if (i < 100) return SECRET;
		return PORTC;
	}

	// ── dungeon state types ─────────────────────────────────────────────────────
	interface RoomData {
		id: number;
		row: number;
		col: number;
		north: number;
		south: number;
		west: number;
		east: number;
		height: number;
		width: number;
		area: number;
		door: Record<string, DoorData[]>;
	}

	interface DoorData {
		row: number;
		col: number;
		key: string;
		type: string;
		out_id?: number;
	}

	interface StairData {
		row: number;
		col: number;
		next_row: number;
		next_col: number;
		key: string;
		connects_to_floor?: number;
	}

	interface Dungeon {
		n_rows: number;
		n_cols: number;
		n_i: number;
		n_j: number;
		max_row: number;
		max_col: number;
		n_rooms: number;
		room_base: number;
		room_radix: number;
		corridor_layout: number;
		remove_deadends: number;
		cell: number[][];
		room: RoomData[];
		stair: StairData[];
		connect: Record<string, number>;
	}

	// ── step 1: initCells ───────────────────────────────────────────────────────
	function initCells(d: Dungeon): void {
		d.cell = [];
		for (let r = 0; r <= d.n_rows; r++) {
			d.cell[r] = new Array(d.n_cols + 1).fill(0);
		}
	}

	// ── step 2: emplaceRooms (scatter mode) ─────────────────────────────────────
	function setRoom(
		d: Dungeon,
		proto: { i?: number; j?: number; height?: number; width?: number }
	): { i: number; j: number; height: number; width: number } {
		const base = d.room_base;
		const radix = d.room_radix;

		let height: number;
		if (proto.height !== undefined) {
			height = proto.height;
		} else if (proto.i !== undefined) {
			const a = Math.max(0, d.n_i - base - proto.i);
			const r = a < radix ? a : radix;
			height = rand(r) + base;
		} else {
			height = rand(radix) + base;
		}

		let width: number;
		if (proto.width !== undefined) {
			width = proto.width;
		} else if (proto.j !== undefined) {
			const a = Math.max(0, d.n_j - base - proto.j);
			const r = a < radix ? a : radix;
			width = rand(r) + base;
		} else {
			width = rand(radix) + base;
		}

		const i = proto.i !== undefined ? proto.i : rand(d.n_i - height);
		const j = proto.j !== undefined ? proto.j : rand(d.n_j - width);

		return { i, j, height, width };
	}

	function soundRoom(
		d: Dungeon,
		r1: number,
		c1: number,
		r2: number,
		c2: number
	): { blocked?: boolean; [key: number]: number } {
		const hit: { blocked?: boolean; [key: number]: number } = {};
		for (let r = r1; r <= r2; r++) {
			for (let c = c1; c <= c2; c++) {
				if (d.cell[r][c] & BLOCKED) return { blocked: true };
				if (d.cell[r][c] & ROOM) {
					const id = (d.cell[r][c] & ROOM_ID) >> 6;
					hit[id] = (hit[id] ?? 0) + 1;
				}
			}
		}
		return hit;
	}

	function emplaceRoom(d: Dungeon, proto?: { i?: number; j?: number }): void {
		if (d.n_rooms === 999) return;

		const p = setRoom(d, proto ?? {});
		const { i, j, height, width } = p;

		const r1 = i * 2 + 1;
		const c1 = j * 2 + 1;
		const r2 = (i + height) * 2 - 1;
		const c2 = (j + width) * 2 - 1;

		if (r1 < 1 || r2 > d.max_row) return;
		if (c1 < 1 || c2 > d.max_col) return;

		const hit = soundRoom(d, r1, c1, r2, c2);
		if (hit.blocked) return;
		const hitKeys = Object.keys(hit).filter((k) => k !== 'blocked');
		if (hitKeys.length > 0) return;

		const roomId = d.n_rooms + 1;
		d.n_rooms = roomId;

		// stamp room cells
		for (let r = r1; r <= r2; r++) {
			for (let c = c1; c <= c2; c++) {
				if (d.cell[r][c] & ENTRANCE) {
					d.cell[r][c] &= ~ESPACE;
				} else if (d.cell[r][c] & PERIMETER) {
					d.cell[r][c] &= ~PERIMETER;
				}
				d.cell[r][c] |= ROOM | (roomId << 6);
			}
		}

		const roomH = (r2 - r1 + 1) * 10;
		const roomW = (c2 - c1 + 1) * 10;

		const roomData: RoomData = {
			id: roomId,
			row: r1,
			col: c1,
			north: r1,
			south: r2,
			west: c1,
			east: c2,
			height: roomH,
			width: roomW,
			area: roomH * roomW,
			door: {}
		};
		d.room[roomId] = roomData;

		// mark perimeter (block corridors from room boundary)
		for (let r = r1 - 1; r <= r2 + 1; r++) {
			if (!(d.cell[r][c1 - 1] & (ROOM | ENTRANCE))) {
				d.cell[r][c1 - 1] |= PERIMETER;
			}
			if (!(d.cell[r][c2 + 1] & (ROOM | ENTRANCE))) {
				d.cell[r][c2 + 1] |= PERIMETER;
			}
		}
		for (let c = c1 - 1; c <= c2 + 1; c++) {
			if (!(d.cell[r1 - 1][c] & (ROOM | ENTRANCE))) {
				d.cell[r1 - 1][c] |= PERIMETER;
			}
			if (!(d.cell[r2 + 1][c] & (ROOM | ENTRANCE))) {
				d.cell[r2 + 1][c] |= PERIMETER;
			}
		}
	}

	function emplaceRooms(d: Dungeon): void {
		// donjon uses room_max^2 for alloc_rooms (alloc_rooms in dungeon.pl)
		const n = Math.floor((d.n_rows * d.n_cols) / (roomMax * roomMax));
		for (let i = 0; i < n; i++) {
			emplaceRoom(d);
		}
	}

	// ── step 3: openRooms ───────────────────────────────────────────────────────
	interface Sill {
		sill_r: number;
		sill_c: number;
		dir: string;
		door_r: number;
		door_c: number;
		out_id?: number;
	}

	function checkSill(
		d: Dungeon,
		room: RoomData,
		sillR: number,
		sillC: number,
		dir: string
	): Sill | null {
		const doorR = sillR + di[dir];
		const doorC = sillC + dj[dir];
		const doorCell = d.cell[doorR]?.[doorC];
		if (doorCell === undefined) return null;
		if (!(doorCell & PERIMETER)) return null;
		if (doorCell & BLOCK_DOOR) return null;

		const outR = doorR + di[dir];
		const outC = doorC + dj[dir];
		const outCell = d.cell[outR]?.[outC];
		if (outCell === undefined) return null;
		if (outCell & BLOCKED) return null;

		let outId: number | undefined;
		if (outCell & ROOM) {
			outId = (outCell & ROOM_ID) >> 6;
			if (outId === room.id) return null;
		}

		return { sill_r: sillR, sill_c: sillC, dir, door_r: doorR, door_c: doorC, out_id: outId };
	}

	function doorSills(d: Dungeon, room: RoomData): Sill[] {
		const list: Sill[] = [];

		if (room.north >= 3) {
			for (let c = room.west; c <= room.east; c += 2) {
				const s = checkSill(d, room, room.north, c, 'north');
				if (s) list.push(s);
			}
		}
		if (room.south <= d.n_rows - 3) {
			for (let c = room.west; c <= room.east; c += 2) {
				const s = checkSill(d, room, room.south, c, 'south');
				if (s) list.push(s);
			}
		}
		if (room.west >= 3) {
			for (let r = room.north; r <= room.south; r += 2) {
				const s = checkSill(d, room, r, room.west, 'west');
				if (s) list.push(s);
			}
		}
		if (room.east <= d.n_cols - 3) {
			for (let r = room.north; r <= room.south; r += 2) {
				const s = checkSill(d, room, r, room.east, 'east');
				if (s) list.push(s);
			}
		}

		return shuffle(list);
	}

	function allocOpens(room: RoomData): number {
		const roomH = (room.south - room.north) / 2 + 1;
		const roomW = (room.east - room.west) / 2 + 1;
		const flumph = Math.floor(Math.sqrt(roomW * roomH));
		return flumph + rand(flumph);
	}

	function openRoom(d: Dungeon, room: RoomData): void {
		const list = doorSills(d, room);
		if (list.length === 0) return;

		const nOpens = allocOpens(room);

		for (let i = 0; i < nOpens; i++) {
			if (list.length === 0) break;

			// pick random sill (splice out)
			const idx = rand(list.length);
			const sill = list.splice(idx, 1)[0];
			if (!sill) break;

			const doorCell = d.cell[sill.door_r][sill.door_c];
			if (doorCell & DOORSPACE) {
				i--; // redo
				continue;
			}

			if (sill.out_id !== undefined) {
				const connect = [room.id, sill.out_id].sort((a, b) => a - b).join(',');
				if (!d.connect[connect]) {
					d.connect[connect] = 0;
				}
				d.connect[connect]++;
				if (d.connect[connect] > 1) {
					i--; // redo
					continue;
				}
			}

			// clear 3 cells of PERIMETER, set ENTRANCE
			for (let x = 0; x < 3; x++) {
				const r = sill.sill_r + di[sill.dir] * x;
				const c = sill.sill_c + dj[sill.dir] * x;
				d.cell[r][c] &= ~PERIMETER;
				d.cell[r][c] |= ENTRANCE;
			}

			const dt = doorType();
			const door: DoorData = { row: sill.door_r, col: sill.door_c, key: '', type: '' };

			if (dt === ARCH) {
				d.cell[sill.door_r][sill.door_c] |= ARCH;
				door.key = 'arch';
				door.type = 'Archway';
			} else if (dt === DOOR) {
				d.cell[sill.door_r][sill.door_c] |= DOOR;
				d.cell[sill.door_r][sill.door_c] |= 'o'.charCodeAt(0) << 24;
				door.key = 'open';
				door.type = 'Unlocked Door';
			} else if (dt === LOCKED) {
				d.cell[sill.door_r][sill.door_c] |= LOCKED;
				d.cell[sill.door_r][sill.door_c] |= 'x'.charCodeAt(0) << 24;
				door.key = 'lock';
				door.type = 'Locked Door';
			} else if (dt === TRAPPED) {
				d.cell[sill.door_r][sill.door_c] |= TRAPPED;
				d.cell[sill.door_r][sill.door_c] |= 't'.charCodeAt(0) << 24;
				door.key = 'trap';
				door.type = 'Trapped Door';
			} else if (dt === SECRET) {
				d.cell[sill.door_r][sill.door_c] |= SECRET;
				d.cell[sill.door_r][sill.door_c] |= 's'.charCodeAt(0) << 24;
				door.key = 'secret';
				door.type = 'Secret Door';
			} else {
				d.cell[sill.door_r][sill.door_c] |= PORTC;
				d.cell[sill.door_r][sill.door_c] |= '#'.charCodeAt(0) << 24;
				door.key = 'portc';
				door.type = 'Portcullis';
			}

			if (sill.out_id !== undefined) door.out_id = sill.out_id;

			if (!room.door[sill.dir]) room.door[sill.dir] = [];
			room.door[sill.dir].push(door);
		}
	}

	function openRooms(d: Dungeon): void {
		for (let id = 1; id <= d.n_rooms; id++) {
			openRoom(d, d.room[id]);
		}
		d.connect = {};
	}

	// ── step 4: corridors ───────────────────────────────────────────────────────
	function tunnelDirs(d: Dungeon, lastDir: string | null): string[] {
		const dirs = shuffle([...allDirs]);
		if (lastDir && d.corridor_layout > 0) {
			if (rand(100) < d.corridor_layout) {
				dirs.unshift(lastDir);
			}
		}
		return dirs;
	}

	function soundTunnel(
		d: Dungeon,
		midR: number,
		midC: number,
		nextR: number,
		nextC: number
	): boolean {
		if (nextR < 0 || nextR > d.n_rows) return false;
		if (nextC < 0 || nextC > d.n_cols) return false;

		const r1 = Math.min(midR, nextR);
		const r2 = Math.max(midR, nextR);
		const c1 = Math.min(midC, nextC);
		const c2 = Math.max(midC, nextC);

		for (let r = r1; r <= r2; r++) {
			for (let c = c1; c <= c2; c++) {
				if (d.cell[r][c] & BLOCK_CORR) return false;
			}
		}
		return true;
	}

	function delveTunnel(
		d: Dungeon,
		thisR: number,
		thisC: number,
		nextR: number,
		nextC: number
	): boolean {
		const r1 = Math.min(thisR, nextR);
		const r2 = Math.max(thisR, nextR);
		const c1 = Math.min(thisC, nextC);
		const c2 = Math.max(thisC, nextC);

		for (let r = r1; r <= r2; r++) {
			for (let c = c1; c <= c2; c++) {
				d.cell[r][c] &= ~ENTRANCE;
				d.cell[r][c] |= CORRIDOR;
			}
		}
		return true;
	}

	function openTunnel(d: Dungeon, i: number, j: number, dir: string): boolean {
		const thisR = i * 2 + 1;
		const thisC = j * 2 + 1;
		const nextR = (i + di[dir]) * 2 + 1;
		const nextC = (j + dj[dir]) * 2 + 1;
		const midR = (thisR + nextR) / 2;
		const midC = (thisC + nextC) / 2;

		if (soundTunnel(d, midR, midC, nextR, nextC)) {
			return delveTunnel(d, thisR, thisC, nextR, nextC);
		}
		return false;
	}

	function tunnel(d: Dungeon, i: number, j: number, lastDir: string | null): void {
		const dirs = tunnelDirs(d, lastDir);
		for (const dir of dirs) {
			if (openTunnel(d, i, j, dir)) {
				const nextI = i + di[dir];
				const nextJ = j + dj[dir];
				tunnel(d, nextI, nextJ, dir);
			}
		}
	}

	function corridors(d: Dungeon): void {
		for (let i = 1; i < d.n_i; i++) {
			const r = i * 2 + 1;
			for (let j = 1; j < d.n_j; j++) {
				const c = j * 2 + 1;
				if (!(d.cell[r][c] & CORRIDOR)) {
					tunnel(d, i, j, null);
				}
			}
		}
	}

	// ── step 5: emplaceStairs ───────────────────────────────────────────────────
	function checkTunnel(
		cell: number[][],
		r: number,
		c: number,
		check: { corridor?: number[][]; walled?: number[][] }
	): boolean {
		if (check.corridor) {
			for (const p of check.corridor) {
				if (cell[r + p[0]]?.[c + p[1]] !== CORRIDOR) return false;
			}
		}
		if (check.walled) {
			for (const p of check.walled) {
				if (cell[r + p[0]]?.[c + p[1]] & OPENSPACE) return false;
			}
		}
		return true;
	}

	function stairEnds(d: Dungeon): StairData[] {
		const list: StairData[] = [];

		outer: for (let i = 0; i < d.n_i; i++) {
			const r = i * 2 + 1;
			for (let j = 0; j < d.n_j; j++) {
				const c = j * 2 + 1;

				if (d.cell[r][c] !== CORRIDOR) continue;
				if (d.cell[r][c] & STAIRS) continue;

				for (const dir of Object.keys(stairEnd)) {
					if (checkTunnel(d.cell, r, c, stairEnd[dir])) {
						const n = stairEnd[dir].next;
						list.push({
							row: r,
							col: c,
							next_row: r + n[0],
							next_col: c + n[1],
							key: ''
						});
						continue outer;
					}
				}
			}
		}

		return list;
	}

	function emplaceStairs(d: Dungeon): void {
		const list = stairEnds(d);
		if (list.length === 0) return;

		for (let i = 0; i < 2; i++) {
			if (list.length === 0) break;
			const idx = rand(list.length);
			const stair = list.splice(idx, 1)[0];
			if (!stair) break;

			if (i === 0) {
				d.cell[stair.row][stair.col] |= STAIR_DN;
				d.cell[stair.row][stair.col] |= 'd'.charCodeAt(0) << 24;
				stair.key = 'down';
			} else {
				d.cell[stair.row][stair.col] |= STAIR_UP;
				d.cell[stair.row][stair.col] |= 'u'.charCodeAt(0) << 24;
				stair.key = 'up';
			}
			d.stair.push(stair);
		}
	}

	// ── step 6: cleanDungeon ────────────────────────────────────────────────────
	function collapse(d: Dungeon, r: number, c: number): void {
		if (!(d.cell[r][c] & OPENSPACE)) return;

		for (const dir of Object.keys(closeEnd)) {
			const xc = closeEnd[dir];
			if (checkTunnel(d.cell, r, c, xc)) {
				for (const p of xc.close) {
					d.cell[r + p[0]][c + p[1]] = 0;
				}
				const rec = xc.recurse;
				collapse(d, r + rec[0], c + rec[1]);
			}
		}
	}

	function collapseTunnels(d: Dungeon, p: number): void {
		if (!p) return;
		const all = p === 100;

		for (let i = 0; i < d.n_i; i++) {
			const r = i * 2 + 1;
			for (let j = 0; j < d.n_j; j++) {
				const c = j * 2 + 1;
				if (!(d.cell[r][c] & OPENSPACE)) continue;
				if (d.cell[r][c] & STAIRS) continue;
				if (!all && rand(100) >= p) continue;
				collapse(d, r, c);
			}
		}
	}

	function fixDoors(d: Dungeon): void {
		const fixed: boolean[][] = [];

		for (const room of d.room) {
			if (!room) continue;
			for (const dir of Object.keys(room.door)) {
				const shiny: DoorData[] = [];
				for (const door of room.door[dir]) {
					const dc = d.cell[door.row]?.[door.col];
					if (!dc || !(dc & OPENSPACE)) continue;

					if (fixed[door.row]?.[door.col]) {
						shiny.push(door);
					} else {
						if (door.out_id !== undefined) {
							const outDir = opposite[dir];
							const outRoom = d.room[door.out_id];
							if (outRoom) {
								if (!outRoom.door[outDir]) outRoom.door[outDir] = [];
								outRoom.door[outDir].push(door);
							}
						}
						shiny.push(door);
						if (!fixed[door.row]) fixed[door.row] = [];
						fixed[door.row][door.col] = true;
					}
				}
				if (shiny.length > 0) {
					room.door[dir] = shiny;
				} else {
					delete room.door[dir];
				}
			}
		}
	}

	function emptyBlocks(d: Dungeon): void {
		for (let r = 0; r <= d.n_rows; r++) {
			for (let c = 0; c <= d.n_cols; c++) {
				if (d.cell[r][c] & BLOCKED) d.cell[r][c] = 0;
			}
		}
	}

	function cleanDungeon(d: Dungeon): void {
		collapseTunnels(d, d.remove_deadends);
		fixDoors(d);
		emptyBlocks(d);
	}

	// ── master generate ─────────────────────────────────────────────────────────
	function generate(skipStairs = false): Dungeon {
		// ensure odd
		const nR = nRows % 2 === 0 ? nRows - 1 : nRows;
		const nC = nCols % 2 === 0 ? nCols - 1 : nCols;

		const d: Dungeon = {
			n_rows: nR,
			n_cols: nC,
			n_i: Math.floor(nR / 2),
			n_j: Math.floor(nC / 2),
			max_row: nR - 1,
			max_col: nC - 1,
			n_rooms: 0,
			room_base: Math.floor((roomMin + 1) / 2),
			room_radix: Math.floor((roomMax - roomMin) / 2) + 1,
			corridor_layout: corridorLayout,
			remove_deadends: removeDeadends,
			cell: [],
			room: [],
			stair: [],
			connect: {}
		};

		// Perl recalculates n_rows/n_cols from n_i/n_j
		d.n_rows = d.n_i * 2;
		d.n_cols = d.n_j * 2;
		d.max_row = d.n_rows - 1;
		d.max_col = d.n_cols - 1;

		initCells(d);
		emplaceRooms(d);
		openRooms(d);
		corridors(d);
		if (!skipStairs) emplaceStairs(d);
		cleanDungeon(d);

		return d;
	}

	// ── color palette (matches DungeonGeneratorModal) ──────────────────────────
	const THEME_PALETTES: Record<
		DungeonTheme,
		{
			void: string;
			gridVoid: string;
			floor: string;
			floorAlt: string;
			corridor: string;
			corridorGrout: string;
			gridFloor: string;
			wallLit: string;
			wallDim: string;
			door: string;
			trap: string;
			label: string;
			bossFloor: string;
			bossFloorAlt: string;
			bossWallLit: string;
			bossWallDim: string;
			bossLabel: string;
			startFloor: string;
			startFloorAlt: string;
			startWallLit: string;
			startWallDim: string;
			startLabel: string;
		}
	> = {
		Crypt: {
			void: '#0a0d12',
			gridVoid: '#111820',
			floor: '#2a3a4a',
			floorAlt: '#243242',
			corridor: '#1e2c3a',
			corridorGrout: 'rgba(100,150,190,0.25)',
			gridFloor: 'rgba(0,0,0,0.18)',
			wallLit: '#5a8098',
			wallDim: '#2a4058',
			door: '#c87820',
			trap: '#cc2222',
			label: '#5a8098',
			bossFloor: '#4a1515',
			bossFloorAlt: '#3d1010',
			bossWallLit: '#a04040',
			bossWallDim: '#602020',
			bossLabel: '#e05050',
			startFloor: '#1a3d20',
			startFloorAlt: '#152f18',
			startWallLit: '#4a9a5a',
			startWallDim: '#2a6035',
			startLabel: '#5fd870'
		},
		Sewer: {
			void: '#06090a',
			gridVoid: '#0d1410',
			floor: '#243028',
			floorAlt: '#1e2a20',
			corridor: '#182418',
			corridorGrout: 'rgba(80,140,80,0.28)',
			gridFloor: 'rgba(0,0,0,0.20)',
			wallLit: '#5a8a50',
			wallDim: '#2a4825',
			door: '#a06820',
			trap: '#cc2222',
			label: '#6a9a60',
			bossFloor: '#3a2810',
			bossFloorAlt: '#2e200c',
			bossWallLit: '#9a6830',
			bossWallDim: '#5a3c18',
			bossLabel: '#e09040',
			startFloor: '#1c3a32',
			startFloorAlt: '#162e28',
			startWallLit: '#40988a',
			startWallDim: '#225848',
			startLabel: '#50d8c0'
		},
		Cave: {
			void: '#0c0906',
			gridVoid: '#1a1410',
			floor: '#3a2e22',
			floorAlt: '#30261c',
			corridor: '#261e16',
			corridorGrout: 'rgba(160,120,80,0.28)',
			gridFloor: 'rgba(0,0,0,0.18)',
			wallLit: '#8a6a48',
			wallDim: '#4a3820',
			door: '#c87820',
			trap: '#cc2222',
			label: '#9a7a58',
			bossFloor: '#3a1a10',
			bossFloorAlt: '#2e1410',
			bossWallLit: '#a84830',
			bossWallDim: '#682818',
			bossLabel: '#e06840',
			startFloor: '#223820',
			startFloorAlt: '#1a2e1a',
			startWallLit: '#608858',
			startWallDim: '#385030',
			startLabel: '#80c870'
		},
		Fortress: {
			void: '#080a0c',
			gridVoid: '#141618',
			floor: '#303438',
			floorAlt: '#282c30',
			corridor: '#1e2226',
			corridorGrout: 'rgba(140,150,160,0.25)',
			gridFloor: 'rgba(0,0,0,0.20)',
			wallLit: '#808898',
			wallDim: '#404850',
			door: '#9a7840',
			trap: '#cc2222',
			label: '#909aaa',
			bossFloor: '#381830',
			bossFloorAlt: '#2c1028',
			bossWallLit: '#984880',
			bossWallDim: '#5a2850',
			bossLabel: '#e060b8',
			startFloor: '#183040',
			startFloorAlt: '#122838',
			startWallLit: '#4080a8',
			startWallDim: '#205068',
			startLabel: '#60c0e8'
		},
		Arcane: {
			void: '#08060e',
			gridVoid: '#110d1c',
			floor: '#241840',
			floorAlt: '#1e1438',
			corridor: '#180e30',
			corridorGrout: 'rgba(120,80,200,0.30)',
			gridFloor: 'rgba(0,0,0,0.20)',
			wallLit: '#7858c0',
			wallDim: '#3c2878',
			door: '#a870e0',
			trap: '#cc2222',
			label: '#8868d0',
			bossFloor: '#2a0840',
			bossFloorAlt: '#220638',
			bossWallLit: '#9830c0',
			bossWallDim: '#5c1878',
			bossLabel: '#d050f0',
			startFloor: '#0c2840',
			startFloorAlt: '#0a2038',
			startWallLit: '#3878c8',
			startWallDim: '#1c4880',
			startLabel: '#60b8f8'
		},
		Fungal: {
			void: '#050a08',
			gridVoid: '#0c1410',
			floor: '#1a2e28',
			floorAlt: '#152620',
			corridor: '#101e1a',
			corridorGrout: 'rgba(80,200,140,0.28)',
			gridFloor: 'rgba(0,0,0,0.22)',
			wallLit: '#48b888',
			wallDim: '#206040',
			door: '#a0b820',
			trap: '#cc2222',
			label: '#58c890',
			bossFloor: '#1e3010',
			bossFloorAlt: '#162808',
			bossWallLit: '#88c020',
			bossWallDim: '#488010',
			bossLabel: '#c8f040',
			startFloor: '#0e2830',
			startFloorAlt: '#0a2028',
			startWallLit: '#30b0c0',
			startWallDim: '#186880',
			startLabel: '#40d8e8'
		}
	};
	const C = $derived(THEME_PALETTES[dungeonTheme]);
	$effect(() => {
		const _t = dungeonTheme;
		if (floors.length > 0 && canvasEl)
			renderDungeon(
				floors[currentFloor],
				floorBossRoomIds[currentFloor],
				currentFloor === 0 ? 1 : 0
			);
	});

	// ── rendering ───────────────────────────────────────────────────────────────
	function renderDungeon(d: Dungeon, bossRoomId = 0, startRoomId = 0): void {
		if (!canvasEl) return;

		const canvasW = (d.n_cols + 1) * TILE;
		const canvasH = (d.n_rows + 1) * TILE;
		canvasEl.width = canvasW;
		canvasEl.height = canvasH;
		canvasPixelW = canvasW;
		canvasPixelH = canvasH;

		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		// ── Pass 1: Void background + subtle grid ────────────────────────────
		ctx.fillStyle = C.void;
		ctx.fillRect(0, 0, canvasW, canvasH);

		ctx.strokeStyle = C.gridVoid;
		ctx.lineWidth = 0.5;
		for (let c = 0; c <= d.n_cols + 1; c++) {
			ctx.beginPath();
			ctx.moveTo(c * TILE, 0);
			ctx.lineTo(c * TILE, canvasH);
			ctx.stroke();
		}
		for (let r = 0; r <= d.n_rows + 1; r++) {
			ctx.beginPath();
			ctx.moveTo(0, r * TILE);
			ctx.lineTo(canvasW, r * TILE);
			ctx.stroke();
		}

		// ── Pass 2: Floors and corridors ─────────────────────────────────────
		for (let r = 0; r <= d.n_rows; r++) {
			for (let c = 0; c <= d.n_cols; c++) {
				const cell = d.cell[r][c];
				const x = c * TILE;
				const y = r * TILE;

				if (cell & ROOM) {
					const roomId = (cell & ROOM_ID) >> 6;
					const isBoss = bossRoomId > 0 && roomId === bossRoomId;
					const isStart = startRoomId > 0 && roomId === startRoomId;
					ctx.fillStyle = isBoss
						? (r + c) % 2 === 1
							? C.bossFloorAlt
							: C.bossFloor
						: isStart
							? (r + c) % 2 === 1
								? C.startFloorAlt
								: C.startFloor
							: (r + c) % 2 === 1
								? C.floorAlt
								: C.floor;
					ctx.fillRect(x, y, TILE, TILE);
					ctx.fillStyle = C.gridFloor;
					ctx.fillRect(x, y, TILE, 1);
				} else if (cell & CORRIDOR) {
					ctx.fillStyle = C.corridor;
					ctx.fillRect(x, y, TILE, TILE);
					// grout lines: 1px lighter border on all edges
					ctx.fillStyle = C.corridorGrout;
					ctx.fillRect(x, y, TILE, 1); // top
					ctx.fillRect(x, y, 1, TILE); // left
					ctx.fillRect(x + TILE - 1, y, 1, TILE); // right
					ctx.fillRect(x, y + TILE - 1, TILE, 1); // bottom
				}
			}
		}

		// ── Pass 2b: Doors ───────────────────────────────────────────────────
		for (let r = 0; r <= d.n_rows; r++) {
			for (let c = 0; c <= d.n_cols; c++) {
				const cell = d.cell[r][c];
				if (!(cell & OPENSPACE)) continue;
				if (!(cell & DOORSPACE)) continue;
				drawDoor(ctx, d, cell, r, c);
			}
		}

		// ── Pass 2c: Stairs ──────────────────────────────────────────────────
		for (let r = 0; r <= d.n_rows; r++) {
			for (let c = 0; c <= d.n_cols; c++) {
				const cell = d.cell[r][c];
				if (cell & STAIRS) {
					const stairData = d.stair.find((s) => s.row === r && s.col === c);
					drawStair(ctx, cell, c * TILE, r * TILE, stairData?.connects_to_floor);
				}
			}
		}

		// ── Pass 2d: Corridor trap icons ─────────────────────────────────────
		const corridorKeys = floorCorridorTrapKeys[currentFloor];
		if (corridorKeys?.size) {
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.font = `bold ${TILE - 2}px monospace`;
			for (const key of corridorKeys) {
				const [kr, kc] = key.split(',').map(Number);
				const x = kc * TILE;
				const y = kr * TILE;
				const pad = 2;
				// Orange square
				ctx.fillStyle = '#d4780a';
				ctx.fillRect(x + pad, y + pad, TILE - pad * 2, TILE - pad * 2);
				// Red exclamation mark
				ctx.fillStyle = '#ee2222';
				ctx.fillText('!', x + TILE / 2, y + TILE / 2 + 1);
			}
		}

		// ── Pass 3: Wall edges at open→void boundaries ───────────────────────
		const isOpen = (row: number, col: number) =>
			row >= 0 &&
			row <= d.n_rows &&
			col >= 0 &&
			col <= d.n_cols &&
			!!(d.cell[row][col] & OPENSPACE);

		ctx.lineWidth = 1.5;
		for (let r = 0; r <= d.n_rows; r++) {
			for (let c = 0; c <= d.n_cols; c++) {
				if (!isOpen(r, c)) continue;
				const wallRoomId = (d.cell[r][c] & ROOM_ID) >> 6;
				const isBoss = bossRoomId > 0 && wallRoomId === bossRoomId;
				const isStart = startRoomId > 0 && wallRoomId === startRoomId;
				const x = c * TILE;
				const y = r * TILE;
				if (!isOpen(r - 1, c)) {
					ctx.strokeStyle = isBoss ? C.bossWallLit : isStart ? C.startWallLit : C.wallLit;
					ctx.beginPath();
					ctx.moveTo(x, y);
					ctx.lineTo(x + TILE, y);
					ctx.stroke();
				}
				if (!isOpen(r + 1, c)) {
					ctx.strokeStyle = isBoss ? C.bossWallDim : isStart ? C.startWallDim : C.wallDim;
					ctx.beginPath();
					ctx.moveTo(x, y + TILE);
					ctx.lineTo(x + TILE, y + TILE);
					ctx.stroke();
				}
				if (!isOpen(r, c - 1)) {
					ctx.strokeStyle = isBoss ? C.bossWallLit : isStart ? C.startWallLit : C.wallLit;
					ctx.beginPath();
					ctx.moveTo(x, y);
					ctx.lineTo(x, y + TILE);
					ctx.stroke();
				}
				if (!isOpen(r, c + 1)) {
					ctx.strokeStyle = isBoss ? C.bossWallDim : isStart ? C.startWallDim : C.wallDim;
					ctx.beginPath();
					ctx.moveTo(x + TILE, y);
					ctx.lineTo(x + TILE, y + TILE);
					ctx.stroke();
				}
			}
		}

		// ── Pass 4: Room labels ───────────────────────────────────────────────
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = `bold ${TILE - 3}px monospace`;
		for (let id = 1; id <= d.n_rooms; id++) {
			const room = d.room[id];
			if (!room) continue;
			ctx.fillStyle = id === bossRoomId ? C.bossLabel : id === startRoomId ? C.startLabel : C.label;
			const lr = Math.floor((room.north + room.south) / 2);
			const lc = Math.floor((room.west + room.east) / 2);
			ctx.fillText(String(id), lc * TILE + TILE / 2, lr * TILE + TILE / 2);
		}

		// ── Visited overlay ────────────────────────────────────────────────────
		const visited = floorVisitedRooms[currentFloor] ?? new Set<number>();
		if (visited.size > 0) {
			ctx.fillStyle = 'rgba(0,0,0,0.45)';
			for (let vr = 0; vr <= d.n_rows; vr++) {
				for (let vc = 0; vc <= d.n_cols; vc++) {
					const vcell = d.cell[vr][vc];
					if (!(vcell & ROOM)) continue;
					if (!visited.has((vcell & ROOM_ID) >> 6)) continue;
					ctx.fillRect(vc * TILE, vr * TILE, TILE, TILE);
				}
			}
		}
	}
	function drawDoor(
		ctx: CanvasRenderingContext2D,
		d: Dungeon,
		cell: number,
		r: number,
		col: number
	): void {
		const x = col * TILE;
		const y = r * TILE;
		const aPx = Math.max(2, Math.floor(TILE / 6));
		const dTx = Math.floor(TILE / 4);
		const xc = x + TILE / 2;
		const yc = y + TILE / 2;

		// Detect horizontal passage by checking left/right open neighbors
		const leftOpen = col > 0 && !!(d.cell[r]?.[col - 1] & OPENSPACE);
		const rightOpen = col <= d.n_cols && !!(d.cell[r]?.[col + 1] & OPENSPACE);
		const horizontal = leftOpen || rightOpen;

		if (cell & SECRET) {
			ctx.fillStyle = '#1a2a5a';
			ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
			ctx.fillStyle = C.wallLit;
			ctx.font = `bold ${TILE - 4}px monospace`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('S', xc, yc);
			return;
		}

		if (cell & PORTC) {
			ctx.strokeStyle = C.wallLit;
			ctx.lineWidth = 1;
			const pad = 2;
			const sz = TILE - pad * 2;
			for (let b = 0; b <= 3; b++) {
				const bx = x + pad + (b / 3) * sz;
				ctx.beginPath();
				ctx.moveTo(bx, y + pad);
				ctx.lineTo(bx, y + pad + sz);
				ctx.stroke();
			}
			ctx.beginPath();
			ctx.moveTo(x + pad, y + pad);
			ctx.lineTo(x + pad + sz, y + pad);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(x + pad, y + pad + sz);
			ctx.lineTo(x + pad + sz, y + pad + sz);
			ctx.stroke();
			return;
		}

		// Arch or standard door — draw jambs then door rect
		const doorColor = cell & (LOCKED | TRAPPED) ? C.trap : C.door;

		if (horizontal) {
			ctx.fillStyle = C.wallLit;
			ctx.fillRect(xc - 1, y, 3, aPx);
			ctx.fillRect(xc - 1, y + TILE - aPx, 3, aPx);
			if (!(cell & ARCH)) {
				ctx.strokeStyle = doorColor;
				ctx.lineWidth = 1.5;
				ctx.strokeRect(xc - dTx, y + aPx + 1, dTx * 2, TILE - 2 * aPx - 2);
			}
		} else {
			ctx.fillStyle = C.wallLit;
			ctx.fillRect(x, yc - 1, aPx, 3);
			ctx.fillRect(x + TILE - aPx, yc - 1, aPx, 3);
			if (!(cell & ARCH)) {
				ctx.strokeStyle = doorColor;
				ctx.lineWidth = 1.5;
				ctx.strokeRect(x + aPx + 1, yc - dTx, TILE - 2 * aPx - 2, dTx * 2);
			}
		}

		if (cell & TRAPPED) {
			ctx.strokeStyle = C.trap;
			ctx.lineWidth = 1;
			if (horizontal) {
				ctx.beginPath();
				ctx.moveTo(xc - dTx + 2, yc);
				ctx.lineTo(xc + dTx - 2, yc);
				ctx.stroke();
			} else {
				ctx.beginPath();
				ctx.moveTo(xc, yc - dTx + 2);
				ctx.lineTo(xc, yc + dTx - 2);
				ctx.stroke();
			}
		}
	}

	function drawStair(
		ctx: CanvasRenderingContext2D,
		cell: number,
		x: number,
		y: number,
		connectsToFloor?: number
	): void {
		ctx.font = `${TILE - 2}px sans-serif`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		if (cell & STAIR_DN) {
			ctx.fillStyle = '#3a6abd';
			ctx.fillText('▼', x + TILE / 2, y + TILE / 2);
		} else {
			ctx.fillStyle = '#2a8a2a';
			ctx.fillText('▲', x + TILE / 2, y + TILE / 2);
		}
		// Floor label (e.g. "2" meaning "leads to floor 2")
		if (connectsToFloor !== undefined) {
			ctx.font = `bold ${Math.max(6, Math.floor(TILE / 2.2))}px monospace`;
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'right';
			ctx.textBaseline = 'top';
			ctx.fillText(String(connectsToFloor + 1), x + TILE - 1, y + 1);
		}
	}

	// ── link stairs across adjacent floors ──────────────────────────────────────
	// For each pair (floor fi, floor fi+1): pick a dead-end on floor fi, find the
	// closest dead-end on floor fi+1, then place STAIR_DN / STAIR_UP at those cells.
	function linkStairs(floorList: Dungeon[]): void {
		for (let fi = 0; fi < floorList.length - 1; fi++) {
			const lower = floorList[fi];
			const upper = floorList[fi + 1];

			const lowerEnds = stairEnds(lower);
			const upperEnds = stairEnds(upper);
			if (lowerEnds.length === 0 || upperEnds.length === 0) continue;

			// Pick a random dead-end on the lower floor
			const ls = lowerEnds.splice(rand(lowerEnds.length), 1)[0];

			// Find the closest dead-end on the upper floor
			let bestIdx = 0;
			let bestDist = Infinity;
			for (let i = 0; i < upperEnds.length; i++) {
				const dr = upperEnds[i].row - ls.row;
				const dc = upperEnds[i].col - ls.col;
				const dist = dr * dr + dc * dc;
				if (dist < bestDist) {
					bestDist = dist;
					bestIdx = i;
				}
			}
			const us = upperEnds[bestIdx];

			// Place stair down on lower floor, linking to upper
			lower.cell[ls.row][ls.col] |= STAIR_DN;
			lower.cell[ls.row][ls.col] |= 'd'.charCodeAt(0) << 24;
			ls.key = 'down';
			ls.connects_to_floor = fi + 1;
			lower.stair.push(ls);

			// Place stair up on upper floor, linking back to lower
			upper.cell[us.row][us.col] |= STAIR_UP;
			upper.cell[us.row][us.col] |= 'u'.charCodeAt(0) << 24;
			us.key = 'up';
			us.connects_to_floor = fi;
			upper.stair.push(us);
		}
	}

	// ── main action ─────────────────────────────────────────────────────────────
	function pickBossRoom(dungeon: Dungeon): number {
		if (!includeBossRoom || dungeon.n_rooms === 0) return 0;
		// Choose the room with the largest area as the boss room
		let bestId = 1;
		let bestArea = 0;
		for (let id = 1; id <= dungeon.n_rooms; id++) {
			const room = dungeon.room[id];
			if (room && room.area > bestArea) {
				bestArea = room.area;
				bestId = id;
			}
		}
		return bestId;
	}

	async function downloadPdf(): Promise<void> {
		if (floors.length === 0 || !canvasEl) return;

		const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
		const pageW = doc.internal.pageSize.getWidth();
		const margin = 36;
		const contentW = pageW - margin * 2;

		// Save current floor so we can restore it after rendering all floors.
		const savedFloor = currentFloor;

		for (let fi = 0; fi < floors.length; fi++) {
			if (fi > 0) doc.addPage();

			const d = floors[fi];
			const bossRoomId = floorBossRoomIds[fi];
			const startRoomId = fi === 0 ? 1 : 0;

			// Temporarily switch floor so renderDungeon picks up the right
			// corridor-trap keys and visited overlay for this floor.
			currentFloor = fi;
			renderDungeon(d, bossRoomId, startRoomId);
			const imgData = canvasEl.toDataURL('image/png');
			const imgNativeW = canvasEl.width;
			const imgNativeH = canvasEl.height;

			// ── fit map to page width ─────────────────────────────────────────────
			const scale = Math.min(1, contentW / imgNativeW);
			const imgW = imgNativeW * scale;
			const imgH = imgNativeH * scale;

			let y = margin;

			// heading
			doc.setFont('helvetica', 'bold');
			doc.setFontSize(14);
			doc.setTextColor(40, 40, 40);
			const floorLabel =
				floors.length === 1 ? dungeonName : `${dungeonName} — Floor ${fi + 1} of ${floors.length}`;
			doc.text(floorLabel, margin, y);
			y += 14;

			// theme sub-label
			doc.setFont('helvetica', 'normal');
			doc.setFontSize(8);
			doc.setTextColor(120, 120, 120);
			doc.text(dungeonTheme, margin, y);
			y += 10;

			// map image
			doc.addImage(imgData, 'PNG', margin, y, imgW, imgH);
			y += imgH + 14;

			// ── room table ────────────────────────────────────────────────────────
			const encounters = floorEncounters[fi] ?? [];
			const treasure = floorTreasure[fi] ?? [];
			const hazards = floorHazards[fi] ?? {};
			const puzzles = floorPuzzles[fi] ?? {};

			const rows: string[][] = [];
			for (let roomId = 1; roomId <= d.n_rooms; roomId++) {
				const enc = encounters[roomId] ?? 'Empty';
				const tr = treasure[roomId] ?? '';
				const isBoss = roomId === bossRoomId;
				const isStart = fi === 0 && roomId === 1;
				const name = getRoomName(roomId, isBoss, isStart);
				const desc = getRoomDescription(roomId, enc, !!tr, isBoss, isStart);
				const hazard = hazards[roomId] ?? '';
				const badge = isBoss ? ' \u2605' : isStart ? ' \u25b6' : '';
				const puz = puzzles[roomId];
				const puzzleStr = puz
					? `Puzzle (${puz.type}): ${puz.prompt}\nSolution: ${puz.solution}\nStakes: ${puz.stakes}`
					: '';
				const details = [
					desc,
					tr ? `Treasure: ${tr}` : '',
					hazard ? `Hazard: ${hazard}` : '',
					puzzleStr
				]
					.filter(Boolean)
					.join('\n');
				rows.push([`${roomId}${badge}`, name, enc || 'Empty', details]);
			}

			autoTable(doc, {
				startY: y,
				margin: { left: margin, right: margin },
				head: [['#', 'Room Name', 'Encounter', 'Details']],
				body: rows,
				styles: { fontSize: 7, cellPadding: 4, overflow: 'linebreak' },
				headStyles: { fillColor: [40, 40, 60], textColor: 255, fontStyle: 'bold', fontSize: 7 },
				columnStyles: {
					0: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
					1: { cellWidth: 100 },
					2: { cellWidth: 90 },
					3: { cellWidth: contentW - 24 - 100 - 90 }
				},
				alternateRowStyles: { fillColor: [248, 248, 252] },
				didParseCell(data) {
					if (data.section === 'body' && data.column.index === 0) {
						const roomId = parseInt(data.cell.text[0]);
						if (roomId === bossRoomId) data.cell.styles.textColor = [180, 50, 50];
						else if (fi === 0 && roomId === 1) data.cell.styles.textColor = [50, 140, 80];
						else data.cell.styles.textColor = [60, 80, 180];
					}
				}
			});
		}

		// Restore the original floor view.
		currentFloor = savedFloor;
		renderDungeon(floors[savedFloor], floorBossRoomIds[savedFloor], savedFloor === 0 ? 1 : 0);

		const safeName = dungeonName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
		doc.save(`${safeName}.pdf`);
	}

	/**
	 * Returns the keys of any CORRIDOR door cells that sit immediately outside a room.
	 * Called when a room is revealed so its doorways appear on the player map.
	 */
	function getRoomDoorKeys(roomId: number): string[] {
		const d = floors[currentFloor];
		if (!d) return [];
		const keys: string[] = [];
		const neighborDirs: [number, number][] = [
			[-1, 0],
			[1, 0],
			[0, -1],
			[0, 1]
		];
		for (let r = 0; r <= d.n_rows; r++) {
			for (let c = 0; c <= d.n_cols; c++) {
				const cell = d.cell[r][c];
				// Only CORRIDOR cells that carry a non-secret door flag
				if (!(cell & CORRIDOR) || !(cell & DOORSPACE) || cell & SECRET) continue;
				// Check if any orthogonal neighbor belongs to the target room
				for (const [dr, dc] of neighborDirs) {
					const nr = r + dr;
					const nc = c + dc;
					if (nr < 0 || nr > d.n_rows || nc < 0 || nc > d.n_cols) continue;
					const ncell = d.cell[nr][nc];
					if (ncell & ROOM && (ncell & ROOM_ID) >> 6 === roomId) {
						keys.push(`${r},${c}`);
						break;
					}
				}
			}
		}
		return keys;
	}

	/** Returns all corridor cell keys in the four straight arms from (row, col). */
	function getCorridorSegment(row: number, col: number): string[] {
		const d = floors[currentFloor];
		if (!d) return [];
		const keys: string[] = [`${row},${col}`];
		const dirs: [number, number][] = [
			[0, 1],
			[0, -1],
			[1, 0],
			[-1, 0]
		];
		for (const [dr, dc] of dirs) {
			let r = row + dr,
				c = col + dc;
			while (r >= 0 && r <= d.n_rows && c >= 0 && c <= d.n_cols) {
				const nc = d.cell[r][c];
				// Stop at non-corridor cells, room cells, or door boundaries
				if (!(nc & CORRIDOR) || nc & ROOM || nc & DOORSPACE) break;
				keys.push(`${r},${c}`);
				r += dr;
				c += dc;
			}
		}
		return keys;
	}

	/** Pushes the current fog-of-war state to the player display (no-op if map not pushed). */
	function syncMapState(): void {
		if (!mapPushed || floors.length === 0) return;
		combat.setDungeonMapState({
			dungeonName,
			theme: dungeonTheme,
			floors: floors.map((d) => ({
				n_rows: d.n_rows,
				n_cols: d.n_cols,
				n_rooms: d.n_rooms,
				cell: d.cell,
				stair: d.stair.map((s) => ({
					row: s.row,
					col: s.col,
					connects_to_floor: s.connects_to_floor
				}))
			})),
			currentFloor,
			bossRoomIds: floorBossRoomIds,
			revealedRooms: floorVisitedRooms.map((s) => [...s]),
			revealedCorridors: floorRevealedCorridors.map((s) => [...s])
		});
	}

	function handleGenerate(): void {
		// Randomise room sizing and fix dead-end removal each run
		roomMin = Math.floor(Math.random() * 4) + 3; // 3–6
		roomMax = Math.floor(Math.random() * (10 - roomMin)) + roomMin + 1; // roomMin+1–10
		removeDeadends = 50;
		const generated: Dungeon[] = [];
		const multiFloor = numFloors > 1;
		for (let fi = 0; fi < numFloors; fi++) {
			generated.push(generate(multiFloor));
		}
		if (multiFloor) linkStairs(generated);
		floors = generated;
		const trapResults = generated.map(generateTraps);
		floorTrapMaps = trapResults.map((r) => r.map);
		floorCorridorTrapKeys = trapResults.map((r) => r.corridorKeys);
		// Boss room goes on the last floor — must be computed before encounters
		floorBossRoomIds = generated.map((_, fi) =>
			fi === generated.length - 1 ? pickBossRoom(generated[fi]) : 0
		);
		floorEncounters = generated.map((d, fi) => generateEncounters(d, floorBossRoomIds[fi]));
		floorTreasure = generated.map((d, fi) => generateTreasure(d, floorBossRoomIds[fi]));
		floorHazards = generated.map((d, fi) => generateHazards(d, floorBossRoomIds[fi], fi));
		floorPuzzles = generated.map((d, fi) =>
			generatePuzzles(d, floorEncounters[fi], floorBossRoomIds[fi], fi)
		);
		expandedPuzzleSolutions = new Set();
		floorVisitedRooms = generated.map(() => new Set<number>());
		floorRevealedCorridors = generated.map(() => new Set<string>());
		mapPushed = false;
		combat.setDungeonMapState(null);
		currentFloor = 0;
		zoom = 1;
		roomCount = generated[0].n_rooms;
		generateFlavorText();
		renderDungeon(generated[0], floorBossRoomIds[0], 1);
	}

	function selectFloor(fi: number): void {
		closeRoomPopover();
		currentFloor = fi;
		roomCount = floors[fi].n_rooms;
		renderDungeon(floors[fi], floorBossRoomIds[fi], fi === 0 ? 1 : 0);
	}

	function toggleVisited(roomId: number): void {
		const s = new Set(floorVisitedRooms[currentFloor] ?? []);
		if (s.has(roomId)) {
			s.delete(roomId);
		} else {
			s.add(roomId);
			// Reveal the door cells on the corridor side of this room's exits
			const doorKeys = getRoomDoorKeys(roomId);
			if (doorKeys.length > 0) {
				const cs = new Set(floorRevealedCorridors[currentFloor] ?? []);
				for (const k of doorKeys) cs.add(k);
				floorRevealedCorridors = floorRevealedCorridors.map((v, i) =>
					i === currentFloor ? cs : v
				);
			}
		}
		floorVisitedRooms = floorVisitedRooms.map((v, i) => (i === currentFloor ? s : v));
		renderDungeon(floors[currentFloor], floorBossRoomIds[currentFloor], currentFloor === 0 ? 1 : 0);
		syncMapState();
	}

	onMount(() => {
		handleGenerate();
	});

	// ── save / load ─────────────────────────────────────────────────────────────
	interface DungeonSave {
		name: string;
		savedAt: string;
		dungeonName: string;
		dungeonDescription: string;
		floors: Dungeon[];
		floorEncounters: string[][];
		floorTreasure: string[][];
		floorBossRoomIds: number[];
		floorHazards?: Record<number, string>[];
		floorPuzzles?: Record<number, Puzzle>[];
		floorVisitedRooms?: number[][];
		floorRevealedCorridors?: string[][];
		includeBossRoom: boolean;
		settings: {
			nRows: number;
			nCols: number;
			roomMin: number;
			roomMax: number;
			corridorLayout: number;
			removeDeadends: number;
			numFloors: number;
			dungeonTheme?: DungeonTheme;
		};
	}

	const STORAGE_KEY = 'donjon_dungeon_saves';

	function readSaves(): DungeonSave[] {
		try {
			return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
		} catch {
			return [];
		}
	}

	let saves = $state<DungeonSave[]>(readSaves());
	let showSaveDialog = $state(false);
	let showLoadDialog = $state(false);
	let saveName = $state('');

	function openSaveDialog(): void {
		saveName = '';
		showSaveDialog = true;
		showLoadDialog = false;
	}

	function openLoadDialog(): void {
		saves = readSaves();
		showLoadDialog = true;
		showSaveDialog = false;
	}

	function confirmSave(): void {
		if (!saveName.trim() || floors.length === 0) return;
		const entry: DungeonSave = {
			name: saveName.trim(),
			savedAt: new Date().toLocaleString(),
			dungeonName,
			dungeonDescription,
			floors,
			floorEncounters,
			floorTreasure,
			floorBossRoomIds,
			floorHazards,
			floorPuzzles,
			floorVisitedRooms: floorVisitedRooms.map((s) => [...s]),
			floorRevealedCorridors: floorRevealedCorridors.map((s) => [...s]),
			includeBossRoom,
			settings: {
				nRows,
				nCols,
				roomMin,
				roomMax,
				corridorLayout,
				removeDeadends,
				numFloors,
				dungeonTheme
			}
		};
		const all = readSaves();
		all.unshift(entry);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
		saves = all;
		showSaveDialog = false;
	}

	function loadSave(entry: DungeonSave): void {
		floors = entry.floors;
		floorEncounters = entry.floorEncounters;
		floorTreasure =
			entry.floorTreasure ??
			entry.floors.map((d, fi) => generateTreasure(d, entry.floorBossRoomIds[fi]));
		floorBossRoomIds = entry.floorBossRoomIds;
		includeBossRoom = entry.includeBossRoom;
		nRows = entry.settings.nRows;
		nCols = entry.settings.nCols;
		roomMin = entry.settings.roomMin;
		roomMax = entry.settings.roomMax;
		corridorLayout = entry.settings.corridorLayout;
		dungeonTheme = (entry.settings.dungeonTheme ?? 'Crypt') as DungeonTheme;
		removeDeadends = entry.settings.removeDeadends;
		numFloors = entry.settings.numFloors;
		floorHazards =
			entry.floorHazards ??
			entry.floors.map((d, fi) => generateHazards(d, entry.floorBossRoomIds[fi], fi));
		floorPuzzles =
			entry.floorPuzzles ??
			entry.floors.map((d, fi) =>
				generatePuzzles(d, entry.floorEncounters[fi], entry.floorBossRoomIds[fi], fi)
			);
		expandedPuzzleSolutions = new Set();
		floorVisitedRooms =
			entry.floorVisitedRooms?.map((arr) => new Set(arr)) ??
			entry.floors.map(() => new Set<number>());
		floorRevealedCorridors =
			entry.floorRevealedCorridors?.map((arr) => new Set(arr)) ??
			entry.floors.map(() => new Set<string>());
		mapPushed = false;
		combat.setDungeonMapState(null);
		const trapResults = entry.floors.map(generateTraps);
		floorTrapMaps = trapResults.map((r) => r.map);
		floorCorridorTrapKeys = trapResults.map((r) => r.corridorKeys);
		dungeonName = entry.dungeonName ?? '';
		dungeonDescription = entry.dungeonDescription ?? '';
		currentFloor = 0;
		zoom = 1;
		roomCount = entry.floors[0].n_rooms;
		showLoadDialog = false;
		// re-render after DOM settles
		setTimeout(() => renderDungeon(entry.floors[0], entry.floorBossRoomIds[0], 1), 0);
	}

	function deleteSave(idx: number): void {
		const all = readSaves();
		all.splice(idx, 1);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
		saves = all;
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (e.key === 'Escape') {
			if (showSaveDialog) {
				showSaveDialog = false;
				return;
			}
			if (showLoadDialog) {
				showLoadDialog = false;
				return;
			}
			if (activeTrap) {
				activeTrap = null;
				return;
			}
			if (activeRoomPopover) {
				closeRoomPopover();
				return;
			}
			if (showMobileOptions) {
				showMobileOptions = false;
				return;
			}
			if (showMobileEncounters) {
				showMobileEncounters = false;
				return;
			}
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- full-screen overlay -->
<div
	class={embedded
		? 'flex h-full flex-col overflow-hidden bg-black/80'
		: 'fixed inset-0 z-50 flex flex-col overflow-hidden bg-black/80 backdrop-blur-sm'}
	role="dialog"
	aria-modal="true"
	aria-label="Donjon Test dungeon generator"
>
	<!-- header bar -->
	{#if !embedded}
		<div
			class="flex shrink-0 items-center justify-between border-b border-white/10 bg-gray-900 px-4 py-3"
		>
			<h2 class="text-base font-bold text-white">
				<i class="fa-duotone fa-light fa-map" aria-hidden="true"></i> Dungeon Generator
			</h2>
			<button
				onclick={onclose}
				class="ml-3 shrink-0 rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
				aria-label="Close"
			>
				<i class="fa-duotone fa-light fa-xmark" aria-hidden="true"></i>
			</button>
		</div>
	{/if}

	{#snippet optionsPanelContent()}
		<div class="flex gap-2">
			<label class="flex min-w-0 flex-1 flex-col gap-1">
				Rows
				<input
					type="number"
					bind:value={nRows}
					min="11"
					max="79"
					step="2"
					class="w-full rounded bg-gray-700 px-1 py-0.5 text-white"
				/>
			</label>
			<label class="flex min-w-0 flex-1 flex-col gap-1">
				Cols
				<input
					type="number"
					bind:value={nCols}
					min="11"
					max="79"
					step="2"
					class="w-full rounded bg-gray-700 px-1 py-0.5 text-white"
				/>
			</label>
		</div>
		<label class="flex flex-col gap-1">
			Corridors
			<select bind:value={corridorLayout} class="w-full rounded bg-gray-700 px-1 py-0.5 text-white">
				<option value={0}>Labyrinth</option>
				<option value={50}>Bent</option>
				<option value={100}>Straight</option>
			</select>
		</label>
		<label class="flex flex-col gap-1">
			Floors
			<input
				type="number"
				bind:value={numFloors}
				min="1"
				max="9"
				class="w-full rounded bg-gray-700 px-1 py-0.5 text-white"
			/>
		</label>

		<label class="flex flex-col gap-1">
			Theme
			<select bind:value={dungeonTheme} class="w-full rounded bg-gray-700 px-1 py-0.5 text-white">
				<option value="Crypt">⚰️ Crypt</option>
				<option value="Sewer">Sewer</option>
				<option value="Cave">Cave</option>
				<option value="Fortress">🏰 Fortress</option>
				<option value="Arcane">🔮 Arcane</option>
				<option value="Fungal">🍄 Fungal</option>
			</select>
		</label>

		<label class="flex cursor-pointer items-center gap-2">
			<input type="checkbox" bind:checked={includeBossRoom} class="accent-red-600" />
			<span>Boss Room</span>
			<span class="inline-block h-2.5 w-2.5 rounded-sm" style="background:{C.bossFloor}"></span>
		</label>

		<div class="border-t border-white/10 pt-2 text-[10px] tracking-wide text-gray-500 uppercase">
			Party
		</div>
		<div class="flex gap-2">
			<label class="flex min-w-0 flex-1 flex-col gap-1">
				Size
				<input
					type="number"
					bind:value={partySize}
					min="1"
					max="8"
					class="w-full rounded bg-gray-700 px-1 py-0.5 text-white"
				/>
			</label>
			<label class="flex min-w-0 flex-1 flex-col gap-1">
				Level
				<input
					type="number"
					bind:value={partyLevel}
					min="1"
					max="20"
					class="w-full rounded bg-gray-700 px-1 py-0.5 text-white"
				/>
			</label>
		</div>
		<label class="flex flex-col gap-1">
			Difficulty
			<select bind:value={difficulty} class="w-full rounded bg-gray-700 px-1 py-0.5 text-white">
				<option value="Easy">Easy</option>
				<option value="Medium">Medium</option>
				<option value="Hard">Hard</option>
				<option value="Deadly">Deadly</option>
			</select>
		</label>

		<button
			onclick={handleGenerate}
			class="rounded bg-indigo-600 px-3 py-1.5 font-bold text-white hover:bg-indigo-500"
		>
			Generate
		</button>

		<div class="flex gap-2">
			<button
				onclick={openSaveDialog}
				disabled={floors.length === 0}
				class="flex-1 rounded bg-gray-700 px-2 py-1 text-xs font-semibold text-gray-200 hover:bg-gray-600 disabled:opacity-40"
			>
				Save
			</button>
			<button
				onclick={openLoadDialog}
				class="flex-1 rounded bg-gray-700 px-2 py-1 text-xs font-semibold text-gray-200 hover:bg-gray-600"
			>
				Load
			</button>
			<button
				onclick={downloadPdf}
				disabled={floors.length === 0}
				title="Download dungeon as PDF"
				class="flex-1 rounded bg-gray-700 px-2 py-1 text-xs font-semibold text-gray-200 hover:bg-gray-600 disabled:opacity-40"
			>
				PDF
			</button>
		</div>

		<!-- Share Map toggle -->
		<button
			onclick={() => {
				mapPushed = !mapPushed;
				if (mapPushed) syncMapState();
				else combat.setDungeonMapState(null);
			}}
			disabled={floors.length === 0}
			title={mapPushed ? 'Stop sharing map with players' : 'Share fog-of-war map with players'}
			class="rounded px-2 py-1.5 text-xs font-semibold transition disabled:opacity-40 {mapPushed
				? 'bg-green-700 text-white hover:bg-green-600'
				: 'bg-gray-700 text-gray-200 hover:bg-gray-600'}"
		>
			<i class="fa-duotone fa-light fa-map" aria-hidden="true"></i>
			{mapPushed ? 'Map Live' : 'Share Map'}
		</button>

		{#if roomCount > 0}
			<span class="text-gray-400">Rooms: <strong class="text-white">{roomCount}</strong></span>
		{/if}

		<!-- legend -->
		<div class="mt-2 flex flex-col gap-1.5 border-t border-white/10 pt-2 text-gray-400">
			<span
				><span class="inline-block h-3 w-3 rounded-sm align-middle" style="background:{C.floor}"
				></span> Room</span
			>
			<span
				><span class="inline-block h-3 w-3 rounded-sm align-middle" style="background:{C.corridor}"
				></span> Corridor</span
			>
			<span
				><span class="inline-block h-3 w-3 rounded-sm align-middle" style="background:{C.door}"
				></span> Door</span
			>
			<span
				><span class="inline-block h-3 w-3 rounded-sm align-middle" style="background:{C.trap}"
				></span> Locked/Trapped</span
			>
			<span
				><span class="inline-block h-3 w-3 rounded-sm align-middle" style="background:{C.wallDim}"
				></span> Secret</span
			>
			<span class="text-blue-400">▼ Stair down</span>
			<span class="text-green-400">▲ Stair up</span>
			<span
				><span
					class="inline-flex h-3 w-3 items-center justify-center rounded-sm bg-[#d4780a] align-middle text-[8px] leading-none font-bold text-[#ee2222]"
					>!</span
				> Corridor trap</span
			>
		</div>
	{/snippet}

	{#snippet encounterListContent()}
		<div class="min-h-0 flex-1 overflow-y-auto">
			{#if floorEncounters[currentFloor]}
				{#each floorEncounters[currentFloor].slice(1) as enc, i}
					{@const roomId = i + 1}
					{@const treasure = floorTreasure[currentFloor]?.[roomId] ?? ''}
					{@const isBossRoom = floorBossRoomIds[currentFloor] === roomId}
					{@const isStartRoom = currentFloor === 0 && roomId === 1}
					{@const roomName = getRoomName(roomId, isBossRoom, isStartRoom)}
					{@const isVisited = (floorVisitedRooms[currentFloor] ?? new Set()).has(roomId)}
					{@const hazard = floorHazards[currentFloor]?.[roomId] ?? ''}
					{@const puzzle = floorPuzzles[currentFloor]?.[roomId] ?? null}
					{@const puzzleKey = `-`}
					{@const encParts = parseEnc(enc)}
					<div
						class="flex flex-col gap-1 border-b border-white/5 px-3 py-2 {isVisited
							? 'opacity-50'
							: ''}"
					>
						<div
							class="flex items-start gap-2 {enc === 'Empty' && !treasure
								? 'text-gray-600'
								: 'text-gray-200'}"
						>
							<!-- left column: room number badge + visited toggle -->
							<div class="flex shrink-0 flex-col items-center gap-1">
								<button
									class="min-w-[1.75rem] rounded px-1.5 py-0.5 text-center text-xs font-bold transition {isBossRoom
										? 'bg-red-900/50 text-red-300 hover:bg-red-800/60 hover:text-red-200'
										: isStartRoom
											? 'bg-green-900/50 text-green-300 hover:bg-green-800/60 hover:text-green-200'
											: 'bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800/60 hover:text-indigo-200'}"
									title="Show room description"
									onclick={(e) => {
										const el = e.currentTarget as HTMLElement;
										if (activeRoomPopover?.roomId === roomId) {
											closeRoomPopover();
											combat.setDungeonRoomDescription(null);
										} else {
											activeRoomPopover = {
												roomId,
												enc,
												hasTreasure: !!treasure,
												isBoss: isBossRoom,
												isStart: isStartRoom,
												anchorEl: el
											};
											combat.setDungeonRoomDescription({
												name: roomName,
												label:
													`Room ${roomId}` +
													(isBossRoom ? ' · Boss' : isStartRoom ? ' · Start' : ''),
												body: getRoomDescription(roomId, enc, !!treasure, isBossRoom, isStartRoom),
												hazard,
												theme: dungeonTheme
											});
										}
									}}>{roomId}</button
								>
								<button
									onclick={() => toggleVisited(roomId)}
									title={isVisited ? 'Mark unvisited' : 'Mark visited'}
									class="w-full rounded px-1 py-0.5 text-center text-[11px] font-bold transition {isVisited
										? 'bg-green-900/50 text-green-400 hover:bg-gray-800 hover:text-gray-500'
										: 'text-gray-600 hover:bg-green-900/40 hover:text-green-400'}"
									><i class="fa-duotone fa-light fa-check" aria-hidden="true"></i></button
								>
							</div>
							<div class="flex flex-col">
								<span
									class="text-[10px] italic {isBossRoom
										? 'text-red-400/70'
										: isStartRoom
											? 'text-green-400/70'
											: 'text-indigo-400/70'}">{roomName}</span
								>
								<span class="text-xs leading-snug">
									{#if encParts.length === 0}
										Empty
									{:else}
										{#each encParts as part, pi}
											{#if pi > 0}<span class="text-gray-500"> + </span>{/if}
											{part.prefix}{part.prefix ? ' ' : ''}{#if part.hasCard}<button
													class="text-indigo-300 underline-offset-2 hover:text-indigo-100 hover:underline"
													onclick={() => {
														const t = findTemplate(part.name);
														if (t) infoMonster = getMonsterDetail(t.name) ?? null;
													}}>{part.name}</button
												>{:else}{part.name}{/if}
										{/each}
									{/if}
								</span>
							</div>
						</div>
						{#if treasure}
							<div class="ml-5 flex items-start gap-1 text-[10px] text-amber-400">
								<i class="fa-duotone fa-light fa-sack-dollar shrink-0" aria-hidden="true"></i>
								<span class="leading-snug">{treasure}</span>
							</div>
						{/if}
						{#if hazard}
							<div class="ml-5 flex items-start gap-1 text-[10px] text-orange-400">
								<i class="fa-duotone fa-light fa-triangle-exclamation shrink-0" aria-hidden="true"
								></i>
								<span class="leading-snug">{hazard}</span>
							</div>
						{/if}
						{#if puzzle}
							<div class="ml-5 flex flex-col gap-0.5 text-[10px] text-purple-300">
								<div class="flex items-start gap-1">
									<i class="fa-duotone fa-light fa-puzzle-piece shrink-0" aria-hidden="true"></i>
									<span class="font-semibold text-purple-200">{puzzle.type} Puzzle</span>
								</div>
								<p class="ml-5 leading-snug text-purple-300/80 italic">{puzzle.prompt}</p>
								<button
									class="ml-5 self-start rounded bg-purple-900/40 px-1.5 py-0.5 text-[9px] font-semibold text-purple-400 hover:bg-purple-800/50 hover:text-purple-200"
									onclick={() => {
										if (expandedPuzzleSolutions.has(puzzleKey)) {
											expandedPuzzleSolutions.delete(puzzleKey);
										} else {
											expandedPuzzleSolutions.add(puzzleKey);
										}
										expandedPuzzleSolutions = new Set(expandedPuzzleSolutions);
									}}
								>
									{expandedPuzzleSolutions.has(puzzleKey) ? 'Hide Solution' : 'Show Solution'}
								</button>
								{#if expandedPuzzleSolutions.has(puzzleKey)}
									<div class="mt-0.5 ml-5 rounded bg-purple-950/60 px-2 py-1.5 leading-snug">
										<p class="mb-1 font-semibold text-green-300">Solution: {puzzle.solution}</p>
										<p class="text-orange-300/80">Stakes: {puzzle.stakes}</p>
									</div>
								{/if}
							</div>
						{/if}
						{#if enc !== 'Empty'}
							<button
								onclick={() => addToInitiative(enc)}
								class="ml-7 self-start rounded bg-indigo-700/60 px-2 py-0.5 text-[10px] font-semibold text-indigo-200 hover:bg-indigo-600"
							>
								<i class="fa-duotone fa-light fa-plus" aria-hidden="true"></i> Add to Initiative
							</button>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	{/snippet}

	<!-- body: left panel + map area -->
	<div class="flex min-h-0 flex-1">
		<!-- left options panel -->
		<div
			class="hidden w-44 shrink-0 flex-col gap-3 overflow-y-auto border-r border-white/10 bg-gray-900 p-3 text-xs text-gray-300 md:flex"
		>
			{@render optionsPanelContent()}
		</div>

		<!-- map area -->
		<div class="flex min-w-0 flex-1 flex-col">
			<!-- floor tabs -->
			{#if floors.length > 1}
				<div class="flex shrink-0 gap-1 border-b border-white/10 bg-gray-900/80 px-4 py-1.5">
					{#each floors as _, fi}
						<button
							onclick={() => selectFloor(fi)}
							class="rounded px-3 py-1 text-xs font-semibold transition-colors {fi === currentFloor
								? 'bg-indigo-600 text-white'
								: 'text-gray-400 hover:bg-white/10 hover:text-white'}"
						>
							Floor {fi + 1}
						</button>
					{/each}
				</div>
			{/if}

			<!-- zoom toolbar -->
			{#if floors.length > 0}
				<div
					class="flex shrink-0 items-center justify-center gap-1 border-b border-white/10 bg-gray-900/80 px-3 py-1"
				>
					<button
						onclick={() => (zoom = Math.max(0.5, zoom - 0.25))}
						disabled={zoom <= 0.5}
						class="flex h-6 w-6 items-center justify-center rounded bg-gray-700 text-sm font-bold text-gray-200 hover:bg-gray-600 disabled:opacity-40"
						aria-label="Zoom out"
						><i class="fa-duotone fa-light fa-minus" aria-hidden="true"></i></button
					>
					<button
						onclick={() => (zoom = 1)}
						class="min-w-[3.5rem] rounded bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-200 hover:bg-gray-600"
						aria-label="Reset zoom">{Math.round(zoom * 100)}%</button
					>
					<button
						onclick={() => (zoom = Math.min(4, zoom + 0.25))}
						disabled={zoom >= 4}
						class="flex h-6 w-6 items-center justify-center rounded bg-gray-700 text-sm font-bold text-gray-200 hover:bg-gray-600 disabled:opacity-40"
						aria-label="Zoom in"
						><i class="fa-duotone fa-light fa-plus" aria-hidden="true"></i></button
					>
				</div>
			{/if}

			<!-- canvas scroll area -->
			<div class="min-h-0 flex-1 overflow-auto p-3">
				<div class="mx-auto flex w-max flex-col items-center gap-4">
					<canvas
						bind:this={canvasEl}
						class="block cursor-pointer"
						style="image-rendering: pixelated;{canvasPixelW
							? ` width: ${canvasPixelW * zoom}px; height: ${canvasPixelH * zoom}px;`
							: ''}"
						onclick={handleCanvasClick}
						onwheel={(e) => {
							if (!e.ctrlKey && !e.metaKey) return;
							e.preventDefault();
							const delta = e.deltaY > 0 ? -0.25 : 0.25;
							zoom = Math.min(4, Math.max(0.5, zoom + delta));
						}}
					></canvas>
					{#if dungeonName}
						<div
							class="w-full max-w-xl rounded-lg border border-white/10 bg-gray-900/80 px-5 py-4 text-center"
						>
							<h2 class="mb-2 font-serif text-lg font-bold tracking-wide text-amber-300">
								{dungeonName}
							</h2>
							<p class="text-sm leading-relaxed text-gray-400 italic">{dungeonDescription}</p>
						</div>
					{/if}
				</div>
			</div>
			<!-- mobile bottom bar: shown only on small screens -->
			<div class="flex shrink-0 gap-2 border-t border-white/10 bg-gray-900/90 p-2 md:hidden">
				<button
					onclick={() => (showMobileOptions = !showMobileOptions)}
					class="flex flex-1 items-center justify-center gap-1.5 rounded bg-gray-700 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-600"
				>
					<i class="fa-duotone fa-light fa-gear" aria-hidden="true"></i> Options
				</button>
				<button
					onclick={() => (showMobileEncounters = !showMobileEncounters)}
					class="flex flex-1 items-center justify-center gap-1.5 rounded bg-gray-700 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-600"
				>
					<i class="fa-duotone fa-light fa-clipboard" aria-hidden="true"></i> Encounters
				</button>
			</div>
		</div>

		<!-- right encounters panel -->
		<div
			class="hidden w-52 shrink-0 flex-col border-l border-white/10 bg-gray-900 text-xs text-gray-300 md:flex"
		>
			<div
				class="shrink-0 border-b border-white/10 px-3 py-2 font-bold tracking-wide text-gray-400 uppercase"
			>
				Encounters
			</div>
			{@render encounterListContent()}
		</div>
	</div>
	<!-- mobile options bottom sheet -->
	{#if showMobileOptions}
		<div class="fixed inset-0 z-40 md:hidden">
			<button
				class="absolute inset-0 bg-black/50"
				aria-label="Close options"
				onclick={() => (showMobileOptions = false)}
			></button>
			<div class="absolute inset-0 flex flex-col bg-gray-900">
				<div class="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2">
					<span class="text-sm font-bold text-gray-200">Options</span>
					<button
						onclick={() => (showMobileOptions = false)}
						class="text-gray-500 hover:text-white"
						aria-label="Close"
						><i class="fa-duotone fa-light fa-xmark" aria-hidden="true"></i></button
					>
				</div>
				<div class="flex-1 overflow-y-auto p-3">
					<div class="flex flex-col gap-3 text-xs text-gray-300">
						{@render optionsPanelContent()}
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- mobile encounters bottom sheet -->
	{#if showMobileEncounters}
		<div class="fixed inset-0 z-40 md:hidden">
			<button
				class="absolute inset-0 bg-black/50"
				aria-label="Close encounters"
				onclick={() => (showMobileEncounters = false)}
			></button>
			<div class="absolute inset-0 flex flex-col bg-gray-900">
				<div class="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2">
					<span class="text-sm font-bold tracking-wide text-gray-400 uppercase">Encounters</span>
					<button
						onclick={() => (showMobileEncounters = false)}
						class="text-gray-500 hover:text-white"
						aria-label="Close"
						><i class="fa-duotone fa-light fa-xmark" aria-hidden="true"></i></button
					>
				</div>
				<div class="min-h-0 flex-1 text-xs text-gray-300">
					{@render encounterListContent()}
				</div>
			</div>
		</div>
	{/if}

	<!-- room description popover -->
	{#if activeRoomPopover}
		<button
			class="absolute inset-0 z-10"
			aria-label="Close room description"
			onclick={closeRoomPopover}
		></button>
		<div
			class="absolute z-20 w-72 rounded-lg border border-indigo-900/60 bg-gray-900 p-4 shadow-xl"
			style="left: {Math.min(
				activeRoomPopover.anchorEl.getBoundingClientRect().left - 296,
				window.innerWidth - 310
			)}px; top: {Math.min(
				activeRoomPopover.anchorEl.getBoundingClientRect().top,
				window.innerHeight - 200
			)}px;"
		>
			<div class="mb-2 flex items-start justify-between gap-2">
				<div>
					<p class="text-[10px] tracking-wide text-gray-500 uppercase">
						Room {activeRoomPopover.roomId}{activeRoomPopover.isBoss
							? ' · Boss'
							: activeRoomPopover.isStart
								? ' · Start'
								: ''}
					</p>
					<h3
						class="font-semibold {activeRoomPopover.isBoss
							? 'text-red-300'
							: activeRoomPopover.isStart
								? 'text-green-300'
								: 'text-indigo-200'}"
					>
						{getRoomName(
							activeRoomPopover.roomId,
							activeRoomPopover.isBoss,
							activeRoomPopover.isStart
						)}
					</h3>
				</div>
				<button
					onclick={closeRoomPopover}
					class="shrink-0 text-gray-500 hover:text-white"
					aria-label="Close"><i class="fa-duotone fa-light fa-xmark" aria-hidden="true"></i></button
				>
			</div>
			<p class="text-xs leading-relaxed text-gray-300 italic">
				{getRoomDescription(
					activeRoomPopover.roomId,
					activeRoomPopover.enc,
					activeRoomPopover.hasTreasure,
					activeRoomPopover.isBoss,
					activeRoomPopover.isStart
				)}
			</p>
			{#if activeRoomPopover && (floorHazards[currentFloor]?.[activeRoomPopover.roomId] ?? '')}
				<div class="mt-3 flex items-start gap-1 text-[10px] text-orange-400">
					<i class="fa-duotone fa-light fa-triangle-exclamation shrink-0" aria-hidden="true"></i>
					<span class="leading-snug italic"
						>{floorHazards[currentFloor][activeRoomPopover.roomId]}</span
					>
				</div>
			{/if}
			<div class="mt-3 text-[10px] tracking-wide text-gray-600 uppercase">
				{dungeonTheme} · for players
			</div>
		</div>
	{/if}

	<!-- trap detail popup -->
	{#if activeTrap}
		<!-- backdrop click dismisses -->
		<button
			class="absolute inset-0 z-10"
			aria-label="Close trap detail"
			onclick={() => (activeTrap = null)}
		></button>
		<div
			class="absolute z-20 w-64 rounded-lg border border-red-900/60 bg-gray-900 p-4 shadow-xl"
			style="left: {Math.min(activeTrap.x + 12, window.innerWidth - 280)}px; top: {Math.min(
				activeTrap.y + 12,
				window.innerHeight - 220
			)}px;"
		>
			<div class="mb-2 flex items-start justify-between gap-2">
				<h3 class="font-bold text-red-400">{activeTrap.trap.name}</h3>
				<button
					onclick={() => (activeTrap = null)}
					class="shrink-0 text-gray-500 hover:text-white"
					aria-label="Close"><i class="fa-duotone fa-light fa-xmark" aria-hidden="true"></i></button
				>
			</div>
			<span
				class="mb-3 inline-block rounded bg-red-950/60 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-red-300 uppercase"
			>
				{activeTrap.trap.type}
			</span>
			<dl class="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
				<dt class="text-gray-500">Trigger</dt>
				<dd class="text-gray-200">{activeTrap.trap.trigger}</dd>
				<dt class="text-gray-500">
					{activeTrap.trap.name === 'Locked Door' ? 'Pick Lock' : 'Detect'}
				</dt>
				<dd class="text-gray-200">DC {activeTrap.trap.detectDC} {activeTrap.trap.detectSkill}</dd>
				<dt class="text-gray-500">Effect</dt>
				<dd class="text-gray-200">{activeTrap.trap.effect}</dd>
				{#if activeTrap.trap.save !== 'None'}
					<dt class="text-gray-500">
						{activeTrap.trap.name === 'Locked Door' ? 'Force Open' : 'Save'}
					</dt>
					<dd class="text-gray-200">DC {activeTrap.trap.dc} {activeTrap.trap.save}</dd>
				{/if}
			</dl>
		</div>
	{/if}

	<!-- save dialog -->
	{#if showSaveDialog}
		<button
			class="absolute inset-0 z-10"
			onclick={() => (showSaveDialog = false)}
			aria-label="Close"
		></button>
		<div class="absolute inset-0 z-20 flex items-center justify-center">
			<div class="w-80 rounded-lg border border-white/10 bg-gray-900 p-5 shadow-2xl">
				<h3 class="mb-3 font-bold text-white">Save Dungeon</h3>
				<input
					type="text"
					bind:value={saveName}
					placeholder="Dungeon name…"
					class="mb-4 w-full rounded bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
					onkeydown={(e) => {
						if (e.key === 'Enter') confirmSave();
					}}
				/>
				<div class="flex justify-end gap-2">
					<button
						onclick={() => (showSaveDialog = false)}
						class="rounded px-3 py-1.5 text-sm text-gray-400 hover:text-white">Cancel</button
					>
					<button
						onclick={confirmSave}
						disabled={!saveName.trim()}
						class="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40"
						>Save</button
					>
				</div>
			</div>
		</div>
	{/if}

	<!-- load dialog -->
	{#if showLoadDialog}
		<button
			class="absolute inset-0 z-10"
			onclick={() => (showLoadDialog = false)}
			aria-label="Close"
		></button>
		<div class="absolute inset-0 z-20 flex items-center justify-center">
			<div class="w-96 rounded-lg border border-white/10 bg-gray-900 shadow-2xl">
				<div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
					<h3 class="font-bold text-white">Load Dungeon</h3>
					<button
						onclick={() => (showLoadDialog = false)}
						class="text-gray-500 hover:text-white"
						aria-label="Close"
						><i class="fa-duotone fa-light fa-xmark" aria-hidden="true"></i></button
					>
				</div>
				{#if saves.length === 0}
					<p class="px-4 py-6 text-center text-sm text-gray-500">No saved dungeons yet.</p>
				{:else}
					<ul class="max-h-80 overflow-y-auto">
						{#each saves as entry, i}
							<li
								class="flex items-center gap-3 border-b border-white/5 px-4 py-3 hover:bg-white/5"
							>
								<div class="min-w-0 flex-1">
									<div class="truncate font-semibold text-white">{entry.name}</div>
									<div class="text-xs text-gray-500">
										{entry.savedAt} · {entry.settings.numFloors} floor{entry.settings.numFloors > 1
											? 's'
											: ''} · {entry.settings.nRows}×{entry.settings.nCols}
									</div>
								</div>
								<button
									onclick={() => loadSave(entry)}
									class="shrink-0 rounded bg-indigo-700/60 px-2 py-1 text-xs font-semibold text-indigo-200 hover:bg-indigo-600"
									>Load</button
								>
								<button
									onclick={() => deleteSave(i)}
									class="shrink-0 text-gray-600 hover:text-red-400"
									aria-label="Delete"
									><i class="fa-duotone fa-light fa-xmark" aria-hidden="true"></i></button
								>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	{/if}
</div>

<MonsterInfoModal monster={infoMonster} onclose={() => (infoMonster = null)} />
