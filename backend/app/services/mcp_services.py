from fastmcp import FastMCP
from app.database import supabase

mcp = FastMCP("OpsPilot Ticket System")

@mcp.tool()
def get_ticket(ticket_id: str) -> dict:
    """Retrieve a support ticket by ID"""
    result = supabase.table("tickets").select("*").eq("id", ticket_id).execute()
    return result.data[0] if result.data else {"error": "Not found"}

@mcp.tool()
def list_open_tickets() -> list:
    """List all open and in-review tickets"""
    result = supabase.table("tickets").select("id, title, priority, category, status") \
        .in_("status", ["open", "in_review", "escalated"]).execute()
    return result.data

@mcp.tool()
def post_escalation_alert(ticket_id: str, reason: str) -> dict:
    """Post an escalation alert to the ops team Slack channel (mock)"""
    return {
        "channel": "#ops-escalations",
        "message": f"🚨 Ticket {ticket_id} escalated: {reason}",
        "status": "sent",
        "mock": True
    }

if __name__ == "__main__":
    mcp.run()