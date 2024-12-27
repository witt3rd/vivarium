import os

from .config import settings


def init_storage():
    """Initialize all required storage directories."""
    os.makedirs(settings.data_dir, exist_ok=True)
    os.makedirs(settings.conversations_dir, exist_ok=True)
    os.makedirs(settings.system_prompts_dir, exist_ok=True)
