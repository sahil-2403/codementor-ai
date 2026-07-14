import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import FormInput from '../../components/form/FormInput.jsx';
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
      await createAccount(values);
      navigate('/verify-email?sent=true');
    } catch (err) {
      setError('root', { message: err.message });
    }
  };

  return <div className="mx-auto max-w-md">
    <Card>
      <h1 className="text-3xl font-black text-slate-950">Create your account</h1>
      <p className="mt-2 text-slate-600">Create a secure account, verify your email, then start your learning setup.</p>
      <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-4">
        <ErrorMessage message={errors.root?.message} />
        <FormInput label="Name" registration={register('name')} error={errors.name?.message} placeholder="Sahil Pawar" />
        <FormInput label="Email" registration={register('email')} error={errors.email?.message} placeholder="you@example.com" />
        <PasswordInput label="Password" registration={register('password')} error={errors.password?.message} placeholder="Strong password" autoComplete="new-password" />
        <PasswordInput label="Confirm password" registration={register('confirmPassword')} error={errors.confirmPassword?.message} placeholder="Repeat password" autoComplete="new-password" />
        <PasswordStrengthMeter value={password} />
        <Button className="w-full py-3" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : <>Create account <ArrowRight className="ml-2" size={18} /></>}</Button>
      </form>
      <p className="mt-5 text-sm text-slate-600">Already have an account? <Link className="font-bold text-indigo-700" to="/login">Login</Link></p>
    </Card>
  </div>;
}
