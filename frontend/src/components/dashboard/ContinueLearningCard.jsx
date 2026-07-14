import { Link } from 'react-router-dom';
import Card from '../common/Card.jsx';
import Button from '../common/Button.jsx';

export default function ContinueLearningCard({ lesson }) {
  return <Card className="border border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-cyan-50">
    <p className="text-sm font-black text-indigo-700">Continue learning</p>
    <h2 className="mt-3 text-2xl font-black text-slate-950">{lesson?.title || 'Start your first lesson'}</h2>
    <p className="mt-2 text-sm leading-6 text-slate-600">“Consistency beats intensity. Open one lesson, understand one idea, and build momentum.”</p>
    {lesson?._id ? <Link to={`/lessons/${lesson._id}`}><Button className="mt-5">Open lesson</Button></Link> : null}
  </Card>;
}
