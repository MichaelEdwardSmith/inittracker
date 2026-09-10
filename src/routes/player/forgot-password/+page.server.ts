// Server logic for /player/forgot-password.
// Always returns the same generic success message regardless of whether the email has an
// account, so this endpoint can't be used to enumerate registered player emails.
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createPlayerPasswordResetToken } from '$lib/server/playerModel';
import { sendMail, passwordResetEmail, appBaseUrl } from '$lib/server/mail';
import { checkRateLimit } from '$lib/server/rateLimit';

const GENERIC_MESSAGE = "If that email has an account, we've sent a password reset link.";

export const actions: Actions = {
	default: async ({ request, getClientAddress }) => {
		const data = await request.formData();
		const email = (data.get('email') as string)?.trim().toLowerCase();

		if (!email) {
			return fail(400, { error: 'Please enter your email address.' });
		}

		if (
			!checkRateLimit(`player-reset:email:${email}`, 3, 15 * 60 * 1000) ||
			!checkRateLimit(`player-reset:ip:${getClientAddress()}`, 10, 15 * 60 * 1000)
		) {
			return { success: true, message: GENERIC_MESSAGE };
		}

		const token = await createPlayerPasswordResetToken(email);
		if (token) {
			const { subject, html, text } = passwordResetEmail(
				`${appBaseUrl()}/player/reset-password/${token}`
			);
			await sendMail({ to: email, subject, html, text, tag: 'password-reset' });
		}

		return { success: true, message: GENERIC_MESSAGE };
	}
};
