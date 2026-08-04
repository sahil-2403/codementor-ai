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
  ['Choose a goal', 'Start with the MERN learning path and a realistic target.'],
  ['Set your level', 'Beginners use preferences; experienced learners may take a diagnostic.'],
  ['Create a roadmap', 'Use a published template or verified diagnostic evidence.'],
  ['Learn and practise', 'Complete lessons, quizzes, projects, revisions, and interview attempts.']
];

const capabilities = [
  {
    title: 'Structured roadmap',
    description: 'Modules, lessons, quizzes, projects, and interview practice remain connected to one learning path.',
    icon: Route
  },
  {
    title: 'Explainable weak topics',
    description: 'Revision signals come from stored quiz, project, and interview results—not invented dashboard data.',
    icon: ChartNoAxesCombined
  },
  {
    title: 'Context-aware mentor',
    description: 'When Gemini is available, mentor answers can use trusted lesson and learner context. Otherwise the UI says it is unavailable.',
    icon: MessagesSquare
  },
  {
    title: 'Practical project work',
    description: 'Submissions are saved before review, so temporary AI failures do not erase learner work.',
    icon: Code2
  },
  {
    title: 'Interview practice',
    description: 'Expected answers stay hidden until an attempt is submitted, then feedback can be reviewed and improved.',
    icon: FileCheck2
  },
  {
    title: 'Secure account flow',
    description: 'Email verification, cookie authentication, CSRF protection, token refresh, and role-aware routes support the learning experience.',
    icon: ShieldCheck
  }
];

const learnerPaths = [
  {
    title: 'Beginner',
    badge: 'No diagnostic required',
    description: 'Start from learning preferences and a foundation-first roadmap. Take diagnostics later when you have enough context.'
  },
  {
    title: 'Intermediate',
    badge: 'Diagnostic optional',
    description: 'Start immediately with a published template or use a diagnostic to identify specific gaps before generation.'
  },
  {
    title: 'Advanced',
    badge: 'Focused personalization',
    description: 'Use the advanced template or add diagnostic evidence for targeted architecture and interview preparation.'
  }
];

export default function LandingPage() {
  return <div className="space-y-24 pb-8">
    <section className="grid items-center gap-10 pt-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14" aria-labelledby="landing-title">
      <div>
        <Badge className="gap-2 px-3 py-2"><BrainCircuit size={16} aria-hidden="true" /> Calm MERN learning workspace</Badge>
        <h1 id="landing-title" className="mt-6 max-w-4xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Turn a coding goal into a learning path you can explain.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          CodeMentor AI connects onboarding, roadmaps, lessons, quizzes, revision, projects, mentoring, and interview practice in one focused junior-developer portfolio application.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register" className="ui-button ui-button--primary px-6">Create account <ArrowRight size={18} aria-hidden="true" /></Link>
          <Link to="/login" className="ui-button ui-button--secondary px-6">Continue learning</Link>
        </div>
        <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          {['MERN path first', 'Template fallback', 'No fake progress'].map((item) => <div key={item} className="flex items-center gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success-soft text-success"><Check size={14} aria-hidden="true" /></span>{item}</div>)}
        </div>
      </div>

      <Card className="relative overflow-hidden p-5 sm:p-7">
        <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary-soft" aria-hidden="true" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="ui-eyebrow">Roadmap workspace</p>
              <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">MERN Developer Path</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">A product preview, not fabricated learner data.</p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-surface bg-primary text-white" aria-hidden="true"><Sparkles size={20} /></span>
          </div>

          <div className="mt-7 space-y-3">
            {[
              ['01', 'JavaScript foundations', 'Lessons and deterministic quizzes'],
              ['02', 'React application skills', 'Components, state, routing, and forms'],
              ['03', 'Node and Express APIs', 'Services, validation, security, and errors'],
              ['04', 'MongoDB and projects', 'Data modelling, integration, and interviews']
            ].map(([number, title, detail], index) => <div key={title} className="flex gap-3 rounded-surface border border-border bg-surface p-4">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-control text-xs font-bold ${index === 0 ? 'bg-primary text-white' : 'bg-surface-secondary text-muted-foreground'}`}>{number}</span>
              <div><p className="font-semibold text-foreground">{title}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div>
            </div>)}
          </div>

          <div className="ui-alert ui-alert--info mt-5">
            <p className="font-semibold">Honest personalization</p>
            <p className="mt-1 font-normal leading-6">Diagnostics can change roadmap emphasis. When Gemini is unavailable, the application uses published template content instead of pretending AI generated it.</p>
          </div>
        </div>
      </Card>
    </section>

    <section aria-labelledby="workflow-title">
      <div className="max-w-3xl">
        <p className="ui-eyebrow">Learning workflow</p>
        <h2 id="workflow-title" className="ui-page-title">One connected flow from setup to practice</h2>
        <p className="ui-page-description">Each step has a clear input and outcome, so the learner can understand where recommendations and progress come from.</p>
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
          <p className="ui-eyebrow">Product capabilities</p>
          <h2 id="capabilities-title" className="ui-page-title">Built around real learner actions</h2>
          <p className="ui-page-description">The interface distinguishes stored results, deterministic behavior, AI-assisted feedback, and unavailable states.</p>
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
        <p className="ui-eyebrow">Choose a suitable start</p>
        <h2 id="paths-title" className="ui-page-title">Different levels, without forced testing</h2>
        <p className="ui-page-description">Level changes the setup workflow, but every path remains editable and explainable.</p>
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
          <h2 id="cta-title" className="mt-2 text-3xl font-bold text-white sm:text-4xl">Build your roadmap, then prove progress through practice.</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-300">Create an account, verify your email, choose a goal and level, and continue through the server-owned onboarding flow.</p>
        </div>
        <Link to="/register" className="ui-button border-white bg-white px-6 text-foreground hover:bg-slate-100">Start learning <ArrowRight size={18} aria-hidden="true" /></Link>
      </div>
    </section>
  </div>;
}
