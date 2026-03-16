<!-- Dungeon Generator
     Generation: Room-placement + Prim's MST corridors (DonJon-style algorithm)
     Rendering:  HTML5 canvas, graph-paper dungeon aesthetic -->
<script lang="ts">
	import { getMonsterDetail } from '$lib/enemies';
	import { exportDungeonPdf } from '$lib/pdfExport';
	import MonsterInfoModal from '$lib/components/MonsterInfoModal.svelte';
	import type { MonsterDetail } from '$lib/types';

	let {
		onclose,
		onAddEncounter
	}: {
		onclose: () => void;
		onAddEncounter?: (monsters: { name: string; count: number }[]) => void;
	} = $props();

	// ── Settings ───────────────────────────────────────────────────────────────
	let partySize = $state(4);
	let partyLevel = $state(5);
	let dungeonSize = $state('medium');
	let difficulty = $state('medium');
	let includeBoss = $state(true);
	let numFloors = $state(1);

	// ── Canvas ─────────────────────────────────────────────────────────────────
	let canvasEl = $state<HTMLCanvasElement | null>(null);
	const GRID_W = 62;
	const GRID_H = 42;
	const TILE = 16; // canvas pixels per tile
	const CVS_W = GRID_W * TILE; // 992
	const CVS_H = GRID_H * TILE; // 672

	// Cell types
	const VOID = 0, FLOOR = 1, CORRIDOR = 2, DOOR = 3;

	// ── Types ──────────────────────────────────────────────────────────────────
	type DungeonRoom = {
		id: number;
		left: number;
		right: number;
		top: number;
		bottom: number;
		cx: number;
		cy: number;
		name: string;
		isEntrance: boolean;
		isBoss: boolean;
		encounter: DungeonEncounter | null;
		loot?: LootInfo;
	};
	type DungeonEncounter = {
		monsters: { name: string; count: number }[];
		xp: number;
		difficulty: string;
	};
	type TrapInfo = {
		name: string;
		trigger: string;
		dc: number;
		effect: string;
	};
	type LootInfo = {
		coins: string;
		items: string[];
	};
	type DungeonFloor = {
		cells: number[][];
		rooms: DungeonRoom[];
		traps: Record<string, TrapInfo>;
		stairs: Record<string, 'up' | 'down'>;
	};
	type GeneratedDungeon = { floors: DungeonFloor[] };

	// ── State ──────────────────────────────────────────────────────────────────
	let dungeon = $state<GeneratedDungeon | null>(null);
	let selectedRoomId = $state<number | null>(null);
	let infoMonster = $state<MonsterDetail | null>(null);
	let activeTrap = $state<TrapInfo | null>(null);
	let activeLoot = $state<LootInfo | null>(null);
	let currentFloor = $state(0);
	let activeStair = $state<{ dir: 'up' | 'down'; floor: number } | null>(null);
	let zoom = $state(1);
	let isExporting = $state(false);
	const ZOOM_MIN = 0.5, ZOOM_MAX = 4, ZOOM_STEP = 0.25;

	// ── Mobile panels ──────────────────────────────────────────────────────────
	let mobilePanel = $state<'controls' | 'encounters' | null>(null);

	// ── Touch (pinch-zoom + pan) ───────────────────────────────────────────────
	let mapContainerEl = $state<HTMLDivElement | null>(null);
	let _touchStartDist = 0;
	let _touchStartZoom = 1;
	let _lastTouchX = 0;
	let _lastTouchY = 0;
	let _touchMoved = false;

	function handleTouchStart(e: TouchEvent) {
		if (e.touches.length === 2) {
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			_touchStartDist = Math.hypot(dx, dy);
			_touchStartZoom = zoom;
		} else if (e.touches.length === 1) {
			_lastTouchX = e.touches[0].clientX;
			_lastTouchY = e.touches[0].clientY;
			_touchMoved = false;
		}
	}

	function handleTouchMove(e: TouchEvent) {
		e.preventDefault();
		if (e.touches.length === 2) {
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			const dist = Math.hypot(dx, dy);
			zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, _touchStartZoom * dist / _touchStartDist));
		} else if (e.touches.length === 1 && mapContainerEl) {
			const dx = _lastTouchX - e.touches[0].clientX;
			const dy = _lastTouchY - e.touches[0].clientY;
			mapContainerEl.scrollLeft += dx;
			mapContainerEl.scrollTop += dy;
			_lastTouchX = e.touches[0].clientX;
			_lastTouchY = e.touches[0].clientY;
			_touchMoved = true;
		}
	}

	// ── Difficulty UI ──────────────────────────────────────────────────────────
	const difficultyBadge: Record<string, string> = {
		trivial: 'border-gray-600 bg-gray-900/40 text-gray-400',
		easy: 'border-green-700/50 bg-green-900/20 text-green-400',
		medium: 'border-yellow-700/50 bg-yellow-900/20 text-yellow-400',
		hard: 'border-orange-700/50 bg-orange-900/20 text-orange-400',
		deadly: 'border-red-700/50 bg-red-900/20 text-red-400'
	};

	// ── XP / Encounter logic ───────────────────────────────────────────────────
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
		return xpPerChar[Math.min(level, 20) - 1][diffIdx[diff] ?? 1] * size;
	}
	function monsterMult(count: number, size: number): number {
		let m =
			count >= 15 ? 4 : count >= 11 ? 3 : count >= 7 ? 2.5 :
			count >= 3 ? 2 : count === 2 ? 1.5 : 1;
		if (size <= 2) m *= 1.5;
		else if (size >= 6) m *= 0.5;
		return m;
	}
	function getActualDifficulty(adjXp: number, level: number, size: number): string {
		const row = xpPerChar[Math.min(level, 20) - 1];
		const pp = adjXp / size;
		if (pp >= row[3]) return 'deadly';
		if (pp >= row[2]) return 'hard';
		if (pp >= row[1]) return 'medium';
		if (pp >= row[0]) return 'easy';
		return 'trivial';
	}

	// ── Monster pools ──────────────────────────────────────────────────────────
	type MonsterDef = { name: string; cr: number; xp: number; role: string };

	const dungeonPool: MonsterDef[] = [
		{ name: 'Rat', cr: 0, xp: 10, role: 'minion' },
		{ name: 'Giant Rat', cr: 0.125, xp: 25, role: 'minion' },
		{ name: 'Cultist', cr: 0.125, xp: 25, role: 'minion' },
		{ name: 'Bandit', cr: 0.125, xp: 25, role: 'minion' },
		{ name: 'Kobold', cr: 0.125, xp: 25, role: 'minion' },
		{ name: 'Grimlock', cr: 0.25, xp: 50, role: 'minion' },
		{ name: 'Troglodyte', cr: 0.25, xp: 50, role: 'minion' },
		{ name: 'Goblin', cr: 0.25, xp: 50, role: 'minion' },
		{ name: 'Skeleton', cr: 0.25, xp: 50, role: 'minion' },
		{ name: 'Zombie', cr: 0.25, xp: 50, role: 'minion' },
		{ name: 'Shadow', cr: 0.5, xp: 100, role: 'minion' },
		{ name: 'Hobgoblin', cr: 0.5, xp: 100, role: 'minion' },
		{ name: 'Orc', cr: 0.5, xp: 100, role: 'minion' },
		{ name: 'Duergar', cr: 1, xp: 200, role: 'minion' },
		{ name: 'Bugbear', cr: 1, xp: 200, role: 'leader' },
		{ name: 'Ghoul', cr: 1, xp: 200, role: 'leader' },
		{ name: 'Giant Spider', cr: 1, xp: 200, role: 'leader' },
		{ name: 'Specter', cr: 1, xp: 200, role: 'leader' },
		{ name: 'Cult Fanatic', cr: 2, xp: 450, role: 'leader' },
		{ name: 'Bandit Captain', cr: 2, xp: 450, role: 'leader' },
		{ name: 'Gargoyle', cr: 2, xp: 450, role: 'minion' },
		{ name: 'Gelatinous Cube', cr: 2, xp: 450, role: 'solo' },
		{ name: 'Mimic', cr: 2, xp: 450, role: 'solo' },
		{ name: 'Ochre Jelly', cr: 2, xp: 450, role: 'solo' },
		{ name: 'Quaggoth', cr: 2, xp: 450, role: 'minion' },
		{ name: 'Wererat', cr: 2, xp: 450, role: 'leader' },
		{ name: 'Minotaur', cr: 3, xp: 700, role: 'solo' },
		{ name: 'Mummy', cr: 3, xp: 700, role: 'leader' },
		{ name: 'Wight', cr: 3, xp: 700, role: 'leader' },
		{ name: 'Black Pudding', cr: 4, xp: 1100, role: 'solo' },
		{ name: 'Flameskull', cr: 4, xp: 1100, role: 'leader' },
		{ name: 'Roper', cr: 5, xp: 1800, role: 'solo' },
		{ name: 'Troll', cr: 5, xp: 1800, role: 'solo' },
		{ name: 'Umber Hulk', cr: 5, xp: 1800, role: 'solo' },
		{ name: 'Vampire Spawn', cr: 5, xp: 1800, role: 'leader' },
		{ name: 'Wraith', cr: 5, xp: 1800, role: 'leader' },
		{ name: 'Mind Flayer', cr: 7, xp: 2900, role: 'leader' },
		{ name: 'Aboleth', cr: 10, xp: 5900, role: 'solo' },
		{ name: 'Stone Golem', cr: 10, xp: 5900, role: 'solo' }
	];

	const bossPool: MonsterDef[] = [
		{ name: 'Bandit Captain', cr: 2, xp: 450, role: 'solo' },
		{ name: 'Cult Fanatic', cr: 2, xp: 450, role: 'solo' },
		{ name: 'Minotaur', cr: 3, xp: 700, role: 'solo' },
		{ name: 'Mummy', cr: 3, xp: 700, role: 'solo' },
		{ name: 'Wight', cr: 3, xp: 700, role: 'solo' },
		{ name: 'Black Pudding', cr: 4, xp: 1100, role: 'solo' },
		{ name: 'Flameskull', cr: 4, xp: 1100, role: 'solo' },
		{ name: 'Roper', cr: 5, xp: 1800, role: 'solo' },
		{ name: 'Troll', cr: 5, xp: 1800, role: 'solo' },
		{ name: 'Umber Hulk', cr: 5, xp: 1800, role: 'solo' },
		{ name: 'Vampire Spawn', cr: 5, xp: 1800, role: 'solo' },
		{ name: 'Wraith', cr: 5, xp: 1800, role: 'solo' },
		{ name: 'Mind Flayer', cr: 7, xp: 2900, role: 'solo' },
		{ name: 'Aboleth', cr: 10, xp: 5900, role: 'solo' },
		{ name: 'Stone Golem', cr: 10, xp: 5900, role: 'solo' },
		{ name: 'Iron Golem', cr: 16, xp: 15000, role: 'solo' },
		{ name: 'Vampire', cr: 13, xp: 10000, role: 'solo' },
		{ name: 'Beholder', cr: 13, xp: 10000, role: 'solo' },
		{ name: 'Death Knight', cr: 17, xp: 18000, role: 'solo' },
		{ name: 'Lich', cr: 21, xp: 33000, role: 'solo' }
	];

	const roomNames = [
		'Guard Room', 'Armory', 'Torture Chamber', 'Shrine', 'Crypt',
		'Barracks', 'Storage Room', 'Pit Room', 'Library', 'Laboratory',
		'Antechamber', 'Fungal Cavern', 'Prison Cell', 'Trophy Room',
		'Ritual Chamber', 'Forge', 'Flooded Chamber', 'Tomb', 'Kennel',
		'Cistern', 'Feast Hall', 'Trap Room', 'Underground Pool',
		'Ossuary', 'Summoning Chamber'
	];

	function pickFrom<T>(arr: T[]): T {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	function genEncounter(budget: number, isBoss: boolean): DungeonEncounter {
		const pool = (isBoss ? bossPool : dungeonPool).filter(
			(m) => m.xp <= budget * (isBoss ? 2 : 1.5)
		);
		if (!pool.length) return { monsters: [], xp: 0, difficulty: 'trivial' };

		if (isBoss) {
			const affordable = pool.filter((m) => m.xp <= budget);
			const boss = pickFrom(affordable.length ? affordable : pool);
			return { monsters: [{ name: boss.name, count: 1 }], xp: boss.xp, difficulty: 'deadly' };
		}

		const leaders = pool.filter((m) => m.role === 'leader');
		const minions = pool.filter((m) => m.role === 'minion');
		const solos = pool.filter((m) => m.role === 'solo');
		const archetypes = ['ambush'];
		if (solos.length) archetypes.push('solo');
		if (minions.length >= 2) archetypes.push('pack');
		if (leaders.length && minions.length) archetypes.push('mixed');
		const arch = pickFrom(archetypes);

		let monsters: { name: string; count: number }[] = [];
		let rawXp = 0;

		if (arch === 'solo' && solos.length) {
			const m = solos.reduce((b, c) => Math.abs(c.xp - budget) < Math.abs(b.xp - budget) ? c : b);
			monsters = [{ name: m.name, count: 1 }];
			rawXp = m.xp;
		} else if (arch === 'pack' && minions.length) {
			const target = budget / (5 * monsterMult(5, partySize));
			const m = minions.reduce((b, c) => Math.abs(c.xp - target) < Math.abs(b.xp - target) ? c : b);
			const count = Math.max(2, Math.min(8, Math.round(budget / (m.xp * monsterMult(5, partySize)))));
			monsters = [{ name: m.name, count }];
			rawXp = m.xp * count;
		} else if (arch === 'mixed' && leaders.length && minions.length) {
			const leader = pickFrom(leaders);
			const minion = pickFrom(minions);
			const count = Math.max(1, Math.min(4, Math.round((budget * 0.5) / (minion.xp * monsterMult(3, partySize)))));
			monsters = [{ name: leader.name, count: 1 }, { name: minion.name, count }];
			rawXp = leader.xp + minion.xp * count;
		} else {
			const m = pickFrom(pool);
			const count = Math.max(1, Math.min(4, Math.round(budget / (m.xp * monsterMult(2, partySize)))));
			monsters = [{ name: m.name, count }];
			rawXp = m.xp * count;
		}

		const totalCount = monsters.reduce((s, m) => s + m.count, 0);
		const adjXp = Math.round(rawXp * monsterMult(totalCount, partySize));
		return { monsters, xp: adjXp, difficulty: getActualDifficulty(adjXp, partyLevel, partySize) };
	}

	// ── Dungeon generation (DonJon-style) ──────────────────────────────────────
	function randInt(min: number, max: number): number {
		return min + Math.floor(Math.random() * (max - min + 1));
	}

	function carveH(cells: number[][], y: number, x1: number, x2: number) {
		const [lo, hi] = x1 < x2 ? [x1, x2] : [x2, x1];
		for (let x = lo; x <= hi; x++)
			if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H && cells[y][x] === VOID)
				cells[y][x] = CORRIDOR;
	}

	function carveV(cells: number[][], x: number, y1: number, y2: number) {
		const [lo, hi] = y1 < y2 ? [y1, y2] : [y2, y1];
		for (let y = lo; y <= hi; y++)
			if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H && cells[y][x] === VOID)
				cells[y][x] = CORRIDOR;
	}

	function carveCorridor(cells: number[][], a: DungeonRoom, b: DungeonRoom) {
		if (Math.random() < 0.5) {
			carveH(cells, a.cy, a.cx, b.cx);
			carveV(cells, b.cx, a.cy, b.cy);
		} else {
			carveV(cells, a.cx, a.cy, b.cy);
			carveH(cells, b.cy, a.cx, b.cx);
		}
	}

	const LOOT_COMMON = ["Potion of Healing (2d4+2 hp)","Spell Scroll (cantrip)","Spell Scroll (1st level)","Vial of Antitoxin","Oil Flask (1d8+1 fire dmg)","Potion of Climbing","Alchemist's Fire (1d4 fire)","Healer's Kit (10 uses)","Bag of Ball Bearings (100)","Holy Water (2d6 vs undead)"];
	const LOOT_UNCOMMON = ["Potion of Greater Healing (4d4+4 hp)","Spell Scroll (2nd level)","Spell Scroll (3rd level)","+1 Ammunition (20 pieces)","Bag of Holding","Cloak of Protection (+1 AC and saves)","Immovable Rod","Wand of Magic Missiles (7 charges)","Hat of Disguise","Rope of Climbing (60 ft)","Pipes of Haunting","Sending Stones (pair)"];
	const LOOT_RARE = ["Potion of Superior Healing (8d4+8 hp)","+2 Weapon (your choice of type)","+1 Shield","Flame Tongue Shortsword","Ring of Protection (+1 AC and saves)","Necklace of Fireballs (7 beads)","Wand of Fireballs (7 charges)","Belt of Hill Giant Strength (STR 21)","Cloak of Displacement","Boots of Speed (haste 1 min/day)","Amulet of Health (CON 19)","Manual of Bodily Health (+2 CON)"];
	const LOOT_VERY_RARE = ["Potion of Supreme Healing (10d4+20 hp)","+3 Weapon (your choice of type)","+2 Shield","Ring of Regeneration (1d6 hp per 10 min)","Vorpal Sword (critical severs a limb)","Crystal Ball","Robe of the Archmagi","Staff of Power (20 charges)","Tome of Leadership and Influence (+2 CHA)","Manual of Quickness of Action (+2 DEX)","Carpet of Flying (6x9 ft, 4 passengers)","Luck Blade (+1 longsword, 3 wishes)"];
	function genLoot(level: number): LootInfo {
		let coins: string; let pool: string[];
		if (level <= 4) { const gp=randInt(1,6)*2,sp=randInt(2,8)*5,cp=randInt(2,12)*10; coins=`${gp} gp, ${sp} sp, ${cp} cp`; pool=LOOT_COMMON; }
		else if (level <= 10) { const gp=randInt(2,12)*10,sp=randInt(1,6)*5; coins=`${gp} gp, ${sp} sp`; pool=LOOT_UNCOMMON; }
		else if (level <= 16) { const gp=randInt(4,8)*50,pp=randInt(1,4)*5; coins=`${gp} gp, ${pp} pp`; pool=LOOT_RARE; }
		else { const gp=randInt(2,6)*250,pp=randInt(2,8)*10; coins=`${gp} gp, ${pp} pp`; pool=LOOT_VERY_RARE; }
		const numItems=Math.random()<0.3?0:Math.random()<0.7?1:2;
		const items:string[]=[]; const usedIdx=new Set<number>();
		for(let i=0;i<numItems;i++){let idx=Math.floor(Math.random()*pool.length);while(usedIdx.has(idx))idx=Math.floor(Math.random()*pool.length);usedIdx.add(idx);items.push(pool[idx]);}
		return{coins,items};
	}

	// Trap table
	const TRAP_TABLE: TrapInfo[] = [
		{ name: "Poison Needle", trigger: "Activated when the door handle is turned", dc: 15, effect: "A needle shoots from the frame. 2d4 piercing damage; DC 15 CON save or poisoned for 1 hour." },
		{ name: "Rolling Boulder", trigger: "Pressure plate behind the door", dc: 14, effect: "A boulder drops and rolls the corridor. DC 14 DEX save or 4d6 bludgeoning damage." },
		{ name: "Collapsing Ceiling", trigger: "Tripwire across the door frame", dc: 13, effect: "Debris rains in a 10 ft radius. DC 13 DEX save or 3d6 bludgeoning and restrained." },
		{ name: "Pit Trap", trigger: "False floor tile just past the threshold", dc: 14, effect: "A 10 ft pit opens. DC 14 DEX save or fall in for 1d6 bludgeoning damage." },
		{ name: "Fire Jet", trigger: "Pressure plate in the doorway", dc: 12, effect: "Jets of flame fill the doorway. DC 12 DEX save or 2d6 fire damage." },
		{ name: "Sleep Gas", trigger: "Mechanism triggers when the door swings open", dc: 13, effect: "Colorless gas fills 10 ft. DC 13 CON save or fall unconscious for 1 hour (damage ends it)." },
		{ name: "Alarm Bell", trigger: "Wire attached to the back of the door", dc: 10, effect: "A loud bell rings. Creatures within 300 ft are alerted; nearest enemies arrive in 1d4 rounds." },
		{ name: "Acid Spray", trigger: "Pressure plate on the far side of the door", dc: 13, effect: "A vial of acid shatters. 2d6 acid; DC 13 DEX save or 2d6 more at end of next turn." },
		{ name: "Crossbow Bolt", trigger: "Tripwire at ankle height across the threshold", dc: 14, effect: "Hidden crossbow fires: +6 to hit, 2d8 piercing damage." },
		{ name: "Curse Glyph", trigger: "Magical rune on the door activates on touch", dc: 16, effect: "Glyph of warding triggers. DC 16 WIS save or cursed for 24 hours: disadvantage on attacks and saves." },
		{ name: "Electrical Arc", trigger: "Conductive handle wired to hidden copper coils", dc: 14, effect: "3d6 lightning damage. DC 14 CON save or stunned until end of next turn." },
		{ name: "Collapsing Floor", trigger: "Weakened floor triggers when the door fully opens", dc: 15, effect: "Floor collapses into a 20 ft pit. Creatures within 10 ft: DC 15 DEX save or fall for 2d6 bludgeoning." },
	];

	function addDoors(cells: number[][], traps: Record<string, TrapInfo>) {
		for (let y = 1; y < GRID_H - 1; y++) {
			for (let x = 1; x < GRID_W - 1; x++) {
				if (cells[y][x] !== CORRIDOR) continue;
				const ns = [cells[y - 1][x], cells[y + 1][x], cells[y][x - 1], cells[y][x + 1]];
				const floorAdj = ns.filter(n => n === FLOOR).length;
				const corrAdj = ns.filter(n => n === CORRIDOR).length;
				if (floorAdj >= 1 && corrAdj >= 1 && Math.random() < 0.55) {
					cells[y][x] = DOOR;
					if (Math.random() < 0.25)
						traps[`${x},${y}`] = TRAP_TABLE[Math.floor(Math.random() * TRAP_TABLE.length)];
				}
			}
		}
	}

	function generateFloor(isFirst: boolean, isLast: boolean): DungeonFloor {
		const maxRooms = dungeonSize === 'small' ? 6 : dungeonSize === 'large' ? 18 : 12;
		const cells: number[][] = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(VOID));
		const rooms: DungeonRoom[] = [];
		const usedNames = new Set<string>();

		for (let attempt = 0; attempt < 500 && rooms.length < maxRooms; attempt++) {
			const w = randInt(5, 13);
			const h = randInt(4, 9);
			const x = randInt(2, GRID_W - w - 2);
			const y = randInt(2, GRID_H - h - 2);

			let ok = true;
			for (const r of rooms) {
				if (x < r.right + 2 && x + w > r.left - 1 && y < r.bottom + 2 && y + h > r.top - 1) {
					ok = false; break;
				}
			}
			if (!ok) continue;

			for (let ry = y; ry < y + h; ry++)
				for (let rx = x; rx < x + w; rx++)
					cells[ry][rx] = FLOOR;

			let name = pickFrom(roomNames);
			while (usedNames.has(name) && usedNames.size < roomNames.length) name = pickFrom(roomNames);
			usedNames.add(name);

			rooms.push({
				id: rooms.length,
				left: x, right: x + w - 1,
				top: y, bottom: y + h - 1,
				cx: x + Math.floor(w / 2),
				cy: y + Math.floor(h / 2),
				name, isEntrance: false, isBoss: false, encounter: null
			});
		}

		if (rooms.length === 0) return { cells, rooms: [], traps: {}, stairs: {} };

		// Prim's MST
		const connected = new Set<number>([0]);
		while (connected.size < rooms.length) {
			let bestDist = Infinity, bestA = -1, bestB = -1;
			for (const a of connected) {
				for (let b = 0; b < rooms.length; b++) {
					if (connected.has(b)) continue;
					const d = Math.hypot(rooms[a].cx - rooms[b].cx, rooms[a].cy - rooms[b].cy);
					if (d < bestDist) { bestDist = d; bestA = a; bestB = b; }
				}
			}
			if (bestA === -1) break;
			carveCorridor(cells, rooms[bestA], rooms[bestB]);
			connected.add(bestB);
		}

		// Extra corridors for loops
		const extra = Math.ceil(rooms.length * 0.25);
		for (let i = 0; i < extra; i++) {
			const a = randInt(0, rooms.length - 1);
			const b = randInt(0, rooms.length - 1);
			if (a !== b) carveCorridor(cells, rooms[a], rooms[b]);
		}

		const traps: Record<string, TrapInfo> = {};
		addDoors(cells, traps);

		// Entrance: most upper-left room (first floor only)
		if (isFirst) {
			const entranceIdx = rooms.reduce(
				(bi, r, i) => r.left + r.top < rooms[bi].left + rooms[bi].top ? i : bi, 0
			);
			rooms[entranceIdx].isEntrance = true;
			rooms[entranceIdx].name = 'Entrance';
		}

		// Boss: furthest room (last floor only)
		if (isLast && includeBoss && rooms.length > 1) {
			const ref = rooms.find(r => r.isEntrance) ?? rooms[0];
			let bossIdx = 0, maxDist = 0;
			for (let i = 0; i < rooms.length; i++) {
				if (rooms[i].isEntrance) continue;
				const d = Math.hypot(rooms[i].cx - ref.cx, rooms[i].cy - ref.cy);
				if (d > maxDist) { maxDist = d; bossIdx = i; }
			}
			rooms[bossIdx].isBoss = true;
			rooms[bossIdx].name = 'Boss Chamber';
		}

		const baseBudget = getXpBudget(partyLevel, difficulty, partySize);
		for (const r of rooms) {
			if (r.isEntrance) continue;
			if (r.isBoss) r.encounter = genEncounter(baseBudget * 2.5, true);
			else if (Math.random() > 0.2) r.encounter = genEncounter(baseBudget * (0.6 + Math.random() * 0.8), false);
		}

		for (const r of rooms) { if (!r.isEntrance && Math.random() < 0.25) r.loot = genLoot(partyLevel); }

		return { cells, rooms, traps, stairs: {} };
	}

	function roomCorner(r: DungeonRoom, used: Record<string, unknown>): [number, number] {
		const corners: [number, number][] = [
			[r.left + 1, r.top + 1],
			[r.right - 1, r.top + 1],
			[r.left + 1, r.bottom - 1],
			[r.right - 1, r.bottom - 1],
		];
		const free = corners.filter(([x, y]) => !used[`${x},${y}`]);
		return free.length > 0 ? pickFrom(free) : pickFrom(corners);
	}

	function placeStairs(lower: DungeonFloor, upper: DungeonFloor) {
		const count = Math.min(2, Math.ceil(lower.rooms.length / 5));
		for (let i = 0; i < count; i++) {
			const upCandidates = lower.rooms.filter(r => !r.isEntrance && !lower.stairs[`${r.cx},${r.cy}`]);
			if (upCandidates.length > 0) {
				const r = pickFrom(upCandidates);
				const [cx, cy] = roomCorner(r, lower.stairs);
				lower.stairs[`${cx},${cy}`] = 'down';
			}
			const downCandidates = upper.rooms.filter(r => !r.isBoss && !upper.stairs[`${r.cx},${r.cy}`]);
			if (downCandidates.length > 0) {
				const r = pickFrom(downCandidates);
				const [cx, cy] = roomCorner(r, upper.stairs);
				upper.stairs[`${cx},${cy}`] = 'up';
			}
		}
	}

	function generateDungeon() {
		const floors: DungeonFloor[] = [];
		for (let fi = 0; fi < numFloors; fi++)
			floors.push(generateFloor(fi === 0, fi === numFloors - 1));
		for (let fi = 0; fi < floors.length - 1; fi++)
			placeStairs(floors[fi], floors[fi + 1]);
		dungeon = { floors };
		currentFloor = 0;
		selectedRoomId = null;
		requestAnimationFrame(renderCanvas);
	}

	// ── Canvas color palette (DonJon-style) ───────────────────────────────────
	const C = {
		void:          '#0a0d12',
		gridVoid:      '#111820',
		floor:         '#2a3a4a',
		floorAlt:      '#243242',
		corridor:      '#1e2c3a',
		gridFloor:     'rgba(0,0,0,0.18)',
		wallLit:       '#5a8098',
		wallDim:       '#2a4058',
		trap:          '#cc2222',
		trapText:      '#ff6666',
		door:          '#c87820',
		doorCenter:    '#6b4010',
		entrance:      '#0d2618',
		entranceAlt:   '#0f2e1c',
		boss:          '#280c0c',
		bossAlt:       '#300e0e',
		selOverlay:    'rgba(180,130,0,0.22)',
		selBorder:     '#e0a030',
	};

	// ── Rendering ──────────────────────────────────────────────────────────────
	function renderFloorToContext(ctx: CanvasRenderingContext2D, floor: DungeonFloor, selectedId: number | null) {
		const { cells, rooms, traps, stairs } = floor;

		// Build room lookup
		const roomOf: (DungeonRoom | null)[][] = Array.from(
			{ length: GRID_H }, () => Array(GRID_W).fill(null)
		);
		for (const r of rooms)
			for (let y = r.top; y <= r.bottom; y++)
				for (let x = r.left; x <= r.right; x++)
					roomOf[y][x] = r;

		// ── Pass 1: Void background + grid ────────────────────────────────────
		ctx.fillStyle = C.void;
		ctx.fillRect(0, 0, CVS_W, CVS_H);

		ctx.strokeStyle = C.gridVoid;
		ctx.lineWidth = 0.5;
		for (let x = 0; x <= GRID_W; x++) {
			ctx.beginPath(); ctx.moveTo(x * TILE, 0); ctx.lineTo(x * TILE, CVS_H); ctx.stroke();
		}
		for (let y = 0; y <= GRID_H; y++) {
			ctx.beginPath(); ctx.moveTo(0, y * TILE); ctx.lineTo(CVS_W, y * TILE); ctx.stroke();
		}

		// ── Pass 2: Floors, corridors, doors ──────────────────────────────────
		for (let y = 0; y < GRID_H; y++) {
			for (let x = 0; x < GRID_W; x++) {
				const v = cells[y][x];
				if (v === VOID) continue;
				const px = x * TILE, py = y * TILE;
				const room = roomOf[y][x];
				const alt = (x + y) % 3 === 0;

				if (v === FLOOR) {
					if (room?.isEntrance) ctx.fillStyle = alt ? C.entranceAlt : C.entrance;
					else if (room?.isBoss) ctx.fillStyle = alt ? C.bossAlt : C.boss;
					else ctx.fillStyle = alt ? C.floorAlt : C.floor;
					ctx.fillRect(px, py, TILE, TILE);
					// Subtle floor grid
					ctx.fillStyle = C.gridFloor;
					ctx.fillRect(px, py, TILE, 1);
					ctx.fillRect(px, py, 1, TILE);
				} else if (v === CORRIDOR) {
					ctx.fillStyle = C.corridor;
					ctx.fillRect(px, py, TILE, TILE);
					// Grid lines on corridors
					ctx.fillStyle = C.gridFloor;
					ctx.fillRect(px, py, TILE, 1);
					ctx.fillRect(px, py, 1, TILE);
				} else if (v === DOOR) {
					const isTrapped = !!traps[`${x},${y}`];
					ctx.fillStyle = C.corridor;
					ctx.fillRect(px, py, TILE, TILE);
					// Door frame (red if trapped, amber if normal) + dark center
					ctx.fillStyle = isTrapped ? C.trap : C.door;
					ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
					ctx.fillStyle = C.doorCenter;
					ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
					if (isTrapped) {
						ctx.font = "bold 8px monospace";
						ctx.textAlign = "center";
						ctx.textBaseline = "middle";
						ctx.fillStyle = C.trapText;
						ctx.fillText("!", px + TILE / 2, py + TILE / 2);
					}
				}
			}
		}

		// ── Pass 3: Wall edges (lines at floor→void boundaries) ───────────────
		const isOpen = (x: number, y: number) => {
			if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return false;
			return cells[y][x] !== VOID;
		};

		ctx.lineWidth = 1.5;
		for (let y = 0; y < GRID_H; y++) {
			for (let x = 0; x < GRID_W; x++) {
				if (!isOpen(x, y)) continue;
				const px = x * TILE, py = y * TILE;
				// North — lit
				if (!isOpen(x, y - 1)) {
					ctx.strokeStyle = C.wallLit;
					ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + TILE, py); ctx.stroke();
				}
				// South — dim (shadow)
				if (!isOpen(x, y + 1)) {
					ctx.strokeStyle = C.wallDim;
					ctx.beginPath(); ctx.moveTo(px, py + TILE); ctx.lineTo(px + TILE, py + TILE); ctx.stroke();
				}
				// West — mid
				if (!isOpen(x - 1, y)) {
					ctx.strokeStyle = C.wallLit;
					ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + TILE); ctx.stroke();
				}
				// East — mid
				if (!isOpen(x + 1, y)) {
					ctx.strokeStyle = C.wallDim;
					ctx.beginPath(); ctx.moveTo(px + TILE, py); ctx.lineTo(px + TILE, py + TILE); ctx.stroke();
				}
			}
		}

		// ── Pass 4: Selected room highlight ───────────────────────────────────
		if (selectedId !== null) {
			const sel = rooms.find(r => r.id === selectedId);
			if (sel) {
				ctx.fillStyle = C.selOverlay;
				for (let y = sel.top; y <= sel.bottom; y++)
					for (let x = sel.left; x <= sel.right; x++)
						if (cells[y][x] === FLOOR) ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
				ctx.strokeStyle = C.selBorder;
				ctx.lineWidth = 2;
				ctx.strokeRect(
					sel.left * TILE, sel.top * TILE,
					(sel.right - sel.left + 1) * TILE, (sel.bottom - sel.top + 1) * TILE
				);
			}
		}

		// ── Pass 5: Room labels + icons ───────────────────────────────────────
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		for (const room of rooms) {
			const px = room.cx * TILE + TILE / 2;
			const py = room.cy * TILE + TILE / 2;
			const rx = room.left * TILE;
			const ry = room.top * TILE;
			const hasEnc = !!room.encounter?.monsters.length;

			// Number badge
			ctx.beginPath();
			ctx.arc(rx + 11, ry + 11, 9, 0, Math.PI * 2);
			ctx.fillStyle = room.isEntrance ? '#0d3318' : room.isBoss ? '#3a0000' : '#111e2c';
			ctx.fill();
			ctx.strokeStyle = room.isEntrance ? '#4ade80' : room.isBoss ? '#f87171' : '#4a7090';
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.font = `bold ${room.id >= 9 ? 8 : 9}px monospace`;
			ctx.fillStyle = room.isEntrance ? '#bbf7d0' : room.isBoss ? '#fecaca' : '#90bcd8';
			ctx.fillText(String(room.id + 1), rx + 11, ry + 11);

			// Room name
			ctx.font = '10px monospace';
			ctx.fillStyle = room.isEntrance ? '#86efac' : room.isBoss ? '#f87171' : '#6a9ab8';
			ctx.fillText(room.name, px, hasEnc ? py - 8 : py);

			// Icon
			if (hasEnc) {
				ctx.font = room.isBoss ? '14px serif' : '11px serif';
				ctx.fillStyle = room.isBoss ? '#f87171' : '#c87830';
				ctx.fillText(room.isBoss ? '☠' : '⚔', px, py + 9);
			} else if (room.isEntrance) {
				ctx.font = 'bold 13px serif';
				ctx.fillStyle = '#4ade80';
				ctx.fillText('▼', px, py + 8);
			}
			if (room.loot) { ctx.font='11px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('💰',(room.right-1)*TILE+TILE/2,(room.bottom-1)*TILE+TILE/2); }
		}

		// ── Pass 6b: Stairs ──────────────────────────────────────────────────
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		for (const [stairKey, stairDir] of Object.entries(stairs)) {
			const [sx, sy] = stairKey.split(',').map(Number);
			const scx = sx * TILE + TILE / 2;
			const scy = sy * TILE + TILE / 2;
			ctx.beginPath();
			ctx.arc(scx, scy, TILE / 2 - 1, 0, Math.PI * 2);
			ctx.fillStyle = 'rgba(255,255,255,0.12)';
			ctx.fill();
			ctx.strokeStyle = 'rgba(255,255,255,0.75)';
			ctx.lineWidth = 1.5;
			ctx.stroke();
			ctx.font = 'bold 9px serif';
			ctx.fillStyle = '#ffffff';
			ctx.fillText(stairDir === 'up' ? '▲' : '▼', scx, scy + 1);
		}

		// ── Pass 6: Border + compass ──────────────────────────────────────────
		ctx.strokeStyle = '#2a4060';
		ctx.lineWidth = 3;
		ctx.strokeRect(1.5, 1.5, CVS_W - 3, CVS_H - 3);
		ctx.strokeStyle = 'rgba(74,112,144,0.35)';
		ctx.lineWidth = 0.8;
		ctx.strokeRect(5, 5, CVS_W - 10, CVS_H - 10);

		// Corner marks
		for (const [ox, oy] of [[9,9],[CVS_W-9,9],[9,CVS_H-9],[CVS_W-9,CVS_H-9]] as [number,number][]) {
			ctx.beginPath();
			ctx.moveTo(ox, oy - 5); ctx.lineTo(ox + 5, oy);
			ctx.lineTo(ox, oy + 5); ctx.lineTo(ox - 5, oy);
			ctx.closePath();
			ctx.fillStyle = 'rgba(74,112,144,0.6)';
			ctx.fill();
		}

		ctx.font = 'bold 9px monospace';
		ctx.fillStyle = 'rgba(90,128,152,0.55)';
		ctx.textAlign = 'center';
		ctx.fillText('DUNGEON MAP', CVS_W / 2, 14);

		drawCompassRose(ctx, CVS_W - 32, CVS_H - 32, 20);
	}

	function renderCanvas() {
		if (!canvasEl || !dungeon) return;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;
		ctx.imageSmoothingEnabled = false;
		renderFloorToContext(ctx, dungeon.floors[currentFloor], selectedRoomId);
	}

	function renderFloorToDataUrl(floor: DungeonFloor): string {
		const offscreen = document.createElement('canvas');
		offscreen.width = CVS_W;
		offscreen.height = CVS_H;
		const ctx = offscreen.getContext('2d')!;
		ctx.imageSmoothingEnabled = false;
		renderFloorToContext(ctx, floor, null);
		return offscreen.toDataURL('image/png');
	}

	function drawCompassRose(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
		ctx.save();
		ctx.translate(cx, cy);

		ctx.beginPath();
		ctx.arc(0, 0, r, 0, Math.PI * 2);
		ctx.fillStyle = '#0c1420';
		ctx.fill();
		ctx.strokeStyle = '#3a6080';
		ctx.lineWidth = 1.5;
		ctx.stroke();

		// N arm (bright)
		ctx.beginPath();
		ctx.moveTo(0, -(r - 2)); ctx.lineTo(3, -7);
		ctx.lineTo(0, -2); ctx.lineTo(-3, -7);
		ctx.closePath();
		ctx.fillStyle = '#90c8e0';
		ctx.fill();

		// S/E/W arms
		for (const angle of [Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
			ctx.save();
			ctx.rotate(angle);
			ctx.beginPath();
			ctx.moveTo(0, -(r - 2)); ctx.lineTo(2.5, -6);
			ctx.lineTo(0, -2); ctx.lineTo(-2.5, -6);
			ctx.closePath();
			ctx.fillStyle = '#2a5068';
			ctx.fill();
			ctx.restore();
		}

		ctx.beginPath();
		ctx.arc(0, 0, 3, 0, Math.PI * 2);
		ctx.fillStyle = '#5a9ab8';
		ctx.fill();

		ctx.font = 'bold 8px monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#90c8e0';
		ctx.fillText('N', 0, -(r + 7));

		ctx.restore();
	}

	async function downloadPdf() {
		if (!dungeon) return;
		isExporting = true;
		try {
			const images = dungeon.floors.map(renderFloorToDataUrl);
			await exportDungeonPdf(dungeon.floors, images);
		} finally {
			isExporting = false;
		}
	}

	// ── Canvas interaction ─────────────────────────────────────────────────────
	function handleCanvasClick(e: MouseEvent) {
		if (!dungeon || !canvasEl || _touchMoved) return;
		const rect = canvasEl.getBoundingClientRect();
		const tx = Math.floor(((e.clientX - rect.left) * (CVS_W / rect.width)) / TILE);
		const ty = Math.floor(((e.clientY - rect.top) * (CVS_H / rect.height)) / TILE);
		const floor = dungeon.floors[currentFloor];
		if (tx >= 0 && tx < GRID_W && ty >= 0 && ty < GRID_H) {
			// Check for stair click
			const stairDir = floor.stairs[`${tx},${ty}`];
			if (stairDir) { activeStair = { dir: stairDir, floor: currentFloor }; return; }
			for (const lr of floor.rooms) { if (lr.loot && tx===lr.right-1 && ty===lr.bottom-1) { activeLoot=lr.loot; return; } }
			// Check for trapped door click
			if (floor.cells[ty][tx] === DOOR) {
				const trap = floor.traps[`${tx},${ty}`];
				if (trap) { activeTrap = trap; return; }
			}
		}
		const clicked = floor.rooms.find(
			r => tx >= r.left && tx <= r.right && ty >= r.top && ty <= r.bottom
		);
		selectedRoomId = clicked ? (clicked.id === selectedRoomId ? null : clicked.id) : null;
		renderCanvas();
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
		zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom + delta));
	}

	$effect(() => {
		if (dungeon && canvasEl) {
			void selectedRoomId;
			void currentFloor;
			requestAnimationFrame(renderCanvas);
		}
	});

	// ── Derived ────────────────────────────────────────────────────────────────
	const roomsWithEncounters = $derived(
		dungeon?.floors[currentFloor].rooms.filter((r) => r.encounter) ?? []
	);
	const selectedRoom = $derived(
		selectedRoomId !== null
			? (dungeon?.floors[currentFloor].rooms.find((r) => r.id === selectedRoomId) ?? null)
			: null
	);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex flex-col bg-gray-950"
	onkeydown={(e) => e.key === 'Escape' && onclose()}
