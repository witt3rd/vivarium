import base64
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import (
    Annotated,
    Any,
    Awaitable,
    Callable,
    Dict,
    List,
    Protocol,
    TypedDict,
    TypeVar,
    cast,
)

import yaml
import litellm
from litellm.utils import ModelResponse
from fastapi import APIRouter, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from loguru import logger

from ..config import settings
from ..system_prompts.schema import SystemPrompt
from ..system_prompts.storage import load_prompt, save_prompt
from .schema import (
    ConversationMetadata,
    Message,
    MessageCreate,
    MessageImage,
    MetadataCreate,
    MetadataUpdate,
    TokenUsage,
    TranscriptFormat,
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

def get_images_dir(conv_id: str) -> Path:
    """Get the images directory for a conversation."""
    conv_dir = Path(settings.conversations_dir) / conv_id / "images"
    conv_dir.mkdir(parents=True, exist_ok=True)
    return conv_dir


# Type variable for generic transaction handling
T = TypeVar("T")


async def atomic_operation(
    conv_id: str, operation: Callable[..., Awaitable[T]], *args: Any, **kwargs: Any
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

    # Update all fields directly from the update object
    metadata.name = update.name
    metadata.system_prompt_id = update.system_prompt_id
    metadata.model = update.model or metadata.model
    metadata.max_tokens = update.max_tokens or metadata.max_tokens
    metadata.tags = update.tags
    metadata.audio_enabled = update.audio_enabled or False
    metadata.voice_id = update.voice_id
    metadata.persona_name = update.persona_name
    metadata.user_name = update.user_name

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
    """Delete a message and its associated images."""

    async def delete_operation() -> List[Message]:
        messages = load_messages(conv_id)

        # Find the message to delete
        message_to_delete = next(
            (msg for msg in messages if msg.id == message_id), None
        )
        if not message_to_delete:
            raise HTTPException(status_code=404, detail="Message not found")

        # Delete associated images if they exist
        if message_to_delete.images:
            images_dir = get_images_dir(conv_id)
            for image in message_to_delete.images:
                image_path = images_dir / image.filename
                if image_path.exists():
                    image_path.unlink()

        # Remove the message
        new_messages = [msg for msg in messages if msg.id != message_id]

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


class StreamCloseable(Protocol):
    async def close(self) -> None: ...


@router.post("/{conv_id}/messages", response_model=None)
async def add_message(
    request: Request,
    conv_id: str,
    id: Annotated[str, Form()],
    assistant_message_id: Annotated[str, Form()],
    content: Annotated[str, Form()],
    cache: Annotated[str, Form()],
    target_persona: Annotated[str | None, Form()] = None,
    files: List[UploadFile] = File(default=[]),
) -> StreamingResponse:
    """Add a message and get LLM's streaming response."""
    # Load current state
    metadata = load_metadata(conv_id)
    original_messages = load_messages(conv_id)
    messages = original_messages.copy()
    message_count = len(messages)

    try:
        # Parse content from JSON string
        content_list = cast(List[Dict[str, Any]], json.loads(content))

        # Convert cache string to bool
        cache_bool = cache.lower() == "true"

        # Create message data
        message = MessageCreate(
            id=id,
            assistant_message_id=assistant_message_id,
            content=content_list,
            cache=cache_bool,
        )

        # Process uploaded images
        message_images: List[MessageImage] = []
        if files:
            for file in files:
                if not file.filename:
                    continue

                # Extract ID from filename (remove extension)
                image_id = str(Path(file.filename).stem)

                # Determine extension and content type
                if file.content_type:
                    if file.content_type == "image/jpeg":
                        ext = ".jpg"
                        media_type = "image/jpeg"
                    elif file.content_type == "image/png":
                        ext = ".png"
                        media_type = "image/png"
                    elif file.content_type == "image/webp":
                        ext = ".webp"
                        media_type = "image/webp"
                    else:
                        # Unknown content type, try filename or default
                        ext = str(Path(file.filename).suffix) or ".jpg"
                        media_type = "image/jpeg"
                else:
                    # No content type, use filename extension if available
                    ext = str(Path(file.filename).suffix)
                    if ext.lower() in [".jpg", ".jpeg"]:
                        media_type = "image/jpeg"
                    elif ext.lower() == ".png":
                        media_type = "image/png"
                    elif ext.lower() == ".webp":
                        media_type = "image/webp"
                    else:
                        # No valid extension found, use defaults
                        ext = ".jpg"
                        media_type = "image/jpeg"

                filename = f"{image_id}{ext}"
                save_path = get_images_dir(conv_id) / filename

                try:
                    file_content: bytes = await file.read()
                    with open(save_path, "wb") as f:
                        f.write(file_content)

                    message_images.append(
                        MessageImage(
                            id=image_id,
                            filename=filename,
                            media_type=media_type,
                        )
                    )
                except Exception as e:
                    print(f"Error processing file {filename}: {str(e)}")
                    raise

        # Create user message if we have content
        user_message = None
        if content_list:
            user_message = Message(
                id=message.id,
                role="user",
                content=content_list,
                images=message_images if message_images else None,
                timestamp=datetime.now(timezone.utc).isoformat(),
                cache=message.cache,
                assistant_message_id=message.assistant_message_id,
            )
            # Add to current conversation's messages
            messages.append(user_message)
            save_messages(conv_id, messages)
            update_message_count(conv_id, len(messages))

        # Initialize system_content at the start
        system_content = None

        # If we have a target_persona, handle special flow
        if target_persona:
            # Load metadata for target persona (conversation ID)
            target_metadata = load_metadata(target_persona)

            # Validate that target conversation has a system prompt
            if not target_metadata.system_prompt_id:
                raise HTTPException(
                    status_code=400,
                    detail="Target conversation must have a system prompt",
                )

            # Load system prompt to validate it exists
            try:
                target_system_prompt = load_prompt(target_metadata.system_prompt_id)
            except HTTPException as e:
                if e.status_code == 404:
                    raise HTTPException(
                        status_code=400,
                        detail="Target conversation's system prompt not found",
                    )
                raise e

            persona_name = target_metadata.persona_name or "Assistant"

            # Get transcript of current conversation with no prefixes for assistant and user_name for user
            transcript = await get_transcript(conv_id, None, metadata.user_name)

            # Create a single message with the transcript and use system prompt in system argument
            persona_message = Message(
                id=str(uuid.uuid4()),
                role="user",
                content=[{
                    "type": "text",
                    "text": f"I am currently participating in a group conversation:\n\n[BEGIN GROUP CONVERSATION]\n\n{transcript}[END GROUP CONVERSATION]\n\nI will respond to this conversation, as {persona_name}, consistent with my beliefs, ethics, morals, and unique perspective in order to advance the group's shared understanding and goals:"
                }],
                timestamp=datetime.now(timezone.utc).isoformat()
            )

            # Set system content to target's system prompt with cache control
            system_content = [
                {
                    "type": "text",
                    "text": target_system_prompt.content,
                    "cache_control": {"type": "ephemeral"},
                }
            ]

            # Convert messages to LiteLLM format
            litellm_messages = convert_messages_to_litellm([persona_message], conv_id, metadata, system_content)
        else:
            # Normal flow - check for system prompt
            if metadata.system_prompt_id:
                system_prompt = load_prompt(metadata.system_prompt_id)
                system_content = [
                    {
                        "type": "text",
                        "text": system_prompt.content,
                        "cache_control": {"type": "ephemeral"} if system_prompt.is_cached else None
                    }
                ]

            # Convert messages to LiteLLM format
            litellm_messages = convert_messages_to_litellm(messages, conv_id, metadata, system_content)

        try:
            # Configure LiteLLM with the correct headers for Anthropic
            litellm.headers = {
                "anthropic": {
                    "anthropic-beta": "prompt-caching-2024-07-31"
                }
            }

            # Configure LiteLLM callback for usage tracking
            def track_usage_callback(kwargs, completion_response, start_time, end_time):
                try:
                    logger.debug(f"LiteLLM callback received response: {completion_response}")
                    if hasattr(completion_response, 'usage'):
                        logger.debug(f"Usage data from callback: {completion_response.usage}")
                except Exception as e:
                    logger.error(f"Error in usage callback: {str(e)}")

            litellm.success_callback = [track_usage_callback]

            # Convert to LiteLLM parameters
            create_params = {
                "model": f"anthropic/{metadata.model}",
                "max_tokens": metadata.max_tokens,
                "messages": litellm_messages,
                "stream": True,
                "stream_options": {"include_usage": True}  # Enable usage tracking in stream
            }

            async def stream_response():
                """Stream the response from LiteLLM."""
                response_text = ""
                usage_dict = None
                assistant_message_saved = False

                try:
                    # Get streaming response
                    stream = await litellm.acompletion(**create_params)

                    async for chunk in stream:
                        # Check if client has disconnected
                        if await request.is_disconnected():
                            if stream and hasattr(stream, "close") and callable(stream.close):
                                try:
                                    await stream.close()
                                except:
                                    print("Failed to close stream after client disconnect")
                            return

                        # Extract content from the chunk
                        delta = chunk.choices[0].delta

                        # Check for usage data in the chunk
                        if hasattr(chunk, 'usage'):
                            logger.debug(f"Raw usage data from chunk: {chunk.usage}")
                            logger.debug(f"Raw usage data attributes: {dir(chunk.usage)}")
                            usage_dict = {
                                "input_tokens": int(chunk.usage.prompt_tokens),
                                "output_tokens": int(chunk.usage.completion_tokens),
                                "cache_creation_input_tokens": int(getattr(chunk.usage, "cache_creation_input_tokens", 0)),
                                "cache_read_input_tokens": int(getattr(chunk.usage, "cache_read_input_tokens", 0))
                            }
                            logger.debug(f"Processed usage_dict for message {assistant_message_id}: {usage_dict}")
                            logger.debug(f"Cache metrics - Creation: {usage_dict['cache_creation_input_tokens']}, Read: {usage_dict['cache_read_input_tokens']}")

                        # Determine event type based on delta content
                        is_content = bool(delta.content)
                        event = {
                            "type": "content_block_delta" if is_content else "message_start"
                        }

                        # Handle content
                        if is_content:
                            delta_text = delta.content
                            response_text += delta_text
                            event["delta"] = {
                                "type": "text_delta",
                                "text": delta_text
                            }

                        # Add usage to event if we have it
                        if usage_dict and event["type"] == "message_start":
                            event["message"] = {
                                "id": assistant_message_id,
                                "role": "assistant",
                                "usage": usage_dict
                            }
                            logger.debug(f"Added usage to message_start event: {event}")

                            # Save the assistant message when we have usage data
                            if not assistant_message_saved:
                                logger.debug(f"Creating assistant message with usage_dict: {usage_dict}")
                                assistant_message = Message(
                                    id=assistant_message_id,
                                    role="assistant",
                                    content=[{"type": "text", "text": response_text}],
                                    usage=TokenUsage(**usage_dict) if usage_dict is not None else None,
                                    timestamp=datetime.now(timezone.utc).isoformat(),
                                )
                                logger.debug(f"Created assistant message with usage: {assistant_message.usage}")
                                messages.append(assistant_message)
                                save_messages(conv_id, messages)
                                update_message_count(conv_id, len(messages))
                                assistant_message_saved = True

                        try:
                            # logger.debug(f"Sending event: {event}")
                            yield f"data: {json.dumps(event)}\n\n"
                        except:
                            print("Failed to send chunk, client likely disconnected")
                            if stream and hasattr(stream, "close") and callable(stream.close):
                                try:
                                    await stream.close()
                                except:
                                    print("Failed to close stream after send failure")
                            return

                        # Send DONE event after saving message with usage data
                        if assistant_message_saved:
                            try:
                                yield "data: [DONE]\n\n"
                            except:
                                print("Failed to send DONE message, client likely disconnected")
                                return

                except Exception as e:
                    import traceback
                    error_details = {
                        "error": str(e),
                        "error_type": type(e).__name__,
                        "stack_trace": traceback.format_exc()
                    }
                    print("Error in stream:")
                    print(f"Error type: {error_details['error_type']}")
                    print(f"Error message: {error_details['error']}")
                    print(f"Stack trace:\n{error_details['stack_trace']}")

                    if stream and hasattr(stream, "close") and callable(stream.close):
                        try:
                            await stream.close()
                        except Exception as close_error:
                            print(f"Failed to close stream after error: {close_error}")
                            print(f"Close error stack trace:\n{traceback.format_exc()}")

                    if not assistant_message_saved:
                        save_messages(conv_id, original_messages)
                        update_message_count(conv_id, message_count)

                    # Send detailed error event to client
                    error_event = {
                        "type": "error",
                        "error": {
                            "type": error_details['error_type'],
                            "message": error_details['error']
                        }
                    }
                    try:
                        yield f"data: {json.dumps(error_event)}\n\n"
                    except Exception as send_error:
                        print(f"Failed to send error event: {send_error}")
                        print(f"Send error stack trace:\n{traceback.format_exc()}")
                    return

            return StreamingResponse(
                stream_response(),
                media_type="text/event-stream",
            )

        except Exception as e:
            # Restore original state on error
            import traceback
            error_details = {
                "error": str(e),
                "error_type": type(e).__name__,
                "stack_trace": traceback.format_exc()
            }
            print("Error in add_message endpoint:")
            print(f"Error type: {error_details['error_type']}")
            print(f"Error message: {error_details['error']}")
            print(f"Stack trace:\n{error_details['stack_trace']}")

            save_messages(conv_id, original_messages)
            update_message_count(conv_id, message_count)
            raise HTTPException(
                status_code=500,
                detail={
                    "error": str(e),
                    "error_type": error_details['error_type']
                }
            )

    except Exception as e:
        # Restore original state on error
        import traceback
        error_details = {
            "error": str(e),
            "error_type": type(e).__name__,
            "stack_trace": traceback.format_exc()
        }
        print("Error in add_message endpoint:")
        print(f"Error type: {error_details['error_type']}")
        print(f"Error message: {error_details['error']}")
        print(f"Stack trace:\n{error_details['stack_trace']}")

        save_messages(conv_id, original_messages)
        update_message_count(conv_id, message_count)
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "error_type": error_details['error_type']
            }
        )


