import json
import uuid
from typing import Any, Awaitable, Callable, Dict, List, TypedDict, TypeVar

from anthropic import Anthropic
from anthropic.types import MessageParam
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..system_prompts.storage import load_prompt
from .schema import (
    ConversationMetadata,
    Message,
    MetadataCreate,
    MetadataUpdate,
    TokenUsage,
)
from .storage import (
    list_metadata,
    load_messages,
    load_metadata,
    rm_conversation,
    save_messages,
    save_metadata,
    update_message_count,
)

# Type variable for generic transaction handling
T = TypeVar("T")


async def atomic_operation(
    conv_id: str, operation: Callable[..., Awaitable[T]], *args, **kwargs
) -> T:
    """
    Execute an operation atomically, maintaining consistency between messages and metadata.
    Rolls back both messages and message count on failure.
    """
    # Load initial state
    original_messages = load_messages(conv_id)
    original_count = len(original_messages)

    try:
        # Execute the operation
        result = await operation(*args, **kwargs)
        return result
    except Exception as e:
        # Restore original state on error
        save_messages(conv_id, original_messages)
        update_message_count(conv_id, original_count)
        raise e


class ContentBlock(TypedDict):
    type: str
    text: str


router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.post("", response_model=ConversationMetadata)
async def create_metadata(metadata: MetadataCreate) -> ConversationMetadata:
    """Create new conversation metadata."""
    new_metadata = ConversationMetadata(
        id=metadata.id,
        name=metadata.name,
        system_prompt_id=metadata.system_prompt_id,
        model=metadata.model or "claude-3-5-sonnet-20241022",
        max_tokens=metadata.max_tokens or 8192,
        tags=metadata.tags,
        audio_enabled=False,
        voice_id=None,
    )
    save_metadata(new_metadata)
    return new_metadata


@router.get("", response_model=List[ConversationMetadata])
async def get_metadata_list() -> List[ConversationMetadata]:
    """Get all conversation metadata."""
    return list_metadata()


@router.get("/{conv_id}/metadata", response_model=ConversationMetadata)
async def get_metadata(conv_id: str) -> ConversationMetadata:
    """Get conversation metadata."""
    return load_metadata(conv_id)


@router.put("/{conv_id}/metadata", response_model=ConversationMetadata)
async def update_metadata(conv_id: str, update: MetadataUpdate) -> ConversationMetadata:
    """Update conversation metadata."""
    metadata = load_metadata(conv_id)

    # Update fields
    metadata.name = update.name
    metadata.system_prompt_id = update.system_prompt_id
    metadata.model = update.model or metadata.model
    metadata.max_tokens = update.max_tokens or metadata.max_tokens
    metadata.tags = update.tags

    # Update TTS fields if provided
    if update.audio_enabled is not None:
        metadata.audio_enabled = update.audio_enabled
    if update.voice_id is not None:
        metadata.voice_id = update.voice_id

    save_metadata(metadata)
    return metadata


@router.get("/{conv_id}/messages", response_model=List[Message])
async def get_messages(conv_id: str) -> List[Message]:
    """Get all messages for a conversation."""
    return load_messages(conv_id)


@router.put("/{conv_id}/messages/{message_id}", response_model=List[Message])
async def update_message(
    conv_id: str, message_id: str, updated_message: Message
) -> List[Message]:
    """Update a message."""
    messages = load_messages(conv_id)
    original_messages = messages.copy()

    try:
        # Find and update the message
        message_found = False
        for i, msg in enumerate(messages):
            if msg.id == message_id:
                messages[i] = updated_message
                message_found = True
                break

        if not message_found:
            raise HTTPException(status_code=404, detail="Message not found")

        save_messages(conv_id, messages)
        return messages

    except Exception as e:
        if not isinstance(e, HTTPException) or e.status_code != 404:
            # Restore original state on error (except for 404)
            save_messages(conv_id, original_messages)
        raise


@router.delete("/{conv_id}/messages/{message_id}", response_model=List[Message])
async def delete_message(conv_id: str, message_id: str) -> List[Message]:
    """Delete a message."""

    async def delete_operation() -> List[Message]:
        messages = load_messages(conv_id)
        original_length = len(messages)
        new_messages = [msg for msg in messages if msg.id != message_id]

        if len(new_messages) == original_length:
            raise HTTPException(status_code=404, detail="Message not found")

        # Update both messages and count in one operation
        save_messages(conv_id, new_messages)
        update_message_count(conv_id, len(new_messages))
        return new_messages

    return await atomic_operation(conv_id, delete_operation)


