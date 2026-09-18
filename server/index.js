import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Ground-truth data
// ---------------------------------------------------------------------------
const dataPath = path.join(__dirname, "data", "airlineData.json");
const airlineData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

const AGENT_WAIVER_LIMIT = 1500;

function getCustomerById(customerId) {
  return airlineData.customers.find((c) => c.id === customerId) || null;
}

// ---------------------------------------------------------------------------
// Gemini client
// ---------------------------------------------------------------------------
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;
const GEMINI_MODEL = "gemini-3.5-flash";

// ---------------------------------------------------------------------------
// Deterministic policy engine
// Computes the ground-truth entitlements for a customer's flight disruption,
// independent of the LLM. The LLM's output is validated/corrected against
// this so policy decisions never depend solely on model behavior.
// ---------------------------------------------------------------------------
function computeBaseEntitlements(customer) {
  const flight = customer.flight;
  const entitlements = [];

  if (flight.status === "CANCELLED") {
    entitlements.push({
      policyId: "CANCELLATION",
      grants: [
        "Free rebooking within 24 hours (customer's choice)",
        "OR full refund to original payment method (customer's choice)",
      ],
    });
  } else if (flight.status === "DELAYED") {
    const h = flight.delayHours;
    if (h > 5) {
      entitlements.push({
        policyId: "DELAY_OVER_5H",
        grants: [
          "₹500 meal voucher",
          "Lounge access",
          "Hotel accommodation covering ONLY the delayed hours (not a full night)",
        ],
      });
    } else if (h > 3) {
      entitlements.push({
        policyId: "DELAY_OVER_3H",
        grants: ["₹500 meal voucher", "Lounge access"],
      });
    } else if (h > 0) {
      entitlements.push({
        policyId: "DELAY_UNDER_3H",
        grants: ["₹500 meal voucher"],
      });
    }
  }

  if (customer.tier === "Gold" || customer.tier === "Platinum") {
    entitlements.push({
      policyId: "TIER_PRIORITY_NO_COMPENSATION",
      grants: ["Priority seat rebooking (no extra financial compensation)"],
    });
  }

  return entitlements;
}

// Detect customer intents from free text that require backend-enforced denial
// or escalation, so the model cannot silently over-grant.
function detectRequestFlags(message) {
  const m = message.toLowerCase();
  return {
    asksUpgrade: /business upgrade|business class|first class|free upgrade/.test(m),
    asksFullNightHotel: /full night|entire night|whole night|full-night/.test(m),
    asksAltPaymentRefund: /paypal|another account|different card|other payment|alternate payment|crypto|upi to a different/.test(m),
    asksRefund: /refund/.test(m),
    asksHotel: /hotel|accommodation|room/.test(m),
    legalThreat: /lawyer|legal action|sue|court|consumer forum|legal notice|file a complaint against you legally|dgca complaint|formal complaint/.test(m),
    waiverAmount: (() => {
      const match = m.match(/₹\s?([\d,]+)|rs\.?\s?([\d,]+)|inr\s?([\d,]+)/);
      if (!match) return null;
      const raw = (match[1] || match[2] || match[3] || "").replace(/,/g, "");
      const num = parseInt(raw, 10);
      return Number.isNaN(num) ? null : num;
    })(),
  };
}

