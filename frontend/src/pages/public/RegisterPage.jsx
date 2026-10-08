import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Input from '../../components/common/Input.jsx';
import AuthShell from '../../components/auth/AuthShell.jsx';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton.jsx';
import PasswordInput from '../../components/form/PasswordInput.jsx';
import PasswordStrengthMeter from '../../components/form/PasswordStrengthMeter.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { registerFormSchema } from '../../validations/auth.schema.js';

export default function RegisterPage() {
  const { register: createAccount, googleRegister } = useAuth();
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register, handleSubmit, watch, clearErrors, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' }
  });
  const password = watch('password') || '';

  const submit = async (values) => {
    try {
      const result = await createAccount(values);
      navigate('/verify-email', {
        state: {
          registration: {
            email: values.email,
            emailSent: Boolean(result?.emailSent),
            deliveryMode: result?.deliveryMode || 'unknown'
          }
        }
      });
    } catch (err) {
      setError('root', { message: err.message });
    }
  };

  const handleGoogleCredential = async (credential) => {
    try {
      setGoogleLoading(true);
      clearErrors('root');
      await googleRegister(credential);
      navigate('/onboarding/catalog', { replace: true });
    } catch (err) {
      setError('root', { message: err.message || 'Could not create your account with Google.' });
    } finally {
      setGoogleLoading(false);
    }
  };

  return <AuthShell
    icon={UserPlus}
    eyebrow="Create account"
    title="Create your learning account"
    description="Create an account and start building your learning roadmap."
    footer={<span>Already have an account? <Link className="auth-link" to="/login">Log in</Link></span>}
  >
    <ErrorMessage message={errors.root?.message} />

    <GoogleAuthButton
      text="signup_with"
      onCredential={handleGoogleCredential}
      disabled={isSubmitting || googleLoading}
    />
    {googleLoading && <p className="mt-2 text-center text-xs font-medium text-muted-foreground">Creating your account with Google...</p>}

    <div className="my-4 flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs font-semibold text-muted-foreground">or continue with email</span>
      <span className="h-px flex-1 bg-border" />
    </div>

    <form onSubmit={handleSubmit(submit)} className="space-y-3">
      <Input label="Name" className="py-2.5" autoComplete="name" {...register('name')} error={errors.name?.message} placeholder="Your name" />
      <Input label="Email" className="py-2.5" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} placeholder="you@example.com" />
      <PasswordInput compact label="Password" registration={register('password')} error={errors.password?.message} placeholder="Strong password" autoComplete="new-password" />
      <PasswordInput compact label="Confirm password" registration={register('confirmPassword')} error={errors.confirmPassword?.message} placeholder="Repeat password" autoComplete="new-password" />
      <PasswordStrengthMeter value={password} compact />
      <Button type="submit" className="w-full" isLoading={isSubmitting} loadingLabel="Creating account..." disabled={googleLoading}>Create account</Button>
    </form>
  </AuthShell>;
}