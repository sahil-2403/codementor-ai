import { CheckCircle2 } from 'lucide-react';
import { REVIEW_MODE, REVIEW_STATUS } from '../../constants/domainEnums.js';
import Badge from '../common/Badge.jsx';
import InlineAlert from '../common/InlineAlert.jsx';

const isFallbackReview = (submission) => submission.reviewMode === REVIEW_MODE.FALLBACK || submission.status === REVIEW_STATUS.UNAVAILABLE;

export default function ProjectSubmissionFeedback({ submission }) {
  const fallback = isFallbackReview(submission);
  const feedback = submission.aiFeedback;
  if (!feedback?.summary) return null;

  return <div className={`mt-4 rounded-panel border p-5 ${fallback ? 'border-warning/20 bg-warning-soft' : 'border-primary/20 bg-primary-soft'}`}>
    {fallback && <InlineAlert tone="warning" title="Gemini review unavailable" className="mb-4">Your submission remains saved. This checklist feedback has no score, creates no weak topics, and does not update learner progress.</InlineAlert>}
    <p className="font-semibold leading-7 text-foreground">{feedback.summary}</p>
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      {!fallback && feedback.strengths?.length ? <div><h4 className="font-bold text-success">Strengths</h4><ul className="mt-2 space-y-2 text-sm text-muted-foreground">{feedback.strengths.map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true">•</span><span>{item}</span></li>)}</ul></div> : null}
      {feedback.improvements?.length ? <div><h4 className="font-bold text-error">Improvements</h4><ul className="mt-2 space-y-2 text-sm text-muted-foreground">{feedback.improvements.map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true">•</span><span>{item}</span></li>)}</ul></div> : null}
    </div>
    {feedback.checklist?.length ? <div className="mt-4 border-t border-border pt-4"><h4 className="font-bold text-foreground">Review checklist</h4><ul className="mt-2 space-y-2 text-sm text-muted-foreground">{feedback.checklist.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 shrink-0 text-success" size={15} aria-hidden="true" /><span>{item}</span></li>)}</ul></div> : null}
    {!fallback && feedback.weakTopicsDetected?.length ? <div className="mt-4 flex flex-wrap gap-2">{feedback.weakTopicsDetected.map((item) => <Badge key={item.topic || item} variant="warning">{item.topic || item}</Badge>)}</div> : null}
  </div>;
}
