import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;
let lastVerification = {
  checked: false,
  available: false,
  checkedAt: null,
  errorCode: null
};

const recipientDomain = (email = '') => {
  const [, domain = 'unknown'] = String(email).trim().toLowerCase().split('@');
  return domain || 'unknown';
};

const createTransporter = () => nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpSecure,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPassword
  },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000
});

export const getEmailTransporter = () => {
  if (!env.emailEnabled) return null;
  if (!transporter) transporter = createTransporter();
  return transporter;
};

export const getEmailTransportStatus = () => ({
  enabled: env.emailEnabled,
  ...lastVerification
});

export const verifyEmailTransport = async () => {
  if (!env.emailEnabled) {
    lastVerification = {
      checked: true,
      available: false,
      checkedAt: new Date(),
      errorCode: 'EMAIL_DISABLED'
    };
    return getEmailTransportStatus();
  }

  if (!env.emailVerifyConnection) {
    lastVerification = {
      checked: false,
      available: true,
      checkedAt: null,
      errorCode: null
    };
    return getEmailTransportStatus();
  }

  try {
    await getEmailTransporter().verify();
    lastVerification = {
      checked: true,
      available: true,
      checkedAt: new Date(),
      errorCode: null
    };
    console.log('SMTP connection verified.');
  } catch (error) {
    lastVerification = {
      checked: true,
      available: false,
      checkedAt: new Date(),
      errorCode: error?.code || 'SMTP_VERIFY_FAILED'
    };
    console.error('SMTP connection verification failed:', lastVerification.errorCode);
  }

  return getEmailTransportStatus();
};

export const sendEmail = async ({ to, subject, text, html, type }) => {
  if (!env.emailEnabled) {
    return {
      sent: false,
      mode: 'disabled',
      code: 'EMAIL_DELIVERY_UNAVAILABLE'
    };
  }

  try {
    const info = await getEmailTransporter().sendMail({
      from: {
        name: env.emailFromName,
        address: env.emailFromAddress
      },
      replyTo: env.emailReplyTo || undefined,
      to,
      subject,
      text,
      html
    });

    console.log('Transactional email sent.', {
      type,
      recipientDomain: recipientDomain(to),
      messageId: info.messageId
    });

    return {
      sent: true,
      mode: 'smtp',
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Transactional email delivery failed.', {
      type,
      recipientDomain: recipientDomain(to),
      code: error?.code || 'SMTP_SEND_FAILED'
    });

    return {
      sent: false,
      mode: 'smtp',
      code: 'EMAIL_DELIVERY_UNAVAILABLE'
    };
  }
};
