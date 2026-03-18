// In-memory mixer track storage and state — keyed by game session public ID.
// Nothing is persisted; clears on server restart (same pattern as sessionStates).

export interface TrackEntry {
	id: string; // channel UUID
	name: string; // original filename
	mimeType: string;
	data: Uint8Array;
}

export interface MixerChannelState {
	id: string;
	playing: boolean;
	volume: number; // channel fader (0–1)
	muted: boolean;
	solo: boolean;
}

export interface MixerState {
	masterVolume: number;
	channels: MixerChannelState[];
}

// sessionId → Map<trackId, TrackEntry>
export const sessionTracks = new Map<string, Map<string, TrackEntry>>();

// sessionId → latest MixerState
export const sessionMixerStates = new Map<string, MixerState>();
