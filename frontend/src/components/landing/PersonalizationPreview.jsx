import { Sparkles } from 'lucide-react';

const scores = [
  ['Closures', 45],
  ['Promises', 62],
  ['Arrays', 90]
];

export default function PersonalizationPreview() {
  return <section className="rounded-panel border border-border bg-surface-secondary p-6 sm:p-8" aria-labelledby="personalization-title">
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div>
        <p className="ui-eyebrow">Personalized priorities</p>
        <h2 id="personalization-title" className="ui-page-title">Focus where you actually need practice</h2>
        <p className="ui-page-description">
          Intermediate and Advanced learners can take a skill check. CodeMentor maps verified weak topics to real roadmap lessons and highlights what deserves attention first.
        </p>
        <div className="mt-5 flex items-start gap-3 rounded-surface border border-primary/20 bg-primary-soft p-4 text-sm leading-6 text-primary-strong">
          <Sparkles className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
          <p>AI may help explain the verified focus areas, but your assessment results and real course content decide the priorities.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2" aria-label="Example skill check and roadmap focus">
        <div className="rounded-panel border border-border bg-surface p-5 shadow-soft">
          <p className="ui-eyebrow">Skill check</p>
          <h3 className="mt-1 text-lg font-bold text-foreground">Topic scores</h3>
          <div className="mt-5 space-y-4">
            {scores.map(([topic, score]) => <div key={topic}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-foreground">{topic}</span>
                <span className="font-semibold text-muted-foreground">{score}%</span>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-surface-secondary"
                role="progressbar"
                aria-label={`${topic} skill check score`}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={score}
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
              </div>
            </div>)}
          </div>
        </div>

        <div className="rounded-panel border border-border bg-surface p-5 shadow-soft">
          <p className="ui-eyebrow">Roadmap focus</p>
          <h3 className="mt-1 text-lg font-bold text-foreground">Recommended attention</h3>
          <div className="mt-5 space-y-3">
            {[
              ['Closures', 'High priority'],
              ['Promises', 'High priority'],
              ['Arrays', 'Continue normally']
            ].map(([topic, label], index) => <div key={topic} className="rounded-surface border border-border p-3.5">
              <div className="flex items-center gap-3">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-control text-xs font-bold ${index < 2 ? 'bg-primary text-white' : 'bg-success-soft text-success'}`}>
                  {index < 2 ? '!' : '✓'}
                </span>
                <div>
                  <p className="font-semibold text-foreground">{topic}</p>
                  <p className={`mt-0.5 text-xs font-semibold ${index < 2 ? 'text-primary' : 'text-success'}`}>{label}</p>
                </div>
              </div>
            </div>)}
          </div>
        </div>
      </div>
    </div>
  </section>;
}
