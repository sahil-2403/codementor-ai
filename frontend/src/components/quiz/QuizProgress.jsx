export default function QuizProgress({ current, total }) {
  const percent = total ? Math.round((current / total) * 100) : 0;
  return <div className="h-3 rounded-full bg-slate-200"><div className="h-3 rounded-full bg-indigo-600" style={{ width: `${percent}%` }} /></div>;
}
