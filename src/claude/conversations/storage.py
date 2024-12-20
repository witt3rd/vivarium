import os
from typing import List

import yaml
from fastapi import HTTPException

from ..storage import CONVERSATIONS_DIR
from .schema import Conversation


def save_conversation(conversation: Conversation) -> None:
    """Save a conversation to disk."""
    file_path = os.path.join(CONVERSATIONS_DIR, f"{conversation.id}.yaml")
    with open(file_path, "w", encoding="utf-8") as f:
        yaml.safe_dump(
            conversation.model_dump(),
            f,
            default_flow_style=False,
            allow_unicode=True,
            sort_keys=False,
        )


def load_conversation(conversation_id: str) -> Conversation:
    """Load a conversation from disk."""
    file_path = os.path.join(CONVERSATIONS_DIR, f"{conversation_id}.yaml")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            return Conversation(**data)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Conversation not found")


def list_conversations() -> List[Conversation]:
    """List all conversations with basic metadata."""
    conversations: List[Conversation] = []
    for filename in os.listdir(CONVERSATIONS_DIR):
        if filename.endswith(".yaml"):
            with open(
                os.path.join(CONVERSATIONS_DIR, filename), "r", encoding="utf-8"
            ) as f:
                data = yaml.safe_load(f)
                conversations.append(Conversation(**data))
    return conversations


def delete_conversation(conversation_id: str) -> None:
    """Delete a conversation."""
    file_path = os.path.join(CONVERSATIONS_DIR, f"{conversation_id}.yaml")
    try:
        os.remove(file_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Conversation not found")
