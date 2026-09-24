// Client-side Document Share annotation types — shared by AnnotationCanvas, DocShareModal, and
// the player display. Mirrors (but is independent of) the server's Stroke shape in
// docShareState.ts, since server-only modules can't be imported into client code.

export interface Stroke {
	points: number[]; // flat [x0, y0, x1, y1, ...], each in [0, 1]
	color: string;
	width: number; // fraction of the page image's width
}
