"""
VynceAI Backend - AI Routes
Endpoints for AI chat and query processing
"""

from fastapi import APIRouter, HTTPException
from app.models.schemas import AIRequest, AIResponse
from app.services.ai_service import process_ai_query, process_ai_query_advanced, get_available_models
from app.core.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

@router.post("/chat", response_model=AIResponse)
async def ai_chat(req: AIRequest):
    """
    AI chat endpoint - process user queries with AI, context, and memory
    
    Args:
        req: AIRequest with prompt, optional context, optional memory, and model
        
    Returns:
        AIResponse with generated text
    """
    logger.info(f"AI chat request - Model: {req.model}, Prompt length: {len(req.prompt)}")
    if req.memory:
        logger.info(f"Memory provided: {len(req.memory)} interactions")
    
    try:
        # Convert memory items to dicts if provided
        memory_list = None
        if req.memory:
            memory_list = [{"user": m.user, "bot": m.bot, "timestamp": m.timestamp} for m in req.memory]
        
        # Use advanced processing if context or memory provided
        if req.context or req.memory:
            result = await process_ai_query_advanced(
                prompt=req.prompt,
                context=req.context,
                memory=memory_list,
                model=req.model or "gemini-2.5-flash"
            )
            return AIResponse(**result)
        else:
            # Simple processing without context
            response = await process_ai_query(
                prompt=req.prompt,
                model=req.model or "gemini-2.5-flash"
            )
            return AIResponse(response=response, model=req.model)
    
    except Exception as e:
        logger.error(f"Error in ai_chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models")
async def list_models():
    """
    Get list of available AI models
    
    Returns:
        List of available models with metadata
    """
    logger.info("Fetching available AI models")
    
    try:
        models = await get_available_models()
        return {
            "models": models,
            "count": len(models)
        }
    
    except Exception as e:
        logger.error(f"Error fetching models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def ai_query(req: AIRequest):
    """
    Simple AI query endpoint (alias for /chat)
    
    Args:
        req: AIRequest with prompt
        
    Returns:
        AI-generated response
    """
    logger.info(f"AI query request - Prompt: {req.prompt[:50]}...")
    
    try:
        response = await process_ai_query(req.prompt, req.model or "gemini-2.5-flash")
        return {"response": response}
    
    except Exception as e:
        logger.error(f"Error in ai_query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
