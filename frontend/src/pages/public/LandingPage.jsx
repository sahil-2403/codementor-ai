import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import Badge from '../../components/common/Badge.jsx';
import Card from '../../components/common/Card.jsx';
import LandingHero from '../../components/landing/LandingHero.jsx';
import LearningWorkflow from '../../components/landing/LearningWorkflow.jsx';
import LearningFeatures from '../../components/landing/LearningFeatures.jsx';
import PersonalizationPreview from '../../components/landing/PersonalizationPreview.jsx';
import MultiCoursePreview from '../../components/landing/MultiCoursePreview.jsx';

const levels = [
  {
    title: 'Beginner',
    badge: 'No skill check required',
    description: 'Start from the fundamentals with a complete guided roadmap and clear lesson progression.'
  },
  {
    title: 'Intermediate',
    badge: 'Skill check optional',
    description: 'Continue beyond the basics or take an optional skill check to identify gaps before moving forward.'
  },
  {
    title: 'Advanced',
    badge: 'Deeper practice',
    description: 'Focus on advanced concepts and interview preparation while keeping earlier levels available for revision.'
  }
];

const practiceLoop = [
  ['Learn', 'Understand the concept'],
  ['Quiz', 'Check your knowledge'],
  ['Practice', 'Use it in code'],
  ['Interview', 'Explain it clearly'],
  ['Review', 'Focus on weak areas']
];

export default function LandingPage() {
  return <div className="space-y-20 pb-8">
    <LandingHero />
    <LearningWorkflow />
    <LearningFeatures />
    <PersonalizationPreview />
    <MultiCoursePreview />

    <section aria-labelledby="levels-title">
      <div className="max-w-3xl">
        <p className="ui-eyebrow">Choose your starting point</p>
        <h2 id="levels-title" className="ui-page-title">A roadmap for every experience level</h2>
        <p className="ui-page-description">Start where your current knowledge makes sense and keep previous learning available as you progress.</p>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {levels.map(({ title, badge, description }) => <Card key={title} className="shadow-sm">
          <Badge variant="neutral">{badge}</Badge>
          <h3 className="mt-4 text-2xl font-bold text-foreground">{title}</h3>
          <p className="mt-3 leading-7 text-muted-foreground">{description}</p>
        </Card>)}
      </div>
    </section>

    <section className="rounded-panel border border-border bg-surface p-6 shadow-soft sm:p-8" aria-labelledby="practice-loop-title">
      <div className="max-w-3xl">
        <p className="ui-eyebrow">Build useful learning habits</p>
        <h2 id="practice-loop-title" className="ui-page-title">Turn understanding into real practice</h2>
        <p className="ui-page-description">CodeMentor connects learning, checking, applying, explaining, and reviewing so each course becomes more than a list of lessons.</p>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {practiceLoop.map(([title, description], index) => <div key={title} className="relative rounded-surface border border-border bg-surface-secondary p-4">
          <span className="text-xs font-bold text-primary">0{index + 1}</span>
          <h3 className="mt-2 font-bold text-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>)}
      </div>
    </section>

    <section className="grid gap-6 rounded-panel border border-primary/20 bg-primary-soft p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center" aria-labelledby="demo-title">
      <div>
        <p className="ui-eyebrow">Explore before signing up</p>
        <h2 id="demo-title" className="mt-1 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Want to see the learning experience first?</h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Prepare a fresh demo learner from the Login page and explore the roadmap, lessons, practice, Mentor, interviews, and progress without affecting another visitor.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {['Fresh learner data', 'Normal login flow', 'Independent progress'].map((item) => <span key={item} className="flex items-center gap-2">
            <Check size={15} className="text-success" aria-hidden="true" /> {item}
          </span>)}
        </div>
      </div>
      <div className="flex flex-wrap gap-3 lg:justify-end">
        <Link to="/register" className="ui-button ui-button--primary px-5">Start learning</Link>
        <Link to="/login" className="ui-button ui-button--secondary px-5">Try a fresh demo</Link>
      </div>
    </section>

    <section className="overflow-hidden rounded-panel bg-foreground p-7 text-white shadow-panel sm:p-10" aria-labelledby="cta-title">
      <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-sm font-semibold text-indigo-200">Start with a clear learning path</p>
          <h2 id="cta-title" className="mt-2 text-3xl font-bold text-white sm:text-4xl">Ready to build your first roadmap?</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-300">Choose what you want to learn, select your level, and start with the next lesson that matters.</p>
        </div>
        <Link to="/register" className="ui-button border-white bg-white px-6 text-foreground hover:bg-slate-100">
          Create free account <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  </div>;
}
