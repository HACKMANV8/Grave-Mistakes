"""
VynceAI Backend - AI Service
Handles AI query processing and LLM integration
Now powered by the unified LLM client (Phase 4)
"""

import asyncio
from typing import Optional, Dict, Any
from app.core.logger import get_logger
from app.services.llm_client import llm_client

logger = get_logger(__name__)

async def process_ai_query(prompt: str, model: str = "gemini-2.5-flash") -> str:
    """
    Process AI query with basic prompt using unified LLM client
    
    Args:
        prompt: User's prompt/question
        model: AI model to use (defaults to gemini-2.5-flash)
        
    Returns:
        AI-generated response text
    """
    logger.info(f"Processing AI query with model: {model}")
    logger.debug(f"Prompt: {prompt[:100]}...")
    
    # Use the unified LLM client
    response = await llm_client.generate(prompt=prompt, model=model)
    
    logger.info(f"Generated response: {len(response)} characters")
    
    return response

async def process_ai_query_advanced(
    prompt: str,
    context: Optional[Any] = None,
    memory: Optional[list] = None,
    model: str = "gemini-2.5-flash"
) -> Dict[str, Any]:
    """
    Process AI query with context, memory, and return detailed response
    
    Args:
        prompt: User's prompt/question
        context: Optional page context (PageContext model or dict)
        memory: Optional recent conversation history
        model: AI model to use
        
    Returns:
        Dictionary with response, model info, tokens, etc.
    """
    logger.info(f"Processing advanced AI query with model: {model}")
    if memory:
        logger.info(f"Using {len(memory)} memory items for context")
    
    # Convert PageContext model to dict if needed
    context_dict = None
    if context:
        if hasattr(context, 'model_dump'):
            context_dict = context.model_dump(by_alias=True)
        elif isinstance(context, dict):
            context_dict = context
    
    # Build enhanced prompt with memory and context
    enhanced_prompt = _build_enhanced_prompt(prompt, context_dict, memory)
    
    # Use the unified LLM client
    response_text = await llm_client.generate(
        prompt=enhanced_prompt,
        model=model
    )
    
    return {
        "response": response_text,
        "model": model,
        "tokens": len(response_text.split()),  # Rough estimate
        "success": True
    }

def _build_enhanced_prompt(prompt: str, context: Optional[Dict] = None, memory: Optional[list] = None) -> str:
    """
    Build enhanced prompt with system instructions, memory, and context
    
    Args:
        prompt: User's current question
        context: Page context (url, title, snippet, etc.)
        memory: Recent conversation history
        
    Returns:
        Enhanced prompt string
    """
    parts = []
    
    # System instructions - VynceAI specialized
    parts.append("""You are VynceAI, an intelligent AI-powered web assistant and browser extension.

ABOUT VYNCEAI:
- VynceAI is a Chrome browser extension that brings AI capabilities directly into the browser
- It helps users with web tasks, automation, content understanding, and smart web interactions
- VynceAI can read page content, answer questions about websites, and assist with browsing tasks
- The product makes web browsing smarter and more productive with AI assistance

YOUR PERSONALITY:
- You are helpful, knowledgeable, and web-savvy
- You provide concise, accurate responses focused on web and browsing contexts
- You always identify yourself as "VynceAI" when asked about your name
- You are enthusiastic about helping users be more productive online

YOUR CAPABILITIES:
- Understand and analyze web page content
- Answer questions about websites and web content
- Help with web-based tasks and automation
- Provide smart suggestions based on page context
- Remember conversation history for context-aware responses

Keep responses concise, relevant, and helpful. Focus on web-related assistance.""")
    
    # Add memory if available
    if memory and len(memory) > 0:
        parts.append("\n=== Recent Conversation History ===")
        for item in memory:
            parts.append(f"User: {item.get('user', '')}")
            parts.append(f"VynceAI: {item.get('bot', '')}")
        parts.append("=== End History ===\n")
    
    # Add page context if available
    if context:
        context_parts = []
        
        if context.get("url"):
            context_parts.append(f"Current Page: {context['url']}")
        
        if context.get("title"):
            context_parts.append(f"Page Title: {context['title']}")
        
        if context.get("selectedText"):
            context_parts.append(f"Selected Text: {context['selectedText'][:500]}")
        
        if context.get("snippet"):
            context_parts.append(f"Page Snippet: {context['snippet']}")
        elif context.get("pageContent"):
            content = context['pageContent'][:500]
            context_parts.append(f"Page Content: {content}")
        
        if context_parts:
            parts.append("\n=== Page Context ===")
            parts.extend(context_parts)
            parts.append("=== End Context ===\n")
    
    # Add current question
    parts.append(f"\nUser Question: {prompt}")
    parts.append("\nVynceAI Response:")
    
    return "\n".join(parts)

async def get_available_models() -> list:
    """
    Get list of available AI models from LLM client
    
    Returns:
        List of available models with metadata
    """
    return await llm_client.get_available_models()
