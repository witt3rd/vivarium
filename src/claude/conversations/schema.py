from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class Message(BaseModel):
    id: Optional[str] = None
    role: str
    content: List[Dict[str, Any]]  # List of content blocks (text, images, etc)
    timestamp: Optional[str] = None
    cache: bool = False
    assistant_message_id: Optional[str] = None  # ID for the assistant's response


class Conversation(BaseModel):
    id: Optional[str] = None
    name: str
    system_prompt_id: Optional[str] = None
    model: str = "claude-3-5-sonnet-20241022"  # default model
    max_tokens: int = 8192  # default max_tokens
    messages: List[Message] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ConversationUpdate(BaseModel):
    """Schema for updating conversation metadata."""

    name: str
    system_prompt_id: Optional[str] = None
    model: Optional[str] = None
    max_tokens: Optional[int] = None
