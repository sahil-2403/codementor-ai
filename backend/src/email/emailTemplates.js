import { buildEmailLayout } from './emailLayout.js';

const recipientName = (name) => String(name || 'there').trim() || 'there';

export const buildVerificationEmail = ({ name, verificationUrl }) => {
  const greeting = `Hi ${recipientName(name)},`;
  const subject = 'Finish setting up your CodeMentor AI account';
  const message = 'Thanks for joining CodeMentor AI. Confirm your email to activate your account and start building your learning roadmap.';

  return {
    subject,
    text: [
      greeting,
      '',
      message,
      '',
      `Confirm your email: ${verificationUrl}`,
      '',
      'This secure link expires in 24 hours.',
      'If you did not create this account, you can safely ignore this email.'
    ].join('\n'),
    html: buildEmailLayout({
      preheader: 'Confirm your email to activate your CodeMentor AI account.',
      title: 'Confirm your email to get started',
      greeting,
      message,
      actionLabel: 'Confirm my email',
      actionUrl: verificationUrl,
      noticeTitle: 'This secure link expires in 24 hours.',
      noticeText: 'Use it to activate this account before starting your learning roadmap.',
      closingText: 'If you did not create this account, you can safely ignore this email.'
    })
  };
};

export const buildPasswordResetEmail = ({ name, resetUrl }) => {
  const greeting = `Hi ${recipientName(name)},`;
  const subject = 'Reset your CodeMentor AI password';
  const message = 'We received a request to reset the password for your CodeMentor AI account. Use the secure button below to choose a new password.';

  return {
    subject,
    text: [
      greeting,
      '',
      message,
      '',
      `Reset your password: ${resetUrl}`,
      '',
      'This secure link expires in 15 minutes.',
      'If you did not request this change, you can safely ignore this email.'
    ].join('\n'),
    html: buildEmailLayout({
      preheader: 'Use this secure link to reset your CodeMentor AI password.',
      title: 'Reset your password',
      greeting,
      message,
      actionLabel: 'Reset password',
      actionUrl: resetUrl,
      noticeTitle: 'This secure link expires in 15 minutes.',
      noticeText: 'For your security, only use the link from this email to reset your password.',
      closingText: 'If you did not request this change, you can safely ignore this email.'
    })
  };
};
