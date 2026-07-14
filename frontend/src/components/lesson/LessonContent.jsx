import CodeBlock from './CodeBlock.jsx';
import InterviewQA from './InterviewQA.jsx';
import PracticeTask from './PracticeTask.jsx';
export default function LessonContent({ lesson }) {
  return <div className="space-y-8">
    <section><h2 className="text-xl font-black">Theory</h2><p className="mt-3 leading-8 text-slate-700">{lesson.theory}</p></section>
    <section><h2 className="text-xl font-black">Full code example</h2><div className="mt-3"><CodeBlock code={lesson.codeExample} /></div></section>
    <section><h2 className="text-xl font-black">Code explanation</h2><p className="mt-3 leading-8 text-slate-700">{lesson.codeExplanation}</p></section>
    <section><h2 className="text-xl font-black">Common mistakes</h2><ul className="mt-3 list-disc space-y-2 pl-6 text-slate-700">{lesson.commonMistakes?.map((item) => <li key={item}>{item}</li>)}</ul></section>
    <section><h2 className="text-xl font-black">Interview definition</h2><p className="mt-3 rounded-3xl bg-slate-100 p-5 font-semibold text-slate-800">{lesson.interviewDefinition}</p></section>
    <section><h2 className="text-xl font-black">Interview Q&A</h2><div className="mt-3"><InterviewQA items={lesson.interviewQuestions} /></div></section>
    <PracticeTask task={lesson.practiceTask} />
  </div>;
}
