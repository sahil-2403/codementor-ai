import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import AuthNotice from '../../components/auth/AuthNotice.jsx';
import AuthShell from '../../components/auth/AuthShell.jsx';
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
      navigate('/login?reset=true', { replace: true });
    } catch (err) {
      setError('root', { message: err.message });
    }
  };

  return <AuthShell
    icon={ShieldCheck}
    eyebrow="Password reset"
    title="Choose a new password"
    description="Choose a strong password you have not used before. You will need to log in again on your devices."
    footer={<Link className="auth-link" to="/login">Back to login</Link>}
  >
    {!token && <AuthNotice tone="warning" className="mb-4">
      This reset link is missing or incomplete. <Link className="font-semibold underline" to="/forgot-password">Request a new reset link</Link>.
    </AuthNotice>}
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <ErrorMessage message={errors.root?.message} />
      <PasswordInput label="New password" registration={register('password')} error={errors.password?.message} placeholder="New password" autoComplete="new-password" />
      <PasswordInput label="Confirm new password" registration={register('confirmPassword')} error={errors.confirmPassword?.message} placeholder="Repeat password" autoComplete="new-password" />
      <PasswordStrengthMeter value={watch('password') || ''} />
      <Button type="submit" className="w-full" disabled={!token} isLoading={isSubmitting} loadingLabel="Resetting password...">Reset password</Button>
    </form>
  </AuthShell>;
}
