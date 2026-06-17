# OpsPilot

**A production AI triage system where every support ticket is classified, prioritized, and drafted in under 3 seconds — with human-in-the-loop approval before anything is sent.**

Ops teams spend 2–3 hours a day manually reading, sorting, and first-responding to tickets. OpsPilot eliminates that. A Claude-powered pipeline classifies every ticket into a typed Pydantic object, drafts a response scoped to its priority SLA, flags edge cases for human review, tracks recurring blockers over time, and generates a one-click executive summary for Monday morning.

[![Cost per ticket](https://img.shields.io/badge/cost_per_ticket-$0.00135-4caf7d?style=flat-square)](https://github.com/AaronFChristian/OpsPilot/blob/main/backend/app/services/ai_service.py)
[![Avg latency](https://img.shields.io/badge/avg_latency-2073ms-4caf7d?style=flat-square)](https://github.com/AaronFChristian/OpsPilot/blob/main/backend/app/routers/analytics.py)
[![Model](https://img.shields.io/badge/model-claude--haiku--4--5-6c63ff?style=flat-square)](https://github.com/AaronFChristian/OpsPilot/blob/main/backend/app/services/ai_service.py)
[![Live Demo](https://img.shields.io/badge/demo-live-6c63ff?style=flat-square)](https://ops-pilot-sooty.vercel.app)
[![MCP Server](https://img.shields.io/badge/MCP-server_ready-orange?style=flat-square)](https://github.com/AaronFChristian/OpsPilot/blob/main/backend/app/services/mcp_service.py)

---

## The Problem

Support teams manually triage 200+ tickets a day — reading, classifying priority, routing to the right team, drafting a first response, and deciding what to escalate. That's 2–3 hours of skilled ops time spent on mechanical decisions. Worse, recurring blockers (the same authentication failure reported 14 times this month) are invisible until someone runs a report no one has time to write.

OpsPilot solves both ends. Every ticket that comes in is classified in under 2 seconds with a structured output: category, priority (P1–P4), sentiment, escalation flag, confidence score, and tags. A response draft is generated scoped to that priority's SLA. P1s and low-confidence classifications auto-escalate to a human queue. The blocker trend engine surfaces recurring issues from SQL aggregations — no AI call, no hallucination. An executive summary of the week's tickets is one button click.

The design principle: AI handles the 80% that is mechanical. Humans handle the 20% that matters.

---

## Architecture

Three layers working together:

**Layer 1 — AI classification and drafting pipeline:** Two sequential Claude Haiku calls per ticket. Call 1 returns a typed JSON object (category, priority, sentiment, escalate, tags, confidence). Call 2 drafts a response scoped to the priority SLA. Both calls are logged to `ai_logs` with token counts, cost in USD, and latency in milliseconds.

**Layer 2 — Human-in-the-loop review:** Every AI draft lands in an editable textarea before anything is sent. Ops agents read, edit, and click Approve. P1 tickets and any classification with confidence below 0.7 are automatically moved to the escalated queue. The AI is a first drafter, not an autonomous sender.

**Layer 3 — Observability and analytics:** Every API call to Claude is logged with cost and latency. The Observability page shows per-request breakdown — classify vs draft, token counts, green/orange/red latency coloring. The Executive Summary page generates a COO-ready narrative from ticket aggregations in one click.

---

## Live Links

| Resource | URL |
|---|---|
| Frontend | https://ops-pilot-sooty.vercel.app |
| Backend API Docs | https://opspilot-production-8d98.up.railway.app/docs |
| GitHub | https://github.com/AaronFChristian/OpsPilot |

---

## Tech Stack

### Backend and AI

- **FastAPI** — async REST API, CORS, structured JSON responses
- **Anthropic Claude Haiku 4.5** — classification (max 150 tokens) and drafting (max 300 tokens)
- **Pydantic** — typed structured outputs; classification returns a validated Python object, not raw text
- **FastMCP** — MCP server exposing the ticket system as three callable tools for any MCP client
- **Supabase** — hosted Postgres with two tables: `tickets` and `ai_logs`
- **uv** — Python package management

### Frontend

- **Next.js 14** — App Router, four pages: Dashboard, Tickets, Observability, Executive Summary
- **Tailwind CSS + shadcn/ui** — component library
- **Recharts** — bar charts for volume by category, inline bar for blocker frequency

### Infrastructure

- **Railway** — FastAPI backend, auto-deploys on push
- **Vercel** — Next.js frontend, auto-deploys on push
- **Supabase** — free-tier hosted Postgres, no infra to manage

---

## Build Plan

### Day 1 — Foundation

- Supabase schema: `tickets` table (category, priority, sentiment, escalate, confidence, tags, draft_response, token_cost_usd, latency_ms) and `ai_logs` table (operation, model, input_tokens, output_tokens, cost_usd, latency_ms)
- FastAPI backend with three endpoints: `POST /tickets`, `GET /tickets`, `GET /tickets/{id}`
- Pydantic models: `TicketCreate`, `ClassificationResult` with typed enums
- Seeded 20 realistic support tickets across five categories with deliberate variation in urgency and complexity

### Day 2 — AI Pipeline

- `ai_service.py`: `classify_ticket()` returning typed JSON, `draft_response()` returning plain text, `generate_summary()` for executive narrative
- System prompts tuned for classification: P1=security/outage/data loss, P2=major feature broken, P3=minor issue, P4=question or feedback
- `POST /tickets/{id}/process`: fetch → classify → draft → update ticket → write two rows to `ai_logs` → return updated ticket
- Escalation logic: `escalate=true` if confidence < 0.7 or priority is P1
- Analytics endpoints: `/analytics/blockers` (tag frequency from SQL), `/analytics/volume` (counts by category/status/priority), `/analytics/summary` (AI narrative from aggregated stats)
- FastMCP server: three tools — `get_ticket`, `list_open_tickets`, `post_escalation_alert` (mock Slack)
- Processed all 20 tickets: total cost $0.0311, 46 AI requests, avg latency 2,073ms

### Day 3 — Frontend and Deployment

- Dashboard: four metric cards, volume bar chart, numbered blocker frequency chart, priority breakdown tiles, status breakdown bars
- Tickets page: filter tabs (All / Escalated / In Review / Resolved), editable AI draft textarea, human-in-the-loop approve and escalate buttons, per-request cost and confidence shown inline
- Observability page: total cost, cost per ticket, avg latency, classify vs draft breakdown cards, full `ai_logs` table with latency color-coded green/orange/red
- Executive Summary page: AI-generated COO narrative with inline markdown rendering, category breakdown grid
- Deployed frontend to Vercel, backend to Railway

---

## Observability Results

```
Total AI spend (20 tickets):    $0.0311
Total AI requests:              46 (2 per ticket: classify + draft)
Cost per ticket:                $0.00135
Avg latency (all operations):   2,073ms
Avg classify latency:           ~1,450ms
Avg draft latency:              ~2,600ms
Model:                          claude-haiku-4-5-20251001

Classification breakdown (20 tickets):
  technical:       9   (45%)
  account:         5   (25%)
  billing:         3   (15%)
  feature_request: 3   (15%)

Priority breakdown:
  P1 critical:     4
  P2 high:        12
  P3 medium:       2
  P4 low:          2

Escalation rate:  70% (14/20 tickets flagged for human review)
Top recurring tags: technical, account, billing, time_sensitive, regression
```

---

## Key Design Decisions

Full reasoning in [DECISIONS.md](./DECISIONS.md).

**Claude Haiku over Sonnet for all operations.** Classification is a routing decision, not a reasoning task. Haiku achieves the same structured output quality at 12x lower cost. Sonnet is the upgrade path if classification accuracy drops below threshold.

**Structured JSON output over tool_use.** Classification returns a raw JSON string parsed by `json.loads()`. Tool_use adds streaming complexity with no quality benefit for a single-turn classification call. Tool_use is used in the MCP server layer where multi-step orchestration justifies it.

**max_tokens=150 for classification.** The classification JSON is 80–100 tokens. A hard cap of 150 prevents runaway costs and forces prompt quality — if the model can't fit the answer in 150 tokens, the prompt needs fixing, not the cap.

**Escalation on confidence < 0.7, not on categories.** Category-based routing rules become brittle as ticket language varies. Confidence-based escalation is model-agnostic and self-adjusting — ambiguous language escalates regardless of which category it falls into.

**Blocker trends from SQL, not AI.** Aggregating tag frequency is a deterministic SQL operation. Running it through an LLM would add cost, latency, and non-determinism to a query that has one correct answer.

**Supabase over self-hosted Postgres.** Built-in auth, REST API, and real-time subscriptions. No infra overhead during a job search. Row-level security is disabled because all DB access goes through the FastAPI backend, not directly from the browser.

**Human-in-the-loop as an architectural requirement, not a feature.** Every draft lands in an editable textarea. The approve button is never auto-clicked. This is not a UX decision — it is the boundary between AI assistance and AI autonomy, and it matters for ops contexts where a wrong response reaches a paying customer.

---

## Run Locally

```bash
git clone https://github.com/AaronFChristian/OpsPilot
cd OpsPilot

# Backend
cd backend
uv init
uv add fastapi "uvicorn[standard]" supabase anthropic fastmcp pydantic python-dotenv httpx

cp .env.example .env
# Add SUPABASE_URL, SUPABASE_KEY, ANTHROPIC_API_KEY to .env

# Run Supabase SQL schema (see backend/schema.sql)

uv run python seed.py          # seed 20 tickets
uv run uvicorn main:app --reload --port 8001

# Frontend (new terminal)
cd ../frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8001" > .env.local
npm run dev
```

Open http://localhost:3000 for the dashboard, http://localhost:8001/docs for the API.

Process all tickets:
```bash
cd backend
uv run python -c "
from app.database import supabase
import httpx, time
tickets = supabase.table('tickets').select('id').execute().data
for i, t in enumerate(tickets):
    r = httpx.post(f'http://localhost:8001/tickets/{t[\"id\"]}/process', timeout=30.0)
    result = r.json()
    print(f'{i+1}/20 | {result.get(\"priority\")} | {result.get(\"category\")} | {result[\"title\"][:40]}')
    time.sleep(0.5)
"
```

---

## Project Structure

```
OpsPilot/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── tickets.py          CRUD + POST /{id}/process
│   │   │   └── analytics.py        blockers, volume, summary endpoints
│   │   ├── services/
│   │   │   ├── ai_service.py       classify_ticket, draft_response, generate_summary
│   │   │   └── mcp_service.py      FastMCP server with 3 tools
│   │   ├── database.py             Supabase client
│   │   └── models.py               Pydantic models and enums
│   ├── main.py                     FastAPI app, CORS, router registration
│   ├── seed.py                     20 realistic support tickets
│   └── Procfile                    Railway start command
├── frontend/
│   ├── app/
│   │   ├── page.tsx                Dashboard: metrics, charts, blockers
│   │   ├── tickets/page.tsx        Queue: filter tabs, AI draft, approve flow
│   │   ├── observability/page.tsx  Cost/latency log per AI request
│   │   └── summary/page.tsx        Executive summary generator
│   └── components/ui/              shadcn Button, Card, Badge, Table, Tabs
├── DECISIONS.md                    7 architectural decision records
└── README.md
```
