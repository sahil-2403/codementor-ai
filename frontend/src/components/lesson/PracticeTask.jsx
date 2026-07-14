export default function PracticeTask({ task }) {
  if (!task) return null;
  return <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
    <h3 className="font-black text-emerald-950">Practice task</h3>
    <p className="mt-2 text-emerald-900">{task}</p>
  </div>;
}
