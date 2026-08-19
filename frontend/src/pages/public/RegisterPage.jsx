import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Input from '../../components/common/Input.jsx';
import AuthShell from '../../components/auth/AuthShell.jsx';
import PasswordInput from '../../components/form/PasswordInput.jsx';
import PasswordStrengthMeter from '../../components/form/PasswordStrengthMeter.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { registerFormSchema } from '../../validations/auth.schema.js';

export default function RegisterPage() {
  const { register: createAccount } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, setError } = useForm({
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

  return <AuthShell
    icon={UserPlus}
    eyebrow="Create account"
    title="Create your learning account"
    description="Verify your email before you log in and start your roadmap."
    footer={<span>Already have an account? <Link className="auth-link" to="/login">Log in</Link></span>}
  >
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <ErrorMessage message={errors.root?.message} />
      <Input label="Name" autoComplete="name" {...register('name')} error={errors.name?.message} placeholder="Sahil Pawar" />
      <Input label="Email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} placeholder="you@example.com" />
      <PasswordInput label="Password" registration={register('password')} error={errors.password?.message} placeholder="Strong password" autoComplete="new-password" />
      <PasswordInput label="Confirm password" registration={register('confirmPassword')} error={errors.confirmPassword?.message} placeholder="Repeat password" autoComplete="new-password" />
      <PasswordStrengthMeter value={password} />
      <Button type="submit" className="w-full" isLoading={isSubmitting} loadingLabel="Creating account...">Create account</Button>
    </form>
  </AuthShell>;
}
