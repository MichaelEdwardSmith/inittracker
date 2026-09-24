// In-memory document-share storage and view state — keyed by game session public ID.
// Nothing is persisted (no MongoDB, no disk); the DM's local files exist here only for the
// life of the server process, same pattern as sessionTracks/sessionMixerStates in mixerState.ts.
// A doc is a single ordered set of page images (one page for a plain image upload, one per
// rendered page for a PDF) — single-slot per session: uploading a new doc replaces the old one.

export interface DocPage {
	mimeType: string;
	data: Uint8Array;
}

export interface SessionDoc {
	id: string;
	name: string;
	pageCount: number;
	pages: DocPage[]; // sparse while a multi-page upload is still in flight
}

export interface DocShareViewState {
	id: string;
	name: string;
	pageCount: number;
	currentPage: number;
	visible: boolean;
}

// gameSessionId → the uploaded doc's page data
export const sessionDocs = new Map<string, SessionDoc>();

// gameSessionId → what's currently prepared/shown to viewers
export const sessionDocViewStates = new Map<string, DocShareViewState>();

// ---------------------------------------------------------------------------
// DM freehand annotations drawn over a doc's pages. Points and stroke width are
// normalized (0–1, relative to the page image's own dimensions) so the same stroke
// data renders correctly at any canvas size — the DM's small preview and a viewer's
// full-screen display alike.
// ---------------------------------------------------------------------------

export interface Stroke {
	points: number[]; // flat [x0, y0, x1, y1, ...], each in [0, 1]
	color: string; // hex
	width: number; // fraction of the page image's width
}

export interface SessionDocAnnotations {
	docId: string;
	pageStrokes: Record<number, Stroke[]>;
}

// gameSessionId → annotations for the current doc
export const sessionDocAnnotations = new Map<string, SessionDocAnnotations>();
