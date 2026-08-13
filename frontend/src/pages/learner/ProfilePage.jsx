import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Loader from '../../components/common/Loader.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { onboardingApi } from '../../api/onboardingApi.js';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [switchingId, setSwitchingId] = useState(null);

  useEffect(() => {
    let active = true;
    setCoursesLoading(true);
    setCoursesError(null);

    onboardingApi.enrollments()
      .then((data) => {
        if (active) setEnrollments(data?.enrollments || []);
      })
      .catch((requestError) => {
        if (active) setCoursesError(requestError);
      })
      .finally(() => {
        if (active) setCoursesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadAttempt]);

  const switchEnrollment = async (enrollmentId) => {
    try {
      setCoursesError(null);
      setSwitchingId(enrollmentId);
      await onboardingApi.switchEnrollment(enrollmentId);
      navigate('/dashboard');
    } catch (requestError) {
      setCoursesError(requestError);
    } finally {
      setSwitchingId(null);
    }
  };

  return <div className="mx-auto max-w-3xl space-y-5">
    <Card>
      <h1 className="text-3xl font-black">Profile</h1>
      <div className="mt-5 space-y-2 text-slate-700"><p><b>Name:</b> {user?.name}</p><p><b>Email:</b> {user?.email}</p><p><b>Role:</b> {user?.role}</p></div>
    </Card>

    <Card>
      <p className="font-bold text-indigo-600">Learning</p>
      <h2 className="text-2xl font-black">My courses</h2>
      <p className="mt-2 text-slate-600">Choose which enrollment should be used by Dashboard, Roadmap, Mentor, Projects, Interview, Progress, and Reports.</p>
      {coursesLoading ? <div className="mt-4"><Loader label="Loading courses..." /></div> : null}
      <ErrorMessage message={coursesError?.message} />
      {!coursesLoading && <div className="mt-4 space-y-3">
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
                : <Button variant="secondary" onClick={() => switchEnrollment(enrollment._id)} disabled={Boolean(switchingId)} isLoading={switchingId === enrollment._id}>Use this course</Button>}
            </div>
          </div>;
        }) : <p className="text-sm text-slate-600">Your active enrollments will appear here after you create a roadmap.</p>}
      </div>}
      {coursesError ? <Button variant="ghost" className="mt-3" onClick={() => setLoadAttempt((value) => value + 1)}>Reload courses</Button> : null}
    </Card>
  </div>;
}
