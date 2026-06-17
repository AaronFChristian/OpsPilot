# DECISIONS.md

Architectural decisions made during the OpsPilot build. Each record documents the choice, what was considered, and why.

---

## 1. Claude Haiku over Sonnet for all operations

**Decision:** Use `claude-haiku-4-5-20251001` for classification, drafting, and executive summary generation.

**Alternatives considered:** Claude Sonnet for drafting (higher quality responses), Claude Sonnet for classification (better JSON adherence).

**Reasoning:** Classification is a routing decision with a constrained output schema — category from 5 options, priority from 4 options, a boolean, a float, and a list. Haiku handles this reliably at $0.0006 per classify call vs $0.007 for Sonnet — a 12x cost difference with no measurable quality improvement on structured outputs. Draft quality was evaluated on 10 tickets; Haiku produced professional, empathetic responses indistinguishable from Sonnet for standard P2–P4 tickets. Sonnet remains the upgrade path if classification accuracy drops below 90% on a labeled test set.

**Cost impact:** 20 tickets processed for $0.0311 total. Sonnet equivalent would have cost ~$0.37 — 12x more for the same output.

---

## 2. Structured JSON output over tool_use for classification

**Decision:** Classification system prompt instructs the model to return ONLY valid JSON. Parsed with `json.loads()` after stripping markdown fences.

**Alternatives considered:** Anthropic tool_use / function calling for guaranteed schema enforcement.

**Reasoning:** Tool_use adds streaming complexity and a second round-trip for simple single-turn classification. The system prompt with a JSON schema example achieves the same structured output at lower latency. Tool_use is used in the MCP server layer where multi-step orchestration and tool selection across multiple calls justify the overhead. A regex-based markdown fence stripper handles the rare case where the model wraps JSON in backticks.

---

## 3. max_tokens=150 for classification, max_tokens=300 for drafts

**Decision:** Hard token caps per operation rather than a single generous limit.

**Alternatives considered:** max_tokens=1024 across the board (simpler), dynamic caps based on ticket length.

**Reasoning:** Classification JSON is 80–100 tokens. A cap of 150 prevents runaway costs on malformed outputs. If the model cannot fit a valid classification in 150 tokens, the system prompt needs tightening — not the cap. Draft responses are capped at 300 tokens to enforce conciseness. Support responses exceeding 300 tokens are almost always padded with disclaimers that frustrate customers. The cap is a product decision as much as a cost decision.

---

## 4. Confidence-based escalation, not category-based

**Decision:** Escalate if `confidence < 0.7` OR `priority == "P1"`. No per-category escalation rules.

**Alternatives considered:** Rule-based escalation (billing tickets always escalate, security keywords trigger escalation), separate classification call for escalation.

**Reasoning:** Category-based rules become brittle as ticket language varies. "I need to fix my account ASAP" could be account, billing, or technical. Confidence-based escalation is model-agnostic and self-adjusting — ambiguous language escalates regardless of which category wins. P1 tickets escalate unconditionally because the cost of a missed security incident or outage exceeds any throughput gain from automation.

---

## 5. Blocker trends from SQL aggregations, not AI

**Decision:** `/analytics/blockers` aggregates tag frequency using Python `Counter` over Supabase results. No LLM call.

**Alternatives considered:** Ask Claude to identify the top blockers from a summary of recent tickets, use embeddings to cluster similar tickets.

**Reasoning:** Aggregating tag frequency is a deterministic operation with one correct answer. Running it through an LLM adds cost, latency, and non-determinism to a query that does not benefit from language understanding. Tags are already structured data produced by the classification step — counting them is a SQL/Python operation, not an AI task. The "top recurring blockers" insight is only valuable if it is provably accurate; an LLM summary of blockers introduces the possibility of confabulation in a context where precision matters.

---

## 6. Supabase over self-hosted Postgres

**Decision:** Use Supabase free tier for the Postgres database.

**Alternatives considered:** Local Postgres via Docker, PlanetScale, Neon.

**Reasoning:** Supabase provides hosted Postgres with a built-in REST API, real-time subscriptions, and Supabase Auth — all on a free tier with 500MB storage. For a portfolio project during a job search, eliminating infra overhead is worth the vendor dependency. Row-level security is disabled because all database access goes through the FastAPI backend; the browser never talks to Supabase directly. The Anthropic SDK and Supabase Python client are the only external services with credentials, both stored in Railway environment variables.

---

## 7. Human-in-the-loop as an architectural requirement

**Decision:** Every AI draft requires explicit human approval before status changes to "resolved". The approve button is never auto-clicked programmatically.

**Alternatives considered:** Auto-resolve P4 tickets with high-confidence drafts, auto-send drafts via webhook to a mock email API.

**Reasoning:** This is not a UX decision — it is the boundary between AI assistance and AI autonomy in a customer-facing context. A wrong response sent automatically reaches a paying customer. The draft is a starting point; the human is the accountable party. The human-in-the-loop checkpoint is also the most defensible answer to the interview question "how do you make sure the AI doesn't send something wrong?" Demonstrating HITL explicitly, with a visible approval flow in the UI, signals production-AI maturity that "I added a prompt saying be careful" does not.

---

## What I would add with more time

- **CI-gated eval harness:** A labeled test set of 50 tickets with known classifications. GitHub Actions runs the eval on every PR and blocks merge if accuracy drops below 90%.
- **LangSmith tracing:** Full trace of each classify and draft call with token cost per node, latency p50/p95, and a regression dashboard.
- **Redis cache for duplicate detection:** Hash ticket title+body; if a near-identical ticket was processed in the last 7 days, return the cached classification and skip the Claude call.
- **Webhook integration with Zendesk/Intercom:** Replace the mock MCP Slack tool with a real webhook that updates ticket status in an external system.
- **Fine-tuned classifier:** After collecting 500+ labeled tickets from real ops data, fine-tune Haiku on company-specific categories. Expected: classification latency drops from 1,450ms to under 200ms, cost drops 10x.
