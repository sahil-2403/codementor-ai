const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const shouldLogLinks = () => process.env.ALLOW_DEV_EMAIL_LOG !== 'false' && process.env.NODE_ENV !== 'production';

export const sendVerificationEmail = async ({ email, token }) => {
  const link = `${clientUrl}/verify-email?token=${encodeURIComponent(token)}`;
  if (shouldLogLinks()) {
    console.log(`\n[CodeMentor AI email] Verify ${email}: ${link}\n`);
  }
  return { sent: true };
};

export const sendPasswordResetEmail = async ({ email, token }) => {
  const link = `${clientUrl}/reset-password?token=${encodeURIComponent(token)}`;
  if (shouldLogLinks()) {
    console.log(`\n[CodeMentor AI email] Reset password for ${email}: ${link}\n`);
  }
  return { sent: true };
};