@router.get("/{conv_id}/transcript", response_model=str)
async def get_transcript(
    conv_id: str,
    assistant_prefix: str | None = "Assistant",
    user_prefix: str | None = "User",
    format: TranscriptFormat = TranscriptFormat.MARKDOWN,
) -> str:
    """Get messages in the specified format.

    Args:
        conv_id: Conversation ID
        assistant_prefix: Custom prefix for assistant messages, None to omit (markdown only)
        user_prefix: Custom prefix for user messages, None to omit (markdown only)
        format: Output format (markdown, sharegpt, or alpaca)

    Returns:
        str: The transcript in the requested format:
            - For markdown: A string with markdown formatting
            - For sharegpt/alpaca: A JSON string representation of the data structure
    """
    messages = load_messages(conv_id)

    if format == TranscriptFormat.MARKDOWN:
        lines: list[str] = []
        for message in messages:
            # Get appropriate prefix based on role
            prefix = None
            if message.role == "assistant":
                # Check if message already starts with a name prefix pattern
                content_text = "\n\n".join(
                    str(block["text"])
                    for block in message.content
                    if block["type"] == "text"
                )
                has_name_prefix = (
                    content_text.startswith("**")
                    and "**: " in content_text.split("\n")[0]
                )

                # Only add prefix if:
                # 1. assistant_prefix is provided AND
                # 2. Either it's not the default "Assistant" prefix OR message doesn't have a name prefix
                if assistant_prefix and (
                    assistant_prefix != "Assistant" or not has_name_prefix
                ):
                    prefix = assistant_prefix
            elif message.role == "user" and user_prefix:
                prefix = user_prefix

            content = "\n\n".join(
                str(block["text"])
                for block in message.content
                if block["type"] == "text"
            )

            # Format line based on whether prefix should be included
            if prefix:
                lines.extend([f"**{prefix}**: {content}", ""])
            else:
                lines.extend([content, ""])

        return "\n".join(lines)

    elif format == TranscriptFormat.SHAREGPT:
        # Group messages into conversations (each starting with a user message)
        conversations: List[Dict[str, List[Dict[str, str]]]] = []
        current_conversation: List[Dict[str, str]] = []

        for message in messages:
            # Extract text content from message
            content = "\n\n".join(
                str(block["text"])
                for block in message.content
                if block["type"] == "text"
            )

            # Add message to current conversation
            current_conversation.append(
                {
                    "from": "human" if message.role == "user" else "assistant",
                    "value": content,
                }
            )

            # Start new conversation after assistant response
            if message.role == "assistant" and current_conversation:
                conversations.append({"conversations": current_conversation})
                current_conversation = []

        # Add any remaining messages
        if current_conversation:
            conversations.append({"conversations": current_conversation})

        return json.dumps(conversations, indent=2)

    elif format == TranscriptFormat.ALPACA:
        # Convert messages to Alpaca format
        alpaca_data: List[Dict[str, Any]] = []
        history: List[List[str]] = []

        for message in messages:
            # Extract text content from message
            content = "\n\n".join(
                str(block["text"])
                for block in message.content
                if block["type"] == "text"
            )

            if message.role == "user":
                # For user messages, create a new instruction entry
                alpaca_data.append(
                    {
                        "instruction": content,
                        "input": "",
                        "output": "",  # Will be filled by next assistant message
                        "history": history.copy(),  # Copy current history
                    }
                )
            else:  # assistant message
                if alpaca_data:  # Should always be true as messages alternate
                    # Fill in the output for the last instruction
                    alpaca_data[-1]["output"] = content
                    # Add this exchange to history for next instruction
                    history.append([alpaca_data[-1]["instruction"], content])

        return json.dumps(alpaca_data, indent=2)

    else:
        raise HTTPException(
            status_code=400, detail=f"Unsupported transcript format: {format}"
        )


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
        tags=source_metadata.tags.copy(),  # Copy tags list
        audio_enabled=source_metadata.audio_enabled,
        voice_id=source_metadata.voice_id,
        persona_name=source_metadata.persona_name,
        user_name=source_metadata.user_name,
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


