import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import PasswordInput from '../../components/form/PasswordInput.jsx';
import PasswordStrengthMeter from '../../components/form/PasswordStrengthMeter.jsx';
import { authApi } from '../../api/authApi.js';
import { resetPasswordFormSchema } from '../../validations/auth.schema.js';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: '', confirmPassword: '' }
  });
  const submit = async (values) => {
    try {
      await authApi.resetPassword({ token, password: values.password, confirmPassword: values.confirmPassword });
      navigate('/login?reset=true');
    } catch (err) {
      setError('root', { message: err.message });
    }
  };
  return <div className="mx-auto max-w-md"><Card>
    <h1 className="text-3xl font-black">Choose a new password</h1>
    <p className="mt-2 text-slate-600">Use a strong password you have not used before.</p>
    {!token && <ErrorMessage message="Reset token is missing. Please request a new password reset link." />}
    <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-4">
      <ErrorMessage message={errors.root?.message} />
      <PasswordInput label="New password" registration={register('password')} error={errors.password?.message} placeholder="New password" autoComplete="new-password" />
      <PasswordInput label="Confirm new password" registration={register('confirmPassword')} error={errors.confirmPassword?.message} placeholder="Repeat password" autoComplete="new-password" />
      <PasswordStrengthMeter value={watch('password') || ''} />
      <Button className="w-full" disabled={isSubmitting || !token}>{isSubmitting ? 'Resetting...' : 'Reset password'}</Button>
    </form>
    <p className="mt-5 text-sm"><Link className="font-bold text-indigo-700" to="/login">Back to login</Link></p>
  </Card></div>;
}
