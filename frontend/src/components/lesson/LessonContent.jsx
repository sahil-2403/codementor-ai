import CodeBlock from './CodeBlock.jsx';
import InterviewQA from './InterviewQA.jsx';
import PracticeTask from './PracticeTask.jsx';

function LessonSection({ title, children }) {
  return (
    <section className="border-b border-border pb-6 last:border-b-0 last:pb-0">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function LessonContent({ lesson }) {
  return (
    <article className="space-y-6">
      {lesson.theory && (
        <LessonSection title="Theory">
          <p className="whitespace-pre-line leading-8 text-muted-foreground">
            {lesson.theory}
          </p>
        </LessonSection>
      )}

      {lesson.codeExample && (
        <LessonSection title="Full code example">
          <CodeBlock
            code={lesson.codeExample}
            label={`${lesson.title} code example`}
          />
        </LessonSection>
      )}

      {lesson.codeExplanation && (
        <LessonSection title="Code explanation">
          <p className="whitespace-pre-line leading-8 text-muted-foreground">
            {lesson.codeExplanation}
          </p>
        </LessonSection>
      )}

      {lesson.commonMistakes?.length ? (
        <LessonSection title="Common mistakes">
          <ul className="space-y-3">
            {lesson.commonMistakes.map((item) => (
              <li key={item} className="flex gap-3 text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
                <span className="leading-7">{item}</span>
              </li>
            ))}
          </ul>
        </LessonSection>
      ) : null}

      {lesson.interviewDefinition && (
        <LessonSection title="Interview definition">
          <p className="border-l-2 border-primary pl-4 font-medium leading-7 text-foreground">
            {lesson.interviewDefinition}
          </p>
        </LessonSection>
      )}

      {lesson.interviewQuestions?.length ? (
        <LessonSection title="Interview questions">
          <InterviewQA items={lesson.interviewQuestions} />
        </LessonSection>
      ) : null}

      <PracticeTask task={lesson.practiceTask} />
    </article>
  );
}
