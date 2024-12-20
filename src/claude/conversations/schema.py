from typing import Any, Dict, List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    role: str
    content: List[Dict[str, Any]]  # List of content blocks (text, images, etc)
    timestamp: Optional[str] = None
    cache: bool = False


class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    messages: List[Message] = []
    system_prompt_id: Optional[str] = None
    model: str = "claude-3-5-sonnet-20241022"  # default model
    max_tokens: int = 1024  # default max_tokens


class ConversationUpdate(BaseModel):
    """Schema for updating conversation metadata."""

    name: str
    system_prompt_id: Optional[str] = None
    model: Optional[str] = None
    max_tokens: Optional[int] = None
