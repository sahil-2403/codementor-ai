const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const emailLayout = ({ previewText, heading, body, actionLabel, actionUrl, expiryText }) => {
  const safeHeading = escapeHtml(heading);
  const safeBody = escapeHtml(body);
  const safeActionLabel = escapeHtml(actionLabel);
  const safeActionUrl = escapeHtml(actionUrl);
  const safeExpiry = escapeHtml(expiryText);
  const safePreview = escapeHtml(previewText);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeHeading}</title>
  </head>
  <body style="margin:0;background:#f7f8fa;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreview}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7f8fa;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e7ec;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid #e4e7ec;font-size:18px;font-weight:700;">CodeMentor AI</td>
            </tr>
            <tr>
              <td style="padding:32px 28px;">
                <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">${safeHeading}</h1>
                <p style="margin:0 0 24px;color:#475467;font-size:15px;line-height:1.7;">${safeBody}</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="border-radius:8px;background:#635bff;">
                      <a href="${safeActionUrl}" style="display:inline-block;padding:12px 18px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">${safeActionLabel}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 8px;color:#667085;font-size:13px;line-height:1.6;">${safeExpiry}</p>
                <p style="margin:0;color:#667085;font-size:13px;line-height:1.6;word-break:break-all;">If the button does not work, copy this link:<br />${safeActionUrl}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

export const buildVerificationEmail = ({ name, verificationUrl }) => {
  const greetingName = String(name || 'there').trim();
  const subject = 'Verify your CodeMentor AI account';
  const body = `Hi ${greetingName}, verify your email address to activate your account and begin onboarding.`;

  return {
    subject,
    text: `${body}\n\nVerify your account: ${verificationUrl}\n\nThis link expires in 24 hours. If you did not create this account, you can ignore this email.`,
    html: emailLayout({
      previewText: 'Verify your email address to activate your CodeMentor AI account.',
      heading: 'Verify your email address',
      body,
      actionLabel: 'Verify account',
      actionUrl: verificationUrl,
      expiryText: 'This link expires in 24 hours. If you did not create this account, you can ignore this email.'
    })
  };
};

export const buildPasswordResetEmail = ({ name, resetUrl }) => {
  const greetingName = String(name || 'there').trim();
  const subject = 'Reset your CodeMentor AI password';
  const body = `Hi ${greetingName}, we received a request to reset the password for your account.`;

  return {
    subject,
    text: `${body}\n\nReset your password: ${resetUrl}\n\nThis link expires in 15 minutes. If you did not request a password reset, you can ignore this email.`,
    html: emailLayout({
      previewText: 'Use this secure link to reset your CodeMentor AI password.',
      heading: 'Reset your password',
      body,
      actionLabel: 'Reset password',
      actionUrl: resetUrl,
      expiryText: 'This link expires in 15 minutes. If you did not request a password reset, you can ignore this email.'
    })
  };
};
