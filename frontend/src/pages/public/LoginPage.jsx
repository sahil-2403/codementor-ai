import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import AuthNotice from '../../components/auth/AuthNotice.jsx';
import AuthShell from '../../components/auth/AuthShell.jsx';
import FormInput from '../../components/form/FormInput.jsx';
import PasswordInput from '../../components/form/PasswordInput.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { loginFormSchema } from '../../validations/auth.schema.js';
import { onboardingApi } from '../../api/onboardingApi.js';

const demoMode = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const verified = params.get('verified') === 'true';
  const reset = params.get('reset') === 'true';
  const logoutMessage = location.state?.message || '';
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' }
  });

  const submit = async (values) => {
    try {
      const user = await login(values);
      if (user.role === 'admin') return navigate('/admin');
      const status = await onboardingApi.status();
      navigate(status?.nextPath || (status?.hasActiveCourse ? '/dashboard' : '/onboarding/goal'));
    } catch (err) {
      setError('root', { message: err.message });
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') {
      setValue('email', 'admin@codementor.ai');
      setValue('password', 'Admin@123');
    } else {
      setValue('email', 'learner@codementor.ai');
      setValue('password', 'Learner@123');
    }
  };

  return <AuthShell
    icon={LogIn}
    eyebrow="Welcome back"
    title="Continue your learning path"
    description="Log in with your verified CodeMentor AI account. We will return you to the correct onboarding or learning step."
    footer={<div className="flex flex-wrap items-center justify-between gap-3">
      <span>No account? <Link className="auth-link" to="/register">Create one</Link></span>
      <Link className="auth-link" to="/verify-email">Resend verification</Link>
    </div>}
  >
    <div className="space-y-3">
      {logoutMessage && <AuthNotice tone="success">{logoutMessage}</AuthNotice>}
      {verified && <AuthNotice tone="success">Email verified. You can now log in.</AuthNotice>}
      {reset && <AuthNotice tone="success">Password reset successfully. Log in with your new password.</AuthNotice>}
    </div>

    <form onSubmit={handleSubmit(submit)} className="mt-5 space-y-4">
      <ErrorMessage message={errors.root?.message} />
      <FormInput label="Email" type="email" autoComplete="email" registration={register('email')} error={errors.email?.message} placeholder="you@example.com" />
      <PasswordInput label="Password" registration={register('password')} error={errors.password?.message} placeholder="Your password" />
      <div className="flex justify-end text-sm"><Link className="auth-link" to="/forgot-password">Forgot password?</Link></div>
      <Button type="submit" className="w-full" isLoading={isSubmitting} loadingLabel="Logging in...">Login</Button>
    </form>

    {demoMode && <div className="mt-5 rounded-surface border border-border bg-surface-secondary p-4 text-sm text-muted-foreground">
      <p className="font-semibold text-foreground">Demo mode</p>
      <p className="mt-1 text-xs">Fill a seeded account without changing production authentication behavior.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => fillDemo('learner')}>Use demo learner</Button>
        <Button type="button" variant="secondary" onClick={() => fillDemo('admin')}>Use demo admin</Button>
      </div>
    </div>}
  </AuthShell>;
}
