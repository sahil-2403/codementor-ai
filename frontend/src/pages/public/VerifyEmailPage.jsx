import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import FormInput from '../../components/form/FormInput.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuth();
  const token = params.get('token');
  const sent = params.get('sent') === 'true';
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(token ? 'verifying' : 'idle');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;
    setStatus('verifying');
    verifyEmail({ token })
      .then(() => {
        if (!active) return;
        setStatus('success');
        setTimeout(() => navigate('/login?verified=true'), 1200);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        setStatus('error');
      });
    return () => { active = false; };
  }, [token, verifyEmail, navigate]);

  const resend = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await resendVerification({ email });
      setMessage('If this email needs verification, a new verification link has been sent.');
    } catch (err) {
      setError(err.message);
    }
  };

  return <div className="mx-auto max-w-md">
    <Card>
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-700"><MailCheck /></div>
      <h1 className="mt-4 text-3xl font-black text-slate-950">Verify your email</h1>
      {status === 'verifying' && <p className="mt-3 text-slate-600">Verifying your email link...</p>}
      {status === 'success' && <p className="mt-3 rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-700">Email verified successfully. Redirecting to login...</p>}
      {sent && !token && <p className="mt-3 rounded-2xl bg-indigo-50 p-4 text-sm font-semibold text-indigo-800">Check your email and click the verification link to activate your account.</p>}
      <ErrorMessage message={error} />
      {!token && <form onSubmit={resend} className="mt-5 space-y-4">
        <p className="text-sm text-slate-600">Didn’t receive the email? Enter your email to request a new verification link.</p>
        <FormInput label="Email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        {message && <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p>}
        <Button className="w-full" disabled={!email}>Resend verification link</Button>
      </form>}
      <div className="mt-5 flex items-center justify-between text-sm">
        <Link to="/login" className="font-bold text-slate-600">Back to login</Link>
        <Link to="/register" className="font-bold text-indigo-700">Create account</Link>
      </div>
    </Card>
  </div>;
}
