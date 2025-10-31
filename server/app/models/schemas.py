"""
VynceAI Backend - Pydantic Schemas
Request and response models for API endpoints
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime

# ============================================================================
# Context Schemas
# ============================================================================

class PageContext(BaseModel):
    """Schema for web page context"""
    url: Optional[str] = Field(None, description="Current page URL")
    title: Optional[str] = Field(None, description="Page title")
    selected_text: Optional[str] = Field(None, description="User-selected text", alias="selectedText")
    page_content: Optional[str] = Field(None, description="Page content", alias="pageContent")
    
    model_config = ConfigDict(populate_by_name=True)

# ============================================================================
# Memory Schemas
# ============================================================================

class MemoryItem(BaseModel):
    """Single memory interaction"""
    user: str = Field(..., description="User message")
    bot: str = Field(..., description="Bot response")
    timestamp: Optional[str] = Field(None, description="ISO timestamp")

# ============================================================================
# AI Chat Schemas
# ============================================================================

class AIRequest(BaseModel):
    """Request schema for AI chat endpoint"""
    prompt: str = Field(..., description="User's prompt/question", min_length=1)
    context: Optional[PageContext] = Field(None, description="Optional page context")
    memory: Optional[List[MemoryItem]] = Field(None, description="Recent conversation history")
    model: Optional[str] = Field("gemini-2.5-flash", description="AI model to use")
    
    model_config = ConfigDict(populate_by_name=True)

class AIResponse(BaseModel):
    """Response schema for AI chat endpoint"""
    response: str = Field(..., description="AI-generated response")
    model: Optional[str] = Field(None, description="Model used for generation")
    tokens: Optional[int] = Field(None, description="Tokens used")
    success: Optional[bool] = Field(True, description="Whether the request was successful")

# ============================================================================
# Command Schemas
# ============================================================================

class CommandRequest(BaseModel):
    """Request schema for command execution"""
    command: str = Field(..., description="Command to execute", min_length=1)
    params: Optional[Dict[str, Any]] = Field(None, description="Optional command parameters")

class CommandResponse(BaseModel):
    """Response schema for command execution"""
    result: str = Field(..., description="Command execution result")
    success: bool = Field(True, description="Execution success status")
    error: Optional[str] = Field(None, description="Error message if failed")

# ============================================================================
# Health Check Schema
# ============================================================================

class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status")
    service: str = Field(..., description="Service name")
    uptime: str = Field(..., description="Uptime status")
    version: str = Field(..., description="API version")

# ============================================================================
# Error Response Schema
# ============================================================================

class ErrorResponse(BaseModel):
    """Standard error response schema"""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.now)
