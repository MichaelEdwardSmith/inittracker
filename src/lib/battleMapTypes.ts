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

export interface BattleMapStroke {
	points: number[]; // flat [x0, y0, x1, y1, ...], each in [0, 1]
	color: string;
	width: number; // fraction of the map image's width
}
