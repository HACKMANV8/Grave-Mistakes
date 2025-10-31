/**
 * VynceAI Extension - API Handler
 * Manages communication with the VynceAI backend API
 */

// API Configuration
const API_BASE_URL = 'https://api.vynceai.com';
const API_VERSION = 'v1';
const API_TIMEOUT = 30000; // 30 seconds

/**
 * Call the VynceAI backend API with a prompt
 * @param {string} model - AI model to use (gpt-4, claude-3-opus, gemini-pro, etc.)
 * @param {string} prompt - User's prompt/question
 * @param {object} context - Additional context (page info, history, etc.)
 * @returns {Promise<object>} API response
 */
export async function callBackend(model, prompt, context = null) {
  try {
    // Get API key from storage
    const { settings } = await chrome.storage.local.get(['settings']);
    const apiKey = settings?.apiKey;
    
    // For development/demo - return mock response if no API key
    if (!apiKey) {
      console.warn('No API key found. Using mock response.');
      return getMockResponse(model, prompt);
    }
    
    // Build request payload
    const payload = {
      model,
      prompt,
      context: context ? {
        url: context.url,
        title: context.title,
        selectedText: context.selectedText,
        pageContent: context.textContent
      } : null,
      timestamp: Date.now()
    };
    
    console.log('Calling backend API:', payload);
    
    // Make API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    // Try the generate endpoint first (simplified API)
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey ? `Bearer ${apiKey}` : undefined,
        'X-Extension-Version': chrome.runtime.getManifest().version
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    }).catch(() => {
      // Fallback to v1 endpoint if generate fails
      return fetch(`${API_BASE_URL}/${API_VERSION}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-Extension-Version': chrome.runtime.getManifest().version
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    });
    
    clearTimeout(timeoutId);
    
    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    // Parse response
    const data = await response.json();
    
    return {
      text: data.response || data.message || data.text,
      model: data.model || model,
      tokens: data.usage?.total_tokens || 0,
      success: true
    };
    
  } catch (error) {
    console.error('API call failed:', error);
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    
    if (error.message.includes('Failed to fetch')) {
      // Return mock response if API is unreachable (for development)
      console.warn('API unreachable. Using mock response.');
      return getMockResponse(model, prompt);
    }
    
    throw error;
  }
}

/**
 * Get mock AI response for development/testing
 * @param {string} model - AI model name
 * @param {string} prompt - User's prompt
 * @returns {object} Mock response
 */
function getMockResponse(model, prompt) {
  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const responses = {
        'gpt-4': generateGPT4Response(prompt),
        'gpt-3.5-turbo': generateGPT35Response(prompt),
        'claude-3-opus': generateClaudeResponse(prompt),
        'claude-3-sonnet': generateClaudeResponse(prompt),
        'gemini-pro': generateGeminiResponse(prompt),
        'gemini-ultra': generateGeminiResponse(prompt)
      };
      
      resolve({
        text: responses[model] || generateDefaultResponse(prompt),
        model,
        tokens: Math.floor(Math.random() * 500) + 100,
        success: true,
        mock: true
      });
    }, 1000 + Math.random() * 1000); // 1-2 second delay
  });
}

/**
 * Generate mock GPT-4 response
 */
function generateGPT4Response(prompt) {
  const templates = [
    `I understand you're asking about "${prompt}". As GPT-4, I can help you with that. Based on your query, here's what I suggest:\n\n1. First, consider the context of your question\n2. Then, explore the available options\n3. Finally, make an informed decision\n\nWould you like me to elaborate on any of these points?`,
    
    `That's an interesting question! Let me break this down for you:\n\n"${prompt}"\n\nHere's my analysis:\n- This appears to be a question about [topic]\n- The key factors to consider are...\n- My recommendation would be...\n\nIs there a specific aspect you'd like me to focus on?`,
    
    `I'd be happy to help with "${prompt}".\n\nBased on current best practices and my training data, here's what you should know:\n\n• Key Point 1: Understanding the fundamentals\n• Key Point 2: Practical applications\n• Key Point 3: Common pitfalls to avoid\n\nLet me know if you need more specific guidance!`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Generate mock GPT-3.5 response
 */
function generateGPT35Response(prompt) {
  return `Thanks for your question about "${prompt}"!\n\nHere's a quick response:\n\nI can help you with this. The main things to consider are understanding the context, evaluating your options, and taking action based on the information available.\n\nWould you like me to provide more details on any specific aspect?`;
}

/**
 * Generate mock Claude response
 */
function generateClaudeResponse(prompt) {
  return `I appreciate you asking about "${prompt}". Let me provide a thoughtful response:\n\nFrom my analysis, there are several important considerations here:\n\n1. **Context**: First, it's important to understand the broader context\n2. **Analysis**: Breaking down the key components\n3. **Recommendations**: Based on the information available\n\nI aim to be helpful, harmless, and honest in my responses. Is there a particular angle you'd like me to explore further?`;
}

/**
 * Generate mock Gemini response
 */
function generateGeminiResponse(prompt) {
  return `Interesting question! Let me help you with "${prompt}".\n\n🔍 **Analysis:**\nBased on my understanding, this relates to [topic area]. Here's what I can tell you:\n\n✨ **Key Insights:**\n- Important factor #1\n- Important factor #2  \n- Important factor #3\n\n💡 **Suggestion:**\nI recommend approaching this systematically and considering all available options.\n\nWhat specific aspect would you like to explore in more depth?`;
}

/**
 * Generate default mock response
 */
function generateDefaultResponse(prompt) {
  return `Thank you for your question: "${prompt}"\n\nI'm here to help! As your AI assistant, I can:\n\n• Answer questions about any topic\n• Help you with tasks on web pages\n• Provide summaries and analysis\n• Automate repetitive actions\n\nPlease note: This is a demo response. Configure your API key in settings to connect to the real AI backend.\n\nHow else can I assist you today?`;
}

/**
 * Check API connection status
 * @returns {Promise<object>} Connection status
 */
export async function checkAPIStatus() {
  try {
    const { settings } = await chrome.storage.local.get(['settings']);
    const apiKey = settings?.apiKey;
    
    if (!apiKey) {
      return {
        connected: false,
        message: 'No API key configured',
        demo: true
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/${API_VERSION}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (response.ok) {
      return {
        connected: true,
        message: 'Connected to VynceAI API',
        demo: false
      };
    }
    
    return {
      connected: false,
      message: 'API authentication failed',
      demo: true
    };
    
  } catch (error) {
    return {
      connected: false,
      message: 'Cannot reach API server',
      demo: true
    };
  }
}

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} Whether the API key format is valid
 */
export function validateAPIKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // API key should be at least 32 characters
  if (apiKey.length < 32) {
    return false;
  }
  
  // Should start with 'vynce_' prefix
  if (!apiKey.startsWith('vynce_')) {
    return false;
  }
  
  return true;
}

/**
 * Get available AI models
 * @returns {Promise<array>} List of available models
 */
export async function getAvailableModels() {
  try {
    const { settings } = await chrome.storage.local.get(['settings']);
    const apiKey = settings?.apiKey;
    
    if (!apiKey) {
      // Return default models for demo
      return getDefaultModels();
    }
    
    const response = await fetch(`${API_BASE_URL}/${API_VERSION}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.models || getDefaultModels();
    }
    
    return getDefaultModels();
    
  } catch (error) {
    console.error('Error fetching models:', error);
    return getDefaultModels();
  }
}

/**
 * Get default AI models list
 * @returns {array} Default models
 */
function getDefaultModels() {
  return [
    { id: 'gpt-4', name: 'GPT-4 (OpenAI)', provider: 'openai' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (OpenAI)', provider: 'openai' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus (Anthropic)', provider: 'anthropic' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet (Anthropic)', provider: 'anthropic' },
    { id: 'gemini-pro', name: 'Gemini Pro (Google)', provider: 'google' },
    { id: 'gemini-ultra', name: 'Gemini Ultra (Google)', provider: 'google' }
  ];
}
