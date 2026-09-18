export default function Header({ systemDate, health, theme, onToggleTheme }) {
  const operational = health && health.status === "ok";

  return (
    <header className="border-b border-base-600 bg-base-950/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-cyan-400/20 to-amber-400/20 border border-base-600 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M2 16L22 8L20 14L10 16.5L22 19L2 16Z"
                fill="none"
                stroke="#3FC6E0"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight leading-none">AeroResolve AI</h1>
            <p className="text-xs text-ink-500 mt-0.5">Customer Resolution Command Center</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-xs font-mono text-ink-500">
            {systemDate || "Wednesday, 23 September 2026"}
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-base-600 bg-base-800">
            <span
              className={`w-1.5 h-1.5 rounded-full pulse-dot ${
                operational ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            <span className="text-[11px] font-medium text-ink-300">
              {operational ? "System operational" : "System unreachable"}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="w-8 h-8 rounded-full border border-base-600 bg-base-800 flex items-center justify-center text-ink-300 hover:text-cyan-400 hover:border-cyan-400/40 transition-colors"
          >
            {theme === "dark" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="4.5" />
                <path
                  strokeLinecap="round"
                  d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
                />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.5 14.2a8.5 8.5 0 1 1-10.7-10.7 7 7 0 0 0 10.7 10.7Z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
