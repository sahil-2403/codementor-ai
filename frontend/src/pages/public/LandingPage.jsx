import { Link } from 'react-router-dom';
import { ArrowRight, BrainCircuit, ChartNoAxesCombined, Code2, LockKeyhole, MessagesSquare, Route, ShieldCheck, Sparkles, Trophy } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';

export default function LandingPage() {
  const features = [
    ['Adaptive roadmaps', 'Start with a learning goal and level. The app creates a roadmap that can later adapt from diagnostics and progress.', Route],
    ['Contextual mentor', 'When AI is available, answers can use your current lesson, weak topics, quiz mistakes, and related course content.', MessagesSquare],
    ['Weak-topic intelligence', 'Quiz, project, and interview mistakes become revision items and next-action recommendations.', ChartNoAxesCombined],
    ['Project practice', 'Move beyond reading with practical coding tasks and checklist-based submission feedback.', Trophy],
    ['Interview mode', 'Practice expected answers, improve answer structure, and track attempts topic by topic.', Code2],
    ['Secure account flow', 'Email verification, cookie auth, CSRF-aware API calls, token rotation, and role-based access.', ShieldCheck]
  ];

  const workflow = ['Choose goal', 'Pick level', 'Get roadmap', 'Study lesson', 'Take quiz', 'Revise weak topic', 'Practice project', 'Prepare interview'];

  return <div className="space-y-20 py-8">
    <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-indigo-700 shadow-sm"><BrainCircuit size={18} /> Personalized coding courses with AI support</div>
        <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-950 md:text-7xl">Build a learning path that fits your coding goal.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">CodeMentor AI helps learners move from goals to structured roadmaps, lessons, quizzes, revision, projects, and interview practice. MERN is the first fully supported path, and the platform is designed to support more coding courses over time.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link to="/register"><Button className="px-6 py-3">Start learning <ArrowRight className="ml-2 inline" size={18} /></Button></Link><Link to="/login"><Button variant="secondary" className="px-6 py-3">Login</Button></Link></div>
      </div>
      <Card className="relative overflow-hidden border border-indigo-100 bg-white text-slate-950 shadow-soft">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-indigo-100/70" />
        <div className="relative">
          <p className="font-bold text-indigo-700">Roadmap preview</p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">Personalized Coding Course</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {['Foundation concepts', 'Framework practice', 'Backend/API skills', 'Projects + interviews'].map((item, index) => <div key={item} className="rounded-3xl border border-slate-100 bg-slate-50 p-4"><p className="text-sm font-bold text-indigo-700">Module {index + 1}</p><p className="text-lg font-black text-slate-950">{item}</p></div>)}
          </div>
          <div className="mt-6 rounded-3xl bg-indigo-50 p-4"><p className="text-sm font-bold text-indigo-700">Today’s recommendation</p><p className="mt-1 text-xl font-black text-slate-950">Revise one weak topic before moving to the next quiz.</p></div>
        </div>
      </Card>
    </section>

    <section>
      <div className="mb-6 flex items-end justify-between gap-4"><div><h2 className="text-3xl font-black text-slate-950">How the app works</h2><p className="mt-2 text-slate-600">A simple flow that turns learning goals into daily actions.</p></div><LockKeyhole className="text-indigo-600" /></div>
      <div className="grid gap-3 md:grid-cols-4">
        {workflow.map((item, index) => <div key={item} className="rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-2xl bg-indigo-50 text-sm font-black text-indigo-700">{index + 1}</span><p className="font-black text-slate-950">{item}</p></div></div>)}
      </div>
    </section>

    <section className="grid gap-5 md:grid-cols-3">
      {features.map(([title, description, Icon]) => <Card key={title}><Icon className="text-indigo-600" /><h3 className="mt-4 text-xl font-black">{title}</h3><p className="mt-2 text-slate-600">{description}</p></Card>)}
    </section>

    <section className="grid gap-6 lg:grid-cols-3">
      {[['Beginners', 'No test. Start with preferences and a safe foundation roadmap.'], ['Intermediate learners', 'Optional diagnostic. Skip for a template or test for personalization.'], ['Advanced learners', 'Optional deep diagnostic. Get a focused roadmap for weak areas and interviews.']].map(([title, desc]) => <Card key={title} className="bg-white/80"><h3 className="text-2xl font-black">For {title}</h3><p className="mt-3 leading-7 text-slate-600">{desc}</p></Card>)}
    </section>

    <section className="rounded-[2rem] bg-slate-950 p-8 text-white md:p-12">
      <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]"><div><h2 className="text-3xl font-black">Ready to start your learning workflow?</h2><p className="mt-3 max-w-2xl text-slate-300">Create an account, verify your email, choose your goal and level, then start your roadmap.</p></div><Link to="/register"><Button className="bg-white text-slate-950 hover:bg-slate-100">Create account</Button></Link></div>
    </section>
  </div>;
}
