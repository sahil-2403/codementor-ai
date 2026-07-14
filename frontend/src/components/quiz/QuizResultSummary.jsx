import Card from '../common/Card.jsx';
export default function QuizResultSummary({ attempt }) {
  return <Card>
    <p className="text-sm font-semibold text-slate-500">Quiz score</p>
    <h1 className="mt-2 text-5xl font-black text-slate-950">{attempt?.score || 0}%</h1>
    <p className="mt-3 text-slate-700">{attempt?.feedback}</p>
  </Card>;
}
