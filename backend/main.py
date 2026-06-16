from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import tickets, analytics
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="OpsPilot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

@app.get("/ai/logs")
def get_ai_logs():
    from app.database import supabase
    result = supabase.table("ai_logs").select("*").order("created_at", desc=True).execute()
    return result.data

@app.get("/")
def root():
    return {"status": "OpsPilot API running"}