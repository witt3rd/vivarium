import json
import uuid
from typing import Any, Dict, List, TypedDict, cast

from anthropic import Anthropic
from anthropic.types import MessageParam
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..system_prompts.storage import load_prompt
from .schema import (
    Conversation,
    ConversationCreate,
    ConversationUpdate,
    Message,
    TokenUsage,
)
from .storage import (
    delete_conversation,
    list_conversations,
    load_conversation,
    save_conversation,
)


class ContentBlock(TypedDict):
    type: str
    text: str


router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.post("", response_model=Conversation)
async def create_conversation(conversation: ConversationCreate) -> Conversation:
    """Create a new conversation."""
    model = conversation.model or "claude-3-5-sonnet-20241022"
    max_tokens = conversation.max_tokens or 8192
    conversation_obj = Conversation(
        id=conversation.id,
        name=conversation.name,
        system_prompt_id=conversation.system_prompt_id,
        model=model,
        max_tokens=max_tokens,
    )
    save_conversation(conversation_obj)
    return conversation_obj


@router.get("", response_model=List[Conversation])
async def get_conversations() -> List[Conversation]:
    """Get all conversations."""
    return list_conversations()


@router.get("/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str) -> Conversation:
    """Get a conversation by ID."""
    return load_conversation(conversation_id)


@router.delete("/{conversation_id}")
async def remove_conversation(conversation_id: str) -> None:
    """Delete a conversation."""
    delete_conversation(conversation_id)


@router.put("/{conversation_id}/messages/{message_id}", response_model=Conversation)
async def update_message(
    conversation_id: str, message_id: str, updated_message: Message
) -> Conversation:
    """Update a message in a conversation."""
    conversation = load_conversation(conversation_id)

    # Find and update the message
    for i, msg in enumerate(conversation.messages):
        if msg.id == message_id:
            conversation.messages[i] = updated_message
            save_conversation(conversation)
            return conversation

    raise HTTPException(status_code=404, detail="Message not found")


@router.delete("/{conversation_id}/messages/{message_id}", response_model=Conversation)
async def delete_message(conversation_id: str, message_id: str) -> Conversation:
    """Delete a message from a conversation."""
    conversation = load_conversation(conversation_id)

    # Filter out the message to delete
    original_length = len(conversation.messages)
    conversation.messages = [
        msg for msg in conversation.messages if msg.id != message_id
    ]

    if len(conversation.messages) == original_length:
        raise HTTPException(status_code=404, detail="Message not found")

    save_conversation(conversation)
    return conversation


@router.post(
    "/{conversation_id}/messages/{message_id}/cache", response_model=Conversation
)
async def toggle_message_cache(conversation_id: str, message_id: str) -> Conversation:
    """Toggle the cache flag for a message."""
    conversation = load_conversation(conversation_id)

    # Find and toggle the message cache
    for msg in conversation.messages:
        if msg.id == message_id:
            msg.cache = not msg.cache
            save_conversation(conversation)
            return conversation

    raise HTTPException(status_code=404, detail="Message not found")


@router.post(
    "/{conversation_id}/messages",
    response_model=None,
    responses={
        200: {
            "description": "Streaming response from Claude",
            "content": {
                "text/event-stream": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "data": {
                                "type": "string",
                                "description": "The streamed text chunk",
                            }
                        },
                    }
                }
            },
        }
    },
    openapi_extra={
        "x-stream": True,
        "x-response-stream": {
            "type": "object",
            "properties": {"data": {"type": "string"}},
        },
    },
)
async def add_message(conversation_id: str, message: Message) -> StreamingResponse:
    """Add a message to a conversation and get Claude's streaming response."""
    conversation = load_conversation(conversation_id)
    print(f"Loaded conversation: {conversation.id}")
    print(f"System prompt ID: {conversation.system_prompt_id}")

    # Extract assistant_message_id if provided
    assistant_message_id = None
    if hasattr(message, "assistant_message_id"):
        assistant_message_id = message.assistant_message_id
        delattr(message, "assistant_message_id")  # Remove it before saving

    # Ensure message has an ID
    if not message.id:
        message.id = str(uuid.uuid4())

    # Add the user's message
    conversation.messages.append(message)
    save_conversation(conversation)

    # Get system prompt if exists
    system_content = ""
    if conversation.system_prompt_id:
        system_prompt = load_prompt(conversation.system_prompt_id)
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
        print(f"Loaded system prompt: {system_prompt.name}")
        print(f"System content: {system_content}")
    else:
        print("No system prompt set for this conversation")

    # Create Anthropic client with cache control enabled
    client = Anthropic()
    # Enable prompt caching beta feature
    setattr(client, "_headers", {"anthropic-beta": "prompt-caching-2024-07-31"})

    # Convert messages to Anthropic format with cache control
    anthropic_messages: List[MessageParam] = []
    for msg in conversation.messages:
        if msg.content and msg.content[0]["text"]:
            content = msg.content[0]["text"]
            message_dict: Dict[str, Any] = {
                "role": "user" if msg.role == "user" else "assistant",
                "content": [{"type": "text", "text": content}],
            }
            # Add cache control for messages over 1024 tokens
            if len(content) > 4096:  # Approximate token count
                message_dict["content"][0]["cache_control"] = {"type": "ephemeral"}

            anthropic_messages.append(cast(MessageParam, message_dict))
            print(
                f"Added message to context - Role: {msg.role}, Content: {content[:100]}..."
            )

    async def stream_response():
        """Stream the response from Claude."""
        response_text = ""
        usage_data = None

        # Get Claude's streaming response
        stream = client.messages.create(
            model=conversation.model,
            max_tokens=conversation.max_tokens,
            system=system_content,
            messages=anthropic_messages,
            stream=True,
        )

        try:
            for chunk in stream:
                print(f"Chunk type: {chunk.type}")
                print(f"Chunk content: {chunk}")

                # Send the event as JSON
                event: Dict[str, Any] = {
                    "type": chunk.type,
                }

                if chunk.type == "message_start":
                    # Extract usage information if available
                    message = getattr(chunk, "message", None)
                    usage = getattr(message, "usage", None) if message else None
                    print(f"Message from chunk: {message}")
                    print(f"Raw usage from message: {usage}")
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
                        print(f"Created TokenUsage: {usage_data.model_dump()}")

                    # Construct message event
                    event["message"] = {
                        "id": assistant_message_id or str(uuid.uuid4()),
                        "role": "assistant",
                        "usage": usage_data.model_dump() if usage_data else None,
                    }
                    print(f"Sending event with usage: {event}")
                elif chunk.type == "content_block_start":
                    event["content_block"] = {
                        "type": "text",
                        "text": "",
                    }
                elif chunk.type == "content_block_delta":
                    delta = getattr(chunk, "delta", None)
                    if delta and getattr(delta, "text", None):
                        delta_text = str(getattr(delta, "text", ""))
                        print(f"Delta text: {delta_text}")
                        response_text = response_text + delta_text
                        event["delta"] = {
                            "type": "text_delta",
                            "text": delta_text,
                        }
                elif chunk.type == "message_delta":
                    # Update output tokens from final usage data
                    delta_usage = getattr(chunk, "usage", None)
                    if delta_usage and usage_data:
                        output_tokens = getattr(delta_usage, "output_tokens", None)
                        if output_tokens is not None:
                            usage_data.output_tokens = output_tokens
                            print(f"Updated output tokens to: {output_tokens}")

                yield f"data: {json.dumps(event)}\n\n"

            # Save the complete response
            assistant_message = Message(
                id=assistant_message_id or str(uuid.uuid4()),
                role="assistant",
                content=[{"type": "text", "text": response_text}],
                usage=usage_data,
            )
            print(f"Saving message with usage: {assistant_message.model_dump()}")
            conversation.messages.append(assistant_message)
            save_conversation(conversation)

            # Send end of stream marker
            yield "data: [DONE]\n\n"

        except Exception as e:
            print(f"Error streaming response: {e}")
            print(f"Error type: {type(e)}")
            print(f"Error details: {str(e)}")
            yield f"data: Error: {str(e)}\n\n"

    return StreamingResponse(
        stream_response(),
        media_type="text/event-stream",
    )


