import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenCheck } from 'lucide-react';
import Card from '../common/Card.jsx';

export default function ContinueLearningCard({ lesson }) {
  return <Card className="relative overflow-hidden border-primary/20 bg-primary-soft">
    <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/55" aria-hidden="true" />
    <div className="relative">
      <span className="grid h-11 w-11 place-items-center rounded-surface bg-primary text-white" aria-hidden="true"><BookOpenCheck size={20} /></span>
      <p className="ui-eyebrow mt-5">Continue learning</p>
      <h2 className="mt-2 text-2xl font-bold text-foreground">{lesson?.title || 'Your next lesson will appear here'}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {lesson?._id ? 'Continue the next available lesson in your active roadmap.' : 'No available lesson was returned for the active roadmap.'}
      </p>
      {lesson?._id && <Link to={`/lessons/${lesson._id}`} className="ui-button ui-button--primary mt-5">Open lesson <ArrowRight size={17} aria-hidden="true" /></Link>}
    </div>
  </Card>;
}
