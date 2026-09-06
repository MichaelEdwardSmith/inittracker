// Parses a "MorePurpleMoreBetter" (MPMB) fillable D&D 5e character sheet PDF and extracts the
// fields the Initiative Tracker cares about. MPMB sheets are AcroForm PDFs with stable,
// human-readable field names across versions (confirmed against v13.1.0 through the v14.0.8-beta
// blank template), so we read named fields directly rather than trying to parse rendered text.
//
// No Svelte dependency — safe to call from a plain file-input handler.

import { PDFDocument, type PDFForm } from 'pdf-lib';

export interface MpmbCharacter {
	name: string;
	level: number;
	ac: number;
	maxHp: number;
	currentHp: number;
	dexMod: number;
	passivePerception: number;
	race?: string;
	classes?: string;
	/** Field names we expected but couldn't read (missing, blank, or non-numeric) — shown to
	 *  the DM so they know which values fell back to a default and may need a manual fix. */
	missingFields: string[];
}

function readText(form: PDFForm, name: string, missing: string[]): string {
	try {
		const field = form.getTextField(name);
		const text = field.getText();
		if (text && text.trim()) return text.trim();
	} catch {
		// field doesn't exist or isn't a text field — fall through
	}
	missing.push(name);
	return '';
}

function readNumber(form: PDFForm, name: string, fallback: number, missing: string[]): number {
	const text = readText(form, name, missing);
	if (!text) return fallback;
	const n = parseInt(text.replace(/[^\d-]/g, ''), 10);
	if (Number.isNaN(n)) {
		if (!missing.includes(name)) missing.push(name);
		return fallback;
	}
	return n;
}

function readDropdown(form: PDFForm, name: string): string | undefined {
	try {
		const field = form.getDropdown(name);
		const selected = field.getSelected();
		const value = selected?.[0]?.trim();
		return value || undefined;
	} catch {
		return undefined;
	}
}

/** Throws a plain Error with a DM-friendly message when the file isn't a usable MPMB sheet. */
export async function parseMpmbSheet(bytes: ArrayBuffer): Promise<MpmbCharacter> {
	let pdf;
	try {
		pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
	} catch {
		throw new Error("Couldn't read that file — make sure it's a valid PDF.");
	}

	const form = pdf.getForm();
	const fieldCount = form.getFields().length;
	if (fieldCount === 0) {
		throw new Error(
			"This PDF has no fillable form fields, so it can't be a MorePurpleMoreBetter sheet " +
				'(or it was flattened/printed to a flat PDF). Upload the original fillable character sheet.'
		);
	}

	const missingFields: string[] = [];
	const name = readText(form, 'PC Name', missingFields);
	if (!name) {
		throw new Error(
			"Couldn't find a character name in this PDF — it doesn't look like a MorePurpleMoreBetter sheet."
		);
	}

	const maxHp = readNumber(form, 'HP Max', 10, missingFields);
	// "HP Current" is often left blank on a reference sheet (current HP is tracked live
	// elsewhere) — default to full health rather than flagging it as missing.
	let currentHp = maxHp;
	try {
		const text = form.getTextField('HP Current').getText()?.trim();
		if (text) {
			const n = parseInt(text.replace(/[^\d-]/g, ''), 10);
			if (!Number.isNaN(n)) currentHp = n;
		}
	} catch {
		// no HP Current field at all — keep the maxHp default, not worth flagging
	}

	return {
		name,
		level: readNumber(form, 'Character Level', 1, missingFields),
		ac: readNumber(form, 'AC', 10, missingFields),
		maxHp,
		currentHp,
		dexMod: readNumber(form, 'Dex Mod', 0, missingFields),
		passivePerception: readNumber(form, 'Passive Perception', 10, missingFields),
		race: readDropdown(form, 'Race'),
		classes: readText(form, 'Class and Levels', []) || undefined,
		missingFields
	};
}
