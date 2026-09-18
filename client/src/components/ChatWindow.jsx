import { useEffect, useRef, useState } from "react";

export default function ChatWindow({ customer, messages, onSend, isLoading, error, escalation }) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isLoading || !customer) return;
    setDraft("");
    onSend(text);
  };

  return (
    <div className="flex-1 bg-base-800 border border-base-600 rounded-lg flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-base-600 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-ink-100">
            {customer ? `Conversation — ${customer.name}` : "Conversation"}
          </h2>
          <p className="text-xs text-ink-500 mt-0.5">
            {customer ? `${customer.flight.number} · ${customer.referenceCode}` : "Select a customer to begin"}
          </p>
        </div>
      </div>

      {escalation && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-md border border-rose-400/40 bg-rose-400/10 flex items-start gap-2">
          <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
          <div className="text-xs">
            <p className="font-medium text-rose-400">Escalated to human supervisor</p>
            {escalation.escalationReason && (
              <p className="text-ink-300 mt-0.5">{escalation.escalationReason}</p>
            )}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="thin-scroll flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-[280px]">
        {messages.length === 0 && !isLoading && (
          <div className="m-auto text-center text-ink-500 text-sm max-w-sm">
            {customer
              ? `No messages yet. Ask about ${customer.name.split(" ")[0]}'s ${customer.flight.status.toLowerCase()} flight, or run a scenario test on the left.`
              : "Select a customer from the roster to open their case."}
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-ink-500 px-1">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-dot" style={{ animationDelay: "0.15s" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-dot" style={{ animationDelay: "0.3s" }} />
            </span>
            Agent is reviewing the case…
          </div>
        )}

        {error && (
          <div className="px-3 py-2 rounded-md border border-rose-400/40 bg-rose-400/10 text-xs text-rose-400">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-base-600 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!customer || isLoading}
          placeholder={customer ? "Type the customer's message…" : "Select a customer first"}
          className="flex-1 bg-base-700 border border-base-600 rounded-md px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 outline-none focus:border-cyan-400/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!customer || isLoading || !draft.trim()}
          className="px-4 py-2 rounded-md bg-cyan-400/15 border border-cyan-400/40 text-cyan-400 text-sm font-medium hover:bg-cyan-400/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-base-700 text-ink-100 border border-base-600"
            : "bg-cyan-400/[0.08] text-ink-100 border border-cyan-400/20"
        }`}
      >
        {!isUser && <p className="text-[10px] font-medium text-cyan-400 mb-1">AeroResolve Agent</p>}
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
