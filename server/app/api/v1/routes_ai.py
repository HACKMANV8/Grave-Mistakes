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

@router.post("/summarize")
async def summarize_page(req: AIRequest):
    """
    Summarize webpage content
    
    Args:
        req: AIRequest with page content in context
        
    Returns:
        AI-generated summary
    """
    logger.info(f"Page summarization request for: {req.context.url if req.context else 'Unknown URL'}")
    
    try:
        if not req.context or not req.context.pageContent:
            raise HTTPException(status_code=400, detail="Page content is required for summarization")
        
        # Build summarization prompt
        prompt = f"""Please provide a comprehensive summary of this webpage:

Title: {req.context.title if req.context.title else 'Unknown'}
URL: {req.context.url if req.context.url else 'Unknown'}

Content:
{req.context.pageContent[:3000]}

Provide:
1. Main topic and purpose
2. Key points (3-5 bullets)
3. Target audience
4. Content type (article, product page, docs, etc.)

Be concise but informative."""
        
        response = await process_ai_query(prompt, req.model or "gemini-2.5-flash")
        
        return {
            "response": response,
            "model": req.model,
            "url": req.context.url,
            "title": req.context.title
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in summarize_page: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze")
async def analyze_page(req: AIRequest):
    """
    Analyze webpage content in depth
    
    Args:
        req: AIRequest with page content in context
        
    Returns:
        AI-generated analysis
    """
    logger.info(f"Page analysis request for: {req.context.url if req.context else 'Unknown URL'}")
    
    try:
        if not req.context or not req.context.pageContent:
            raise HTTPException(status_code=400, detail="Page content is required for analysis")
        
        # Build analysis prompt
        prompt = f"""Please provide a detailed analysis of this webpage:

Title: {req.context.title if req.context.title else 'Unknown'}
URL: {req.context.url if req.context.url else 'Unknown'}

Content:
{req.context.pageContent[:3000]}

Analyze:
1. Content quality and credibility
2. Structure and organization
3. Key information and insights
4. Sentiment and tone
5. Readability level
6. Calls-to-action or next steps

Provide useful insights."""
        
        response = await process_ai_query(prompt, req.model or "gemini-2.5-flash")
        
        return {
            "response": response,
            "model": req.model,
            "url": req.context.url,
            "title": req.context.title
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in analyze_page: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
