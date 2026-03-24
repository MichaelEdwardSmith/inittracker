// Shared dungeon rendering utilities used by both the DM modal and the player viewer.
// Exports bit flags, theme palettes, and renderFogOfWarCanvas().

export const ROOM = 0x00000002;
export const CORRIDOR = 0x00000004;
export const ROOM_ID = 0x0000ffc0;
export const ARCH = 0x00010000;
export const DOOR = 0x00020000;
export const LOCKED = 0x00040000;
export const TRAPPED = 0x00080000;
export const SECRET = 0x00100000;
export const PORTC = 0x00200000;
export const STAIR_DN = 0x00400000;
export const STAIR_UP = 0x00800000;
export const OPENSPACE = ROOM | CORRIDOR;
export const DOORSPACE = ARCH | DOOR | LOCKED | TRAPPED | SECRET | PORTC;
export const STAIRS = STAIR_DN | STAIR_UP;

export type DungeonTheme = 'Crypt' | 'Sewer' | 'Cave' | 'Fortress' | 'Arcane' | 'Fungal';

export interface ThemePalette {
	void: string;
	floor: string;
	floorAlt: string;
	corridor: string;
	corridorGrout: string;
	wallLit: string;
	wallDim: string;
	bossFloor: string;
	bossFloorAlt: string;
	bossWallLit: string;
	bossWallDim: string;
	startFloor: string;
	startFloorAlt: string;
	startWallLit: string;
	startWallDim: string;
}

export const THEME_PALETTES: Record<DungeonTheme, ThemePalette> = {
	Crypt: {
		void: '#0a0d12',
		floor: '#2a3a4a',
		floorAlt: '#243242',
		corridor: '#1e2c3a',
		corridorGrout: 'rgba(100,150,190,0.25)',
		wallLit: '#5a8098',
		wallDim: '#2a4058',
		bossFloor: '#4a1515',
		bossFloorAlt: '#3d1010',
		bossWallLit: '#a04040',
		bossWallDim: '#602020',
		startFloor: '#1a3d20',
		startFloorAlt: '#152f18',
		startWallLit: '#4a9a5a',
		startWallDim: '#2a6035'
	},
	Sewer: {
		void: '#06090a',
		floor: '#243028',
		floorAlt: '#1e2a20',
		corridor: '#182418',
		corridorGrout: 'rgba(80,140,80,0.28)',
		wallLit: '#5a8a50',
		wallDim: '#2a4825',
		bossFloor: '#3a2810',
		bossFloorAlt: '#2e200c',
		bossWallLit: '#9a6830',
		bossWallDim: '#5a3c18',
		startFloor: '#1c3a32',
		startFloorAlt: '#162e28',
		startWallLit: '#40988a',
		startWallDim: '#225848'
	},
	Cave: {
		void: '#0c0906',
		floor: '#3a2e22',
		floorAlt: '#30261c',
		corridor: '#261e16',
		corridorGrout: 'rgba(160,120,80,0.28)',
		wallLit: '#8a6a48',
		wallDim: '#4a3820',
		bossFloor: '#3a1a10',
		bossFloorAlt: '#2e1410',
		bossWallLit: '#a84830',
		bossWallDim: '#682818',
		startFloor: '#223820',
		startFloorAlt: '#1a2e1a',
		startWallLit: '#608858',
		startWallDim: '#385030'
	},
	Fortress: {
		void: '#080a0c',
		floor: '#303438',
		floorAlt: '#282c30',
		corridor: '#1e2226',
		corridorGrout: 'rgba(140,150,160,0.25)',
		wallLit: '#808898',
		wallDim: '#404850',
		bossFloor: '#381830',
		bossFloorAlt: '#2c1028',
		bossWallLit: '#984880',
		bossWallDim: '#5a2850',
		startFloor: '#183040',
		startFloorAlt: '#122838',
		startWallLit: '#4080a8',
		startWallDim: '#205068'
	},
	Arcane: {
		void: '#08060e',
		floor: '#241840',
		floorAlt: '#1e1438',
		corridor: '#180e30',
		corridorGrout: 'rgba(120,80,200,0.30)',
		wallLit: '#7858c0',
		wallDim: '#3c2878',
		bossFloor: '#2a0840',
		bossFloorAlt: '#220638',
		bossWallLit: '#9830c0',
		bossWallDim: '#5c1878',
		startFloor: '#0c2840',
		startFloorAlt: '#0a2038',
		startWallLit: '#3878c8',
		startWallDim: '#1c4880'
	},
	Fungal: {
		void: '#050a08',
		floor: '#1a2e28',
		floorAlt: '#152620',
		corridor: '#101e1a',
		corridorGrout: 'rgba(80,200,140,0.28)',
		wallLit: '#48b888',
		wallDim: '#206040',
		bossFloor: '#1e3010',
		bossFloorAlt: '#162808',
		bossWallLit: '#88c020',
		bossWallDim: '#488010',
		startFloor: '#0e2830',
		startFloorAlt: '#0a2028',
		startWallLit: '#30b0c0',
		startWallDim: '#186880'
	}
};

