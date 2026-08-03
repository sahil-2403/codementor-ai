import { env } from '../config/env.js';
import { sendEmail } from '../email/emailTransport.js';
import { buildPasswordResetEmail, buildVerificationEmail } from '../email/emailTemplates.js';

const buildClientUrl = (path, token) => {
  const url = new URL(path, env.clientUrl);
  url.searchParams.set('token', token);
  return url.toString();
};

const logDevelopmentLink = ({ type, email, link }) => {
  if (!env.allowDevEmailLog || env.isProduction) return false;
  console.log(`\n[CodeMentor AI development email] ${type} for ${email}: ${link}\n`);
  return true;
};

const disabledDelivery = ({ type, email, link }) => ({
  sent: false,
  mode: logDevelopmentLink({ type, email, link }) ? 'development_link' : 'disabled',
  code: 'EMAIL_DELIVERY_UNAVAILABLE'
});

export const sendVerificationEmail = async ({ email, token, name }) => {
  const verificationUrl = buildClientUrl('/verify-email', token);

  if (!env.emailEnabled) {
    return disabledDelivery({ type: 'Verify account', email, link: verificationUrl });
  }

  const message = buildVerificationEmail({ name, verificationUrl });
  return sendEmail({
    to: email,
    type: 'account_verification',
    ...message
  });
};

export const sendPasswordResetEmail = async ({ email, token, name }) => {
  const resetUrl = buildClientUrl('/reset-password', token);

  if (!env.emailEnabled) {
    return disabledDelivery({ type: 'Reset password', email, link: resetUrl });
  }

  const message = buildPasswordResetEmail({ name, resetUrl });
  return sendEmail({
    to: email,
    type: 'password_reset',
    ...message
  });
};
