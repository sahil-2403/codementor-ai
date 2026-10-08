import {
  BookOpenCheck,
  ChartNoAxesCombined,
  Code2,
  FileCheck2,
  MessagesSquare,
  Route
} from 'lucide-react';
import Card from '../common/Card.jsx';

const features = [
  {
    title: 'Structured lessons',
    description: 'Learn concepts through focused explanations, examples, common mistakes, and connected roadmap content.',
    icon: BookOpenCheck
  },
  {
    title: 'Coding practice',
    description: 'Apply what you learn through course-specific coding tasks and receive feedback when review is available.',
    icon: Code2
  },
  {
    title: 'Module quizzes',
    description: 'Check your understanding after roadmap modules and identify topics that deserve another review.',
    icon: Route
  },
  {
    title: 'AI Mentor',
    description: 'Ask for simpler explanations, examples, interview definitions, or extra guidance without leaving your learning flow.',
    icon: MessagesSquare
  },
  {
    title: 'Interview preparation',
    description: 'Practice explaining technical concepts and compare your response with expected answers and available feedback.',
    icon: FileCheck2
  },
  {
    title: 'Progress tracking',
    description: 'Track lesson completion, practice activity, revisions, weak topics, and weekly learning progress.',
    icon: ChartNoAxesCombined
  }
];

export default function LearningFeatures() {
  return <section aria-labelledby="features-title">
    <div className="max-w-3xl">
      <p className="ui-eyebrow">Learning experience</p>
      <h2 id="features-title" className="ui-page-title">Everything you need around the roadmap</h2>
      <p className="ui-page-description">Move from understanding a concept to using it in code, checking your knowledge, and explaining it clearly.</p>
    </div>
    <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {features.map(({ title, description, icon: Icon }) => <Card key={title}>
        <span className="grid h-11 w-11 place-items-center rounded-surface bg-primary-soft text-primary" aria-hidden="true">
          <Icon size={21} />
        </span>
        <h3 className="mt-4 text-xl font-bold text-foreground">{title}</h3>
        <p className="mt-2 leading-7 text-muted-foreground">{description}</p>
      </Card>)}
    </div>
  </section>;
}
