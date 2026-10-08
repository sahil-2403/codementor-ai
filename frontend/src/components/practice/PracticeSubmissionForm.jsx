import { Code2 } from 'lucide-react';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import InlineAlert from '../common/InlineAlert.jsx';
import SectionHeader from '../common/SectionHeader.jsx';
import Textarea from '../common/Textarea.jsx';

export default function PracticeSubmissionForm({
  maxAttempts,
  canSubmit,
  isLocked,
  register,
  errors,
  isSubmitting,
  onSubmit
}) {
  return (
    <Card variant="compact">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-surface-secondary text-muted-foreground" aria-hidden="true">
          <Code2 size={18} />
        </span>
        <SectionHeader
          className="min-w-0 flex-1"
          title="Submit your solution"
          description={`Save up to ${maxAttempts} attempts. Mentor review is requested separately from your saved attempt.`}
        />
      </div>

      {!canSubmit ? (
        <InlineAlert className="mt-4" tone="warning" title="Attempts closed">
          {isLocked ? 'Unlock this practice task before submitting.' : `You have used all ${maxAttempts} attempts for this task.`}
        </InlineAlert>
      ) : null}

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Textarea
          label="Code or pseudocode"
          className="min-h-52 font-mono text-xs"
          placeholder="Paste your code or pseudocode here..."
          error={errors.submittedCode?.message}
          disabled={!canSubmit}
          {...register('submittedCode')}
        />
        <Textarea
          label="Approach and tradeoffs"
          className="min-h-32"
          placeholder="Explain your approach, edge cases, and decisions..."
          error={errors.submittedExplanation?.message}
          disabled={!canSubmit}
          {...register('submittedExplanation')}
        />
        <Button type="submit" disabled={!canSubmit} isLoading={isSubmitting} loadingLabel="Saving attempt...">
          Save attempt
        </Button>
      </form>
    </Card>
  );
}