// Validate & correct the model's structured output against ground-truth policy.
// Returns the corrected result plus the list of triggered policy IDs.
function validateAndCorrect(customer, message, modelResult) {
  const flags = detectRequestFlags(message);
  const base = computeBaseEntitlements(customer);
  const triggeredPolicies = new Set(
    (modelResult.triggeredPolicies || []).filter((p) =>
      airlineData.policies.some((pol) => pol.id === p)
    )
  );
  base.forEach((e) => triggeredPolicies.add(e.policyId));

  let isEscalated = Boolean(modelResult.isEscalated);
  let escalationReason = modelResult.escalationReason || null;
  let actionsTaken = Array.isArray(modelResult.actionsTaken)
    ? [...modelResult.actionsTaken]
    : [];

  // Legal/formal threat -> mandatory escalation
  if (flags.legalThreat) {
    isEscalated = true;
    escalationReason =
      "Customer indicated intent to pursue legal or formal complaint action — escalated to human supervisor per policy.";
    triggeredPolicies.add("LEGAL_THREAT_ESCALATION");
  }

  // Upgrade requested on Gold/Platinum with no extra compensation allowed
  if (flags.asksUpgrade) {
    triggeredPolicies.add("TIER_PRIORITY_NO_COMPENSATION");
    actionsTaken = actionsTaken.filter(
      (a) => !/business upgrade|free upgrade|complimentary upgrade/i.test(a)
    );
    if (customer.flight.status === "CANCELLED") {
      isEscalated = true;
      escalationReason = escalationReason
        ? escalationReason
        : "Customer requested a complimentary business-class upgrade, which policy does not permit — escalated for review.";
    }
  }

  // Full-night hotel requested beyond delayed-hours-only entitlement
  if (flags.asksFullNightHotel && customer.flight.status === "DELAYED") {
    triggeredPolicies.add("DELAY_OVER_5H");
    actionsTaken = actionsTaken.filter(
      (a) => !/full night|entire night|whole night/i.test(a)
    );
  }

  // Refund can never go to an alternate payment method
  if (flags.asksAltPaymentRefund) {
    triggeredPolicies.add("REFUND_POLICY");
    actionsTaken = actionsTaken.filter(
      (a) => !/alternate payment|different card|paypal|other payment method/i.test(a)
    );
    isEscalated = true;
    escalationReason = escalationReason
      ? escalationReason
      : "Customer requested refund to a non-original payment method, which is not permitted.";
  }

  // Waiver amount above the agent's authority
  if (flags.waiverAmount !== null && flags.waiverAmount > AGENT_WAIVER_LIMIT) {
    isEscalated = true;
    escalationReason = `Requested compensation of ₹${flags.waiverAmount} exceeds the agent waiver limit of ₹${AGENT_WAIVER_LIMIT} — requires supervisor approval.`;
    triggeredPolicies.add("AGENT_WAIVER_LIMIT");
  }

  // Hotel requested for a delay of 5h or less is not entitled
  if (
    flags.asksHotel &&
    customer.flight.status === "DELAYED" &&
    customer.flight.delayHours <= 5
  ) {
    actionsTaken = actionsTaken.filter((a) => !/hotel|accommodation/i.test(a));
  }

  return {
    ...modelResult,
    actionsTaken,
    triggeredPolicies: Array.from(triggeredPolicies),
    isEscalated,
    escalationReason: isEscalated ? escalationReason : null,
  };
}

function buildSystemPrompt(customer) {
  const entitlements = computeBaseEntitlements(customer);
  return `You are AeroResolve AI, an airline customer-resolution agent. You must act ONLY on the ground-truth data and policies below. Never invent customer details, policies, compensation amounts, authority, or completed actions. Never state an action was taken unless it is permitted by policy.

SYSTEM DATE: ${airlineData.systemDateDisplay}

CUSTOMER:
${JSON.stringify(customer, null, 2)}

FLIGHT-BASED ENTITLEMENTS (ground truth, computed from policy):
${JSON.stringify(entitlements, null, 2)}

ALL POLICIES:
${JSON.stringify(airlineData.policies, null, 2)}

RULES:
- Cancellation: customer chooses free rebooking within 24h OR full refund. Never both, never neither.
- Delay <3h: ₹500 meal voucher only.
- Delay >3h: meal voucher + lounge access.
- Delay >5h: meal voucher + lounge + hotel covering ONLY delayed hours (never a full night).
- Refunds: full refund within 7 business days to ORIGINAL payment method only. Never another method.
- Voluntary rebooking to a higher fare requires the customer to pay the fare difference.
- You may waive at most ₹1500. Anything above requires escalation.
- Gold/Platinum: priority seat rebooking only, NO extra financial compensation.
- Any legal/formal complaint threat requires immediate escalation.
- Never over-compensate. Deny anything not explicitly permitted, politely and clearly, citing the applicable policy.

RESPONSE FORMAT: Respond with ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:
{
  "customerName": "string",
  "replyMessage": "string (what you say to the customer, empathetic but policy-accurate)",
  "actionsTaken": ["string", ...],
  "triggeredPolicies": ["POLICY_ID", ...],
  "isEscalated": boolean,
  "escalationReason": "string or null"
}`;
}