@router.post("/{conv_id}/messages/{message_id}/cache", response_model=List[Message])
async def toggle_message_cache(conv_id: str, message_id: str) -> List[Message]:
    """Toggle the cache flag for a message."""
    messages = load_messages(conv_id)

    # Find and toggle the message cache
    for msg in messages:
        if msg.id == message_id:
            msg.cache = not msg.cache
            save_messages(conv_id, messages)
            return messages

    raise HTTPException(status_code=404, detail="Message not found")


@router.post("/{conv_id}/messages", response_model=None)
async def add_message(conv_id: str, message: Message) -> StreamingResponse:
    """Add a message and get Claude's streaming response."""
    # Load current state
    metadata = load_metadata(conv_id)
    messages = load_messages(conv_id)
    original_messages = messages.copy()
    original_count = len(messages)

    try:
        # Extract assistant_message_id if provided
        assistant_message_id = None
        if hasattr(message, "assistant_message_id"):
            assistant_message_id = message.assistant_message_id
            delattr(message, "assistant_message_id")

        # Ensure message has an ID
        if not message.id:
            message.id = str(uuid.uuid4())

        # Add the user's message atomically
        messages.append(message)
        save_messages(conv_id, messages)
        update_message_count(conv_id, len(messages))

        # Get system prompt if exists
        system_content = ""
        if metadata.system_prompt_id:
            system_prompt = load_prompt(metadata.system_prompt_id)
            if system_prompt.is_cached:
                system_content = [
                    {
                        "type": "text",
                        "text": system_prompt.content,
                        "cache_control": {"type": "ephemeral"},
                    }
                ]
            else:
                system_content = system_prompt.content

        # Create Anthropic client with cache control enabled
        client = Anthropic()
        setattr(client, "_headers", {"anthropic-beta": "prompt-caching-2024-07-31"})

        # Convert messages to Anthropic format with cache control
        anthropic_messages: List[MessageParam] = []
        for msg in messages:
            if msg.content and msg.content[0]["text"]:
                content = msg.content[0]["text"]
                message_dict: MessageParam = {
                    "role": "user" if msg.role == "user" else "assistant",
                    "content": content,
                }
                anthropic_messages.append(message_dict)

        async def stream_response():
            """Stream the response from Claude."""
            response_text = ""
            usage_data = None
            assistant_message_saved = False

            try:
                # Get Claude's streaming response
                stream = client.messages.create(
                    model=metadata.model,
                    max_tokens=metadata.max_tokens,
                    system=system_content,
                    messages=anthropic_messages,
                    stream=True,
                )

                for chunk in stream:
                    event: Dict[str, Any] = {
                        "type": chunk.type,
                    }

                    if chunk.type == "message_start":
                        # Extract usage information if available
                        message = getattr(chunk, "message", None)
                        usage = getattr(message, "usage", None) if message else None
                        if usage:
                            usage_data = TokenUsage(
                                cache_creation_input_tokens=getattr(
                                    usage, "cache_creation_input_tokens", None
                                ),
                                cache_read_input_tokens=getattr(
                                    usage, "cache_read_input_tokens", None
                                ),
                                input_tokens=getattr(usage, "input_tokens", None),
                                output_tokens=getattr(usage, "output_tokens", None),
                            )

                        # Construct message event
                        event["message"] = {
                            "id": assistant_message_id or str(uuid.uuid4()),
                            "role": "assistant",
                            "usage": usage_data.model_dump() if usage_data else None,
                        }
                    elif chunk.type == "content_block_start":
                        event["content_block"] = {
                            "type": "text",
                            "text": "",
                        }
                    elif chunk.type == "content_block_delta":
                        delta = getattr(chunk, "delta", None)
                        if delta and getattr(delta, "text", None):
                            delta_text = str(getattr(delta, "text", ""))
                            response_text = response_text + delta_text
                            event["delta"] = {
                                "type": "text_delta",
                                "text": delta_text,
                            }
                    elif chunk.type == "message_delta":
                        # Update all token usage fields from final usage data
                        delta_usage = getattr(chunk, "usage", None)
                        if delta_usage and usage_data:
                            for field in [
                                "output_tokens",
                                "cache_read_input_tokens",
                                "cache_creation_input_tokens",
                                "input_tokens",
                            ]:
                                value = getattr(delta_usage, field, None)
                                if value is not None:
                                    setattr(usage_data, field, value)

                    yield f"data: {json.dumps(event)}\n\n"

                # Save the complete response atomically
                if not assistant_message_saved:
                    assistant_message = Message(
                        id=assistant_message_id or str(uuid.uuid4()),
                        role="assistant",
                        content=[{"type": "text", "text": response_text}],
                        usage=usage_data,
                    )
                    messages.append(assistant_message)
                    save_messages(conv_id, messages)
                    update_message_count(conv_id, len(messages))
                    assistant_message_saved = True

                # Send end of stream marker
                yield "data: [DONE]\n\n"

            except Exception as e:
                # If we haven't saved the assistant message yet, restore original state
                if not assistant_message_saved:
                    save_messages(conv_id, original_messages)
                    update_message_count(conv_id, original_count)
                yield f"data: Error: {str(e)}\n\n"

        return StreamingResponse(
            stream_response(),
            media_type="text/event-stream",
        )

    except Exception as e:
        # Restore original state on error
        save_messages(conv_id, original_messages)
        update_message_count(conv_id, original_count)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{conv_id}/markdown")