@router.get("/{conv_id}/images/{image_id}")
async def get_image(conv_id: str, image_id: str):
    """Get an image by its ID."""
    images_dir = get_images_dir(conv_id)

    # Find any file that starts with the image_id
    for file in images_dir.glob(f"{image_id}.*"):
        return FileResponse(file)

    raise HTTPException(status_code=404, detail="Image not found")


@router.post("/{conv_id}/system-prompt-from-transcript", response_model=SystemPrompt)
async def create_system_prompt_from_transcript(
    conv_id: str,
    name: Annotated[str, Query(description="Name for the new system prompt")],
    assistant_prefix: Annotated[
        str | None, Query(description="Custom prefix for assistant messages")
    ] = "Assistant",
    user_prefix: Annotated[
        str | None, Query(description="Custom prefix for user messages")
    ] = "User",
) -> SystemPrompt:
    """Create a new system prompt from conversation transcript.

    Args:
        conv_id: Source conversation ID
        name: Name for the new system prompt
        assistant_prefix: Custom prefix for assistant messages, None to omit
        user_prefix: Custom prefix for user messages, None to omit
    """
    # Get metadata to check for existing system prompt
    metadata = load_metadata(conv_id)
    existing_content = ""

    # If there's an existing system prompt, load it
    if metadata.system_prompt_id:
        existing_prompt = load_prompt(metadata.system_prompt_id)
        existing_content = existing_prompt.content

    # Get transcript with specified prefixes
    transcript = await get_transcript(conv_id, assistant_prefix, user_prefix)

    # Define wrapper text
    begin_wrapper = "[BEGIN GROUP CONVERSATION]"
    end_wrapper = "[END GROUP CONVERSATION]"

    # Determine the final content based on existing system prompt
    if existing_content:
        # Check if existing content already has wrapper text
        if begin_wrapper in existing_content and end_wrapper in existing_content:
            # Insert transcript before the end wrapper
            end_index = existing_content.rindex(end_wrapper)
            content = (
                existing_content[:end_index].rstrip()
                + "\n\n"
                + transcript
                + "\n\n"
                + existing_content[end_index:]
            )
        else:
            # Add wrapper text around both existing content and transcript
            content = f"{existing_content}\n\n{begin_wrapper}\n\n{transcript}\n\n{end_wrapper}"
    else:
        # No existing content, just wrap the transcript
        content = f"{begin_wrapper}\n\n{transcript}\n\n{end_wrapper}"

    # Create new system prompt
    system_prompt = SystemPrompt(
        id=conv_id,  # Use conversation ID as the system prompt ID to override any existing prompt
        name=name,
        content=content,
        description="Generated from conversation transcript",
        is_cached=False,
    )

    # Save the system prompt
    save_prompt(system_prompt)

    return system_prompt


