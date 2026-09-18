function ticketId(customer) {
  const seed = `${customer.referenceCode}-${customer.flight.number}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const digits = String(hash % 10000).padStart(4, "0");
  return `AR-2026-${digits}`;
}

export default function ResolutionTicket({ customer, result }) {
  if (!customer || !result) return null;

  const issue =
    customer.flight.status === "CANCELLED"
      ? `Flight ${customer.flight.number} cancelled — ${customer.flight.statusReason || "operational reasons"}`
      : `Flight ${customer.flight.number} delayed ${customer.flight.delayHours}h`;

  return (
    <div className="bg-base-800 border border-base-600 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-base-600 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-ink-100">Resolution Summary Ticket</h2>
          <p className="text-[11px] text-ink-500 mt-0.5">Internal case record — not a boarding pass or airline ticket</p>
        </div>
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
            result.isEscalated
              ? "text-rose-400 border-rose-400/30 bg-rose-400/10"
              : "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
          }`}
        >
          {result.isEscalated ? "Escalated" : "Resolved"}
        </span>
      </div>

      <div className="px-4 py-3 text-xs space-y-2.5">
        <Row label="Ticket ID" value={ticketId(customer)} mono />
        <Row label="Customer" value={`${customer.name} (${customer.tier})`} />
        <Row label="Flight" value={`${customer.flight.number} · ${customer.flight.route}`} mono />
        <Row label="Issue" value={issue} />
        <div>
          <p className="text-ink-500 mb-1">Actions</p>
          {result.actionsTaken && result.actionsTaken.length > 0 ? (
            <ul className="list-disc list-inside text-ink-300 space-y-0.5">
              {result.actionsTaken.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-500">None recorded</p>
          )}
        </div>
        <div>
          <p className="text-ink-500 mb-1">Policies applied</p>
          <p className="text-ink-300 font-mono text-[11px]">
            {result.triggeredPolicies && result.triggeredPolicies.length > 0
              ? result.triggeredPolicies.join(", ")
              : "None"}
          </p>
        </div>
        {result.isEscalated && result.escalationReason && (
          <div className="pt-1 border-t border-base-600">
            <p className="text-ink-500 mb-1">Escalation reason</p>
            <p className="text-rose-400">{result.escalationReason}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-ink-500 shrink-0">{label}</span>
      <span className={`text-ink-100 text-right ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
