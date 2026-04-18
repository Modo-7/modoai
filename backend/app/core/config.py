from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./modoai.db"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Hugging Face API (free tier)
    HF_API_KEY: str = ""
    HF_MODEL: str = "deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct"
    HF_API_URL: str = "https://api-inference.huggingface.co/models"
    
    # Alternative: Ollama (self-hosted)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "deepseek-coder"
    
    # Model provider selection: "huggingface" or "ollama"
    MODEL_PROVIDER: str = "huggingface"
    
    # Performance settings
    MAX_TOKENS: int = 4096
    TEMPERATURE: float = 0.7
    TOP_P: float = 0.95
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
