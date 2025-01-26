from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .conversations.router import router as conversations_router
from .storage import init_storage
from .system_prompts.router import router as system_prompts_router

app = FastAPI()

# Initialize storage directories
init_storage()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(conversations_router, prefix=settings.api_prefix)
app.include_router(system_prompts_router, prefix=settings.api_prefix)
