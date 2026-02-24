import type { WithId, Document } from 'mongodb';
import { getDb } from './db';
import type { StorageState, CustomMonster } from '$lib/types';

export interface DM {
	firstName: string;
	lastName: string;
	email: string;
	passwordHash: string;
	sessionId: string;
	combatState: StorageState;
	customMonsters: CustomMonster[];
	createdAt: Date;
}

// 6 chars from an unambiguous alphabet (no O/0/I/1 confusion)
const SESSION_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSessionId(): string {
	return Array.from(
		{ length: 6 },
		() => SESSION_CHARS[Math.floor(Math.random() * SESSION_CHARS.length)]
	).join('');
}

async function col() {
	const db = await getDb();
	return db.collection<DM>('dms');
}

export type CreateDMResult = { sessionId: string } | { error: string };

export async function createDM(
	firstName: string,
	lastName: string,
	email: string,
	password: string
): Promise<CreateDMResult> {
	const c = await col();

	if (await c.findOne({ email })) {
		return { error: 'An account with that email already exists.' };
	}

	// Generate a sessionId that doesn't already exist
	let sessionId: string;
	do {
		sessionId = randomSessionId();
	} while (await c.findOne({ sessionId }));

	await c.insertOne({
		firstName,
		lastName,
		email,
		passwordHash: password,
		sessionId,
		combatState: { combatants: [], currentTurnId: null, round: 1 },
		customMonsters: [],
		createdAt: new Date()
	});

	return { sessionId };
}

export async function loginDM(
	email: string,
	password: string
): Promise<(WithId<Document> & DM) | null> {
	const c = await col();
	const dm = await c.findOne({ email });
	if (!dm) return null;
	const valid = password === dm.passwordHash;
	return valid ? (dm as unknown as WithId<Document> & DM) : null;
}

export async function getDMBySessionId(
	sessionId: string
): Promise<(WithId<Document> & DM) | null> {
	const c = await col();
	return (await c.findOne({ sessionId })) as unknown as (WithId<Document> & DM) | null;
}

export async function saveCombatState(sessionId: string, state: StorageState): Promise<void> {
	const c = await col();
	await c.updateOne({ sessionId }, { $set: { combatState: state } });
}

export async function getCombatState(sessionId: string): Promise<StorageState> {
	const c = await col();
	const dm = await c.findOne({ sessionId });
	return (dm?.combatState as StorageState) ?? { combatants: [], currentTurnId: null, round: 1 };
}

export async function getCustomMonsters(sessionId: string): Promise<CustomMonster[]> {
	const c = await col();
	const dm = await c.findOne({ sessionId });
	return (dm?.customMonsters as CustomMonster[]) ?? [];
}

export async function addCustomMonster(
	sessionId: string,
	monster: CustomMonster
): Promise<void> {
	const c = await col();
	await c.updateOne({ sessionId }, { $push: { customMonsters: monster } as never });
}

export async function updateCustomMonster(
	sessionId: string,
	id: string,
	updates: Omit<CustomMonster, 'id'>
): Promise<void> {
	const c = await col();
	await c.updateOne(
		{ sessionId, 'customMonsters.id': id },
		{
			$set: {
				'customMonsters.$.name': updates.name,
				'customMonsters.$.ac': updates.ac,
				'customMonsters.$.hp': updates.hp,
				'customMonsters.$.cr': updates.cr,
				'customMonsters.$.monsterType': updates.monsterType
			}
		}
	);
}

export async function deleteCustomMonster(sessionId: string, id: string): Promise<void> {
	const c = await col();
	await c.updateOne({ sessionId }, { $pull: { customMonsters: { id } } as never });
}