@router.put("/{conversation_id}", response_model=Conversation)
async def update_conversation(
    conversation_id: str, update: ConversationUpdate
) -> Conversation:
    """Update conversation metadata."""
    conversation = load_conversation(conversation_id)

    # Always update all fields
    conversation.name = update.name
    conversation.system_prompt_id = update.system_prompt_id
    conversation.model = update.model or "claude-3-5-sonnet-20241022"
    conversation.max_tokens = update.max_tokens or 8192

    save_conversation(conversation)
    return conversation


@router.get(
    "/{conversation_id}/markdown",
    response_model=str,
    responses={200: {"content": {"text/markdown": {"schema": {"type": "string"}}}}},
)
async def get_conversation_markdown(conversation_id: str) -> str:
    """Get a conversation in markdown format."""
    conversation = load_conversation(conversation_id)

    lines: list[str] = [
        # f"# {conversation.name}",
        # "",
        # f"Created: {conversation.created_at}",
        # f"Updated: {conversation.updated_at}",
        # "",
        # "---",
        # "",
    ]

    for message in conversation.messages or []:
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


@router.post("/{conversation_id}/clone", response_model=Conversation)
async def clone_conversation(conversation_id: str) -> Conversation:
    """Clone an existing conversation."""
    # Get source conversation
    source = load_conversation(conversation_id)

    # Create new conversation with same settings
    new_id = str(uuid.uuid4())
    clone = Conversation(
        id=new_id,
        name=f"{source.name} [CLONE]",
        system_prompt_id=source.system_prompt_id,
        model=source.model,
        max_tokens=source.max_tokens,
        messages=[],
    )

    # Clone all messages with new IDs
    for msg in source.messages:
        new_msg = Message(
            id=str(uuid.uuid4()),
            role=msg.role,
            content=msg.content,
            timestamp=msg.timestamp,
            cache=msg.cache,
            usage=msg.usage,
        )
        clone.messages.append(new_msg)

    save_conversation(clone)
    return clone
