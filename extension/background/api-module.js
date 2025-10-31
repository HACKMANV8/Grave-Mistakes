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
        'claude-3-opus': `Thanks for asking about "${prompt}". This is a thoughtful mock response from Claude.`,
        'claude-3-sonnet': `I appreciate your question about "${prompt}". This is a mock response from Claude Sonnet.`,
        'gemini-pro': `Interesting! About "${prompt}" - this is a mock response from Gemini Pro.`,
        'gemini-ultra': `Great question about "${prompt}"! This is a mock response from Gemini Ultra.`
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
