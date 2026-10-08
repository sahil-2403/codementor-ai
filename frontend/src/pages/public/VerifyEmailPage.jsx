import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Input from '../../components/common/Input.jsx';
import AuthNotice from '../../components/auth/AuthNotice.jsx';
import AuthShell from '../../components/auth/AuthShell.jsx';
import { useAuth } from '../../hooks/useAuth.js';

const registrationNotice = ({ emailSent, deliveryMode }) => {
  if (emailSent) return { tone: 'success', text: 'Account created. Check your inbox and open the verification link before logging in.' };
  if (deliveryMode === 'development_link') return { tone: 'info', text: 'Account created. Email delivery is disabled in this development environment; use the verification link provided in the server log.' };
  return { tone: 'warning', text: 'Account created, but the verification email could not be delivered. You can request another link below.' };
};

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuth();
  const token = params.get('token');
  const legacySent = params.get('sent') === 'true';
  const registration = location.state?.registration;
  const initialNotice = registration ? registrationNotice(registration) : legacySent ? registrationNotice({ emailSent: true }) : null;
  const [email, setEmail] = useState(registration?.email || '');
  const [status, setStatus] = useState(token ? 'verifying' : 'idle');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) return undefined;

    let active = true;
    let redirectTimer;
    setStatus('verifying');
    setError('');

    verifyEmail({ token })
      .then(() => {
        if (!active) return;
        setStatus('success');
        redirectTimer = window.setTimeout(() => navigate('/login?verified=true', { replace: true }), 1400);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        setStatus('error');
      });

    return () => {
      active = false;
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [token, verifyEmail, navigate]);

  const resend = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      setIsResending(true);
      await resendVerification({ email });
      setMessage('If this email still needs verification, a new verification link has been requested.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsResending(false);
    }
  };

  const canResend = !token || status === 'error';

  return <AuthShell
    icon={MailCheck}
    eyebrow="Email verification"
    title="Verify your email"
    description="Verification protects your learner progress and must be completed before login."
    footer={<div className="flex flex-wrap items-center justify-between gap-3">
      <Link to="/login" className="auth-link">Back to login</Link>
      <Link to="/register" className="auth-link">Create account</Link>
    </div>}
  >
    <div className="space-y-3">
      {initialNotice && !token && <AuthNotice tone={initialNotice.tone}>{initialNotice.text}</AuthNotice>}
      {status === 'verifying' && <AuthNotice>Verifying your email link…</AuthNotice>}
      {status === 'success' && <AuthNotice tone="success">Email verified successfully. Redirecting to login…</AuthNotice>}
      <ErrorMessage message={error} />
    </div>

    {canResend && <form onSubmit={resend} className="mt-5 space-y-4">
      <p className="text-sm leading-6 text-muted-foreground">Enter your email to request a new link. The response does not reveal whether the account exists.</p>
      <Input label="Email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
      {message && <AuthNotice tone="success">{message}</AuthNotice>}
      <Button type="submit" className="w-full" disabled={!email.trim()} isLoading={isResending} loadingLabel="Sending link...">Resend verification link</Button>
    </form>}

    {status === 'success' && <Link to="/login?verified=true" replace className="ui-button ui-button--secondary mt-5 w-full">Continue to login</Link>}
  </AuthShell>;
}
