export default function InterviewQA({ items = [] }) {
  if (!items.length) return null;
  return <div className="space-y-3">
    {items.map((item, index) => <div key={index} className="rounded-2xl bg-indigo-50 p-4">
      <p className="font-bold text-indigo-950">Q. {item.question}</p>
      <p className="mt-2 text-sm text-indigo-900">{item.answer}</p>
    </div>)}
  </div>;
}