@router.post("/{conv_id}/cached-message", response_model=str)
async def add_cached_message(
    conv_id: str,
    message: MessageCreate,
) -> str:
    """Add a cached user message to a conversation.

    This endpoint is optimized for large cached messages and does not support:
    - File uploads
    - Streaming responses
    - Anthropic API calls

    Returns just the message ID as acknowledgment.
    """
    # Validate this is a cached user message
    if not message.cache:
        raise HTTPException(
            status_code=400, detail="This endpoint only accepts cached messages"
        )

    # Load metadata will raise 404 if conversation not found
    _ = load_metadata(conv_id)
    messages = load_messages(conv_id)
    original_messages = messages.copy()
    original_count = len(messages)

    try:
        # Create user message
        user_message = Message(
            id=message.id,
            role="user",
            content=message.content,
            timestamp=datetime.now(timezone.utc).isoformat(),
            cache=True,
            assistant_message_id=message.assistant_message_id,
        )

        # Add to current conversation's messages
        messages.append(user_message)
        save_messages(conv_id, messages)
        update_message_count(conv_id, len(messages))

        # Return just the message ID
        return message.id

    except Exception as e:
        # Restore original state on error
        save_messages(conv_id, original_messages)
        update_message_count(conv_id, original_count)
        # Re-raise storage errors as 500
        raise HTTPException(status_code=500, detail=str(e))


