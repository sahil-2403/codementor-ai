import { env } from '../config/env.js';

const BREVO_EMAIL_API_URL = 'https://api.brevo.com/v3/smtp/email';
const EMAIL_REQUEST_TIMEOUT_MS = 15_000;

const recipientDomain = (email = '') => {
  const [, domain = 'unknown'] = String(email).trim().toLowerCase().split('@');
  return domain || 'unknown';
};

export const sendEmail = async ({ to, subject, text, html, type }) => {
  if (!env.emailEnabled) {
    return {
      sent: false,
      mode: 'disabled',
      code: 'EMAIL_DELIVERY_UNAVAILABLE'
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EMAIL_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(BREVO_EMAIL_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': env.brevoApiKey
      },
      body: JSON.stringify({
        sender: {
          name: env.emailFromName,
          email: env.emailFromAddress
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
        ...(env.emailReplyTo ? { replyTo: { email: env.emailReplyTo } } : {})
      }),
      signal: controller.signal
    });

    const responseBody = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(responseBody?.message || `Brevo request failed with status ${response.status}`);
    }

    console.log('Transactional email sent.', {
      type,
      recipientDomain: recipientDomain(to),
      messageId: responseBody?.messageId || null
    });

    return {
      sent: true,
      mode: 'brevo',
      messageId: responseBody?.messageId || null
    };
  } catch (error) {
    console.error('Transactional email delivery failed.', {
      type,
      recipientDomain: recipientDomain(to),
      code: error?.name === 'AbortError' ? 'BREVO_TIMEOUT' : 'BREVO_SEND_FAILED'
    });

    return {
      sent: false,
      mode: 'brevo',
      code: 'EMAIL_DELIVERY_UNAVAILABLE'
    };
  } finally {
    clearTimeout(timeoutId);
  }
};
