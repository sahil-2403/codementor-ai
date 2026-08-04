import { Archive, FilePenLine, Send } from 'lucide-react';

const stages = [
  { title: 'Draft', description: 'Editable work in progress. Learners cannot see it yet.', icon: FilePenLine },
  { title: 'Published', description: 'Reviewed content that learners can use.', icon: Send },
  { title: 'Archived', description: 'Read-only history that cannot be edited or published again.', icon: Archive }
];

export default function AdminLifecycleGuide() {
  return <div className="grid gap-3 md:grid-cols-3">
    {stages.map(({ title, description, icon: Icon }, index) => <div key={title} className="rounded-panel border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-control bg-primary-soft text-primary"><Icon size={17} /></span>
        <div>
          <p className="font-bold text-foreground">{index + 1}. {title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>)}
  </div>;
}
