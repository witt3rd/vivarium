import os
import sys
from pathlib import Path

import yaml

# Add the src directory to the Python path so we can import our modules
src_dir = Path(__file__).parent.parent / "src"
sys.path.append(str(src_dir))

from vivarium.system_prompts.storage import SYSTEM_PROMPTS_DIR
from vivarium.system_prompts.schema import SystemPrompt


def load_prompt(prompt_id: str) -> SystemPrompt:
    """Load a system prompt from disk."""
    file_path = os.path.join(SYSTEM_PROMPTS_DIR, f"{prompt_id}.yaml")
    with open(file_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
        return SystemPrompt(**data)


def save_prompt(prompt: SystemPrompt) -> None:
    """Save a system prompt to disk."""
    # Create a new filename by appending _stripped to the original ID
    new_id = f"{prompt.id}_stripped"
    file_path = os.path.join(SYSTEM_PROMPTS_DIR, f"{new_id}.yaml")

    # Create a new prompt with the stripped content
    new_prompt = SystemPrompt(
        id=new_id,
        name=f"{prompt.name} (Stripped)",
        content=prompt.content,
        description=prompt.description,
        is_cached=prompt.is_cached,
    )

    with open(file_path, "w", encoding="utf-8") as f:
        yaml.safe_dump(
            new_prompt.model_dump(),
            f,
            default_flow_style=False,
            allow_unicode=True,
            sort_keys=False,
        )


def strip_separators(content: str) -> str:
    """Remove all '---\n\n' sequences from the content."""
    return content.replace("---\n\n", "")


def main():
    if len(sys.argv) != 2:
        print("Usage: python strip_seps.py <prompt_id>")
        sys.exit(1)

    prompt_id = sys.argv[1]

    try:
        # Load the prompt
        prompt = load_prompt(prompt_id)

        # Strip the separators
        prompt.content = strip_separators(prompt.content)

        # Save the new version
        save_prompt(prompt)
        print(f"Successfully created stripped version of prompt {prompt_id}")

    except FileNotFoundError:
        print(f"Error: Prompt with ID {prompt_id} not found")
        sys.exit(1)
    except Exception as e:
        print(f"Error processing prompt: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
