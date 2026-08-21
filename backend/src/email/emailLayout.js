import { env } from '../config/env.js';

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const getBrandLogoUrl = () => new URL('/codementor-email-logo.png', env.clientUrl).toString();

export const buildEmailLayout = ({
  preheader,
  title,
  greeting,
  message,
  actionLabel,
  actionUrl,
  noticeTitle,
  noticeText,
  closingText = ''
}) => {
  const safePreheader = escapeHtml(preheader);
  const safeTitle = escapeHtml(title);
  const safeGreeting = escapeHtml(greeting);
  const safeMessage = escapeHtml(message);
  const safeActionLabel = escapeHtml(actionLabel);
  const safeActionUrl = escapeHtml(actionUrl);
  const safeNoticeTitle = escapeHtml(noticeTitle);
  const safeNoticeText = escapeHtml(noticeText);
  const safeClosingText = escapeHtml(closingText);
  const safeLogoUrl = escapeHtml(getBrandLogoUrl());

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${safeTitle}</title>
    <style>
      @media only screen and (max-width: 620px) {
        .email-shell { padding: 16px 8px !important; }
        .email-header { padding: 22px 20px !important; }
        .email-content { padding: 26px 20px !important; }
        .email-footer { padding: 18px 20px !important; }
        .email-title { font-size: 22px !important; line-height: 29px !important; }
        .brand-logo { width: 205px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f7f8fa;color:#111827;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">${safePreheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f7f8fa;">
      <tr>
        <td align="center" class="email-shell" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:580px;background:#ffffff;border:1px solid #e4e7ec;border-top:4px solid #635bff;border-radius:14px;overflow:hidden;">
            <tr>
              <td align="center" class="email-header" style="padding:24px 28px;border-bottom:1px solid #e4e7ec;background:#ffffff;">
                <img src="${safeLogoUrl}" alt="CodeMentor AI" width="220" class="brand-logo" style="display:block;width:220px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;" />
              </td>
            </tr>
            <tr>
              <td class="email-content" style="padding:32px 36px;">
                <h1 class="email-title" style="margin:0;text-align:center;color:#111827;font-size:24px;line-height:32px;font-weight:700;letter-spacing:-0.4px;">${safeTitle}</h1>
                <div style="margin-top:26px;">
                  <p style="margin:0;color:#111827;font-size:15px;line-height:24px;font-weight:700;">${safeGreeting}</p>
                  <p style="margin:8px 0 0;color:#475467;font-size:15px;line-height:25px;">${safeMessage}</p>
                </div>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:26px;">
                  <tr>
                    <td align="center" bgcolor="#635bff" style="background:#635bff;border-radius:9px;">
                      <a href="${safeActionUrl}" target="_blank" style="display:block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:15px;line-height:22px;font-weight:700;border-radius:9px;">${safeActionLabel}</a>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:22px;background:#eef0ff;border:1px solid #d9dcff;border-radius:10px;">
                  <tr>
                    <td valign="top" style="padding:15px 16px;">
                      <p style="margin:0;color:#4c44e6;font-size:13px;line-height:20px;font-weight:700;">${safeNoticeTitle}</p>
                      <p style="margin:3px 0 0;color:#475467;font-size:13px;line-height:20px;">${safeNoticeText}</p>
                    </td>
                  </tr>
                </table>

                ${safeClosingText ? `<p style="margin:22px 0 0;color:#475467;font-size:13px;line-height:21px;">${safeClosingText}</p>` : ''}

                <p style="margin:26px 0 8px;color:#667085;font-size:12px;line-height:19px;text-align:center;">If the button does not work, copy and paste this link into your browser:</p>
                <div style="padding:11px 12px;background:#f7f8fa;border:1px solid #e4e7ec;border-radius:8px;">
                  <a href="${safeActionUrl}" target="_blank" style="color:#4c44e6;font-size:12px;line-height:19px;text-decoration:none;word-break:break-all;">${safeActionUrl}</a>
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" class="email-footer" style="padding:20px 28px;background:#f7f8fa;border-top:1px solid #e4e7ec;">
                <p style="margin:0;color:#475467;font-size:12px;line-height:18px;font-weight:700;">Automated message from CodeMentor AI</p>
                <p style="margin:2px 0 0;color:#667085;font-size:12px;line-height:18px;">Please do not reply to this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
