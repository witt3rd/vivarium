import os
from typing import List

import yaml
from fastapi import HTTPException

from ..config import settings
from .schema import SystemPrompt


def save_prompt(prompt: SystemPrompt) -> None:
    """Save a system prompt to disk."""
    file_path = os.path.join(str(settings.system_prompts_dir), f"{prompt.id}.yaml")
    with open(file_path, "w", encoding="utf-8") as f:
        yaml.safe_dump(
            prompt.model_dump(),
            f,
            default_flow_style=False,
            allow_unicode=True,
            sort_keys=False,
        )


def load_prompt(prompt_id: str) -> SystemPrompt:
    """Load a system prompt from disk."""
    file_path = os.path.join(str(settings.system_prompts_dir), f"{prompt_id}.yaml")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            return SystemPrompt(**data)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="System prompt not found")


def list_prompts() -> List[SystemPrompt]:
    """List all system prompts."""
    prompts: List[SystemPrompt] = []
    for filename in os.listdir(str(settings.system_prompts_dir)):
        if filename.endswith(".yaml"):
            with open(
                os.path.join(str(settings.system_prompts_dir), filename),
                "r",
                encoding="utf-8",
            ) as f:
                data = yaml.safe_load(f)
                prompts.append(SystemPrompt(**data))
    return prompts


def delete_prompt(prompt_id: str) -> None:
    """Delete a system prompt."""
    file_path = os.path.join(str(settings.system_prompts_dir), f"{prompt_id}.yaml")
    try:
        os.remove(file_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="System prompt not found")
