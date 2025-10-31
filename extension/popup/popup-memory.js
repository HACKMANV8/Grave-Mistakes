/**
 * VynceAI Extension - Popup Script with Memory Support
 * Handles user interactions and communication with background service worker
 * Now includes memory management for context-aware conversations
 */

import { formatResponse, sanitizeInput, getCurrentTimestamp } from '../utils/helpers.js';

// ============================================
// DOM ELEMENTS
// ============================================

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');
const memoryBtn = document.getElementById('memory-btn');
const clearMemoryBtn = document.getElementById('clear-memory-btn');
const settingsBtn = document.getElementById('settings-btn');
const modelSelect = document.getElementById('model-select');
const statusText = document.querySelector('.status-text');
const statusDot = document.querySelector('.status-dot');

// Memory Elements
const memorySection = document.getElementById('memory-section');
const memoryList = document.getElementById('memory-list');
const memoryStats = document.getElementById('memory-stats');
const closeMemoryBtn = document.getElementById('close-memory-btn');

// ============================================
// STATE
// ============================================

let conversationHistory = [];
let isProcessing = false;

// ============================================
// MEMORY CONSTANTS
// ============================================

const MEMORY_KEY = 'vynceai_memory';
const MAX_MEMORY_ITEMS = 20;

// ============================================
// INITIALIZATION
// ============================================

function init() {
  loadConversationHistory();
  loadSelectedModel();
  setupEventListeners();
  updateStatus('ready');
  updateMemoryBadge();
  userInput.focus();
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  sendBtn.addEventListener('click', handleSendMessage);
  clearBtn.addEventListener('click', handleClearConversation);
  memoryBtn.addEventListener('click', handleShowMemory);
  clearMemoryBtn.addEventListener('click', handleClearMemory);
  settingsBtn.addEventListener('click', handleSettings);
  closeMemoryBtn.addEventListener('click', handleCloseMemory);
  
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });
  
  userInput.addEventListener('input', autoResizeTextarea);
  
  modelSelect.addEventListener('change', () => {
    chrome.storage.local.set({ selectedModel: modelSelect.value });
  });
}

// ============================================
// MESSAGE HANDLING
// ============================================

async function handleSendMessage() {
  const message = sanitizeInput(userInput.value.trim());
  
  if (!message || isProcessing) return;
  
  const selectedModel = modelSelect.value;
  
  userInput.value = '';
  userInput.style.height = 'auto';
  
  addMessage('user', message);
  setProcessingState(true);
  const loadingId = addLoadingMessage();
  
  try {
    // Get page context and recent memory
    const context = await getPageContext();
    const recentMemory = await getRecentMemory(3);
    
    console.log('Sending with memory:', recentMemory.length, 'items');
    
    // Send to background
    const response = await chrome.runtime.sendMessage({
      type: 'SEND_PROMPT',
      payload: {
        model: selectedModel,
        prompt: message,
        context: context,
        memory: recentMemory
      }
    });
    
    removeLoadingMessage(loadingId);
    
    if (response.success) {
      const aiResponse = response.text || response.response;
      addMessage('bot', aiResponse);
      
      // Save to memory
      await saveToMemory(message, aiResponse, context, selectedModel);
      
      // Save to conversation history
      conversationHistory.push({
        user: message,
        bot: aiResponse,
        model: selectedModel,
        timestamp: Date.now()
      });
      
      saveConversationHistory();
      updateMemoryBadge();
    } else {
      showError(response.error || 'Failed to get response');
    }
  } catch (error) {
    console.error('Error:', error);
    removeLoadingMessage(loadingId);
    showError('Failed to send message: ' + error.message);
  } finally {
    setProcessingState(false);
  }
}

// ============================================
// MEMORY FUNCTIONS
// ============================================

async function getMemory() {
  try {
    const result = await chrome.storage.local.get([MEMORY_KEY]);
    return result[MEMORY_KEY] || [];
  } catch (error) {
    console.error('Error getting memory:', error);
    return [];
  }
}

async function getRecentMemory(count = 3) {
  try {
    const memory = await getMemory();
    return memory.slice(0, count).map(item => ({
      user: item.user,
      bot: item.bot,
      timestamp: item.timestamp
    }));
  } catch (error) {
    console.error('Error getting recent memory:', error);
    return [];
  }
}

async function saveToMemory(userMessage, botResponse, context, model) {
  try {
    const memory = await getMemory();
    
    const interaction = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      user: userMessage,
      bot: botResponse,
      model: model,
      context: context ? {
        url: context.url,
        title: context.title
      } : null
    };
    
    memory.unshift(interaction);
    const trimmedMemory = memory.slice(0, MAX_MEMORY_ITEMS);
    
    await chrome.storage.local.set({ [MEMORY_KEY]: trimmedMemory });
    console.log('Memory saved:', interaction.id);
  } catch (error) {
    console.error('Error saving memory:', error);
  }
}

async function clearAllMemory() {
  try {
    await chrome.storage.local.remove(MEMORY_KEY);
    console.log('Memory cleared');
    return true;
  } catch (error) {
    console.error('Error clearing memory:', error);
    return false;
  }
}

async function getMemoryStats() {
  try {
    const memory = await getMemory();
    return {
      count: memory.length,
      oldestTimestamp: memory.length > 0 ? memory[memory.length - 1].timestamp : null,
      newestTimestamp: memory.length > 0 ? memory[0].timestamp : null,
      totalSize: JSON.stringify(memory).length
    };
  } catch (error) {
    console.error('Error getting memory stats:', error);
    return { count: 0 };
  }
}

