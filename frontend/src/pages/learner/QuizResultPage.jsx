import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import PageShell from '../../components/common/PageShell.jsx';
import QuizAnswerReview from '../../components/quiz/QuizAnswerReview.jsx';
import QuizExplanationPanel from '../../components/quiz/QuizExplanationPanel.jsx';
import QuizResultSummary from '../../components/quiz/QuizResultSummary.jsx';
import { quizApi } from '../../api/quizApi.js';

export default function QuizResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [attemptError, setAttemptError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isExplaining, setIsExplaining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!attemptId) return undefined;
    let active = true;
    setAttemptError(null);

    quizApi.attempt(attemptId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError) => {
        if (active) setAttemptError(requestError);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [attemptId, loadAttempt]);

  if (isLoading) return <Loader label="Loading quiz result..." />;

  if (attemptError) {
    return (
      <EmptyState
        title="Quiz result is unavailable"
        description={attemptError.message}
        actionLabel="Back to roadmap"
        onAction={() => navigate('/roadmap')}
      />
    );
  }

  const attempt = data?.attempt;

  if (!attempt) {
    return (
      <EmptyState
        title="Quiz attempt not found"
        description="This result is not available for your account."
        actionLabel="Try again"
        onAction={() => setLoadAttempt((value) => value + 1)}
      />
    );
  }

  const explainMistakes = async () => {
    if (!(attempt.answers || []).some((answer) => !answer.isCorrect)) return;

    setIsExplaining(true);
    try {
      setError('');
      await quizApi.explainAttempt(attemptId);
      setLoadAttempt((value) => value + 1);
    } catch (err) {
      setError(err?.message || 'Could not prepare the explanation.');
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <PageShell className="space-y-5 pb-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <QuizResultSummary attempt={attempt} />
        <ErrorMessage message={error} />
        <QuizExplanationPanel
          attempt={attempt}
          isExplaining={isExplaining}
          onExplain={explainMistakes}
        />
        <QuizAnswerReview answers={attempt.answers || []} />
      </div>
    </PageShell>
  );
}