function safeParseModelJson(text) {
  if (!text) return null;
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/```\s*$/i, "");
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) return null;
  cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    return null;
  }
}

function normalizeModelResult(customer, parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  return {
    customerName: typeof parsed.customerName === "string" ? parsed.customerName : customer.name,
    replyMessage:
      typeof parsed.replyMessage === "string"
        ? parsed.replyMessage
        : "I'm sorry, I wasn't able to generate a response. Please try again.",
    actionsTaken: Array.isArray(parsed.actionsTaken) ? parsed.actionsTaken.filter((a) => typeof a === "string") : [],
    triggeredPolicies: Array.isArray(parsed.triggeredPolicies)
      ? parsed.triggeredPolicies.filter((p) => typeof p === "string")
      : [],
    isEscalated: Boolean(parsed.isEscalated),
    escalationReason: typeof parsed.escalationReason === "string" ? parsed.escalationReason : null,
  };
}

async function runAgent(customer, message, conversationHistory) {
  const systemPrompt = buildSystemPrompt(customer);

  if (!genAI) {
    // No API key configured — fail clearly rather than fabricate a response.
    throw Object.assign(
      new Error(
        "GEMINI_API_KEY is not configured on the server. Set it in server/.env to enable the agent."
      ),
      { code: "NO_API_KEY" }
    );
  }

  const historyText = (conversationHistory || [])
    .map((turn) => `${turn.role === "user" ? "Customer" : "Agent"}: ${turn.content}`)
    .join("\n");

  const prompt = `${systemPrompt}

CONVERSATION SO FAR:
${historyText || "(none)"}

NEW CUSTOMER MESSAGE:
${message}

Respond now with ONLY the JSON object described above.`;

  let text;
  try {
    const result = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    text = result.text;
  } catch (err) {
    throw Object.assign(new Error(`Gemini API request failed: ${err.message}`), {
      code: "GEMINI_ERROR",
    });
  }

  const parsed = safeParseModelJson(text);
  const normalized = normalizeModelResult(customer, parsed);

  if (!normalized) {
    // Malformed JSON from the model — return a safe, non-crashing fallback.
    return {
      customerName: customer.name,
      replyMessage:
        "I'm having trouble processing that request right now. A member of our support team will follow up shortly.",
      actionsTaken: [],
      triggeredPolicies: [],
      isEscalated: true,
      escalationReason: "Agent response could not be validated — routed to human review.",
    };
  }

  return validateAndCorrect(customer, message, normalized);
}

// ---------------------------------------------------------------------------
// Deterministic scenario tests (do not depend on live model variance for
// the pass/fail shape — backend policy engine guarantees correctness even
// if the model text differs).
// ---------------------------------------------------------------------------
const SCENARIOS = {
  1: {
    customerId: "priya",
    message: "My flight was cancelled. I want a full refund AND a free business class upgrade for the inconvenience.",
  },
  2: {
    customerId: "arvind",
    message: "My flight is delayed 4 hours. Can I get a hotel room while I wait?",
  },
  3: {
    customerId: "meher",
    message: "My flight is delayed 6 hours. I want a full night's hotel stay and a ₹2,000 waiver for my trouble.",
  },
};

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    systemDate: airlineData.systemDateDisplay,
    geminiConfigured: Boolean(apiKey),
  });
});

app.get("/api/customers", (req, res) => {
  res.json({ customers: airlineData.customers });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { customerId, message, conversationHistory } = req.body || {};

    if (!customerId || typeof customerId !== "string") {
      return res.status(400).json({ error: "customerId is required." });
    }
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required." });
    }

    const customer = getCustomerById(customerId);
    if (!customer) {
      return res.status(404).json({ error: `Unknown customerId: ${customerId}` });
    }

    const result = await runAgent(customer, message, conversationHistory);
    res.json(result);
  } catch (err) {
    console.error("POST /api/chat error:", err.message);
    if (err.code === "NO_API_KEY") {
      return res.status(503).json({ error: err.message });
    }
    res.status(502).json({ error: "The resolution agent failed to respond. Please try again." });
  }
});

app.post("/api/scenario-test", async (req, res) => {
  try {
    const { scenarioId } = req.body || {};
    const scenario = SCENARIOS[scenarioId];
    if (!scenario) {
      return res.status(400).json({ error: `Unknown scenarioId: ${scenarioId}` });
    }

    const customer = getCustomerById(scenario.customerId);
    const result = await runAgent(customer, scenario.message, []);
    res.json({ scenarioId, customerMessage: scenario.message, result });
  } catch (err) {
    console.error("POST /api/scenario-test error:", err.message);
    if (err.code === "NO_API_KEY") {
      return res.status(503).json({ error: err.message });
    }
    res.status(502).json({ error: "The resolution agent failed to respond. Please try again." });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`AeroResolve AI server listening on http://localhost:${PORT}`);
  if (!apiKey) {
    console.warn(
      "WARNING: GEMINI_API_KEY is not set. /api/chat and /api/scenario-test will return 503 until it is configured in server/.env"
    );
  }
});
