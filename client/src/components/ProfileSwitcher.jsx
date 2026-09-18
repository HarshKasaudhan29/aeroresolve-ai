const TIER_STYLES = {
  Gold: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  Silver: "text-ink-300 border-ink-500/30 bg-ink-500/10",
  Platinum: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
};

const STATUS_STYLES = {
  CANCELLED: "text-rose-400 bg-rose-400/10 border-rose-400/30",
  DELAYED: "text-amber-400 bg-amber-400/10 border-amber-400/30",
};

const SCENARIOS = [
  { id: 1, customerId: "priya", label: "Scenario 1 — Cancellation + upgrade ask" },
  { id: 2, customerId: "arvind", label: "Scenario 2 — 4h delay, hotel ask" },
  { id: 3, customerId: "meher", label: "Scenario 3 — 6h delay, full-night + ₹2,000" },
];

export default function ProfileSwitcher({
  customers,
  selectedCustomerId,
  onSelect,
  onRunScenario,
  loadingCustomerId,
}) {
  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div className="bg-base-800 border border-base-600 rounded-lg overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-base-600">
          <h2 className="text-sm font-medium text-ink-100">Customer roster</h2>
          <p className="text-xs text-ink-500 mt-0.5">Select a passenger to open their case</p>
        </div>

        <div className="thin-scroll overflow-y-auto max-h-[52vh]">
          {customers.length === 0 && (
            <p className="px-4 py-6 text-xs text-ink-500">Loading customers…</p>
          )}
          {customers.map((c) => {
            const active = c.id === selectedCustomerId;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`w-full text-left px-4 py-3 border-b border-base-600 last:border-b-0 transition-colors ${
                  active ? "bg-cyan-400/[0.06]" : "hover:bg-base-700/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink-100">{c.name}</span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${TIER_STYLES[c.tier] || ""}`}
                  >
                    {c.tier}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-xs font-mono text-ink-500">
                  <span>{c.referenceCode}</span>
                  <span className="text-base-500">·</span>
                  <span>{c.flight.number}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-ink-500">{c.flight.route}</span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                      STATUS_STYLES[c.flight.status] || ""
                    }`}
                  >
                    {c.flight.status}
                    {c.flight.status === "DELAYED" ? ` ${c.flight.delayHours}h` : ""}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-base-800 border border-base-600 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-base-600">
          <h2 className="text-sm font-medium text-ink-100">Scenario tests</h2>
          <p className="text-xs text-ink-500 mt-0.5">Deterministic policy checks</p>
        </div>
        <div className="p-3 flex flex-col gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => onRunScenario(s.id, s.customerId)}
              disabled={loadingCustomerId === s.customerId}
              className="text-left px-3 py-2 rounded-md border border-base-600 bg-base-700/50 hover:bg-base-700 hover:border-cyan-400/40 transition-colors text-xs text-ink-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingCustomerId === s.customerId ? "Running…" : s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
