// POST /api/resend-verification — sends a fresh verify-email link to whichever account (DM or
// Player) the caller is logged in as. Backs the "Resend email" button on the nag banner in the
// root layout. Rate-limited per session so the button can't be used to spam a mailbox.
import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getDMBySessionId, createEmailVerificationToken } from '$lib/server/dmModel';
import { getPlayerBySessionId, createPlayerEmailVerificationToken } from '$lib/server/playerModel';
import { sendMail, verifyEmailEmail, appBaseUrl } from '$lib/server/mail';
import { checkRateLimit } from '$lib/server/rateLimit';

export async function POST({ cookies }: RequestEvent) {
	const dmSessionId = cookies.get('dm_auth');
	if (dmSessionId) {
		const dm = await getDMBySessionId(dmSessionId);
		if (!dm) throw error(404, 'Account not found');
		if (!dm.email) throw error(400, 'No email on file for this account');
		if (dm.emailVerified) return json({ ok: true, alreadyVerified: true });
		if (!checkRateLimit(`resend-verify:${dmSessionId}`, 3, 15 * 60 * 1000)) {
			throw error(429, 'Too many requests — try again later');
		}

		const token = await createEmailVerificationToken(dmSessionId);
		if (token) {
			const { subject, html, text } = verifyEmailEmail(`${appBaseUrl()}/verify-email/${token}`);
			await sendMail({ to: dm.email, subject, html, text, tag: 'email-verify' });
		}
		return json({ ok: true });
	}

	const playerSessionId = cookies.get('player_auth');
	if (playerSessionId) {
		const player = await getPlayerBySessionId(playerSessionId);
		if (!player) throw error(404, 'Account not found');
		if (!player.email) throw error(400, 'No email on file for this account');
		if (player.emailVerified) return json({ ok: true, alreadyVerified: true });
		if (!checkRateLimit(`resend-verify:${playerSessionId}`, 3, 15 * 60 * 1000)) {
			throw error(429, 'Too many requests — try again later');
		}

		const token = await createPlayerEmailVerificationToken(playerSessionId);
		if (token) {
			const { subject, html, text } = verifyEmailEmail(
				`${appBaseUrl()}/player/verify-email/${token}`
			);
			await sendMail({ to: player.email, subject, html, text, tag: 'email-verify' });
		}
		return json({ ok: true });
	}

	throw error(401, 'Not signed in');
}