// ============================================
// MEMORY UI HANDLERS
// ============================================

async function handleShowMemory() {
  try {
    const memory = await getMemory();
    
    memoryList.innerHTML = '';
    
    if (memory.length === 0) {
      memoryList.innerHTML = `
        <div class="memory-empty">
          <div class="memory-empty-icon">💭</div>
          <div class="memory-empty-text">No memory yet<br>Start chatting to build memory</div>
        </div>
      `;
    } else {
      memory.forEach(item => {
        const memoryItem = document.createElement('div');
        memoryItem.className = 'memory-item';
        
        const timestamp = new Date(item.timestamp).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const contextInfo = item.context ? 
          `<div class="memory-context">${escapeHtml(item.context.title || item.context.url)}</div>` : '';
        
        memoryItem.innerHTML = `
          <div class="memory-item-header">
            <span class="memory-timestamp">${timestamp}</span>
            <span class="memory-model">${item.model || 'unknown'}</span>
          </div>
          <div class="memory-user">${escapeHtml(item.user)}</div>
          <div class="memory-bot">${escapeHtml(item.bot.substring(0, 150))}${item.bot.length > 150 ? '...' : ''}</div>
          ${contextInfo}
        `;
        
        memoryList.appendChild(memoryItem);
      });
    }
    
    const stats = await getMemoryStats();
    memoryStats.innerHTML = `
      <span>💾 ${stats.count} interactions</span>
      <span>📦 ${(stats.totalSize / 1024).toFixed(1)} KB</span>
    `;
    
    memorySection.style.display = 'flex';
  } catch (error) {
    console.error('Error showing memory:', error);
    showError('Failed to load memory');
  }
}

function handleCloseMemory() {
  memorySection.style.display = 'none';
}

async function handleClearMemory() {
  const confirmed = confirm('Clear all memory? This cannot be undone.');
  
  if (confirmed) {
    const success = await clearAllMemory();
    
    if (success) {
      showSuccess('Memory cleared successfully');
      updateMemoryBadge();
      
      if (memorySection.style.display === 'flex') {
        handleShowMemory();
      }
    } else {
      showError('Failed to clear memory');
    }
  }
}

async function updateMemoryBadge() {
  try {
    const stats = await getMemoryStats();
    if (stats.count > 0) {
      memoryBtn.setAttribute('data-count', stats.count);
      memoryBtn.style.position = 'relative';
    } else {
      memoryBtn.removeAttribute('data-count');
    }
  } catch (error) {
    console.error('Error updating memory badge:', error);
  }
}

// ============================================
// UI HELPERS
// ============================================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'error-message';
  successDiv.style.background = 'rgba(76, 175, 80, 0.2)';
  successDiv.style.borderColor = 'rgba(76, 175, 80, 0.4)';
  successDiv.style.color = '#4caf50';
  successDiv.textContent = '✅ ' + message;
  
  chatContainer.insertBefore(successDiv, chatContainer.firstChild);
  
  setTimeout(() => successDiv.remove(), 3000);
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = '❌ ' + message;
  
  chatContainer.insertBefore(errorDiv, chatContainer.firstChild);
  
  setTimeout(() => errorDiv.remove(), 5000);
}

function addMessage(role, content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}-message`;
  messageDiv.innerHTML = formatResponse(content);
  
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addLoadingMessage() {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message bot-message loading';
  loadingDiv.id = 'loading-' + Date.now();
  loadingDiv.textContent = 'Thinking...';
  
  chatContainer.appendChild(loadingDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  return loadingDiv.id;
}

function removeLoadingMessage(id) {
  const loadingDiv = document.getElementById(id);
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

function setProcessingState(processing) {
  isProcessing = processing;
  sendBtn.disabled = processing;
  userInput.disabled = processing;
}

function updateStatus(status) {
  const statusMap = {
    ready: { text: 'Ready', color: '#4caf50' },
    processing: { text: 'Processing', color: '#ff9800' },
    error: { text: 'Error', color: '#f44336' }
  };
  
  const s = statusMap[status] || statusMap.ready;
  statusText.textContent = s.text;
  statusDot.style.background = s.color;
}

function autoResizeTextarea() {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
}

// ============================================
// PAGE CONTEXT
// ============================================

async function getPageContext() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_PAGE_CONTEXT'
    });
    
    return response.context || null;
  } catch (error) {
    console.error('Error getting page context:', error);
    return null;
  }
}

// ============================================
// STORAGE
// ============================================

function loadConversationHistory() {
  chrome.storage.local.get(['conversationHistory'], (result) => {
    conversationHistory = result.conversationHistory || [];
    
    conversationHistory.forEach(msg => {
      if (msg.user) addMessage('user', msg.user);
      if (msg.bot) addMessage('bot', msg.bot);
    });
  });
}

function saveConversationHistory() {
  chrome.storage.local.set({ conversationHistory });
}

function handleClearConversation() {
  conversationHistory = [];
  saveConversationHistory();
  chatContainer.innerHTML = '<div class="welcome-message"><div class="welcome-icon">💭</div><h3>Welcome to VynceAI</h3><p>Ask me anything or let me help you automate tasks on this webpage.</p></div>';
  showSuccess('Conversation cleared');
}

function loadSelectedModel() {
  chrome.storage.local.get(['selectedModel'], (result) => {
    if (result.selectedModel) {
      modelSelect.value = result.selectedModel;
    }
  });
}

function handleSettings() {
  alert('Settings panel coming soon!');
}

// ============================================
// START
// ============================================

init();
