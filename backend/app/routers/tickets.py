from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.models import TicketCreate
from app.services.ai_service import classify_ticket, draft_response

router = APIRouter()

@router.post("")
def create_ticket(ticket: TicketCreate):
    data = {
        "title": ticket.title,
        "description": ticket.description,
        "submitter_email": ticket.submitter_email,
        "status": "open"
    }
    result = supabase.table("tickets").insert(data).execute()
    return result.data[0]

@router.get("")
def list_tickets():
    result = supabase.table("tickets").select("*").order("created_at", desc=True).execute()
    return result.data

@router.get("/{ticket_id}")
def get_ticket(ticket_id: str):
    result = supabase.table("tickets").select("*").eq("id", ticket_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return result.data[0]

@router.post("/{ticket_id}/process")
def process_ticket(ticket_id: str):
    # 1. Fetch ticket
    result = supabase.table("tickets").select("*").eq("id", ticket_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket = result.data[0]

    # 2. Classify
    cl_data = classify_ticket(ticket["title"], ticket["description"])
    cl = cl_data["result"]

    # 3. Draft response
    dr_data = draft_response(ticket["title"], ticket["description"], cl["category"], cl["priority"])

    # 4. Update ticket
    status = "escalated" if cl["escalate"] else "in_review"
    update = {
        "category": cl["category"],
        "priority": cl["priority"],
        "sentiment": cl["sentiment"],
        "escalate": cl["escalate"],
        "confidence": cl["confidence"],
        "tags": cl["tags"],
        "draft_response": dr_data["draft"],
        "status": status,
        "token_cost_usd": round(cl_data["cost_usd"] + dr_data["cost_usd"], 6),
        "latency_ms": cl_data["latency_ms"] + dr_data["latency_ms"]
    }
    updated = supabase.table("tickets").update(update).eq("id", ticket_id).execute()

    # 5. Log to ai_logs
    supabase.table("ai_logs").insert([
        {"ticket_id": ticket_id, "operation": "classify", "model": "claude-haiku-4-5-20251001",
         "input_tokens": cl_data["input_tokens"], "output_tokens": cl_data["output_tokens"],
         "cost_usd": cl_data["cost_usd"], "latency_ms": cl_data["latency_ms"]},
        {"ticket_id": ticket_id, "operation": "draft", "model": "claude-haiku-4-5-20251001",
         "input_tokens": dr_data["input_tokens"], "output_tokens": dr_data["output_tokens"],
         "cost_usd": dr_data["cost_usd"], "latency_ms": dr_data["latency_ms"]}
    ]).execute()

    return updated.data[0]

@router.patch("/{ticket_id}")
def update_ticket(ticket_id: str, data: dict):
    result = supabase.table("tickets").update(data).eq("id", ticket_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return result.data[0]