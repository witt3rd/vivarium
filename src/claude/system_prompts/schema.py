from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field

class SystemPrompt(BaseModel):
    id: str = Field(..., description="Unique identifier for the system prompt")
    name: str = Field(..., description="Display name for the system prompt")
    content: str = Field(..., description="The actual system prompt text")
    description: Optional[str] = Field(None, description="Optional description of the prompt's purpose")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_cached: bool = Field(default=False, description="Whether this prompt should use API caching")

class SystemPromptCreate(BaseModel):
    name: str
    content: str
    description: Optional[str] = None
    is_cached: bool = False

class SystemPromptUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    description: Optional[str] = None
    is_cached: Optional[bool] = None
