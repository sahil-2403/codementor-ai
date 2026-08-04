import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  ChartNoAxesCombined,
  Check,
  Code2,
  FileCheck2,
  MessagesSquare,
  Route,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import Badge from '../../components/common/Badge.jsx';
import Card from '../../components/common/Card.jsx';

const workflow = [
  ['Choose a goal', 'Start with the MERN path and a realistic learning target.'],
  ['Choose your level', 'Pick the starting point that best matches your current skills.'],
  ['Build your roadmap', 'Get a clear sequence of lessons, practice, and revision.'],
  ['Learn and practise', 'Complete lessons, quizzes, projects, and interview questions.']
];

const capabilities = [
  {
    title: 'Guided roadmap',
    description: 'Follow connected modules, lessons, quizzes, projects, and interview practice in the right order.',
    icon: Route
  },
  {
    title: 'Clear practice priorities',
    description: 'See which topics need more attention based on your completed quizzes, projects, and interviews.',
    icon: ChartNoAxesCombined
  },
  {
    title: 'Learning mentor',
    description: 'Ask for simpler explanations, examples, interview answers, and practice questions while you learn.',
    icon: MessagesSquare
  },
  {
    title: 'Practical project work',
    description: 'Apply each module through coding tasks and keep your submitted work even when detailed review is unavailable.',
    icon: Code2
  },
  {
    title: 'Interview practice',
    description: 'Write your answer first, then compare it with the expected answer and available feedback.',
    icon: FileCheck2
  },
  {
    title: 'Secure learning progress',
    description: 'Email verification and protected accounts help keep your roadmap and progress safe.',
    icon: ShieldCheck
  }
];

const learnerPaths = [
  {
    title: 'Beginner',
    badge: 'No skill check required',
    description: 'Start with the fundamentals and choose a pace that fits your schedule.'
  },
  {
    title: 'Intermediate',
    badge: 'Skill check optional',
    description: 'Start with the recommended roadmap or take a short skill check to focus on your gaps.'
  },
  {
    title: 'Advanced',
    badge: 'Focused preparation',
    description: 'Begin with advanced topics or use a deeper skill check for targeted interview and architecture practice.'
  }
];

export default function LandingPage() {
  return <div className="space-y-24 pb-8">
    <section className="grid items-center gap-10 pt-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14" aria-labelledby="landing-title">
      <div>
        <Badge className="gap-2 px-3 py-2"><BrainCircuit size={16} aria-hidden="true" /> Focused MERN learning</Badge>
        <h1 id="landing-title" className="mt-6 max-w-4xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Build MERN skills with a clear path from lessons to interviews.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          Choose your level, follow a guided roadmap, practise with quizzes and projects, and prepare for junior-developer interviews in one place.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register" className="ui-button ui-button--primary px-6">Create account <ArrowRight size={18} aria-hidden="true" /></Link>
          <Link to="/login" className="ui-button ui-button--secondary px-6">Continue learning</Link>
        </div>
        <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          {['MERN learning path', 'Flexible starting point', 'Progress based on your work'].map((item) => <div key={item} className="flex items-center gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success-soft text-success"><Check size={14} aria-hidden="true" /></span>{item}</div>)}
        </div>
      </div>

      <Card className="relative overflow-hidden p-5 sm:p-7">
        <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary-soft" aria-hidden="true" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="ui-eyebrow">Your learning path</p>
              <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">MERN Developer Path</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">A preview of how your roadmap is organised.</p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-surface bg-primary text-white" aria-hidden="true"><Sparkles size={20} /></span>
          </div>

          <div className="mt-7 space-y-3">
            {[
              ['01', 'JavaScript foundations', 'Lessons, examples, and quizzes'],
              ['02', 'React application skills', 'Components, state, routing, and forms'],
              ['03', 'Node and Express APIs', 'Services, validation, security, and errors'],
              ['04', 'MongoDB and projects', 'Data modelling, integration, and interviews']
            ].map(([number, title, detail], index) => <div key={title} className="flex gap-3 rounded-surface border border-border bg-surface p-4">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-control text-xs font-bold ${index === 0 ? 'bg-primary text-white' : 'bg-surface-secondary text-muted-foreground'}`}>{number}</span>
              <div><p className="font-semibold text-foreground">{title}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div>
            </div>)}
          </div>

          <div className="ui-alert ui-alert--info mt-5">
            <p className="font-semibold">A path that fits you</p>
            <p className="mt-1 font-normal leading-6">Your level, schedule, and optional skill-check results help decide what to learn first.</p>
          </div>
        </div>
      </Card>
    </section>

    <section aria-labelledby="workflow-title">
      <div className="max-w-3xl">
        <p className="ui-eyebrow">How it works</p>
        <h2 id="workflow-title" className="ui-page-title">One clear flow from setup to practice</h2>
        <p className="ui-page-description">Each step shows what to do next, so you can spend less time planning and more time learning.</p>
      </div>
      <ol className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workflow.map(([title, description], index) => <li key={title} className="ui-card">
          <span className="grid h-9 w-9 place-items-center rounded-control bg-primary-soft text-sm font-bold text-primary-strong">{index + 1}</span>
          <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </li>)}
      </ol>
    </section>

    <section aria-labelledby="capabilities-title">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="ui-eyebrow">What you can practise</p>
          <h2 id="capabilities-title" className="ui-page-title">Learn, apply, review, and improve</h2>
          <p className="ui-page-description">Move from understanding a topic to using it in code and explaining it in an interview.</p>
        </div>
        <BookOpenCheck className="hidden text-primary md:block" size={34} aria-hidden="true" />
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {capabilities.map(({ title, description, icon: Icon }) => <Card key={title}>
          <span className="grid h-11 w-11 place-items-center rounded-surface bg-primary-soft text-primary" aria-hidden="true"><Icon size={21} /></span>
          <h3 className="mt-4 text-xl font-bold text-foreground">{title}</h3>
          <p className="mt-2 leading-7 text-muted-foreground">{description}</p>
        </Card>)}
      </div>
    </section>

    <section className="rounded-panel border border-border bg-surface-secondary p-6 sm:p-8" aria-labelledby="paths-title">
      <div className="max-w-3xl">
        <p className="ui-eyebrow">Choose your starting point</p>
        <h2 id="paths-title" className="ui-page-title">A path for every experience level</h2>
        <p className="ui-page-description">You can start immediately and adjust your learning path later as your skills improve.</p>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {learnerPaths.map(({ title, badge, description }) => <Card key={title} className="shadow-sm">
          <Badge variant="neutral">{badge}</Badge>
          <h3 className="mt-4 text-2xl font-bold text-foreground">{title}</h3>
          <p className="mt-3 leading-7 text-muted-foreground">{description}</p>
        </Card>)}
      </div>
    </section>

    <section className="overflow-hidden rounded-panel bg-foreground p-7 text-white shadow-panel sm:p-10" aria-labelledby="cta-title">
      <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-sm font-semibold text-indigo-200">Start with a focused path</p>
          <h2 id="cta-title" className="mt-2 text-3xl font-bold text-white sm:text-4xl">Build your roadmap, then turn learning into practice.</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-300">Create an account, choose your goal and level, and start with the next recommended lesson.</p>
        </div>
        <Link to="/register" className="ui-button border-white bg-white px-6 text-foreground hover:bg-slate-100">Start learning <ArrowRight size={18} aria-hidden="true" /></Link>
      </div>
    </section>
  </div>;
}
