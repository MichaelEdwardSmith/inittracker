// In-memory battle-map storage and live state — keyed by game session public ID. Nothing is
// persisted (no MongoDB, no disk); the DM's map image and token positions exist here only for
// the life of the server process — same pattern as sessionDocs/sessionTracks. Single active map
// per session: uploading a new one replaces the old one and clears its tokens/ruler.

export interface BattleMapImage {
	id: string;
	name: string;
	mimeType: string;
	data: Uint8Array;
}

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

// gameSessionId → the uploaded map's image bytes
export const sessionBattleMaps = new Map<string, BattleMapImage>();

// gameSessionId → grid calibration + show/hide state
export const sessionBattleMapViewStates = new Map<string, BattleMapViewState>();

// A placed token references an existing combatant by id; position is normalized (0–1) relative
// to the map image's own dimensions — same coordinate system Document Share uses for strokes.
export interface BattleMapToken {
	combatantId: string;
	x: number;
	y: number;
}

// gameSessionId → placed tokens for the current map
export const sessionBattleMapTokens = new Map<string, BattleMapToken[]>();

export interface BattleMapRuler {
	from: [number, number];
	to: [number, number];
}

// gameSessionId → the DM's in-progress measurement line, or null when not measuring
export const sessionBattleMapRulers = new Map<string, BattleMapRuler | null>();

// DM freehand/straight-line drawing over the map, same normalized-points convention as Document
// Share's annotation strokes — see docShareState.ts's Stroke.
export interface BattleMapStroke {
	points: number[]; // flat [x0, y0, x1, y1, ...], each in [0, 1]
	color: string; // hex
	width: number; // fraction of the map image's width
}

// gameSessionId → the current map's drawn strokes
export const sessionBattleMapStrokes = new Map<string, BattleMapStroke[]>();

export function clearBattleMapSession(gameSessionId: string) {
	sessionBattleMaps.delete(gameSessionId);
	sessionBattleMapViewStates.delete(gameSessionId);
	sessionBattleMapTokens.delete(gameSessionId);
	sessionBattleMapRulers.delete(gameSessionId);
	sessionBattleMapStrokes.delete(gameSessionId);
}
