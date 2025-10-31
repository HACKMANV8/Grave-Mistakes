/**
 * VynceAI Extension - API Module for Service Worker
 * Simplified version that works with Chrome service worker imports
 */

const API_BASE_URL = 'https://api.vynceai.com';
const API_VERSION = 'v1';
const API_TIMEOUT = 30000;

export async function callBackend(model, prompt, context = null) {
  try {
    const { settings } = await chrome.storage.local.get(['settings']);
    const apiKey = settings?.apiKey;
    
    if (!apiKey) {
      console.warn('No API key found. Using mock response.');
      return getMockResponse(model, prompt);
    }
    
    const payload = { model, prompt, context, timestamp: Date.now() };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
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
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      text: data.response || data.message || data.text,
      model: data.model || model,
      tokens: data.usage?.total_tokens || 0,
      success: true
    };
    
  } catch (error) {
    console.error('API call failed:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    
    if (error.message.includes('Failed to fetch')) {
      console.warn('API unreachable. Using mock response.');
      return getMockResponse(model, prompt);
    }
    
    throw error;
  }
}

function getMockResponse(model, prompt) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const responses = {
        'gpt-4': `I understand you're asking about "${prompt}". As GPT-4, I can help you with that. This is a mock response for testing.`,
        'gpt-3.5-turbo': `Quick response to "${prompt}". This is a mock response for testing.`,
        'gpt-4-turbo': `Fast and comprehensive response to "${prompt}". Mock response for testing.`,
        'gemini-pro': `Interesting! About "${prompt}" - this is a mock response from Gemini Pro.`,
        'gemini-1.5-flash': `Quick analysis of "${prompt}" - mock response from Gemini 1.5 Flash.`,
        'gemini-1.5-pro': `Detailed response about "${prompt}" - mock from Gemini 1.5 Pro.`,
        'llama-3.1-70b': `Thanks for asking about "${prompt}". Mock response from Llama 3.1 70B.`,
        'llama-3.1-8b': `Quick response to "${prompt}". Mock from Llama 3.1 8B.`,
        'mixtral-8x7b': `Expert analysis of "${prompt}". Mock response from Mixtral 8x7B.`,
        'claude-3-opus': `Thanks for asking about "${prompt}". This is a thoughtful mock response from Claude.`,
        'claude-3-sonnet': `I appreciate your question about "${prompt}". This is a mock response from Claude Sonnet.`
      };
      
      resolve({
        text: responses[model] || `Mock response from ${model}: I received "${prompt}"`,
        model,
        tokens: Math.floor(Math.random() * 500) + 100,
        success: true,
        mock: true
      });
    }, 1000 + Math.random() * 1000);
  });
}
