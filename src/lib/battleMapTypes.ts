// Client-side Battle Map types — shared by BattleGridCanvas, BattleMapModal, and the player
// display. Mirrors (but is independent of) the server's shapes in battleMapState.ts, since
// server-only modules can't be imported into client code.

export interface BattleMapViewState {
	id: string;
	name: string;
	naturalWidth: number;
	naturalHeight: number;
	gridSquaresAcross: number;
	gridSquaresDown: number;
	feetPerSquare: number;
	showGrid: boolean;
	visible: boolean;
}

export interface BattleMapToken {
	combatantId: string;
	x: number; // normalized 0-1, relative to the map image's own dimensions
	y: number;
}

export interface BattleMapRuler {
	from: [number, number]; // normalized 0-1 points
	to: [number, number];
}

// A placed furniture/barrier stamp — carried in the stroke list (as a single center point) so
// undo/erase/clear, library save/load and viewer sync all handle it with no extra plumbing.
export interface BattleMapStamp {
	kind: string; // id from battleMapStamps.ts
	w: number; // footprint in grid squares, before rotation
	h: number;
	rot: number; // degrees
}

export interface BattleMapStroke {
	points: number[]; // flat [x0, y0, x1, y1, ...], each in [0, 1]; a stamp has just [cx, cy]
	color: string;
	width: number; // fraction of the map image's width
	stamp?: BattleMapStamp;
}
