import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import FormInput from '../../components/form/FormInput.jsx';
import { authApi } from '../../api/authApi.js';
import { forgotPasswordSchema } from '../../validations/auth.schema.js';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });
  const submit = async (values) => {
    try {
      setMessage('');
      await authApi.forgotPassword(values);
      setMessage('If the email exists, a password reset link has been sent.');
    } catch (err) {
      setError('root', { message: err.message });
    }
  };
  return <div className="mx-auto max-w-md"><Card>
    <h1 className="text-3xl font-black">Reset your password</h1>
    <p className="mt-2 text-slate-600">Enter your account email and we’ll send a secure reset link.</p>
    <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-4">
      <ErrorMessage message={errors.root?.message} />
      <FormInput label="Email" registration={register('email')} error={errors.email?.message} placeholder="you@example.com" />
      {message && <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p>}
      <Button className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Sending link...' : 'Send reset link'}</Button>
    </form>
    <p className="mt-5 text-sm"><Link className="font-bold text-indigo-700" to="/login">Back to login</Link></p>
  </Card></div>;
}
