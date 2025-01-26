from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class TranscriptFormat(str, Enum):
    """Format for conversation transcripts."""

    MARKDOWN = "markdown"  # Default format with markdown formatting
    SHAREGPT = "sharegpt"  # ShareGPT JSON format
    ALPACA = "alpaca"  # Alpaca JSON format


class TokenUsage(BaseModel):
    """Token usage information from the API response."""

    cache_creation_input_tokens: Optional[int] = None
    cache_read_input_tokens: Optional[int] = None
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None


class MessageImage(BaseModel):
    """Reference to an uploaded image associated with a message."""

    id: str  # UUID for the image
    filename: str  # Original filename for reference
    media_type: str  # MIME type (image/jpeg, etc)


class Message(BaseModel):
    """A message in a conversation."""

    id: Optional[str] = None
    role: str
    content: List[Dict[str, Any]]  # List of content blocks (text, images, etc)
    images: Optional[List[MessageImage]] = None  # References to uploaded images
    timestamp: Optional[str] = None
    cache: bool = False
    assistant_message_id: Optional[str] = None  # ID for the assistant's response
    usage: Optional[TokenUsage] = None  # Token usage information for assistant messages


class MessageCreate(BaseModel):
    """Schema for creating a new message with optional images."""

    id: str  # Required - client generates UUID
    assistant_message_id: str  # Required - client generates UUID for assistant response
    content: List[Dict[str, Any]]  # Text content
    cache: bool = False


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
    persona_name: Optional[str] = (
        None  # Name to use for assistant in transcripts, None for default
    )
    user_name: Optional[str] = (
        None  # Name to use for user in transcripts, None for default
    )


class MetadataUpdate(BaseModel):
    """Schema for updating conversation metadata."""

    name: str
    system_prompt_id: Optional[str] = None
    model: Optional[str] = None
    max_tokens: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    audio_enabled: bool = False
    voice_id: Optional[str] = None
    persona_name: Optional[str] = (
        None  # Name to use for assistant in transcripts, None for default
    )
    user_name: Optional[str] = (
        None  # Name to use for user in transcripts, None for default
    )


class MetadataCreate(BaseModel):
    """Schema for creating new conversation metadata."""

    name: str
    id: str
    system_prompt_id: Optional[str] = None
    model: Optional[str] = None
    max_tokens: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    persona_name: Optional[str] = (
        None  # Name to use for assistant in transcripts, None for default
    )
    user_name: Optional[str] = (
        None  # Name to use for user in transcripts, None for default
    )
