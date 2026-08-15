import { CheckCircle2, CircleAlert } from "lucide-react";
import { REVIEW_MODE, REVIEW_STATUS } from "../../constants/domainEnums.js";
import Badge from "../common/Badge.jsx";
import InlineAlert from "../common/InlineAlert.jsx";

const isFallbackReview = (submission) =>
  submission.reviewMode === REVIEW_MODE.FALLBACK ||
  submission.status === REVIEW_STATUS.UNAVAILABLE;

const normalizeChecklistItem = (entry) => {
  if (typeof entry === "string") {
    return { label: entry, detail: "", passed: true };
  }

  if (entry && typeof entry === "object") {
    return {
      label: entry.item || entry.feedback || "Review item",
      detail: entry.item && entry.feedback ? entry.feedback : "",
      passed: entry.passed !== false,
    };
  }

  return { label: "Review item", detail: "", passed: false };
};

export default function PracticeSubmissionFeedback({ submission }) {
  const fallback = isFallbackReview(submission);
  const feedback = submission.aiFeedback;
  if (!feedback?.summary) return null;

  return (
    <div
      className={`mt-4 rounded-panel border p-5 ${
        fallback
          ? "border-warning/20 bg-warning-soft"
          : "border-primary/20 bg-primary-soft"
      }`}
    >
      {fallback && (
        <InlineAlert
          tone="warning"
          title="Detailed review unavailable"
          className="mb-4"
        >
          Your attempt is saved. This checklist has no score, does not add
          practice topics, and does not change your progress.
        </InlineAlert>
      )}

      <p className="font-semibold leading-7 text-foreground">
        {feedback.summary}
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {!fallback && feedback.strengths?.length ? (
          <div>
            <h4 className="font-bold text-success">What you did well</h4>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {feedback.strengths.map((item, index) => (
                <li key={`${item}-${index}`} className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {feedback.improvements?.length ? (
          <div>
            <h4 className="font-bold text-error">What to improve</h4>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {feedback.improvements.map((item, index) => (
                <li key={`${item}-${index}`} className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {feedback.checklist?.length ? (
        <div className="mt-4 border-t border-border pt-4">
          <h4 className="font-bold text-foreground">Review checklist</h4>
          <ul className="mt-2 space-y-3 text-sm text-muted-foreground">
            {feedback.checklist.map((entry, index) => {
              const item = normalizeChecklistItem(entry);
              const StatusIcon = item.passed ? CheckCircle2 : CircleAlert;

              return (
                <li
                  key={`${item.label}-${index}`}
                  className="flex items-start gap-2.5"
                >
                  <StatusIcon
                    className={`mt-0.5 shrink-0 ${
                      item.passed ? "text-success" : "text-warning"
                    }`}
                    size={15}
                    aria-hidden="true"
                  />
                  <span>
                    <span className="font-medium text-foreground">
                      {item.label}
                    </span>
                    {item.detail ? (
                      <span className="mt-0.5 block leading-6">
                        {item.detail}
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {!fallback && feedback.weakTopicsDetected?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {feedback.weakTopicsDetected.map((item, index) => {
            const label =
              typeof item === "string" ? item : item?.topic || "Review topic";
            return (
              <Badge key={`${label}-${index}`} variant="warning">
                {label}
              </Badge>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
