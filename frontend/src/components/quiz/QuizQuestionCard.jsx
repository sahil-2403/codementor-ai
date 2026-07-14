export default function QuizQuestionCard({ question, value, onChange, index }) {
  return <div className="rounded-[1.75rem] bg-white/80 p-5 shadow-sm">
    <p className="text-sm font-bold text-indigo-600">Question {index + 1}</p>
    <h3 className="mt-2 font-black text-slate-950">{question.question}</h3>
    <div className="mt-4 grid gap-2">
      {question.options?.map((option) => <label key={option} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-3 hover:bg-indigo-50">
        <input type="radio" checked={value === option} onChange={() => onChange(option)} />
        <span className="text-sm font-medium text-slate-700">{option}</span>
      </label>)}
    </div>
  </div>;
}
