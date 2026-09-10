// Minimal in-memory rate limiter — same "plain Map, single-node" approach as sessionCache.ts.
// Good enough for a low-traffic self-hosted app; would need a shared store (Redis/Mongo) behind
// multiple server instances.
interface Bucket {
	count: number;
	windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Sweep stale buckets occasionally so this Map doesn't grow forever.
setInterval(
	() => {
		const now = Date.now();
		for (const [key, b] of buckets) {
			if (now - b.windowStart > 60 * 60 * 1000) buckets.delete(key);
		}
	},
	10 * 60 * 1000
).unref?.();

/**
 * Returns true if `key` is still within its allowance (and records this attempt), false if the
 * limit has been hit. `key` should combine the action with an identifier, e.g.
 * `password-reset:${email}` and `password-reset:${clientIp}`, checked separately.
 */
export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
	const now = Date.now();
	const existing = buckets.get(key);
	if (!existing || now - existing.windowStart > windowMs) {
		buckets.set(key, { count: 1, windowStart: now });
		return true;
	}
	if (existing.count >= maxAttempts) return false;
	existing.count++;
	return true;
}
