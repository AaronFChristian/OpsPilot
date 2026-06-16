from fastapi import APIRouter
from app.database import supabase
from app.services.ai_service import generate_summary
from collections import Counter
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/blockers")
def get_blockers():
    result = supabase.table("tickets").select("tags, category, created_at").execute()
    tickets = result.data
    tag_counter = Counter()
    for t in tickets:
        if t.get("tags"):
            tag_counter.update(t["tags"])
        if t.get("category"):
            tag_counter.update([t["category"]])
    top = [{"name": k, "count": v} for k, v in tag_counter.most_common(10)]
    return top

@router.get("/volume")
def get_volume():
    result = supabase.table("tickets").select("category, status, priority, created_at").execute()
    tickets = result.data
    by_category = Counter(t["category"] for t in tickets if t.get("category"))
    by_status = Counter(t["status"] for t in tickets if t.get("status"))
    by_priority = Counter(t["priority"] for t in tickets if t.get("priority"))
    return {
        "by_category": dict(by_category),
        "by_status": dict(by_status),
        "by_priority": dict(by_priority),
        "total": len(tickets)
    }

@router.get("/summary")
def get_executive_summary():
    result = supabase.table("tickets").select("*").execute()
    tickets = result.data
    by_category = Counter(t["category"] for t in tickets if t.get("category"))
    by_priority = Counter(t["priority"] for t in tickets if t.get("priority"))
    escalated = sum(1 for t in tickets if t.get("escalate"))
    resolved = sum(1 for t in tickets if t.get("status") == "resolved")
    tag_counter = Counter()
    for t in tickets:
        if t.get("tags"):
            tag_counter.update(t["tags"])
    stats = {
        "total_tickets": len(tickets),
        "by_category": dict(by_category),
        "by_priority": dict(by_priority),
        "escalated": escalated,
        "resolved": resolved,
        "top_tags": dict(tag_counter.most_common(5))
    }
    summary = generate_summary(stats)
    return {"summary": summary, "stats": stats, "generated_at": datetime.utcnow().isoformat()}