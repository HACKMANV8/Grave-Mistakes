/**
 * VynceAI Extension - Background Service Worker
 * Handles API communication and message routing between popup and content scripts
 */

// Import the API module using importScripts or dynamic import
// Since we can't use top-level import in service workers without "type": "module"
// We'll use dynamic import inside an async context

console.log('VynceAI Background Service Worker initializing...');

// Simple inline API function to avoid import issues
async function callBackend(model, prompt, context = null) {
  try {
    const { settings } = await chrome.storage.local.get(['settings']);
    const apiKey = settings?.apiKey;
    
    if (!apiKey) {
      console.warn('No API key found. Using mock response.');
      return getMockResponse(model, prompt);
    }
    
    const payload = { model, prompt, context, timestamp: Date.now() };
    const API_BASE_URL = 'https://api.vynceai.com';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey ? `Bearer ${apiKey}` : undefined
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        text: data.response || data.message || data.text,
        model: data.model || model,
        tokens: data.usage?.total_tokens || 0,
        success: true
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.warn('API unreachable. Using mock response.');
      return getMockResponse(model, prompt);
    }
  } catch (error) {
    console.error('API call failed:', error);
    return getMockResponse(model, prompt);
  }
}

function getMockResponse(model, prompt) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const responses = {
        'gpt-4': `I understand you're asking about "${prompt}". As GPT-4, I can help you with that. Based on your query, here's what I suggest:\n\n1. First, consider the context of your question\n2. Then, explore the available options\n3. Finally, make an informed decision\n\nWould you like me to elaborate on any of these points?`,
        'gpt-3.5-turbo': `Thanks for your question about "${prompt}"!\n\nHere's a quick response: I can help you with this. The main things to consider are understanding the context, evaluating your options, and taking action.\n\nWould you like more details?`,
        'claude-3-opus': `I appreciate you asking about "${prompt}". Let me provide a thoughtful response:\n\n1. **Context**: First, it's important to understand the broader context\n2. **Analysis**: Breaking down the key components\n3. **Recommendations**: Based on available information\n\nIs there a particular angle you'd like me to explore further?`,
        'claude-3-sonnet': `Thank you for your question about "${prompt}". Here's my analysis:\n\n• Important consideration #1\n• Important consideration #2\n• Important consideration #3\n\nI aim to be helpful and accurate. What specific aspect interests you most?`,
        'gemini-pro': `Interesting question! Let me help you with "${prompt}".\n\n🔍 **Analysis:**\nThis relates to an important topic. Here's what you should know:\n\n✨ **Key Points:**\n• Factor #1\n• Factor #2\n• Factor #3\n\nWhat would you like to explore in more depth?`,
        'gemini-ultra': `Great question about "${prompt}"!\n\n💡 **Insights:**\nLet me break this down for you:\n\n1. Primary consideration\n2. Secondary factors\n3. Best practices\n\nShall I dive deeper into any of these areas?`
      };
      
      resolve({
        text: responses[model] || `Mock response from ${model}: I received your message "${prompt}". This is a demo response. Configure your API key in settings to get real AI responses!`,
        model,
        tokens: Math.floor(Math.random() * 500) + 100,
        success: true,
        mock: true
      });
    }, 1000 + Math.random() * 1000);
  });
}

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('VynceAI Extension installed successfully!');
    
    // Set default settings
    chrome.storage.local.set({
      selectedModel: 'gpt-4',
      conversationHistory: [],
      settings: {
        autoContext: true,
        darkMode: true,
        apiKey: null
      }
    });
    
    // Open welcome page (optional)
    // chrome.tabs.create({ url: 'https://vynceai.com/welcome' });
  } else if (details.reason === 'update') {
    console.log('VynceAI Extension updated to version:', chrome.runtime.getManifest().version);
  }
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.type);
  
  switch (request.type) {
    case 'SEND_PROMPT':
      handleSendPrompt(request.payload, sendResponse);
      return true; // Keep channel open for async response
      
    case 'GET_TAB_INFO':
      handleGetTabInfo(sender, sendResponse);
      return true;
      
    case 'EXECUTE_ACTION':
      handleExecuteAction(request.payload, sendResponse);
      return true;
      
    case 'SAVE_SETTINGS':
      handleSaveSettings(request.payload, sendResponse);
      return true;
      
    default:
      console.warn('Unknown message type:', request.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

/**
 * Handle sending prompt to AI backend
 */
async function handleSendPrompt(payload, sendResponse) {
  const { model, prompt, context } = payload;
  
  try {
    console.log(`Sending prompt to ${model}:`, prompt);
    
    // Call backend API
    const response = await callBackend(model, prompt, context);
    
    console.log('AI Response received:', response);
    
    sendResponse({
      success: true,
      data: {
        response: response.text,
        model: response.model,
        tokens: response.tokens,
        timestamp: Date.now()
      }
    });
    
  } catch (error) {
    console.error('Error in handleSendPrompt:', error);
    
    sendResponse({
      success: false,
      error: error.message || 'Failed to get AI response'
    });
  }
}

/**
 * Get information about the current tab
 */
async function handleGetTabInfo(sender, sendResponse) {
  try {
    const tab = sender.tab;
    
    if (!tab) {
      throw new Error('No active tab found');
    }
    
    sendResponse({
      success: true,
      data: {
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl,
        id: tab.id
      }
    });
    
  } catch (error) {
    console.error('Error getting tab info:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Execute an action on a webpage (via content script)
 */
async function handleExecuteAction(payload, sendResponse) {
  const { action, params, tabId } = payload;
  
  try {
    // Get active tab if tabId not provided
    let targetTabId = tabId;
    
    if (!targetTabId) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      targetTabId = activeTab.id;
    }
    
    // Send action to content script
    const response = await chrome.tabs.sendMessage(targetTabId, {
      type: 'EXECUTE_ACTION',
      action,
      params
    });
    
    sendResponse({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('Error executing action:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Save user settings to storage
 */
async function handleSaveSettings(payload, sendResponse) {
  try {
    await chrome.storage.local.set({ settings: payload });
    
    sendResponse({
      success: true,
      message: 'Settings saved successfully'
    });
    
  } catch (error) {
    console.error('Error saving settings:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

console.log('VynceAI Background Service Worker loaded');
