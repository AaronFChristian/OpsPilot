from pydantic import BaseModel
from typing import Optional

class TicketCreate(BaseModel):
    title: str
    description: str
    submitter_email: Optional[str] = None

class ClassificationResult(BaseModel):
    category: str
    priority: str
    sentiment: str
    escalate: bool
    tags: list[str]
    confidence: float
    reasoning: str