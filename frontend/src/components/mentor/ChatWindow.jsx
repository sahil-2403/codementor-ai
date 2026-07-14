import MessageBubble from './MessageBubble.jsx';
export default function ChatWindow({ messages = [] }) {
  return <div className="min-h-[420px] space-y-4 rounded-[2rem] bg-slate-100/80 p-5">
    {messages.length ? messages.map((message, index) => <MessageBubble key={message._id || index} message={message} />) : <p className="text-center text-slate-500">Ask your first doubt to the AI mentor.</p>}
  </div>;
}
