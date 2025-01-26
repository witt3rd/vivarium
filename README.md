# Vivarium

Vivarium is a FastAPI-based backend service that manages AI conversations and system prompts, designed to work with a modern React-based chat interface. It provides a robust API for handling conversational AI interactions using LiteLLM, supporting multiple LLM providers and models.

## Features

- FastAPI-powered REST API
- React-based chat interface
- Conversation management and persistence
- System prompt management
- Multi-provider LLM support via LiteLLM
- CORS support for cross-origin requests
- Modern dependency management with Rye

## Prerequisites

- Python 3.12 or higher
- Node.js (for chat UI)
- [Rye](https://rye-up.com/) for Python dependency management

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/vivarium.git
   cd vivarium
   ```

2. Install Python dependencies:

   ```bash
   rye sync
   ```

3. Install chat UI dependencies:
   ```bash
   cd chat-ui
   npm install
   ```

## Configuration

Create a `.env` file in the project root with your configuration:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

## Usage

1. Start the API server:

   ```bash
   rye run api
   ```

   The API will be available at http://localhost:9000

2. Start the chat UI (in a separate terminal):
   ```bash
   cd chat-ui
   npm run dev
   ```
   The UI will be available at http://localhost:3000

## API Endpoints

- `/api/conversations` - Manage conversations
- `/api/system-prompts` - Manage system prompts

## License

MIT. See [LICENSE](LICENSE) for more details.
