"""
VynceAI Backend - Utility Routes
Health checks, status, and utility endpoints
"""

from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.core.config import settings
from app.core.logger import get_logger
import time

router = APIRouter()
logger = get_logger(__name__)

# Track server start time
START_TIME = time.time()

@router.get("/health", response_model=HealthResponse)
def health_check():
    """
    Health check endpoint
    
    Returns:
        Service health status
    """
    logger.debug("Health check request")
    
    uptime_seconds = int(time.time() - START_TIME)
    uptime_minutes = uptime_seconds // 60
    uptime_hours = uptime_minutes // 60
    
    if uptime_hours > 0:
        uptime_str = f"{uptime_hours}h {uptime_minutes % 60}m"
    elif uptime_minutes > 0:
        uptime_str = f"{uptime_minutes}m {uptime_seconds % 60}s"
    else:
        uptime_str = f"{uptime_seconds}s"
    
    return {
        "status": "ok",
        "service": "VynceAI",
        "uptime": uptime_str,
        "version": settings.APP_VERSION
    }

@router.get("/ping")
def ping():
    """
    Simple ping endpoint for connectivity testing
    
    Returns:
        Pong response
    """
    logger.debug("Ping request")
    return {"ping": "pong", "timestamp": int(time.time())}

@router.get("/config")
def get_config():
    """
    Get current configuration (non-sensitive info only)
    
    Returns:
        Configuration details
    """
    logger.debug("Config request")
    
    api_keys_status = settings.validate_api_keys()
    available_models = settings.get_available_models()
    
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "debug": settings.DEBUG,
        "api_keys_configured": api_keys_status,
        "available_models": len(available_models),
        "max_tokens": settings.MAX_TOKENS,
        "temperature": settings.TEMPERATURE
    }

@router.get("/status")
def get_status():
    """
    Get detailed service status
    
    Returns:
        Detailed status information
    """
    logger.debug("Status request")
    
    uptime_seconds = int(time.time() - START_TIME)
    api_keys_status = settings.validate_api_keys()
    available_models = settings.get_available_models()
    
    return {
        "service": "VynceAI Backend",
        "status": "running",
        "version": settings.APP_VERSION,
        "uptime_seconds": uptime_seconds,
        "api_providers": {
            "gemini": api_keys_status["gemini"]
        },
        "available_models": [m["id"] for m in available_models],
        "total_models": len(available_models)
    }
