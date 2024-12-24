import asyncio
import sys
import uuid
from pathlib import Path

# Add the src directory to the Python path so we can import our modules
src_dir = Path(__file__).parent.parent / "src"
sys.path.append(str(src_dir))

from claude.conversations.router import get_conversation_markdown
from claude.conversations.storage import load_conversation
from claude.system_prompts.schema import SystemPrompt
from claude.system_prompts.storage import load_prompt, save_prompt


async def create_transcript(conversation_id: str) -> str:
    """Create a markdown transcript of the conversation."""
    return await get_conversation_markdown(conversation_id)


async def main():
    if len(sys.argv) != 2:
        print("Usage: python compact.py <conversation_id>")
        sys.exit(1)

    conversation_id = sys.argv[1]

    try:
        # Load the conversation
        conversation = load_conversation(conversation_id)

        # Get the system prompt if it exists
        system_prompt = None
        if conversation.system_prompt_id:
            system_prompt = load_prompt(conversation.system_prompt_id)
        else:
            print("Error: Conversation has no system prompt")
            sys.exit(1)

        # Get the transcript
        transcript = await create_transcript(conversation_id)

        # Create a new prompt with the transcript appended
        new_prompt = SystemPrompt(
            id=str(uuid.uuid4()),
            name=f"{system_prompt.name} (With Transcript)",
            content=f"{system_prompt.content}\n\n# Transcript\n\n{transcript}",
            description=f"System prompt from {system_prompt.name} combined with transcript from conversation {conversation.name}",
            is_cached=system_prompt.is_cached,
        )

        # Save the new prompt
        save_prompt(new_prompt)
        print(f"Successfully created new prompt {new_prompt.id} with transcript")

    except FileNotFoundError:
        print(f"Error: Conversation with ID {conversation_id} not found")
        sys.exit(1)
    except Exception as e:
        print(f"Error processing conversation: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
