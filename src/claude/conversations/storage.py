import fcntl
import os
import tempfile
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Dict, List, cast

import yaml
from fastapi import HTTPException

from ..storage import CONVERSATIONS_DIR
from .schema import ConversationMetadata, Message


def atomic_write_yaml(path: str, data: Dict[str, Any] | List[Any]) -> None:
    """Write data to a file atomically using a temporary file."""
    # Create temporary file in same directory to ensure atomic move
    directory = os.path.dirname(path)
    temp_file = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", dir=directory, delete=False) as tf:
            temp_file = tf.name
            # Write data to temp file
            yaml.safe_dump(
                data,
                tf,
                default_flow_style=False,
                allow_unicode=True,
                sort_keys=False,
            )
            tf.flush()  # Ensure all data is written
            os.fsync(tf.fileno())  # Force write to disk

        # Atomic rename temp file to target
        os.replace(temp_file, path)
    except Exception:
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except Exception as cleanup_error:
                print(
                    f"[atomic_write_yaml] Error cleaning up temp file: {cleanup_error}"
                )
        raise


def ensure_conversations_dir(conv_id: str) -> str:
    """Ensure conversation directory exists and return its path."""
    conversations_dir = os.path.join(CONVERSATIONS_DIR, conv_id)
    if not os.path.exists(conversations_dir):
        os.makedirs(conversations_dir)
    return conversations_dir


def save_metadata(metadata: ConversationMetadata) -> None:
    """Save conversation metadata by updating the index."""
    all_metadata = load_metadata_index()
    # Update timestamp and save metadata
    metadata.updated_at = datetime.now(timezone.utc)
    # Update or add the metadata
    found = False
    for i, m in enumerate(all_metadata):
        if m.id == metadata.id:
            all_metadata[i] = metadata
            found = True
            break
    if not found:
        all_metadata.append(metadata)
    save_metadata_index(all_metadata)


def save_messages(conv_id: str, messages: List[Message]) -> None:
    """Save conversation messages atomically."""
    conversations_dir = ensure_conversations_dir(conv_id)
    messages_path = os.path.join(conversations_dir, "messages.yaml")
    atomic_write_yaml(messages_path, [msg.model_dump() for msg in messages])


def load_metadata(conv_id: str) -> ConversationMetadata:
    """Load conversation metadata from the index."""
    all_metadata = load_metadata_index()
    for metadata in all_metadata:
        if metadata.id == conv_id:
            return metadata
    raise HTTPException(status_code=404, detail="Conversation metadata not found")


def load_messages(conv_id: str) -> List[Message]:
    """Load conversation messages."""
    messages_path = os.path.join(CONVERSATIONS_DIR, conv_id, "messages.yaml")
    try:
        with open(messages_path, "r", encoding="utf-8") as f:
            raw_data = yaml.safe_load(f)
            messages_data = cast(
                List[Dict[str, Any]], raw_data if isinstance(raw_data, list) else []
            )
            return [Message(**msg) for msg in messages_data]
    except FileNotFoundError:
        return []
    except yaml.YAMLError:
        raise HTTPException(status_code=500, detail="Invalid messages format")


def list_metadata() -> List[ConversationMetadata]:
    """List all conversation metadata from the index."""
    return load_metadata_index()


def rm_conversation(conv_id: str) -> None:
    """Delete a conversation directory and its metadata."""
    # Remove from metadata index
    all_metadata = load_metadata_index()
    all_metadata = [m for m in all_metadata if m.id != conv_id]
    save_metadata_index(all_metadata)

    # Delete conversation directory if it exists
    conversations_dir = os.path.join(CONVERSATIONS_DIR, conv_id)
    try:
        import shutil

        shutil.rmtree(conversations_dir)
    except FileNotFoundError:
        pass  # Directory doesn't exist, which is fine


def update_message_count(conv_id: str, count: int) -> None:
    """Update message count in metadata atomically."""
    metadata = load_metadata(conv_id)
    metadata.message_count = count
    save_metadata(metadata)


@contextmanager
def file_lock(path: str):
    """Provide exclusive file locking."""
    lock_path = f"{path}.lock"
    lock_file = None
    try:
        lock_file = open(lock_path, "w")
        fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)
        yield
    finally:
        if lock_file:
            fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)
            lock_file.close()
            try:
                os.unlink(lock_path)
            except OSError:
                pass


def save_metadata_index(metadata_list: List[ConversationMetadata]) -> None:
    """Save all conversation metadata to a single index file."""
    index_path = os.path.join(CONVERSATIONS_DIR, "_metadata.yaml")

    with file_lock(index_path):
        try:
            atomic_write_yaml(index_path, [m.model_dump() for m in metadata_list])
        except Exception:
            raise


def load_metadata_index() -> List[ConversationMetadata]:
    """Load all conversation metadata from the index file."""
    index_path = os.path.join(CONVERSATIONS_DIR, "_metadata.yaml")

    with file_lock(index_path):
        try:
            with open(index_path, "r", encoding="utf-8") as f:
                raw_data = yaml.safe_load(f)
                data = cast(
                    List[Dict[str, Any]], raw_data if isinstance(raw_data, list) else []
                )
                result = [ConversationMetadata(**item) for item in data]
                return result
        except FileNotFoundError:
            return []
