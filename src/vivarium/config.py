from pathlib import Path
from typing import Any, List

from pydantic import Field, ValidationInfo, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Data Directory Configuration
    data_dir: Path = Field(
        default=Path("data"), description="Base directory for all data"
    )
    conversations_dir: Path = Field(
        default=Path("data/conversations"),
        description="Directory for conversation data",
    )
    system_prompts_dir: Path = Field(
        default=Path("data/system_prompts"), description="Directory for system prompts"
    )
    debug_dir: Path = Field(
        default=Path("data/debug"), description="Directory for debug data"
    )

    # Model Configuration
    default_model: str = Field(
        default="claude-3-5-sonnet-20241022", description="Default Claude model to use"
    )
    default_max_tokens: int = Field(
        default=8192, description="Default maximum tokens limit"
    )

    # API Configuration
    anthropic_beta_header: str = Field(
        default="prompt-caching-2024-07-31",
        description="Beta feature header for prompt caching",
    )
    api_prefix: str = Field(default="/api", description="API route prefix")
    cors_origins: str = Field(default="*", description="CORS configuration")

    # File Storage Configuration
    supported_image_types: str = Field(
        default="jpg,png,webp",
        description="Comma-separated list of supported image formats",
    )

    anthropic_api_key: str = ""  # Add Anthropic API key field

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", env_prefix="", extra="allow"
    )

    @field_validator("conversations_dir", "system_prompts_dir", mode="before")
    def validate_paths(cls, value: Any, info: ValidationInfo) -> Path:
        if isinstance(value, str):
            value = Path(value)
        if not value:
            data_dir = info.data.get("data_dir", Path("data"))
            if info.field_name == "conversations_dir":
                return data_dir / "conversations"
            return data_dir / "system_prompts"
        return value

    @property
    def image_types(self) -> List[str]:
        return [x.strip() for x in self.supported_image_types.split(",")]

    @classmethod
    def parse_env_var(cls, field_name: str, raw_val: str) -> Any:
        if field_name in ["data_dir", "conversations_dir", "system_prompts_dir"]:
            return Path(raw_val)
        return raw_val


settings = Settings()
