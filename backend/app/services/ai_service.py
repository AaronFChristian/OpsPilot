import anthropic, json, time, os
from dotenv import load_dotenv

load_dotenv()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

CLASSIFY_SYSTEM = """You are a support ticket classifier. Return ONLY valid JSON, no explanation:
{
  "category": "billing|technical|account|feature_request|other",
  "priority": "P1|P2|P3|P4",
  "sentiment": "positive|neutral|negative|urgent",
  "escalate": true or false,
  "tags": ["tag1", "tag2"],
  "confidence": 0.0 to 1.0,
  "reasoning": "one sentence"
}
P1=security breach/data loss/outage, P2=major feature broken, P3=minor issue, P4=question/feedback.
Set escalate=true if confidence < 0.7 or priority is P1."""

DRAFT_SYSTEM = """You are a professional customer support agent. Write an empathetic reply in 2-3 short paragraphs.
Do not promise specific fixes. End with the SLA: P1=1 hour, P2=4 hours, P3=24 hours, P4=72 hours."""

def classify_ticket(title: str, description: str) -> dict:
    start = time.time()
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=150,
        system=CLASSIFY_SYSTEM,
        messages=[{"role": "user", "content": f"Title: {title}\n\nDescription: {description}"}]
    )
    latency_ms = int((time.time() - start) * 1000)
    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    result = json.loads(raw.strip())
    cost = (response.usage.input_tokens * 0.0000008) + (response.usage.output_tokens * 0.000004)
    return {
        "result": result,
        "latency_ms": latency_ms,
        "cost_usd": round(cost, 6),
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens
    }

def draft_response(title: str, description: str, category: str, priority: str) -> dict:
    start = time.time()
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        system=DRAFT_SYSTEM,
        messages=[{
            "role": "user",
            "content": f"Category: {category}\nPriority: {priority}\nTitle: {title}\n\nDescription: {description}"
        }]
    )
    latency_ms = int((time.time() - start) * 1000)
    cost = (response.usage.input_tokens * 0.0000008) + (response.usage.output_tokens * 0.000004)
    return {
        "draft": response.content[0].text,
        "latency_ms": latency_ms,
        "cost_usd": round(cost, 6),
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens
    }

def generate_summary(stats: dict) -> str:
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=400,
        system="You are a COO writing a weekly ops report. Be concise and exec-ready.",
        messages=[{
            "role": "user",
            "content": f"Write a weekly summary from this ticket data: {json.dumps(stats)}\n\n"
                       "Include: 1 paragraph overview, top 3 recurring issues with counts, 1 recommended action."
        }]
    )
    return response.content[0].text