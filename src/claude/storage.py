import os

DATA_DIR = "data"
CONVERSATIONS_DIR = os.path.join(DATA_DIR, "conversations")
SYSTEM_PROMPTS_DIR = os.path.join(DATA_DIR, "system_prompts")


def init_storage():
    """Initialize all required storage directories."""
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(CONVERSATIONS_DIR, exist_ok=True)
    os.makedirs(SYSTEM_PROMPTS_DIR, exist_ok=True)
