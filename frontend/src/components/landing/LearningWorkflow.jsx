const steps = [
  {
    title: 'Choose what to learn',
    description: 'Select a course or structured learning path from the catalog.'
  },
  {
    title: 'Start at your level',
    description: 'Choose Beginner, Intermediate, or Advanced. Higher levels can optionally use a skill check to find gaps.'
  },
  {
    title: 'Follow your roadmap',
    description: 'Work through lessons and quizzes in a clear sequence, with verified weak areas highlighted when available.'
  },
  {
    title: 'Practice and improve',
    description: 'Reinforce each course with coding practice, interview questions, Mentor support, and progress tracking.'
  }
];

export default function LearningWorkflow() {
  return <section aria-labelledby="workflow-title">
    <div className="max-w-3xl">
      <p className="ui-eyebrow">How it works</p>
      <h2 id="workflow-title" className="ui-page-title">One clear flow from choosing a course to improving your skills</h2>
      <p className="ui-page-description">CodeMentor keeps the next step visible so you can spend less time planning and more time learning.</p>
    </div>
    <ol className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {steps.map(({ title, description }, index) => <li key={title} className="ui-card">
        <span className="grid h-9 w-9 place-items-center rounded-control bg-primary-soft text-sm font-bold text-primary-strong">{index + 1}</span>
        <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </li>)}
    </ol>
  </section>;
}