async def get_markdown(conv_id: str) -> str:
    """Get messages in markdown format."""
    messages = load_messages(conv_id)
    lines: list[str] = []

    for message in messages:
        role = message.role.capitalize()
        content = "\n\n".join(
            str(block["text"])
            .replace("_", "\\_")
            .replace("*", "\\*")
            .replace("`", "\\`")
            for block in message.content
            if block["type"] == "text"
        )
        lines.extend([f"**{role}**: {content}", ""])

    return "\n".join(lines)


@router.post("/{conv_id}/clone", response_model=ConversationMetadata)
async def clone_conversation(conv_id: str) -> ConversationMetadata:
    """Clone a conversation."""
    # Get source data
    source_metadata = load_metadata(conv_id)
    source_messages = load_messages(conv_id)

    # Create new metadata
    new_id = str(uuid.uuid4())
    new_metadata = ConversationMetadata(
        id=new_id,
        name=f"{source_metadata.name} [CLONE]",
        system_prompt_id=source_metadata.system_prompt_id,
        model=source_metadata.model,
        max_tokens=source_metadata.max_tokens,
    )
    save_metadata(new_metadata)

    # Clone messages with new IDs
    new_messages: List[Message] = []
    for msg in source_messages:
        new_msg = Message(
            id=str(uuid.uuid4()),
            role=msg.role,
            content=msg.content,
            timestamp=msg.timestamp,
            cache=msg.cache,
            usage=msg.usage,
        )
        new_messages.append(new_msg)

    save_messages(new_id, new_messages)
    update_message_count(new_id, len(new_messages))

    return new_metadata


@router.post("/{conv_id}/tags/{tag}")
async def add_tag(conv_id: str, tag: str) -> ConversationMetadata:
    """Add a tag to a conversation."""
    metadata = load_metadata(conv_id)
    if tag not in metadata.tags:
        metadata.tags.append(tag)
        save_metadata(metadata)
    return metadata


@router.delete("/{conv_id}/tags/{tag}")
async def remove_tag(conv_id: str, tag: str) -> ConversationMetadata:
    """Remove a tag from a conversation."""
    metadata = load_metadata(conv_id)
    if tag in metadata.tags:
        metadata.tags.remove(tag)
        save_metadata(metadata)
    return metadata


@router.get("/tags")
async def list_tags() -> List[str]:
    """Get a list of all unique tags across all conversations."""
    all_tags: set[str] = set()
    for metadata in list_metadata():
        all_tags.update(metadata.tags)
    return sorted(list(all_tags))


@router.get("/tags/{tag}")
async def get_conversations_by_tag(tag: str) -> List[ConversationMetadata]:
    """Get all conversations with a specific tag."""
    return [meta for meta in list_metadata() if tag in meta.tags]


@router.delete("/{conv_id}")
async def delete_conversation(conv_id: str) -> None:
    """Delete a conversation and all its contents."""
    rm_conversation(conv_id)
