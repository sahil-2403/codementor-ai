import { Link } from 'react-router-dom';
import { ArrowRight, BrainCircuit, Check, Sparkles } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';

const roadmapItems = [
  ['Getting started', 'complete'],
  ['Variables and data types', 'complete'],
  ['Functions and scope', 'current'],
  ['Arrays and objects', 'upcoming'],
  ['Async JavaScript', 'upcoming']
];

export default function LandingHero() {
  return <section className="grid items-center gap-10 pt-2 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14" aria-labelledby="landing-title">
    <div>
      <Badge className="gap-2 px-3 py-2">
        <BrainCircuit size={16} aria-hidden="true" /> Structured code learning
      </Badge>
      <h1 id="landing-title" className="mt-6 max-w-4xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        Learn to code with a roadmap built around your level.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
        Choose a course or learning path, start at the right level, and learn through structured lessons, quizzes, coding practice, mentor support, interview preparation, and progress tracking.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/register" className="ui-button ui-button--primary px-6">
          Start learning <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <Link to="/login" className="ui-button ui-button--secondary px-6">Try demo</Link>
      </div>
      <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
        {['Courses & learning paths', 'Beginner to advanced', 'Progress saved per course'].map((item) => <div key={item} className="flex items-center gap-2">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success-soft text-success">
            <Check size={14} aria-hidden="true" />
          </span>
          {item}
        </div>)}
      </div>
    </div>

    <Card className="relative overflow-hidden p-5 sm:p-7">
      <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary-soft" aria-hidden="true" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="ui-eyebrow">Your roadmap</p>
            <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">JavaScript</h2>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Beginner · 32% complete</p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-surface bg-primary text-white" aria-hidden="true">
            <Sparkles size={20} />
          </span>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-secondary" aria-label="Roadmap progress: 32 percent">
          <div className="h-full w-[32%] rounded-full bg-primary" />
        </div>

        <div className="mt-6 space-y-2.5">
          {roadmapItems.map(([title, status], index) => <div key={title} className="flex items-center gap-3 rounded-surface border border-border bg-surface px-3.5 py-3">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-control text-xs font-bold ${status === 'complete' ? 'bg-success-soft text-success' : status === 'current' ? 'bg-primary text-white' : 'bg-surface-secondary text-muted-foreground'}`}>
              {status === 'complete' ? <Check size={15} aria-hidden="true" /> : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{title}</p>
              {status === 'current' && <p className="mt-0.5 text-xs font-semibold text-primary">Current focus</p>}
            </div>
          </div>)}
        </div>

        <div className="ui-alert ui-alert--info mt-5">
          <p className="font-semibold">Keep learning from where you left off</p>
          <p className="mt-1 font-normal leading-6">Your roadmap and progress stay connected to the course you are currently learning.</p>
        </div>
      </div>
    </Card>
  </section>;
}
