"""
VynceAI Backend - Context Service
Handles web page context extraction and formatting
"""

from typing import Dict, Any, Optional
from app.core.logger import get_logger

logger = get_logger(__name__)

async def extract_context(page_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract and process page context from raw page data
    
    Args:
        page_data: Raw page data from extension
        
    Returns:
        Processed context dictionary
    """
    logger.info("Extracting page context")
    
    context = {}
    
    # Extract URL
    if "url" in page_data:
        context["url"] = page_data["url"]
    
    # Extract title
    if "title" in page_data:
        context["title"] = page_data["title"]
    
    # Extract selected text
    if "selectedText" in page_data or "selected_text" in page_data:
        selected = page_data.get("selectedText") or page_data.get("selected_text")
        if selected:
            context["selected_text"] = selected
    
    # Extract page content (truncate if too long)
    if "pageContent" in page_data or "page_content" in page_data:
        content = page_data.get("pageContent") or page_data.get("page_content")
        if content:
            # Limit to first 2000 characters
            context["page_content"] = content[:2000] if len(content) > 2000 else content
    
    # Extract metadata
    if "metadata" in page_data:
        context["metadata"] = page_data["metadata"]
    
    logger.debug(f"Extracted context keys: {list(context.keys())}")
    
    return context

async def format_context(context: Dict[str, Any]) -> str:
    """
    Format context dictionary into readable text for AI prompt
    
    Args:
        context: Context dictionary
        
    Returns:
        Formatted context string
    """
    logger.info("Formatting context for AI prompt")
    
    parts = []
    
    if "url" in context:
        parts.append(f"Page URL: {context['url']}")
    
    if "title" in context:
        parts.append(f"Page Title: {context['title']}")
    
    if "selected_text" in context:
        parts.append(f"Selected Text: {context['selected_text']}")
    
    if "page_content" in context:
        content = context["page_content"]
        parts.append(f"Page Content: {content[:500]}..." if len(content) > 500 else f"Page Content: {content}")
    
    formatted = "\n".join(parts)
    logger.debug(f"Formatted context: {len(formatted)} characters")
    
    return formatted

async def summarize_page(context: Dict[str, Any]) -> str:
    """
    Generate a brief summary of the page from context
    
    Args:
        context: Page context
        
    Returns:
        Brief page summary
    """
    summary_parts = []
    
    if "title" in context:
        summary_parts.append(context["title"])
    
    if "url" in context:
        summary_parts.append(f"({context['url']})")
    
    if "page_content" in context:
        content = context["page_content"]
        preview = content[:100] + "..." if len(content) > 100 else content
        summary_parts.append(f"Content preview: {preview}")
    
    return " ".join(summary_parts)
