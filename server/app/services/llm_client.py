"""
VynceAI Backend - LLM Client
Clean Gemini-only implementation
"""

import asyncio
from typing import Optional, Dict, Any

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)

# Import Gemini SDK
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("Gemini SDK not installed. Run: pip install google-generativeai")


class LLMClient:
    """
    VynceAI LLM client - Gemini-powered
    """
    
    def __init__(self):
        """Initialize Gemini client"""
        logger.info(f"Initializing VynceAI LLM Client with Gemini")
        self._init_gemini()
    
    def _init_gemini(self):
        """Initialize Gemini client"""
        if GEMINI_AVAILABLE and settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            logger.info("✓ Gemini client initialized")
        else:
            if not GEMINI_AVAILABLE:
                logger.error("✗ Gemini SDK not installed")
            elif not settings.GEMINI_API_KEY:
                logger.error("✗ Gemini API key not configured")
    
    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Generate AI response using Gemini
        
        Args:
            prompt: User's prompt/question
            model: Optional specific model (defaults to gemini-2.5-flash)
            context: Optional page context
            temperature: Optional temperature override
            max_tokens: Optional max tokens override
            
        Returns:
            Generated text response
        """
        # Use provided values or defaults
        temp = temperature or settings.TEMPERATURE
        tokens = max_tokens or settings.MAX_TOKENS
        
        # Build enhanced prompt with context
        enhanced_prompt = self._build_prompt(prompt, context)
        
        logger.info(f"Generating response with Gemini (model: {model or 'default'})")
        
        try:
            return await self._gemini_generate(enhanced_prompt, model, temp, tokens)
        
        except Exception as e:
            error_msg = f"VynceAI generation error: {str(e)}"
            logger.error(error_msg)
            return error_msg
    
    def _build_prompt(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Build enhanced prompt with VynceAI branding and context"""
        if not context:
            return prompt
        
        context_parts = []
        
        # Add VynceAI system context
        context_parts.append("""You are VynceAI, an intelligent AI-powered browser assistant.

ABOUT VYNCEAI:
- VynceAI is a Chrome browser extension that brings AI directly into your browser
- It helps with web tasks, content understanding, automation, and smart browsing
- VynceAI makes web browsing more productive with AI-powered assistance

YOUR ROLE:
- Answer questions about web pages and content
- Help users understand what they're reading
- Provide smart, concise, web-focused responses
- Always identify as "VynceAI" when asked your name""")
        
        # Add page context if available
        if context.get("url"):
            context_parts.append(f"\nCurrent page URL: {context['url']}")
        if context.get("title"):
            context_parts.append(f"Page title: {context['title']}")
        if context.get("selected_text"):
            context_parts.append(f"Selected text: {context['selected_text']}")
        if context.get("page_content"):
            content = context['page_content'][:500]
            context_parts.append(f"Page content: {content}...")
        
        # Combine context and prompt
        context_parts.append(f"\nUser question: {prompt}")
        context_parts.append("\nVynceAI response:")
        
        return "\n".join(context_parts)
    
    async def _gemini_generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> str:
        """Generate response using Google Gemini API"""
        if not GEMINI_AVAILABLE:
            return "Error: Gemini SDK not installed. Run: pip install google-generativeai"
        if not settings.GEMINI_API_KEY:
            return "Error: Gemini API key not configured"
        
        try:
            model_name = model or settings.GEMINI_MODEL
            # Remove 'models/' prefix if present
            if model_name.startswith('models/'):
                model_name = model_name.replace('models/', '')
            
            logger.info(f"Calling Gemini API with model: {model_name}")
            
            gemini_model = genai.GenerativeModel(model_name)
            response = await asyncio.to_thread(
                gemini_model.generate_content,
                prompt
            )
            
            result = response.text.strip()
            logger.info(f"Gemini response received: {len(result)} characters")
            return result
        
        except Exception as e:
            error_msg = f"Gemini API error: {str(e)}"
            logger.error(error_msg)
            return error_msg
    
    async def get_available_models(self) -> list:
        """Get list of available Gemini models"""
        if not settings.GEMINI_API_KEY:
            return []
        
        return [
            {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "provider": "gemini"},
            {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash", "provider": "gemini"},
        ]


# Singleton instance
llm_client = LLMClient()
