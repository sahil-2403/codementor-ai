import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Input from '../../components/common/Input.jsx';
import AuthNotice from '../../components/auth/AuthNotice.jsx';
import AuthShell from '../../components/auth/AuthShell.jsx';
import { authApi } from '../../api/authApi.js';
import { forgotPasswordSchema } from '../../validations/auth.schema.js';

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' }
  });

  const submit = async (values) => {
    try {
      setMessage('');
      await authApi.forgotPassword(values);
      setMessage('If an account exists for that email, a password reset link has been requested.');
    } catch (err) {
      setError('root', { message: err.message });
    }
  };

  return <AuthShell
    icon={KeyRound}
    eyebrow="Account recovery"
    title="Reset your password"
    description="Enter your account email. For privacy, the response is the same whether or not an account exists."
    footer={<Link className="auth-link" to="/login">Back to login</Link>}
  >
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <ErrorMessage message={errors.root?.message} />
      <Input label="Email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} placeholder="you@example.com" />
      {message && <AuthNotice tone="success">{message}</AuthNotice>}
      <Button type="submit" className="w-full" isLoading={isSubmitting} loadingLabel="Sending link...">Send reset link</Button>
    </form>
  </AuthShell>;
}
