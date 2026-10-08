import { useEffect, useRef, useState } from 'react';
import { BookOpen, Check, ChevronDown, Plus, Route } from 'lucide-react';
import Button from '../common/Button.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import ErrorMessage from '../common/ErrorMessage.jsx';
import LevelBadge from '../common/LevelBadge.jsx';

const getEnrollmentTitle = (enrollment) =>
  enrollment?.learningPath?.title ||
  enrollment?.currentCourse?.title ||
  enrollment?.course?.title ||
  enrollment?.roadmap?.title ||
  'Course';

const getEnrollmentLevel = (enrollment) =>
  enrollment?.level || enrollment?.roadmap?.level || 'beginner';

const getEnrollmentContext = (enrollment) => {
  if (enrollment?.learningPath) {
    return enrollment.currentCourse?.title
      ? `Current course: ${enrollment.currentCourse.title}`
      : 'Learning path';
  }
  return 'Course';
};

export default function CourseSwitcher({ enrollments = [], onSwitch, onEnroll }) {
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingEnrollment, setPendingEnrollment] = useState(null);
  const [showEnrollConfirm, setShowEnrollConfirm] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState('');

  const currentEnrollment = enrollments.find((item) => item.isCurrent) || enrollments[0] || null;
  const currentTitle = getEnrollmentTitle(currentEnrollment);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOutside = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const chooseEnrollment = (enrollment) => {
    setIsOpen(false);
    if (enrollment.isCurrent) return;
    setSwitchError('');
    setPendingEnrollment(enrollment);
  };

  const confirmSwitch = async () => {
    if (!pendingEnrollment?._id || !onSwitch) return;

    try {
      setIsSwitching(true);
      setSwitchError('');
      await onSwitch(pendingEnrollment);
      setPendingEnrollment(null);
    } catch (error) {
      setSwitchError(error?.message || 'Could not switch course.');
    } finally {
      setIsSwitching(false);
    }
  };

  const confirmEnroll = () => {
    setShowEnrollConfirm(false);
    onEnroll?.();
  };

  return (
    <>
      <section className="rounded-surface border border-border bg-surface p-4 sm:p-5" aria-labelledby="current-learning-title">
        <div className="mb-3">
          <p id="current-learning-title" className="text-xs font-semibold text-muted-foreground">Current learning</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <div ref={dropdownRef} className="relative min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setIsOpen((value) => !value)}
              className="flex min-h-12 w-full items-center gap-3 rounded-control border border-border bg-surface-secondary/45 px-3.5 text-left transition hover:border-primary/30 hover:bg-surface-secondary"
              aria-expanded={isOpen}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-primary-soft text-primary-strong" aria-hidden="true">
                {currentEnrollment?.learningPath ? <Route size={17} /> : <BookOpen size={17} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-foreground">{currentTitle}</span>
                {currentEnrollment ? (
                  <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{getEnrollmentContext(currentEnrollment)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{getEnrollmentLevel(currentEnrollment)}</span>
                  </span>
                ) : null}
              </span>
              <ChevronDown
                size={17}
                className={`shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {isOpen ? (
              <div
                className="absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-surface border border-border bg-surface p-1.5 shadow-panel"
                role="group"
                aria-label="Enrolled courses"
              >
                {enrollments.map((enrollment) => (
                  <button
                    key={enrollment._id}
                    type="button"
                    onClick={() => chooseEnrollment(enrollment)}
                    className="flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left transition hover:bg-surface-secondary"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-surface-secondary text-muted-foreground" aria-hidden="true">
                      {enrollment.learningPath ? <Route size={15} /> : <BookOpen size={15} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {getEnrollmentTitle(enrollment)}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {enrollment.learningPath && enrollment.currentCourse?.title ? (
                          <span>{enrollment.currentCourse.title}</span>
                        ) : null}
                        <span className="capitalize">{getEnrollmentLevel(enrollment)}</span>
                      </span>
                    </span>
                    {enrollment.isCurrent ? (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-primary-strong">
                        <Check size={14} aria-hidden="true" /> Current
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <Button
            type="button"
            variant="secondary"
            className="min-h-12 shrink-0 justify-center gap-2 px-4 sm:w-auto"
            onClick={() => setShowEnrollConfirm(true)}
          >
            <Plus size={16} aria-hidden="true" />
            Enroll new course
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(pendingEnrollment)}
        title="Switch course?"
        description={`Switch from ${currentTitle} to ${getEnrollmentTitle(pendingEnrollment)}?`}
        confirmLabel="Switch course"
        loadingLabel="Switching..."
        tone="primary"
        isLoading={isSwitching}
        onConfirm={confirmSwitch}
        onCancel={() => {
          if (isSwitching) return;
          setPendingEnrollment(null);
          setSwitchError('');
        }}
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-control border border-border bg-surface-secondary/50 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Current</p>
              <p className="mt-1 text-sm font-bold text-foreground">{currentTitle}</p>
              {currentEnrollment ? <div className="mt-2"><LevelBadge level={getEnrollmentLevel(currentEnrollment)} /></div> : null}
            </div>
            <div className="rounded-control border border-primary/20 bg-primary-soft/40 p-3">
              <p className="text-xs font-semibold text-primary-strong">Switch to</p>
              <p className="mt-1 text-sm font-bold text-foreground">{getEnrollmentTitle(pendingEnrollment)}</p>
              {pendingEnrollment ? <div className="mt-2"><LevelBadge level={getEnrollmentLevel(pendingEnrollment)} /></div> : null}
            </div>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Your current progress will stay saved, and you can switch back anytime.
          </p>
          <ErrorMessage message={switchError} />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={showEnrollConfirm}
        title="Enroll in a new course?"
        description="You’ll go through course selection and setup for a new course."
        confirmLabel="Continue"
        tone="primary"
        onConfirm={confirmEnroll}
        onCancel={() => setShowEnrollConfirm(false)}
      >
        <p className="text-sm leading-6 text-muted-foreground">
          Your {currentTitle} progress will remain saved. When the new roadmap is created, the new course will become your current course.
        </p>
      </ConfirmDialog>
    </>
  );
}