>
	<div aria-hidden="true" class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
		<div class="bg-orb orb-1"></div>
		<div class="bg-orb orb-2"></div>
		<div class="bg-orb orb-3"></div>
		<div class="bg-orb orb-4"></div>
	</div>
	<!-- Header -->
	<div
		class="flex shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900/80 px-5 py-3"
	>
		<div class="flex items-center gap-3">
			<span class="text-xl">🗺️</span>
			<h2 class="text-lg font-bold tracking-wide text-amber-300">Dungeon Generator</h2>
			{#if dungeon}
				<span class="text-xs text-gray-500">
					{dungeon.floors[currentFloor].rooms.length} rooms &bull; {roomsWithEncounters.length} encounters
					{#if dungeon.floors.length > 1}&bull; Floor {currentFloor + 1}/{dungeon.floors.length}{/if}
				</span>
			{/if}
		</div>
		<button
			onclick={onclose}
			class="rounded border border-gray-700 bg-gray-800 p-1.5 text-gray-400 transition hover:border-red-700 hover:text-red-400"
			aria-label="Close"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<!-- Body: controls | map | encounter list -->
	<div class="relative flex min-h-0 flex-1 overflow-hidden">
		<!-- Controls panel -->
		<div
			class="{mobilePanel === 'controls'
				? 'absolute inset-0 z-20 flex flex-col gap-4 overflow-y-auto bg-gray-900 p-4'
				: 'hidden sm:flex w-52 shrink-0 flex-col gap-4 overflow-y-auto border-r border-gray-800 bg-gray-900/60 p-4'}"
		>
			{#if mobilePanel === 'controls'}
				<div class="flex items-center justify-between border-b border-gray-800 pb-3 sm:hidden">
					<span class="text-sm font-bold text-amber-300">Generate Map</span>
					<button onclick={() => (mobilePanel = null)} aria-label="Close panel" class="rounded border border-gray-700 bg-gray-800 p-1.5 text-gray-400 hover:border-red-700 hover:text-red-400">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
					</button>
				</div>
			{/if}

			<div class="flex flex-col gap-1">
				<label for="dng-party-size" class="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Party Size</label>
				<select id="dng-party-size" bind:value={partySize} class="rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none">
					{#each [1, 2, 3, 4, 5, 6, 7, 8] as n}
						<option value={n}>{n} player{n !== 1 ? 's' : ''}</option>
					{/each}
				</select>
			</div>

			<div class="flex flex-col gap-1">
				<label for="dng-level" class="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Party Level</label>
				<select id="dng-level" bind:value={partyLevel} class="rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none">
					{#each Array.from({ length: 20 }, (_, i) => i + 1) as lv}
						<option value={lv}>Level {lv}</option>
					{/each}
				</select>
			</div>

			<div class="flex flex-col gap-1">
				<label for="dng-size" class="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Size</label>
				<select id="dng-size" bind:value={dungeonSize} class="rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none">
					<option value="small">Small</option>
					<option value="medium">Medium</option>
					<option value="large">Large</option>
				</select>
			</div>

			<div class="flex flex-col gap-1">
				<label for="dng-difficulty" class="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Difficulty</label>
				<select id="dng-difficulty" bind:value={difficulty} class="rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none">
					<option value="easy">Easy</option>
					<option value="medium">Medium</option>
					<option value="hard">Hard</option>
					<option value="deadly">Deadly</option>
				</select>
			</div>

			<div class="flex flex-col gap-1">
				<label for="dng-floors" class="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Floors</label>
				<select id="dng-floors" bind:value={numFloors} class="rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none">
					{#each [1, 2, 3, 4, 5] as n}
						<option value={n}>{n} Floor{n !== 1 ? "s" : ""}</option>
					{/each}
				</select>
			</div>

			<label class="flex cursor-pointer items-center gap-2">
				<input type="checkbox" bind:checked={includeBoss} class="h-4 w-4 rounded accent-amber-500" />
				<span class="text-sm text-gray-300">Include Boss</span>
			</label>

			<button
				onclick={generateDungeon}
				class="mt-1 rounded-lg bg-amber-600 py-2 text-sm font-bold text-white transition hover:bg-amber-500 active:scale-95"
			>
				{dungeon ? 'Regenerate' : 'Generate'}
			</button>

			{#if dungeon}
				<div class="mt-2 border-t border-gray-800 pt-3">
					<p class="mb-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase">Legend</p>
					<div class="flex flex-col gap-1.5 text-xs text-gray-400">
						<div class="flex items-center gap-2">
							<span class="inline-block h-3 w-4 rounded-sm" style="background:#0f2e1c;border:1px solid #4ade80"></span>
							Entrance ▼
						</div>
						{#if includeBoss}
							<div class="flex items-center gap-2">
								<span class="inline-block h-3 w-4 rounded-sm" style="background:#300e0e;border:1px solid #f87171"></span>
								Boss ☠
							</div>
						{/if}
						<div class="flex items-center gap-2">
							<span class="inline-block h-3 w-4 rounded-sm" style="background:#c87820;border:1px solid #8b5e18"></span>
							Door
						</div>
						<div class="flex items-center gap-2">
							<span class="inline-flex h-3 w-4 items-center justify-center rounded-sm text-[8px] font-bold text-red-200" style="background:#cc2222;border:1px solid #991111">!</span>
							Trapped Door
						</div>
						{#if dungeon.floors.length > 1}
							<div class="flex items-center gap-2">
								<span class="inline-flex h-3 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.5)">▲</span>
								Stairs Up
							</div>
							<div class="flex items-center gap-2">
								<span class="inline-flex h-3 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.5)">▼</span>
								Stairs Down
							</div>
						{/if}
						<div class="flex items-center gap-2">
							<span class="text-sm leading-none">⚔</span>
							Has encounter
						</div>
						<div class="flex items-center gap-2">
							<span class="text-sm leading-none">💰</span>
							Has loot
						</div>
						<div class="mt-1 text-[10px] text-gray-600">Click a room to select it</div>
					</div>
				</div>

				{#if dungeon.floors[currentFloor].rooms.some((r) => r.isBoss && r.encounter)}
					{@const boss = dungeon.floors[currentFloor].rooms.find((r) => r.isBoss)!}
					<div class="mt-1 rounded border border-red-900/50 bg-red-950/30 px-2 py-1.5">
						<p class="text-[10px] font-bold tracking-wider text-red-400 uppercase">Boss</p>
						<p class="text-xs text-red-300">{boss.encounter?.monsters[0]?.name ?? '—'}</p>
					</div>
				{/if}
			{/if}
		</div>

		<!-- Map area -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			bind:this={mapContainerEl}
			class="relative min-w-0 flex-1 overflow-auto bg-transparent"
			onwheel={handleWheel}
			ontouchstart={handleTouchStart}
			ontouchmove={handleTouchMove}
		>
			<!-- Zoom controls + floor selector -->
			<div class="sticky top-2 left-0 z-10 flex justify-end gap-2 pr-3 pb-0">
				{#if dungeon && dungeon.floors.length > 1}
					<select
						bind:value={currentFloor}
						onchange={() => { selectedRoomId = null; }}
						class="rounded-lg border border-gray-700 bg-gray-900/90 px-2 py-1 text-xs text-gray-300 shadow-lg focus:border-amber-500 focus:outline-none"
					>
						{#each dungeon.floors as _, fi}
							<option value={fi}>Floor {fi + 1}</option>
						{/each}
					</select>
				{/if}
				{#if dungeon}
				<button
					onclick={downloadPdf}
					disabled={isExporting}
					class="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-900/90 px-2 py-1 text-xs text-gray-300 shadow-lg transition hover:border-amber-600 hover:text-amber-300 disabled:opacity-50"
					title="Download all floors as PDF"
				>
					{#if isExporting}
						<span class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-500 border-t-amber-400"></span>
					{:else}
						⤓
					{/if}
					PDF
				</button>
			{/if}
			<div class="flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-900/90 px-2 py-1 shadow-lg">
					<button
						onclick={() => (zoom = Math.max(ZOOM_MIN, zoom - ZOOM_STEP))}
						class="flex h-6 w-6 items-center justify-center rounded text-gray-300 transition hover:text-amber-300"
						title="Zoom out"
					>&#8722;</button>
					<span class="min-w-[2.5rem] text-center text-xs text-gray-500">{Math.round(zoom * 100)}%</span>
					<button
						onclick={() => (zoom = Math.min(ZOOM_MAX, zoom + ZOOM_STEP))}
						class="flex h-6 w-6 items-center justify-center rounded text-gray-300 transition hover:text-amber-300"
						title="Zoom in"
					>+</button>
				</div>
			</div>
			{#if !dungeon}
				<div class="flex flex-1 items-center justify-center">
					<div class="text-center">
						<div class="mb-3 text-5xl opacity-20">🗺️</div>
						<p class="text-sm text-gray-600">Configure options and click Generate.</p>
					</div>
				</div>
			{:else}
				<div class="p-4" style="min-width:fit-content;">
				<div style="width:{CVS_W * zoom}px; height:{CVS_H * zoom}px; position:relative; flex-shrink:0; margin:0 auto;">
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<canvas
					bind:this={canvasEl}
					width={CVS_W}
					height={CVS_H}
					onclick={handleCanvasClick}
					style="display:block; border-radius:4px; cursor:crosshair; box-shadow:0 8px 40px rgba(0,0,0,0.85); transform-origin:top left; transform:scale({zoom});"
				></canvas>

				<!-- Selected room tooltip -->
				{#if selectedRoom}
					<div class="absolute bottom-3 left-3 max-w-xs rounded-lg border border-amber-800/60 bg-gray-950/95 p-3 shadow-xl">
						<p class="mb-1.5 text-xs font-bold text-amber-300">
							Room {selectedRoom.id + 1} &mdash; {selectedRoom.name}
						</p>
						{#if selectedRoom.isEntrance}
							<p class="text-xs text-green-400">Party entrance point</p>
						{:else if selectedRoom.encounter && selectedRoom.encounter.monsters.length > 0}
							<div class="space-y-0.5">
								{#each selectedRoom.encounter.monsters as m}
									<p class="text-xs text-gray-300">{m.count}&times; {m.name}</p>
								{/each}
								<span class="mt-1.5 inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold {difficultyBadge[selectedRoom.encounter.difficulty]}">
									{selectedRoom.encounter.difficulty} &mdash; {selectedRoom.encounter.xp.toLocaleString()} XP
								</span>
							</div>
							{#if onAddEncounter}
								<button
									onclick={() => onAddEncounter!(selectedRoom!.encounter!.monsters)}
									class="mt-2 w-full rounded bg-emerald-700 px-2 py-1 text-xs font-bold text-white transition hover:bg-emerald-600"
								>
									Add to Initiative
								</button>
							{/if}
						{:else}
							<p class="text-xs text-gray-500">Empty room</p>
						{/if}
					</div>
				{/if}
				</div>
				<p class="mt-2 text-center text-[10px] text-gray-700">Click a room to view its encounter.</p>
				</div>
			{/if}
		</div>

		<!-- Encounter list panel -->
		{#if dungeon}
			<div
				class="{mobilePanel === 'encounters'
					? 'absolute inset-0 z-20 flex flex-col overflow-y-auto bg-gray-900'
					: 'hidden sm:flex w-64 shrink-0 flex-col overflow-y-auto border-l border-gray-800 bg-gray-900/60'}"
			>
				<div class="flex items-center justify-between border-b border-gray-800 px-4 py-3">
					<p class="text-xs font-bold tracking-widest text-gray-400 uppercase">Encounters</p>
					{#if mobilePanel === 'encounters'}
						<button onclick={() => (mobilePanel = null)} aria-label="Close panel" class="rounded border border-gray-700 bg-gray-800 p-1.5 text-gray-400 hover:border-red-700 hover:text-red-400 sm:hidden">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
						</button>
					{/if}
				</div>

				{#if roomsWithEncounters.length === 0}
					<p class="p-4 text-xs text-gray-600">No encounters generated.</p>
				{:else}
					<div class="flex flex-col divide-y divide-gray-800/60">
						{#each roomsWithEncounters as room}
							<div class="p-3 transition {room.id === selectedRoomId ? 'bg-amber-900/10' : 'hover:bg-gray-800/40'}">
								<button
									class="mb-1.5 flex w-full items-center gap-1.5 text-left"
									onclick={() => (selectedRoomId = room.id === selectedRoomId ? null : room.id)}
								>
									<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold {room.isBoss ? 'bg-red-900 text-red-300' : room.isEntrance ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'}">
										{room.id + 1}
									</span>
									<span class="text-xs font-semibold {room.isBoss ? 'text-red-300' : 'text-gray-300'}">
										{room.name}
									</span>
									{#if room.isBoss}
										<span class="ml-auto text-xs">☠</span>
									{/if}
								</button>

								<div class="ml-7 space-y-0.5">
									{#each room.encounter!.monsters as m}
										<div class="flex items-center gap-1">
											<span class="text-xs text-gray-500">{m.count}&times;</span>
											<button
												onclick={() => { const detail = getMonsterDetail(m.name); if (detail) infoMonster = detail; }}
												class="text-left text-xs text-amber-400 underline decoration-dotted underline-offset-2 transition hover:text-amber-300"
											>
												{m.name}
											</button>
										</div>
									{/each}
								</div>

								<div class="ml-7 mt-1.5 flex items-center justify-between">
									<span class="rounded border px-1.5 py-0.5 text-[9px] font-bold {difficultyBadge[room.encounter!.difficulty]}">
										{room.encounter!.difficulty}
									</span>
									<span class="text-[9px] text-gray-600">{room.encounter!.xp.toLocaleString()} XP</span>
								</div>

								{#if onAddEncounter}
									<button
										onclick={() => onAddEncounter!(room.encounter!.monsters)}
										class="ml-7 mt-2 w-[calc(100%-1.75rem)] rounded bg-emerald-800 py-1 text-[10px] font-bold text-emerald-300 transition hover:bg-emerald-700 active:scale-95"
									>
										Add to Initiative
									</button>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Mobile bottom tab bar -->
	<div class="flex shrink-0 border-t border-gray-800 bg-gray-900/95 sm:hidden">
		<button
			onclick={() => (mobilePanel = mobilePanel === 'controls' ? null : 'controls')}
			class="flex flex-1 flex-col items-center gap-1 py-3 text-xs transition
				{mobilePanel === 'controls' ? 'text-amber-300' : 'text-gray-500 hover:text-gray-300'}"
		>
			<span class="text-lg leading-none">🗺️</span>
			Generate Map
		</button>
		<button
			onclick={() => (mobilePanel = mobilePanel === 'encounters' ? null : 'encounters')}
			class="flex flex-1 flex-col items-center gap-1 py-3 text-xs transition
				{mobilePanel === 'encounters' ? 'text-amber-300' : dungeon ? 'text-gray-500 hover:text-gray-300' : 'text-gray-700 cursor-not-allowed'}"
			disabled={!dungeon}
		>
			<span class="text-lg leading-none">⚔️</span>
			Encounters
		</button>
	</div>
</div>

{#if infoMonster}
	<MonsterInfoModal monster={infoMonster} onclose={() => (infoMonster = null)} />
{/if}

{#if activeTrap}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[60] flex items-center justify-center p-4"
		onclick={() => (activeTrap = null)}
		onkeydown={(e) => e.key === "Escape" && (activeTrap = null)}
	>
		<div class="absolute inset-0 bg-black/70"></div>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="relative z-10 w-full max-w-sm rounded-xl border border-red-900/60 bg-gray-950 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Modal header -->
			<div class="flex items-center justify-between border-b border-red-900/40 bg-red-950/30 px-4 py-3 rounded-t-xl">
				<div class="flex items-center gap-2">
					<span class="text-base">&#9888;</span>
					<h3 class="text-sm font-bold tracking-wide text-red-300">Trap Detected</h3>
				</div>
				<button
					onclick={() => (activeTrap = null)}
					class="rounded border border-gray-700 bg-gray-800 p-1.5 text-gray-400 transition hover:border-red-700 hover:text-red-400"
					aria-label="Close"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<!-- Modal body -->
			<div class="space-y-3 p-4">
				<p class="text-base font-bold text-red-200">{activeTrap.name}</p>
				<div class="rounded border border-gray-800 bg-gray-900/60 px-3 py-2 text-xs text-gray-400">
					<span class="font-bold uppercase tracking-widest text-gray-600 text-[10px]">Trigger</span>
					<p class="mt-0.5 text-gray-300">{activeTrap.trigger}</p>
				</div>
				<div class="rounded border border-red-900/30 bg-red-950/20 px-3 py-2 text-xs">
					<span class="font-bold uppercase tracking-widest text-red-600 text-[10px]">Effect</span>
					<p class="mt-0.5 text-red-200">{activeTrap.effect}</p>
				</div>
				<div class="flex items-center gap-2 rounded border border-amber-900/30 bg-amber-950/20 px-3 py-2">
					<span class="text-[10px] font-bold uppercase tracking-widest text-amber-600">Detection DC</span>
					<span class="ml-auto text-sm font-bold text-amber-300">{activeTrap.dc}</span>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if activeStair}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[60] flex items-center justify-center p-4"
		onclick={() => (activeStair = null)}
		onkeydown={(e) => e.key === "Escape" && (activeStair = null)}
	>
		<div class="absolute inset-0 bg-black/70"></div>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="relative z-10 w-full max-w-xs rounded-xl border border-gray-700 bg-gray-950 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="flex items-center justify-between border-b border-gray-800 bg-gray-900/60 px-4 py-3 rounded-t-xl">
				<div class="flex items-center gap-2">
					<span class="text-base">{activeStair.dir === 'up' ? '▲' : '▼'}</span>
					<h3 class="text-sm font-bold tracking-wide text-gray-200">
						{activeStair.dir === 'up' ? 'Stairway Up' : 'Stairway Down'}
					</h3>
				</div>
				<button
					onclick={() => (activeStair = null)}
					class="rounded border border-gray-700 bg-gray-800 p-1.5 text-gray-400 transition hover:border-red-700 hover:text-red-400"
					aria-label="Close"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="space-y-3 p-4">
				<p class="text-sm text-gray-300">
					{activeStair.dir === 'down'
						? `These stairs descend to Floor ${activeStair.floor + 2}.`
						: `These stairs ascend to Floor ${activeStair.floor}.`}
				</p>
				<button
					onclick={() => { currentFloor = activeStair!.dir === 'down' ? activeStair!.floor + 1 : activeStair!.floor - 1; selectedRoomId = null; activeStair = null; }}
					class="w-full rounded bg-gray-700 px-3 py-1.5 text-xs font-bold text-gray-200 transition hover:bg-gray-600"
				>Go to Floor {activeStair.dir === 'down' ? activeStair.floor + 2 : activeStair.floor}</button>
			</div>
		</div>
	</div>
{/if}

{#if activeLoot}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-[60] flex items-center justify-center p-4" onclick={() => (activeLoot = null)} onkeydown={(e) => e.key === "Escape" && (activeLoot = null)}>
		<div class="absolute inset-0 bg-black/70"></div>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="relative z-10 w-full max-w-sm rounded-xl border border-yellow-900/50 bg-gray-950 shadow-2xl" onclick={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between border-b border-yellow-900/40 bg-yellow-950/20 px-4 py-3 rounded-t-xl">
				<div class="flex items-center gap-2"><span class="text-base">💰</span><h3 class="text-sm font-bold tracking-wide text-yellow-300">Loot Found!</h3></div>
				<button onclick={() => (activeLoot = null)} class="rounded border border-gray-700 bg-gray-800 p-1.5 text-gray-400 transition hover:border-red-700 hover:text-red-400" aria-label="Close"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
			</div>
			<div class="space-y-3 p-4">
				<div class="flex items-center gap-2 rounded border border-yellow-900/30 bg-yellow-950/20 px-3 py-2">
					<span class="text-[10px] font-bold uppercase tracking-widest text-yellow-600">Coins</span>
					<span class="ml-auto text-sm font-bold text-yellow-300">{activeLoot.coins}</span>
				</div>
				{#if activeLoot.items.length > 0}
					<div class="rounded border border-gray-800 bg-gray-900/60 px-3 py-2">
						<p class="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500">Items</p>
						{#each activeLoot.items as item}<p class="text-xs text-gray-200">• {item}</p>{/each}
					</div>
				{:else}<p class="text-xs text-gray-600">No magic items — just the coins.</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.bg-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(90px);
	}
	.orb-1 {
		width: min(65vw, 700px); height: min(65vw, 700px);
		background: rgba(88, 28, 135, 0.45);
		top: -15%; left: -12%;
		animation: orb-drift-1 24s ease-in-out infinite;
	}
	.orb-2 {
		width: min(55vw, 620px); height: min(55vw, 620px);
		background: rgba(30, 58, 138, 0.45);
		bottom: -18%; right: -10%;
		animation: orb-drift-2 30s ease-in-out infinite;
	}
	.orb-3 {
		width: min(45vw, 520px); height: min(45vw, 520px);
		background: rgba(120, 53, 15, 0.35);
		top: 35%; left: 42%;
		transform: translate(-50%, -50%);
		animation: orb-drift-3 20s ease-in-out infinite;
	}
	.orb-4 {
		width: min(38vw, 440px); height: min(38vw, 440px);
		background: rgba(49, 46, 129, 0.4);
		top: 15%; right: 18%;
		animation: orb-drift-4 26s ease-in-out infinite;
	}
	@keyframes orb-drift-1 {
		0%, 100% { transform: translate(0, 0) scale(1); }
		25%       { transform: translate(8vw, 6vh) scale(1.06); }
		55%       { transform: translate(3vw, 12vh) scale(0.94); }
		75%       { transform: translate(-3vw, 7vh) scale(1.03); }
	}
	@keyframes orb-drift-2 {
		0%, 100% { transform: translate(0, 0) scale(1); }
		30%      { transform: translate(-7vw, -9vh) scale(1.08); }
		65%      { transform: translate(-2vw, -4vh) scale(0.92); }
	}
	@keyframes orb-drift-3 {
		0%, 100% { transform: translate(-50%, -50%) scale(1); }
		40%      { transform: translate(calc(-50% + 7vw), calc(-50% - 9vh)) scale(1.1); }
		70%      { transform: translate(calc(-50% - 5vw), calc(-50% + 5vh)) scale(0.9); }
	}
	@keyframes orb-drift-4 {
		0%, 100% { transform: translate(0, 0) scale(1); }
		35%      { transform: translate(6vw, 9vh) scale(0.94); }
		68%      { transform: translate(-5vw, 4vh) scale(1.06); }
	}
</style>
