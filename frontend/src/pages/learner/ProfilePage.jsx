import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useAsyncAction } from '../../hooks/useAsyncAction.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { authApi } from '../../api/authApi.js';
import { onboardingApi } from '../../api/onboardingApi.js';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const enrollmentsQuery = useAsyncData(onboardingApi.enrollments);
  const switchAction = useAsyncAction(onboardingApi.switchEnrollment);

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

  const switchEnrollment = async (enrollmentId) => {
    try {
      await switchAction.mutateAsync(enrollmentId);
      navigate('/dashboard');
    } catch {
      // The action error is shown in the My courses card.
    }
  };

  const enrollments = enrollmentsQuery.data?.enrollments || [];

  return <div className="mx-auto max-w-3xl space-y-5">
    <Card>
      <h1 className="text-3xl font-black">Profile</h1>
      <div className="mt-5 space-y-2 text-slate-700"><p><b>Name:</b> {user?.name}</p><p><b>Email:</b> {user?.email}</p><p><b>Role:</b> {user?.role}</p></div>
    </Card>

    <Card>
      <p className="font-bold text-indigo-600">Learning</p>
      <h2 className="text-2xl font-black">My courses</h2>
      <p className="mt-2 text-slate-600">Choose which enrollment should be used by Dashboard, Roadmap, Mentor, Projects, Interview, Progress, and Reports.</p>
      {enrollmentsQuery.isLoading ? <div className="mt-4"><Loader label="Loading courses..." /></div> : null}
      <ErrorMessage message={enrollmentsQuery.error?.message || switchAction.error?.message} />
      {!enrollmentsQuery.isLoading && <div className="mt-4 space-y-3">
        {enrollments.length ? enrollments.map((enrollment) => {
          const title = enrollment.learningPath?.title || enrollment.currentCourse?.title || enrollment.course?.title || enrollment.roadmap?.title || 'Course';
          const courseTitle = enrollment.currentCourse?.title || enrollment.course?.title || enrollment.roadmap?.title;
          return <div key={enrollment._id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-slate-900">{title}</p>
                {enrollment.learningPath && courseTitle ? <p className="mt-1 text-sm text-slate-600">Current course: {courseTitle}</p> : null}
                <p className="mt-1 text-xs capitalize text-slate-500">{enrollment.level || enrollment.roadmap?.level || 'learner'} · {enrollment.status}</p>
              </div>
              {enrollment.isCurrent
                ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Current</span>
                : <Button variant="secondary" onClick={() => switchEnrollment(enrollment._id)} disabled={switchAction.isPending}>Use this course</Button>}
            </div>
          </div>;
        }) : <p className="text-sm text-slate-600">Your active enrollments will appear here after you create a roadmap.</p>}
      </div>}
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
