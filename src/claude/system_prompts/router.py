from fastapi import APIRouter
from typing import List
from uuid import uuid4

from .schema import SystemPrompt, SystemPromptCreate, SystemPromptUpdate
from .storage import save_prompt, load_prompt, list_prompts, delete_prompt

router = APIRouter(prefix="/system-prompts", tags=["system-prompts"])

@router.post("", response_model=SystemPrompt)
async def create_system_prompt(prompt: SystemPromptCreate) -> SystemPrompt:
    """Create a new system prompt."""
    system_prompt = SystemPrompt(
        id=str(uuid4()),
        **prompt.model_dump()
    )
    save_prompt(system_prompt)
    return system_prompt

@router.get("", response_model=List[SystemPrompt])
async def get_system_prompts() -> List[SystemPrompt]:
    """Get all system prompts."""
    return list_prompts()

@router.get("/{prompt_id}", response_model=SystemPrompt)
async def get_system_prompt(prompt_id: str) -> SystemPrompt:
    """Get a specific system prompt."""
    return load_prompt(prompt_id)

@router.put("/{prompt_id}", response_model=SystemPrompt)
async def update_system_prompt(prompt_id: str, update: SystemPromptUpdate) -> SystemPrompt:
    """Update a system prompt."""
    prompt = load_prompt(prompt_id)
    update_data = update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(prompt, field, value)

    save_prompt(prompt)
    return prompt

@router.delete("/{prompt_id}")
async def delete_system_prompt(prompt_id: str) -> None:
    """Delete a system prompt."""
    delete_prompt(prompt_id)