/** Minimal floor data needed for fog-of-war rendering on the viewer. */
export interface DungeonFloor {
	n_rows: number;
	n_cols: number;
	n_rooms: number;
	cell: number[][];
	stair: Array<{ row: number; col: number; connects_to_floor?: number }>;
}

/** State synced from DM to players for fog-of-war map display. */
export interface DungeonMapState {
	dungeonName: string;
	theme: string;
	floors: DungeonFloor[];
	currentFloor: number;
	bossRoomIds: number[];
	/** Per floor: array of revealed room IDs (from DM marking rooms visited). */
	revealedRooms: number[][];
	/** Per floor: array of "row,col" corridor cell keys revealed by DM clicking. */
	revealedCorridors: string[][];
}

const TILE = 14;

/**
 * Renders a fog-of-war dungeon map onto the given canvas.
 * Only revealed rooms and corridors are drawn; everything else stays void-black.
 */
export function renderFogOfWarCanvas(canvas: HTMLCanvasElement, state: DungeonMapState): void {
	const fi = state.currentFloor;
	const d = state.floors[fi];
	if (!d) return;

	const bossRoomId = state.bossRoomIds[fi] ?? 0;
	const startRoomId = fi === 0 ? 1 : 0;
	const pal = THEME_PALETTES[(state.theme as DungeonTheme) ?? 'Crypt'] ?? THEME_PALETTES.Crypt;

	const revealedRooms = new Set(state.revealedRooms[fi] ?? []);
	const revealedCorridors = new Set(state.revealedCorridors[fi] ?? []);

	const canvasW = (d.n_cols + 1) * TILE;
	const canvasH = (d.n_rows + 1) * TILE;
	canvas.width = canvasW;
	canvas.height = canvasH;

	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	const isCellRevealed = (r: number, c: number): boolean => {
		if (r < 0 || r > d.n_rows || c < 0 || c > d.n_cols) return false;
		const cell = d.cell[r][c];
		if (cell & ROOM) return revealedRooms.has((cell & ROOM_ID) >> 6);
		if (cell & CORRIDOR) return revealedCorridors.has(`${r},${c}`);
		return false;
	};

	// Fill entire canvas with void
	ctx.fillStyle = pal.void;
	ctx.fillRect(0, 0, canvasW, canvasH);

	// Pass 1: floors and corridors
	for (let r = 0; r <= d.n_rows; r++) {
		for (let c = 0; c <= d.n_cols; c++) {
			if (!isCellRevealed(r, c)) continue;
			const cell = d.cell[r][c];
			const x = c * TILE;
			const y = r * TILE;
			if (cell & ROOM) {
				const roomId = (cell & ROOM_ID) >> 6;
				const isBoss = roomId === bossRoomId;
				const isStart = roomId === startRoomId;
				ctx.fillStyle = isBoss
					? (r + c) % 2 === 1
						? pal.bossFloorAlt
						: pal.bossFloor
					: isStart
						? (r + c) % 2 === 1
							? pal.startFloorAlt
							: pal.startFloor
						: (r + c) % 2 === 1
							? pal.floorAlt
							: pal.floor;
				ctx.fillRect(x, y, TILE, TILE);
			} else if (cell & CORRIDOR) {
				ctx.fillStyle = pal.corridor;
				ctx.fillRect(x, y, TILE, TILE);
				ctx.fillStyle = pal.corridorGrout;
				ctx.fillRect(x, y, TILE, 1);
				ctx.fillRect(x, y, 1, TILE);
				ctx.fillRect(x + TILE - 1, y, 1, TILE);
				ctx.fillRect(x, y + TILE - 1, TILE, 1);
			}
		}
	}

	// Pass 2: wall edges at revealed→void boundaries
	ctx.lineWidth = 1.5;
	for (let r = 0; r <= d.n_rows; r++) {
		for (let c = 0; c <= d.n_cols; c++) {
			if (!isCellRevealed(r, c)) continue;
			const cell = d.cell[r][c];
			const roomId = (cell & ROOM_ID) >> 6;
			const isBoss = roomId === bossRoomId;
			const isStart = roomId === startRoomId;
			const x = c * TILE;
			const y = r * TILE;
			if (!isCellRevealed(r - 1, c)) {
				ctx.strokeStyle = isBoss ? pal.bossWallLit : isStart ? pal.startWallLit : pal.wallLit;
				ctx.beginPath();
				ctx.moveTo(x, y);
				ctx.lineTo(x + TILE, y);
				ctx.stroke();
			}
			if (!isCellRevealed(r + 1, c)) {
				ctx.strokeStyle = isBoss ? pal.bossWallDim : isStart ? pal.startWallDim : pal.wallDim;
				ctx.beginPath();
				ctx.moveTo(x, y + TILE);
				ctx.lineTo(x + TILE, y + TILE);
				ctx.stroke();
			}
			if (!isCellRevealed(r, c - 1)) {
				ctx.strokeStyle = isBoss ? pal.bossWallLit : isStart ? pal.startWallLit : pal.wallLit;
				ctx.beginPath();
				ctx.moveTo(x, y);
				ctx.lineTo(x, y + TILE);
				ctx.stroke();
			}
			if (!isCellRevealed(r, c + 1)) {
				ctx.strokeStyle = isBoss ? pal.bossWallDim : isStart ? pal.startWallDim : pal.wallDim;
				ctx.beginPath();
				ctx.moveTo(x + TILE, y);
				ctx.lineTo(x + TILE, y + TILE);
				ctx.stroke();
			}
		}
	}

	// Pass 3: doors — plain, no locked/trapped distinction, no secret doors
	ctx.lineWidth = 1.5;
	for (let r = 0; r <= d.n_rows; r++) {
		for (let c = 0; c <= d.n_cols; c++) {
			if (!isCellRevealed(r, c)) continue;
			const cell = d.cell[r][c];
			if (!(cell & OPENSPACE) || !(cell & DOORSPACE)) continue;
			if (cell & SECRET && !revealedCorridors.has(`${r},${c}`)) continue; // hidden until DM reveals

			const x = c * TILE;
			const y = r * TILE;
			const xc = x + TILE / 2;
			const yc = y + TILE / 2;
			const aPx = Math.max(2, Math.floor(TILE / 6));
			const dTx = Math.floor(TILE / 4);

			// detect orientation: horizontal if left or right neighbour is open
			const horizontal =
				(c > 0 && !!(d.cell[r]?.[c - 1] & OPENSPACE)) ||
				(c <= d.n_cols && !!(d.cell[r]?.[c + 1] & OPENSPACE));

			if (cell & PORTC) {
				// portcullis — draw bars
				ctx.strokeStyle = pal.wallLit;
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
				ctx.lineWidth = 1.5;
				continue;
			}

			// plain door (arch draws jambs only; standard/locked/trapped draw a rect too)
			if (horizontal) {
				ctx.fillStyle = pal.wallLit;
				ctx.fillRect(xc - 1, y, 3, aPx);
				ctx.fillRect(xc - 1, y + TILE - aPx, 3, aPx);
				if (!(cell & ARCH)) {
					ctx.strokeStyle = pal.wallLit;
					ctx.strokeRect(xc - dTx, y + aPx + 1, dTx * 2, TILE - 2 * aPx - 2);
				}
			} else {
				ctx.fillStyle = pal.wallLit;
				ctx.fillRect(x, yc - 1, aPx, 3);
				ctx.fillRect(x + TILE - aPx, yc - 1, aPx, 3);
				if (!(cell & ARCH)) {
					ctx.strokeStyle = pal.wallLit;
					ctx.strokeRect(x + aPx + 1, yc - dTx, TILE - 2 * aPx - 2, dTx * 2);
				}
			}
		}
	}

	// Pass 4: stairs (helpful navigation — shown when the cell is revealed)
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	for (const stair of d.stair) {
		if (!isCellRevealed(stair.row, stair.col)) continue;
		const cell = d.cell[stair.row]?.[stair.col] ?? 0;
		const x = stair.col * TILE;
		const y = stair.row * TILE;
		ctx.font = `${TILE - 2}px sans-serif`;
		ctx.fillStyle = cell & STAIR_DN ? '#3a6abd' : '#2a8a2a';
		ctx.fillText(cell & STAIR_DN ? '▼' : '▲', x + TILE / 2, y + TILE / 2);
		if (stair.connects_to_floor !== undefined) {
			ctx.font = `bold ${Math.max(6, Math.floor(TILE / 2.2))}px monospace`;
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'right';
			ctx.textBaseline = 'top';
			ctx.fillText(String(stair.connects_to_floor + 1), x + TILE - 1, y + 1);
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
		}
	}
}
