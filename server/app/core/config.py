"""
VynceAI Backend - Configuration
Centralized configuration management using environment variables
"""

import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "VynceAI Backend"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Server
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    # LLM Provider Selection
    LLM_PROVIDER: str = "gemini"  # Fixed to Gemini only
    
    # AI Models - Gemini (Primary and Only)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # AI Generation Settings
    MAX_TOKENS: int = 1000
    TEMPERATURE: float = 0.7
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env file

    def validate_api_keys(self) -> dict:
        """Check which API keys are configured - Gemini only"""
        return {
            "gemini": bool(self.GEMINI_API_KEY)
        }
    
    def get_available_models(self) -> list:
        """Get list of available AI models - Gemini only"""
        models = []
        
        if self.GEMINI_API_KEY:
            models.extend([
                {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "provider": "gemini"},
                {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro", "provider": "gemini"},
                {"id": "gemini-flash-latest", "name": "Gemini Flash Latest", "provider": "gemini"},
            ])
        
        return models

# Global settings instance
settings = Settings()
