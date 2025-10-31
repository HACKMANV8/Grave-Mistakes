"""
VynceAI Backend - Main Application Entry Point
FastAPI server for Chrome extension AI interactions
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ai_router
from utils.logger import get_logger

# Initialize logger
logger = get_logger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="VynceAI Backend",
    description="AI-powered backend for VynceAI Chrome Extension",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS - Allow all origins for local extension testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ai_router.router, prefix="/api", tags=["AI"])

# Root route
@app.get("/")
async def root():
    """
    Root endpoint - Health check for the API
    """
    logger.info("Root endpoint accessed")
    return {
        "message": "VynceAI Backend running",
        "status": "active",
        "version": "1.0.0"
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    """
    Runs when the application starts
    """
    logger.info("🚀 VynceAI Backend starting up...")
    logger.info("📡 CORS enabled for all origins")
    logger.info("✅ Application ready to receive requests")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """
    Runs when the application shuts down
    """
    logger.info("🛑 VynceAI Backend shutting down...")

# Run with: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
