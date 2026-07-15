"""Chat schemas for AI conversation about code."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=10_000)
    action: Optional[str] = Field(default="chat", max_length=64)
    ai_provider: Optional[str] = Field(None, pattern=r"^(gemini|openai)$")


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    review_id: int
    role: str
    content: str
    action: Optional[str] = None
    created_at: datetime


class ChatHistoryResponse(BaseModel):
    messages: List[ChatMessageOut]