def convert_messages_to_litellm(messages: List[Message], conv_id: str, metadata: ConversationMetadata, system_content: Any = None) -> List[Dict[str, Any]]:
    """Convert messages to LiteLLM format while preserving all functionality."""
    try:
        litellm_messages = []
        logger.debug(f"Converting {len(messages)} messages to LiteLLM format")
        logger.debug(f"Messages with cache=True: {[msg.id for msg in messages if msg.cache]}")

        # Handle system message first if present
        if system_content:
            try:
                system_message = {
                    "role": "system",
                    "content": [
                        {
                            "type": "text",
                            "text": system_content[0]["text"],
                            "cache_control": system_content[0].get("cache_control")
                        }
                    ]
                }
                logger.debug(f"Added cache control to system message: {system_message}")
                litellm_messages.append(system_message)
            except (KeyError, IndexError) as e:
                raise ValueError(f"Invalid system content format: {str(e)}")

        # Convert regular messages
        for msg in messages:
            try:
                message_content = []
                logger.debug(f"Processing message {msg.id}, cache={msg.cache}")

                # Handle images if present
                if msg.images:
                    for img in msg.images:
                        try:
                            img_path = get_images_dir(conv_id) / f"{img.id}{Path(img.filename).suffix}"
                            with open(img_path, "rb") as f:
                                base64_data = base64.b64encode(f.read()).decode()
                                message_content.append({
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:{img.media_type};base64,{base64_data}"
                                    }
                                })
                        except IOError as e:
                            print(f"Error processing image {img.filename}: {str(e)}")
                            raise

                # Add text content
                for block in msg.content:
                    if block["type"] == "text":
                        text = block["text"]
                        if msg.role == "user" and metadata.user_name:
                            text = f"**{metadata.user_name}**: {text}"
                        message_content.append({
                            "type": "text",
                            "text": text,
                            "cache_control": {"type": "ephemeral"} if msg.cache else None
                        })

                # Create message with proper role and content
                litellm_message = {
                    "role": msg.role,
                    "content": message_content
                }

                litellm_messages.append(litellm_message)
            except Exception as e:
                print(f"Error processing message {msg.id}: {str(e)}")
                # Don't print message content as it may contain binary data
                raise

        logger.debug(f"Final litellm_messages structure: {json.dumps([{k:v for k,v in msg.items() if k != 'content'} for msg in litellm_messages], indent=2)}")
        return litellm_messages
    except Exception as e:
        import traceback
        print(f"Error in convert_messages_to_litellm: {str(e)}")
        print(f"Stack trace:\n{traceback.format_exc()}")
        raise
