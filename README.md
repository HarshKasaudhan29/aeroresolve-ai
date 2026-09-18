# AeroResolve AI ✈️

> An AI-powered, policy-grounded customer resolution command center for airline disruptions.

AeroResolve AI is a full-stack AI customer-resolution platform designed to assist airline support teams and passengers during flight cancellations and delays.

The system combines **React, Node.js/Express, Google Gemini, deterministic policy validation, customer booking data, audit logging, and escalation workflows** to provide controlled and explainable resolutions.

Unlike a generic chatbot, AeroResolve AI does not simply accept every customer request. It evaluates the request against predefined airline policies, identifies allowed and disallowed actions, and escalates cases that require human intervention.

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Objectives](#-objectives)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Data & Ground Truth](#-data--ground-truth)
- [Business Policies](#-business-policies)
- [AI Response Format](#-ai-response-format)
- [Policy Validation Engine](#-policy-validation-engine)
- [API Reference](#-api-reference)
- [Pre-configured Scenarios](#-pre-configured-scenarios)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [How the System Works](#-how-the-system-works)
- [Example Interaction](#-example-interaction)
- [Safety & Escalation](#-safety--escalation)
- [Troubleshooting](#-troubleshooting)
- [Limitations](#-limitations)
- [Future Enhancements](#-future-enhancements)
- [Conclusion](#-conclusion)

---

# ✈️ Project Overview

Airline disruptions such as flight cancellations and long delays often require customer-service agents to make decisions based on multiple policies.

AeroResolve AI provides an AI-assisted command center that can:

- Understand customer requests using natural language.
- Retrieve the selected customer's booking context.
- Apply predefined airline policies.
- Determine eligible benefits and resolutions.
- Reject requests outside policy.
- Detect situations requiring human escalation.
- Maintain a live audit trail.
- Generate an internal resolution summary ticket.

The application is designed as a **policy-grounded AI agent**, rather than an unrestricted conversational chatbot.

---

# 🎯 Objectives

The primary objectives of AeroResolve AI are:

1. Provide an intelligent conversational interface for airline disruption cases.
2. Ground AI responses in customer and booking information.
3. Apply deterministic business rules to important decisions.
4. Prevent unauthorized compensation or fare waivers.
5. Automatically identify cases requiring human intervention.
6. Provide transparent action and policy logs.
7. Generate an auditable resolution summary for each case.
8. Demonstrate how generative AI can be integrated with deterministic business logic.

---

# 🌟 Key Features

## 1. Customer Context Management

The system contains predefined customer profiles with:

- Customer name
- Loyalty tier
- Booking/reference number
- Contact information
- Travel history
- Flight information
- Current disruption status

Supported customers:

- Priya Nair — Gold
- Arvind Kulkarni — Silver
- Meher Kaur — Platinum

---

## 2. AI-Powered Chat

Customers can interact with the AeroResolve AI agent using natural language.

Example:

> "My flight SK-204 was cancelled. Am I eligible for a full refund and a free Business Class upgrade?"

The agent analyzes the request and produces a structured resolution.

---

## 3. Policy-Grounded Responses

The AI receives the relevant customer context and predefined airline policies.

The system is designed to prevent the model from inventing:

- Refund eligibility
- Compensation
- Hotel benefits
- Fare waivers
- Loyalty benefits
- Booking information

---

## 4. Deterministic Policy Validation

AI output is checked by backend validation logic.

The validation layer can correct or reject AI decisions that conflict with known business rules.

This provides an additional layer of control between the generative model and the final UI response.

---

## 5. Live Audit Inspector

The right-side Audit Inspector provides visibility into:

- Active customer
- PNR/reference
- Loyalty tier
- Flight
- Route
- Actions taken
- Triggered policies
- Escalation status
- Escalation reason

This makes the AI decision process easier to inspect.

---

## 6. Resolution Summary Ticket

After a resolution or escalation, the application can generate an internal case summary containing:

- Ticket ID
- Customer
- Loyalty tier
- Flight
- Route
- Issue
- Actions taken
- Policies applied
- Escalation status
- Escalation reason

> This is an internal case record and is not a real airline boarding pass or ticket.

---

## 7. Scenario Testing

Three predefined scenarios are available for quick demonstration and validation.

These scenarios reproduce the core assignment test cases without requiring manual conversation setup.

---

## 8. Dual Theme Interface

The dashboard supports:

- Dark mode
- Light mode

The UI is designed as an aviation operations command center.

---

# 🧰 Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Backend | Node.js |
| API Framework | Express.js |
| AI | Google Gemini API |
| Data Layer | JSON |
| API Communication | REST / HTTP fetch |
| Environment Configuration | dotenv |
| Cross-Origin Support | CORS |

---

# 🏗️ System Architecture

```text
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
                 │   /api/health                       │
                 │   /api/customers                    │
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
