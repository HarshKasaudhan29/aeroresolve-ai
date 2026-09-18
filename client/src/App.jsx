import { useEffect, useState, useCallback } from "react";
import Header from "./components/Header.jsx";
import ProfileSwitcher from "./components/ProfileSwitcher.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import AuditInspector from "./components/AuditInspector.jsx";
import ResolutionTicket from "./components/ResolutionTicket.jsx";

const API_BASE = "https://aeroresolve-ai.onrender.com";

function getInitialTheme() {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem("aeroresolve-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export default function App() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [health, setHealth] = useState(null);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    window.localStorage.setItem("aeroresolve-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  // conversation + result state, keyed by customer id
  const [conversations, setConversations] = useState({});
  const [results, setResults] = useState({});
  const [loadingCustomerId, setLoadingCustomerId] = useState(null);
  const [errorByCustomer, setErrorByCustomer] = useState({});

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: "unreachable" }));

    fetch(`${API_BASE}/api/customers`)
      .then((r) => r.json())
      .then((data) => {
        setCustomers(data.customers || []);
        if (data.customers && data.customers.length > 0) {
          setSelectedCustomerId(data.customers[0].id);
        }
      })
      .catch(() =>
        setErrorByCustomer((prev) => ({ ...prev, global: "Cannot reach AeroResolve backend on port 5000." }))
      );
  }, []);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;
  const messages = conversations[selectedCustomerId] || [];
  const activeResult = results[selectedCustomerId] || null;
  const isLoading = loadingCustomerId === selectedCustomerId;
  const activeError = errorByCustomer[selectedCustomerId] || null;

  const sendMessage = useCallback(
    async (customerId, text) => {
      const history = conversations[customerId] || [];
      const userTurn = { role: "user", content: text };
      const nextHistory = [...history, userTurn];
      setConversations((prev) => ({ ...prev, [customerId]: nextHistory }));
      setLoadingCustomerId(customerId);
      setErrorByCustomer((prev) => ({ ...prev, [customerId]: null }));

      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId,
            message: text,
            conversationHistory: history,
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `Request failed (${res.status})`);
        }

        const result = await res.json();
        const agentTurn = { role: "agent", content: result.replyMessage };
        setConversations((prev) => ({
          ...prev,
          [customerId]: [...nextHistory, agentTurn],
        }));
        setResults((prev) => ({ ...prev, [customerId]: result }));
      } catch (err) {
        setErrorByCustomer((prev) => ({ ...prev, [customerId]: err.message }));
      } finally {
        setLoadingCustomerId(null);
      }
    },
    [conversations]
  );

  const runScenario = useCallback(async (scenarioId, customerId) => {
    setSelectedCustomerId(customerId);
    setLoadingCustomerId(customerId);
    setErrorByCustomer((prev) => ({ ...prev, [customerId]: null }));

    try {
      const res = await fetch(`${API_BASE}/api/scenario-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Scenario failed (${res.status})`);
      }

      const { customerMessage, result } = await res.json();
      const userTurn = { role: "user", content: customerMessage };
      const agentTurn = { role: "agent", content: result.replyMessage };
      setConversations((prev) => ({
        ...prev,
        [customerId]: [...(prev[customerId] || []), userTurn, agentTurn],
      }));
      setResults((prev) => ({ ...prev, [customerId]: result }));
    } catch (err) {
      setErrorByCustomer((prev) => ({ ...prev, [customerId]: err.message }));
    } finally {
      setLoadingCustomerId(null);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header systemDate={health?.systemDate} health={health} theme={theme} onToggleTheme={toggleTheme} />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 max-w-[1600px] w-full mx-auto">
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
          <ProfileSwitcher
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            onSelect={setSelectedCustomerId}
            onRunScenario={runScenario}
            loadingCustomerId={loadingCustomerId}
          />
        </div>

        <div className="lg:col-span-6 flex flex-col min-h-0">
          <ChatWindow
            customer={selectedCustomer}
            messages={messages}
            onSend={(text) => selectedCustomerId && sendMessage(selectedCustomerId, text)}
            isLoading={isLoading}
            error={activeError}
            escalation={activeResult && activeResult.isEscalated ? activeResult : null}
          />
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
          <AuditInspector customer={selectedCustomer} result={activeResult} />
          {activeResult && <ResolutionTicket customer={selectedCustomer} result={activeResult} />}
        </div>
      </main>
    </div>
  );
}
