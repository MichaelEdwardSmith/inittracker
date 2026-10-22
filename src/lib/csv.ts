// Tiny CSV helpers shared by the admin exports. Every cell is quoted, and cells that start
// with a formula character get a leading apostrophe: several exported values (generator names,
// voice transcripts, DM-chosen names) are user-supplied text a spreadsheet would otherwise run.
export function csvCell(value: string | number | null | undefined): string {
	const text = String(value ?? '');
	const safe = /^[=+@\t\r-]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text) ? `'${text}` : text;
	return `"${safe.replace(/"/g, '""')}"`;
}

export function csvRow(cells: (string | number | null | undefined)[]): string {
	return cells.map(csvCell).join(',');
}
