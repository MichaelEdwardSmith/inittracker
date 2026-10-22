// Shared (client + server) vocabulary for the per-DM usage log shown in /admin. The server
// only accepts features listed here, so the label map doubles as the allow-list for
// POST /api/activity.
export const ACTIVITY_LABELS = {
	'player-added': 'Added a player',
	'enemies-added': 'Added enemies',
	'combat-started': 'Started combat',
	'combat-ended': 'Ended combat',
	'voice-command': 'Used a voice command',
	'session-created': 'Created a game session',
	'custom-monster-saved': 'Saved a custom monster',
	'encounter-saved': 'Saved an encounter',
	'dice-roller': 'Opened Dice Roller',
	mixer: 'Opened Audio Mixer',
	encounters: 'Opened Encounter Builder',
	spells: 'Opened Spells',
	items: 'Opened Items',
	notes: 'Opened Session Notes',
	'quick-rules': 'Opened Quick Rules',
	generators: 'Opened Generators',
	generator: 'Used a generator',
	dungeon: 'Opened Dungeon Generator',
	donjon: 'Opened Donjon Dungeon',
	town: 'Opened Town Generator',
	inn: 'Opened Inn Generator',
	'liars-dice': "Opened Liar's Dice",
	poll: 'Opened Poll',
	'doc-share': 'Opened Document Share',
	'battle-map': 'Opened Battle Map',
	scheduling: 'Opened Scheduling',
	'chase-tracker': 'Opened Chase Tracker',
	'session-manager': 'Opened Session Manager',
	inbox: 'Opened Messages'
} as const;

export type ActivityFeature = keyof typeof ACTIVITY_LABELS;

export function isActivityFeature(value: unknown): value is ActivityFeature {
	return typeof value === 'string' && Object.hasOwn(ACTIVITY_LABELS, value);
}

export const ACTIVITY_DETAIL_MAX = 120;
