/**
 * VynceAI Extension - Popup Script
 * Handles user interactions and communication with background service worker
 */

import { formatResponse, sanitizeInput, getCurrentTimestamp } from '../utils/helpers.js';

// DOM Elements
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');
const settingsBtn = document.getElementById('settings-btn');
const modelSelect = document.getElementById('model-select');
const statusText = document.querySelector('.status-text');
const statusDot = document.querySelector('.status-dot');

// State
let conversationHistory = [];
let isProcessing = false;

/**
 * Initialize the popup
 */
function init() {
  loadConversationHistory();
  loadSelectedModel();
  setupEventListeners();
  updateStatus('ready');
  
  // Auto-focus input
  userInput.focus();
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Send message on button click
  sendBtn.addEventListener('click', handleSendMessage);
  
  // Send message on Enter (Shift+Enter for new line)
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });
  
  // Auto-resize textarea
  userInput.addEventListener('input', autoResizeTextarea);
  
  // Clear conversation
  clearBtn.addEventListener('click', handleClearConversation);
  
  // Settings (placeholder for now)
  settingsBtn.addEventListener('click', handleSettings);
  
  // Save selected model
  modelSelect.addEventListener('change', () => {
    chrome.storage.local.set({ selectedModel: modelSelect.value });
  });
}

/**
 * Handle sending a message
 */
async function handleSendMessage() {
  const message = sanitizeInput(userInput.value.trim());
  
  if (!message || isProcessing) return;
  
  const selectedModel = modelSelect.value;
  
  // Clear input and reset height
  userInput.value = '';
  userInput.style.height = 'auto';
  
  // Add user message to UI
  addMessage('user', message);
  
  // Show loading state
  setProcessingState(true);
  const loadingId = addLoadingMessage();
  
  try {
    // Send message to background script
    const response = await chrome.runtime.sendMessage({
      type: 'SEND_PROMPT',
      payload: {
        model: selectedModel,
        prompt: message,
        context: await getPageContext()
      }
    });
    
    // Remove loading message
    removeLoadingMessage(loadingId);
    
    if (response.success) {
      // Add AI response to UI
      addMessage('ai', response.data.response, response.data.model);
      
      // Save to history
      saveConversation();
    } else {
      // Show error
      showError(response.error || 'Failed to get response');
    }
    
  } catch (error) {
    console.error('Error sending message:', error);
    removeLoadingMessage(loadingId);
    showError('Failed to communicate with AI. Please try again.');
  } finally {
    setProcessingState(false);
  }
}

/**
 * Add a message to the chat container
 */
function addMessage(sender, content, model = null) {
  // Remove welcome message if exists
  const welcomeMsg = chatContainer.querySelector('.welcome-message');
  if (welcomeMsg) {
    welcomeMsg.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;
  
  const timestamp = getCurrentTimestamp();
  const avatar = sender === 'user' ? 'You' : '🤖';
  const senderName = sender === 'user' ? 'You' : (model ? `VynceAI (${model})` : 'VynceAI');
  
  messageDiv.innerHTML = `
    <div class="message-header">
      <div class="message-avatar">${sender === 'user' ? 'Y' : 'V'}</div>
      <span class="message-sender">${senderName}</span>
      <span class="message-time">${timestamp}</span>
    </div>
    <div class="message-content">${formatResponse(content)}</div>
  `;
  
  chatContainer.appendChild(messageDiv);
  
  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  // Add to conversation history
  conversationHistory.push({
    sender,
    content,
    model,
    timestamp: Date.now()
  });
}

/**
 * Add loading message while waiting for AI response
 */
function addLoadingMessage() {
  const loadingId = `loading-${Date.now()}`;
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message ai-message';
  loadingDiv.id = loadingId;
  
  loadingDiv.innerHTML = `
    <div class="message-header">
      <div class="message-avatar">V</div>
      <span class="message-sender">VynceAI</span>
    </div>
    <div class="loading-message">
      <span>Thinking</span>
      <div class="loading-dots">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </div>
    </div>
  `;
  
  chatContainer.appendChild(loadingDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  return loadingId;
}

/**
 * Remove loading message
 */
function removeLoadingMessage(loadingId) {
  const loadingElement = document.getElementById(loadingId);
  if (loadingElement) {
    loadingElement.remove();
  }
}

/**
 * Show error message
 */
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.innerHTML = `
    <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    <span>${message}</span>
  `;
  
  chatContainer.appendChild(errorDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  // Remove after 5 seconds
  setTimeout(() => errorDiv.remove(), 5000);
}

/**
 * Handle clear conversation
 */
function handleClearConversation() {
  if (confirm('Clear all conversation history?')) {
    conversationHistory = [];
    chatContainer.innerHTML = `
      <div class="welcome-message">
        <svg class="welcome-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
        </svg>
        <h3>Welcome to VynceAI</h3>
        <p>Ask me anything or let me help you automate tasks on this webpage.</p>
      </div>
    `;
    saveConversation();
  }
}

/**
 * Handle settings button click
 */
function handleSettings() {
  // TODO: Implement settings panel
  alert('Settings panel coming soon!');
}

/**
 * Auto-resize textarea based on content
 */
function autoResizeTextarea() {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
}

/**
 * Set processing state
 */
function setProcessingState(processing) {
  isProcessing = processing;
  sendBtn.disabled = processing;
  userInput.disabled = processing;
  updateStatus(processing ? 'processing' : 'ready');
}

/**
 * Update status indicator
 */
function updateStatus(status) {
  const statusMap = {
    ready: { text: 'Ready', color: '#22c55e' },
    processing: { text: 'Processing...', color: '#f59e0b' },
    error: { text: 'Error', color: '#ef4444' }
  };
  
  const { text, color } = statusMap[status] || statusMap.ready;
  statusText.textContent = text;
  statusDot.style.background = color;
}

/**
 * Get current page context for AI
 */
async function getPageContext() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab?.id) return null;
    
    // Get page info from content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_PAGE_CONTEXT'
    });
    
    return response;
  } catch (error) {
    console.error('Error getting page context:', error);
    return null;
  }
}

/**
 * Load conversation history from storage
 */
async function loadConversationHistory() {
  try {
    const result = await chrome.storage.local.get(['conversationHistory']);
    
    if (result.conversationHistory && result.conversationHistory.length > 0) {
      conversationHistory = result.conversationHistory;
      
      // Remove welcome message
      const welcomeMsg = chatContainer.querySelector('.welcome-message');
      if (welcomeMsg) {
        welcomeMsg.remove();
      }
      
      // Render conversation history
      conversationHistory.forEach(msg => {
        addMessage(msg.sender, msg.content, msg.model);
      });
    }
  } catch (error) {
    console.error('Error loading conversation history:', error);
  }
}

/**
 * Save conversation to storage
 */
function saveConversation() {
  chrome.storage.local.set({ conversationHistory });
}

/**
 * Load selected model from storage
 */
async function loadSelectedModel() {
  try {
    const result = await chrome.storage.local.get(['selectedModel']);
    if (result.selectedModel) {
      modelSelect.value = result.selectedModel;
    }
  } catch (error) {
    console.error('Error loading selected model:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
