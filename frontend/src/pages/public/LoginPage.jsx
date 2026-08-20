import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Input from '../../components/common/Input.jsx';
import AuthNotice from '../../components/auth/AuthNotice.jsx';
import AuthShell from '../../components/auth/AuthShell.jsx';
import PasswordInput from '../../components/form/PasswordInput.jsx';
import { authApi } from '../../api/authApi.js';
import { onboardingApi } from '../../api/onboardingApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import { loginFormSchema } from '../../validations/auth.schema.js';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const verified = params.get('verified') === 'true';
  const reset = params.get('reset') === 'true';
  const logoutMessage = location.state?.message || '';
  const [demoLoading, setDemoLoading] = useState(false);
  const { register, handleSubmit, setValue, clearErrors, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' }
  });

  const submit = async (values) => {
    try {
      const user = await login(values);
      if (user.role === 'admin') return navigate('/admin');
      const status = await onboardingApi.status();
      navigate(status?.nextPath || (status?.hasActiveCourse ? '/dashboard' : '/onboarding/catalog'));
    } catch (err) {
      setError('root', { message: err.message });
    }
  };

  const fillFreshDemoAccount = async () => {
    try {
      setDemoLoading(true);
      clearErrors('root');
      const result = await authApi.demoAccount();
      const credentials = result?.credentials;
      if (!credentials?.email || !credentials?.password) throw new Error('Could not prepare a demo account.');

      setValue('email', credentials.email, { shouldDirty: true, shouldValidate: true });
      setValue('password', credentials.password, { shouldDirty: true, shouldValidate: true });
    } catch (err) {
      setError('root', { message: err.message || 'Could not prepare a demo account.' });
    } finally {
      setDemoLoading(false);
    }
  };

  return <AuthShell
    icon={LogIn}
    eyebrow="Welcome back"
    title="Continue your learning path"
    description="Log in to continue from your current course or onboarding step."
    footer={<div className="flex flex-wrap items-center justify-between gap-2">
      <span>No account? <Link className="auth-link" to="/register">Create one</Link></span>
      <Link className="auth-link" to="/verify-email">Resend verification</Link>
    </div>}
  >
    <div className="space-y-2">
      {logoutMessage && <AuthNotice tone="success">{logoutMessage}</AuthNotice>}
      {verified && <AuthNotice tone="success">Email verified. You can now log in.</AuthNotice>}
      {reset && <AuthNotice tone="success">Password reset successfully. Log in with your new password.</AuthNotice>}
    </div>

    <form onSubmit={handleSubmit(submit)} className="mt-4 space-y-3">
      <ErrorMessage message={errors.root?.message} />
      <Input label="Email" className="py-2.5" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} placeholder="you@example.com" />
      <PasswordInput compact label="Password" registration={register('password')} error={errors.password?.message} placeholder="Your password" />
      <div className="flex justify-end text-sm"><Link className="auth-link" to="/forgot-password">Forgot password?</Link></div>
      <Button type="submit" className="w-full" isLoading={isSubmitting} loadingLabel="Logging in...">Login</Button>
    </form>

    <div className="mt-4 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
      <span className="text-xs font-semibold text-muted-foreground">Login as a demo account</span>
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
    </div>
    <Button
      type="button"
      variant="secondary"
      className="mt-3 w-full"
      onClick={fillFreshDemoAccount}
      isLoading={demoLoading}
      loadingLabel="Preparing demo..."
      disabled={isSubmitting}
    >
      Use fresh demo account
    </Button>
  </AuthShell>;
}
