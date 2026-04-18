# ModoAI - Production-Grade AI Coding Assistant

ModoAI is a production-grade AI coding assistant built from scratch with a clean, minimal ChatGPT-style interface. It runs entirely on remote servers using only free and open providers.

## Architecture

```
Frontend (Next.js 14)
  → API calls → Backend (FastAPI)
  → AI Service → Hugging Face Inference API (free tier) or Ollama
  → Database → PostgreSQL (Railway/Render free tier) or SQLite
```

## Features

- **Clean ChatGPT-style Interface**: Minimal, modern dark UI with sidebar conversation history
- **Real-time Streaming**: Server-sent events for instant AI responses
- **Multi-user Support**: JWT authentication with user management
- **Conversation Management**: Create, view, and delete conversations
- **Code Highlighting**: Syntax-highlighted code blocks with copy functionality
- **Markdown Support**: Full markdown rendering with GFM
- **Responsive Design**: Works on desktop and mobile
- **Production-Ready**: Proper error handling, logging, and scalability

## Tech Stack

### Backend
- **FastAPI**: Modern, fast Python web framework
- **SQLAlchemy**: Async ORM with PostgreSQL/SQLite support
- **Pydantic**: Data validation and settings management
- **python-jose**: JWT authentication
- **httpx**: Async HTTP client for AI API calls

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Zustand**: Lightweight state management
- **React Markdown**: Markdown rendering
- **React Syntax Highlighter**: Code highlighting

### AI Models
- **Hugging Face Inference API** (free tier): DeepSeek-Coder-V2-Lite-Instruct
- **Ollama** (self-hosted): DeepSeek-Coder, Qwen-Coder, or other models

## Deployment Options

### Option 1: Railway (Recommended)

1. **Deploy Backend**:
   ```bash
   # Create Railway account at railway.app
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Initialize project
   railway init
   
   # Add PostgreSQL database
   railway add postgresql
   
   # Deploy backend
   railway up --service backend
   ```

2. **Deploy Frontend**:
   ```bash
   # In frontend directory
   railway up --service frontend
   ```

### Option 2: Render

1. **Create PostgreSQL Database**:
   - Go to render.com
   - Create new PostgreSQL database
   - Copy connection string

2. **Deploy Backend**:
   - Connect GitHub repository
   - Create new web service
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Add environment variables from `.env.example`

3. **Deploy Frontend**:
   - Create new web service
   - Root directory: `frontend`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Add `NEXT_PUBLIC_API_URL` environment variable pointing to backend URL

## Local Development

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your settings
# For local development with SQLite:
DATABASE_URL=sqlite+aiosqlite:///./modoai.db
SECRET_KEY=your-secret-key-here
HF_API_KEY=your-huggingface-api-key-optional

# Run backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000

# Run frontend
npm run dev
```

Access the application at http://localhost:3000

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user (returns JWT token)

### Chat
- `POST /chat/completions` - Send message and get AI response (streaming)
- `GET /chat/conversations` - List user's conversations
- `GET /chat/conversations/{id}/messages` - Get conversation messages
- `DELETE /chat/conversations/{id}` - Delete conversation

### Health
- `GET /health` - Health check endpoint

## Configuration

### Backend Environment Variables

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/modoai
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
HF_API_KEY=your-huggingface-api-key-optional
HF_MODEL=deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct
MODEL_PROVIDER=huggingface  # or "ollama"
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-coder
```

### Frontend Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## AI Model Configuration

### Using Hugging Face Inference API (Free Tier)

1. Get a free API key from https://huggingface.co/settings/tokens
2. Set `HF_API_KEY` in backend `.env`
3. The default model is `deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct`

### Using Ollama (Self-Hosted)

1. Install Ollama from https://ollama.ai
2. Pull a coding model:
   ```bash
   ollama pull deepseek-coder
   # or
   ollama pull qwen2.5-coder
   ```
3. Set in backend `.env`:
   ```env
   MODEL_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=deepseek-coder
   ```

## Performance & Scalability

- **Async I/O**: All database and HTTP calls are async
- **Connection Pooling**: SQLAlchemy with connection pooling
- **Streaming Responses**: Server-sent events for real-time AI responses
- **CORS Enabled**: Configured for cross-origin requests
- **Production Database**: PostgreSQL for production, SQLite for development

## Security

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **CORS Configuration**: Configurable CORS middleware
- **Environment Variables**: Sensitive data in environment variables
- **SQL Injection Prevention**: SQLAlchemy ORM prevents SQL injection

## Future Enhancements

- Rate limiting
- User roles and permissions
- File upload and analysis
- Web search integration
- Multiple AI model selection
- Conversation export/import
- Voice input/output
- Mobile app (React Native)

## License

MIT License - Feel free to use and modify for your needs.

## Support

For issues and questions, please open an issue on the repository.
