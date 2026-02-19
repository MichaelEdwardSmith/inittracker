import type { RequestHandler } from './$types';
import type { StorageState } from '$lib/types';

// ---------------------------------------------------------------------------
// In-memory state shared across all requests in this server process.
// Resets if the server restarts, which is intentional for a session-based tool.
// ---------------------------------------------------------------------------

let serverState: StorageState = { combatants: [], currentTurnId: null, round: 1 };

// Each connected SSE client registers a controller here so we can push to them.
const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();
const encoder = new TextEncoder();

function broadcast(state: StorageState) {
	const msg = encoder.encode(`data: ${JSON.stringify(state)}\n\n`);
	for (const ctrl of clients) {
		try {
			ctrl.enqueue(msg);
		} catch {
			// Client already closed — remove it so we stop trying.
			clients.delete(ctrl);
		}
	}
}

// ---------------------------------------------------------------------------
// POST /api/state  — DM screen pushes updated combat state here.
// ---------------------------------------------------------------------------
export const POST: RequestHandler = async ({ request }) => {
	serverState = (await request.json()) as StorageState;
	broadcast(serverState);
	return new Response(null, { status: 204 });
};

// ---------------------------------------------------------------------------
// GET /api/state
//   • Accept: text/event-stream  → SSE stream (Player Display subscribes here)
//   • Any other Accept           → plain JSON snapshot (DM screen loads on refresh)
// ---------------------------------------------------------------------------
export const GET: RequestHandler = ({ request }) => {
	const wantsStream = (request.headers.get('accept') ?? '').includes('text/event-stream');

	if (!wantsStream) {
		return Response.json(serverState);
	}

	// Keep references in closure so the cancel callback can clean up.
	let ctrl: ReadableStreamDefaultController<Uint8Array>;
	let keepAlive: ReturnType<typeof setInterval>;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			ctrl = controller;
			clients.add(ctrl);

			// Immediately send the current state so the display isn't blank on connect.
			ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(serverState)}\n\n`));

			// Send a comment-line ping every 25 s to keep proxies from closing the connection.
			keepAlive = setInterval(() => {
				try {
					ctrl.enqueue(encoder.encode(': ping\n\n'));
				} catch {
					clearInterval(keepAlive);
					clients.delete(ctrl);
				}
			}, 25_000);
		},
		cancel() {
			clearInterval(keepAlive);
			clients.delete(ctrl);
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			// Tell nginx / Caddy not to buffer the stream.
			'X-Accel-Buffering': 'no'
		}
	});
};
