import Badge from '../common/Badge.jsx';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[86%] rounded-3xl px-5 py-3 text-sm leading-7 ${isUser ? 'bg-slate-950 text-white' : 'bg-white text-slate-800 shadow-sm'}`}>
      <div className="whitespace-pre-line">{message.content}</div>
      {!isUser && message.sources?.length ? <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">Context used</p>
        <div className="flex flex-wrap gap-2">{message.sources.map((source, index) => <Badge key={`${source.refId || source.title}-${index}`} className="bg-cyan-50 text-cyan-700">{source.title}</Badge>)}</div>
      </div> : null}
      {!isUser && message.metadata?.promptType ? <p className="mt-3 text-xs font-semibold text-slate-400">Mode: {message.metadata.promptType.replaceAll('_', ' ')}</p> : null}
    </div>
  </div>;
}
