from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class TokenUsage(BaseModel):
    """Token usage information from the API response."""

    cache_creation_input_tokens: Optional[int] = None
    cache_read_input_tokens: Optional[int] = None
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None


class Message(BaseModel):
    """A message in a conversation."""

    id: Optional[str] = None
    role: str
    content: List[Dict[str, Any]]  # List of content blocks (text, images, etc)
    timestamp: Optional[str] = None
    cache: bool = False
    assistant_message_id: Optional[str] = None  # ID for the assistant's response
    usage: Optional[TokenUsage] = None  # Token usage information for assistant messages


class ConversationMetadata(BaseModel):
    """Metadata about a conversation conversation."""

    id: str
    name: str
    system_prompt_id: Optional[str] = None
    model: str = "claude-3-5-sonnet-20241022"
    max_tokens: int = 8192
    message_count: int = 0
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    audio_enabled: bool = False
    voice_id: Optional[str] = None


class MetadataUpdate(BaseModel):
    """Schema for updating conversation metadata."""

    name: str
    system_prompt_id: Optional[str] = None
    model: Optional[str] = None
    max_tokens: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    audio_enabled: Optional[bool] = None
    voice_id: Optional[str] = None


class MetadataCreate(BaseModel):
    """Schema for creating new conversation metadata."""

    name: str
    id: str
    system_prompt_id: Optional[str] = None
    model: Optional[str] = None
    max_tokens: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
