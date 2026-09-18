const POLICY_LABELS = {
  CANCELLATION: "Cancellation — rebook or refund",
  DELAY_UNDER_3H: "Delay <3h — meal voucher",
  DELAY_OVER_3H: "Delay >3h — voucher + lounge",
  DELAY_OVER_5H: "Delay >5h — voucher + lounge + partial hotel",
  REFUND_POLICY: "Refund — original method, 7 business days",
  VOLUNTARY_REBOOKING_FARE: "Voluntary rebooking — fare difference applies",
  AGENT_WAIVER_LIMIT: "Agent waiver limit — ₹1,500 max",
  TIER_PRIORITY_NO_COMPENSATION: "Tier priority — no extra compensation",
  LEGAL_THREAT_ESCALATION: "Legal/formal threat — mandatory escalation",
  NO_OVER_COMPENSATION: "No over-compensation",
};

export default function AuditInspector({ customer, result }) {
  return (
    <div className="bg-base-800 border border-base-600 rounded-lg overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-base-600">
        <h2 className="text-sm font-medium text-ink-100">Active context</h2>
        <p className="text-xs text-ink-500 mt-0.5">Audit trail for this case</p>
      </div>

      {!customer ? (
        <p className="px-4 py-6 text-xs text-ink-500">No customer selected.</p>
      ) : (
        <div className="thin-scroll overflow-y-auto max-h-[70vh]">
          <dl className="px-4 py-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs border-b border-base-600">
            <Field label="Customer" value={customer.name} />
            <Field label="Tier" value={customer.tier} />
            <Field label="Reference" value={customer.referenceCode} mono />
            <Field label="Flight" value={customer.flight.number} mono />
            <Field label="Route" value={customer.flight.route} />
            <Field
              label="Status"
              value={
                customer.flight.status === "DELAYED"
                  ? `DELAYED ${customer.flight.delayHours}h`
                  : customer.flight.status
              }
            />
          </dl>

          <div className="px-4 py-3 border-b border-base-600">
            <h3 className="text-xs font-medium text-ink-300 mb-2">Actions log</h3>
            {result && result.actionsTaken && result.actionsTaken.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {result.actionsTaken.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-ink-300">
                    <span className="mt-1 w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ink-500">No actions recorded yet.</p>
            )}
          </div>

          <div className="px-4 py-3 border-b border-base-600">
            <h3 className="text-xs font-medium text-ink-300 mb-2">Triggered policies</h3>
            {result && result.triggeredPolicies && result.triggeredPolicies.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {result.triggeredPolicies.map((p, i) => (
                  <li
                    key={i}
                    className="text-[11px] font-mono text-cyan-400 bg-cyan-400/[0.06] border border-cyan-400/20 rounded px-2 py-1"
                  >
                    {POLICY_LABELS[p] || p}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ink-500">None yet.</p>
            )}
          </div>

          <div className="px-4 py-3">
            <h3 className="text-xs font-medium text-ink-300 mb-2">Escalation</h3>
            {result ? (
              result.isEscalated ? (
                <div className="text-xs">
                  <span className="inline-flex items-center gap-1.5 text-rose-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Escalated
                  </span>
                  {result.escalationReason && (
                    <p className="text-ink-500 mt-1.5">{result.escalationReason}</p>
                  )}
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Resolved by agent
                </span>
              )
            ) : (
              <p className="text-xs text-ink-500">No case activity yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div>
      <dt className="text-ink-500">{label}</dt>
      <dd className={`text-ink-100 mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
