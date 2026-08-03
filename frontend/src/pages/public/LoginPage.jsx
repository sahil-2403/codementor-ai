import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
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
  const verified = new URLSearchParams(location.search).get('verified') === 'true';
  const reset = new URLSearchParams(location.search).get('reset') === 'true';
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

  return <div className="mx-auto max-w-md">
    <Card>
      <h1 className="text-3xl font-black">Welcome back</h1>
      <p className="mt-2 text-slate-600">Log in with your verified CodeMentor AI account.</p>
      {verified && <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700"><MailCheck className="mr-2 inline" size={18} />Email verified. You can now log in.</div>}
      {reset && <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">Password reset successfully. Please log in.</div>}
      <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-4">
        <ErrorMessage message={errors.root?.message} />
        <FormInput label="Email" registration={register('email')} error={errors.email?.message} placeholder="you@example.com" />
        <PasswordInput label="Password" registration={register('password')} error={errors.password?.message} placeholder="Your password" />
        <div className="flex justify-end text-sm"><Link className="font-bold text-indigo-700" to="/forgot-password">Forgot password?</Link></div>
        <Button className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Logging in...' : 'Login'}</Button>
      </form>
      <p className="mt-5 text-sm text-slate-600">No account? <Link className="font-bold text-indigo-700" to="/register">Create one</Link></p>
      {demoMode && <div className="mt-5 grid gap-2 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
        <p className="font-bold text-slate-900">Demo mode</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => fillDemo('learner')} className="rounded-full bg-white px-3 py-2 font-bold text-indigo-700">Use demo learner</button>
          <button type="button" onClick={() => fillDemo('admin')} className="rounded-full bg-white px-3 py-2 font-bold text-indigo-700">Use demo admin</button>
        </div>
      </div>}
    </Card>
  </div>;
}
