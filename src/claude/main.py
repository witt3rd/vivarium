from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .conversations.router import router as conversations_router
from .storage import init_storage
from .system_prompts.router import router as system_prompts_router

# Create FastAPI app with /api prefix
app = FastAPI(root_path="/api")

# Initialize storage directories
init_storage()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(conversations_router)
app.include_router(system_prompts_router)
