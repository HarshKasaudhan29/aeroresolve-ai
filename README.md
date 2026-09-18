# AeroResolve AI ✈️
> An AI-powered, policy-grounded customer resolution command center for airline disruptions.

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18%2B-blue.svg)](https://react.dev/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-2.5--Flash-orange.svg)](https://aistudio.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg)](https://tailwindcss.com/)

AeroResolve AI assists airline support teams and passengers by processing flight delay/cancellation queries. It applies strict, deterministic policy checks alongside Google Gemini's natural language understanding to issue vouchers, process refunds, and automatically escalate unauthorized edge cases.

---

## 🌟 Key Features

* **Deterministic Policy Engine:** AI reasoning is strictly validated and corrected by backend policy rules to eliminate hallucinations.
* **Dual Theme UI:** Light & Dark mode support designed as an aviation operations command center.
* **Grounded AI Interactions:** Powered by `gemini-2.5-flash` with structured system prompts containing customer tiers and flight entitlements.
* **Live Audit Inspector:** Displays active customer context, actions log, triggered policies, and real-time escalation status.
* **Resolution Summary Ticket:** Generates an internal case record ticket for each resolution attempt.
* **Pre-built Scenario Tests:** One-click deterministic policy checks for instant validation.

---

                 ┌─────────────────────────────────────┐
                 │        React + Vite Frontend        │
                 │       Command Center Dashboard      │
                 │              :5173                  │
                 └──────────────────┬──────────────────┘
                                    │
                              HTTP fetch()
                                    │
                                    ▼
                 ┌─────────────────────────────────────┐
                 │       Node.js + Express Backend     │
                 │              :5000                  │
                 │                                     │
                 │   /api/chat                         │
                 │   /api/scenario-test                │
                 └───────────────┬─────────────────────┘
                                 │
                 ┌───────────────┴────────────────┐
                 │                                │
                 ▼                                ▼
    ┌────────────────────────┐       ┌────────────────────────┐
    │ airlineData.json       │       │   Google Gemini API     │
    │                        │       │   gemini-3.6-flash      │
    │ • Customer Profiles    │──────▶│                        │
    │ • Booking Data         │       │ Intent Understanding   │
    │ • Airline Policies    │       │ + Response Generation  │
    └────────────────────────┘       └────────────┬───────────┘
                                                  │
                                                  ▼
                              ┌──────────────────────────────┐
                              │   Policy / Response          │
                              │       Validation             │
                              │                              │
                              │ • Validate JSON response     │
                              │ • Check policy constraints   │
                              │ • Check escalation status    │
                              └──────────────┬───────────────┘
                                             │
                                             ▼
                              ┌──────────────────────────────┐
                              │      Structured Response     │
                              │                              │
                              │ • Customer Reply             │
                              │ • Actions Taken              │
                              │ • Triggered Policies         │
                              │ • Escalation Status          │
                              │ • Escalation Reason          │
                              └──────────────┬───────────────┘
                                             │
                                             ▼
                 ┌──────────────────────────────────────────┐
                 │             React Dashboard               │
                 │                                          │
                 │  Chat Window → Audit Inspector           │
                 │  Actions Log → Policies → Resolution     │
                 │                 Ticket                   │
                 └──────────────────────────────────────────┘

## 📁 Project Structure

```text
aeroresolve-ai/
├── client/                      # React + Vite Frontend
│   ├── public/                  # Public assets
│   ├── src/
│   │   ├── components/          # Reusable UI Components
│   │   │   ├── AuditInspector.jsx   # Audit logs & policy triggers
│   │   │   ├── ChatWindow.jsx       # Chat messaging interface
│   │   │   ├── Header.jsx           # Top header & Light/Dark toggle
│   │   │   ├── ProfileSwitcher.jsx  # Customer selection panel
│   │   │   └── ResolutionTicket.jsx # Generated internal resolution record
│   │   ├── App.jsx              # Main App layout & theme state
│   │   ├── index.css            # Tailwind directives & global styles
│   │   └── main.jsx             # React entry point
│   ├── package.json             # Frontend dependencies & scripts
│   ├── tailwind.config.js       # Tailwind configuration
│   └── vite.config.js           # Vite development server settings
│
├── server/                      # Node.js + Express Backend
│   ├── data/
│   │   └── airlineData.json     # Ground-truth dataset (Customers, Flights, Policies)
│   ├── .env                     # Server environment variables (Git ignored)
│   ├── index.js                 # Express server, Gemini client & Policy Engine
│   └── package.json             # Backend dependencies & scripts
│
├── .gitignore                   # Root Git ignore rules
└── README.md                    # Project documentation

⚙️ Environment VariablesCreate a .env file in the server/ directory:Code snippetPORT=5000
GEMINI_API_KEY=your_google_gemini_api_key_here
🚀 Getting StartedPrerequisitesNode.js: v18.0.0 or highernpm: v9.0.0 or higherInstallation & Execution1. Backend SetupBash# Navigate to server directory
cd server

# Install dependencies
npm install

# Start backend server
npm run dev
The API server will start on http://localhost:5000.2. Frontend SetupIn a new terminal tab:Bash# Navigate to client directory
cd client

# Install dependencies
npm install

# Start Vite frontend
npm run dev
The dashboard will open on http://localhost:5173.🔗 API ReferenceMethodEndpointDescriptionGET/api/healthVerifies server status & Gemini API key configuration.GET/api/customersFetches ground-truth customer roster and flight status.POST/api/chatSends customer prompt; returns policy-corrected AI resolution.POST/api/scenario-testRuns a fixed deterministic policy test (scenarioId: 1 | 2 | 3).🧪 Pre-configured Test ScenariosScenarioPassengerFlight StatusRequestExpected System BehaviorScenario 1Priya Nair (Gold)SK-204 (Cancelled)Full refund + Free Business Class upgradeRefund approved, Upgrade denied, EscalatedScenario 2Arvind Kulkarni (Silver)SK-118 (Delayed 4h)Overnight hotel stay requestMeal voucher approved, Hotel denied ($\le$5h delay), No escalationScenario 3Meher Kaur (Platinum)SK-305 (Delayed 6h)Full-night hotel + ₹2,000 waiver askMeal & partial stay approved, Waiver exceeds limit, Escalated🛡️ Policy Engine Safety MeasuresZero Hallucination Guarantee: The backend policy validator (validateAndCorrect()) overrides Gemini outputs if the AI grants unauthorized waivers, improper refund accounts, or incorrect class upgrades.Graceful Fallbacks: If the AI model response is malformed or times out, the backend defaults to a safe Human Escalation Ticket without crashing the app.
