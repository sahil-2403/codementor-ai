import { useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { authApi } from '../../api/authApi.js';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const logoutAll = async () => {
    try {
      setError('');
      await authApi.logoutAll();
      setMessage('You have been signed out from all devices. Please log in again.');
      await logout();
    } catch (err) {
      setError(err.message);
    }
  };

  return <div className="mx-auto max-w-3xl space-y-5">
    <Card>
      <h1 className="text-3xl font-black">Profile</h1>
      <div className="mt-5 space-y-2 text-slate-700"><p><b>Name:</b> {user?.name}</p><p><b>Email:</b> {user?.email}</p><p><b>Role:</b> {user?.role}</p></div>
    </Card>
    <Card>
      <p className="font-bold text-indigo-600">Account security</p>
      <h2 className="text-2xl font-black">Sign out everywhere</h2>
      <p className="mt-2 text-slate-600">Use this if you signed in on a shared device or think someone else may have access to your account.</p>
      <ErrorMessage message={error} />
      {message && <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</p>}
      <Button variant="secondary" className="mt-5" onClick={logoutAll}>Sign out from all devices</Button>
    </Card>
  </div>;
}
