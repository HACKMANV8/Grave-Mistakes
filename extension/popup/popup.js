/**
 * VynceAI Extension - Popup Script
 * Handles user interactions and communication with background service worker
 * Now includes memory management for context-aware conversations
 */

import { formatResponse, sanitizeInput, getCurrentTimestamp } from '../utils/helpers.js';

// DOM Elements
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');
const voiceIndicator = document.getElementById('voice-indicator');
const voiceStatusText = document.getElementById('voice-status-text');
const clearBtn = document.getElementById('clear-btn');
const settingsBtn = document.getElementById('settings-btn');
const modelSelect = document.getElementById('model-select');
const statusText = document.querySelector('.status-text');
const statusDot = document.querySelector('.status-dot');

// Mode Elements
const chatModeBtn = document.getElementById('chat-mode-btn');
const commandModeBtn = document.getElementById('command-mode-btn');

// Memory Elements
const memorySection = document.getElementById('memory-section');
const memoryList = document.getElementById('memory-list');
const memoryStats = document.getElementById('memory-stats');
const closeMemoryBtn = document.getElementById('close-memory-btn');

// State
let conversationHistory = [];
let isProcessing = false;
let currentMode = 'chat'; // 'chat' or 'command'
let recognition = null;
let isListening = false;

// Fixed model configuration
const FIXED_MODEL = 'gemini-2.5-flash'; // Using Gemini 2.5 Flash as the only model

// Memory Constants
const MEMORY_KEY = 'vynceai_memory';
const MAX_MEMORY_ITEMS = 20;

/**
 * Initialize the popup
 */
function init() {
  loadConversationHistory();
  // Set fixed model
  modelSelect.value = FIXED_MODEL;
  setupEventListeners();
  initVoiceRecognition();
  updateStatus('ready');
  updateMemoryBadge();
  
  // Auto-focus input
  userInput.focus();
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Send message on button click
  sendBtn.addEventListener('click', handleSendMessage);
  
  // Voice input
  voiceBtn.addEventListener('click', toggleVoiceRecognition);
  
  // Mode switching
  chatModeBtn.addEventListener('click', () => switchMode('chat'));
  commandModeBtn.addEventListener('click', () => switchMode('command'));
  
  // Send message on Enter (Shift+Enter for new line)
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    
    // Ctrl/Cmd + Space to activate voice input
    if (e.key === ' ' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      toggleVoiceRecognition();
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
    // Model is fixed, but keep listener for compatibility
    modelSelect.value = FIXED_MODEL;
  });
}

// ============================================
// VOICE RECOGNITION
// ============================================

/**
 * Initialize Web Speech API
 */
function initVoiceRecognition() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.warn('Speech recognition not supported');
    voiceBtn.disabled = true;
    voiceBtn.title = 'Speech recognition not supported in this browser';
    return;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;
  
  // Set initial tooltip
  voiceBtn.title = 'Voice input (click to speak, Ctrl+Space)';
  
  recognition.onstart = () => {
    isListening = true;
    voiceBtn.classList.add('listening');
    voiceIndicator.style.display = 'flex';
    voiceBtn.title = 'Stop listening (click or speak)';
    updateStatus('listening');
  };
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const confidence = event.results[0][0].confidence;
    
    console.log(`Voice recognized: "${transcript}" (confidence: ${confidence})`);
    
    userInput.value = transcript;
    autoResizeTextarea();
    userInput.focus();
    
    // Visual feedback for successful recognition
    voiceBtn.style.borderColor = 'var(--green-primary)';
    voiceBtn.style.color = 'var(--green-primary)';
    setTimeout(() => {
      voiceBtn.style.borderColor = '';
      voiceBtn.style.color = '';
    }, 500);
    
    // Auto-send after a short delay (optional - you can remove this)
    // Uncomment the line below to auto-send voice messages
    // setTimeout(() => handleSendMessage(), 500);
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    stopVoiceRecognition();
    
    if (event.error === 'no-speech') {
      showError('🎤 No speech detected. Please try again.');
    } else if (event.error === 'audio-capture') {
      showError('🎤 No microphone detected. Please check your microphone connection.');
    } else if (event.error === 'not-allowed') {
      showError('🎤 Microphone permission denied. Click the 🎤 icon in your browser\'s address bar to allow access, then try again.');
    } else if (event.error !== 'aborted') {
      showError('🎤 Voice recognition error: ' + event.error);
    }
  };
  
  recognition.onend = () => {
    stopVoiceRecognition();
  };
}

/**
 * Toggle voice recognition on/off
 */
async function toggleVoiceRecognition() {
  if (!recognition) {
    showError('Voice recognition not available in this browser');
    return;
  }
  
  if (isListening) {
    recognition.stop();
    return;
  }
  
  try {
    // Show requesting permission state
    voiceBtn.classList.add('requesting');
    voiceIndicator.style.display = 'flex';
    voiceStatusText.textContent = 'Requesting microphone permission...';
    console.log('Requesting microphone permission...');
    
    // First, request the optional permission from Chrome
    const permissionGranted = await chrome.permissions.request({
      permissions: ['audioCapture']
    });
    
    if (!permissionGranted) {
      throw new Error('Permission request was dismissed or denied');
    }
    
    console.log('Chrome permission granted, requesting media access...');
    voiceStatusText.textContent = 'Click "Allow" in browser popup...';
    
    // Now request microphone access from the browser
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    
    // Permission granted! Stop the test stream
    stream.getTracks().forEach(track => track.stop());
    
    console.log('Microphone access granted, starting recognition...');
    
    // Update UI
    voiceBtn.classList.remove('requesting');
    voiceStatusText.textContent = 'Listening...';
    
    // Small delay to ensure cleanup, then start voice recognition
    setTimeout(() => {
      try {
        recognition.start();
      } catch (err) {
        console.error('Recognition start error:', err);
        stopVoiceRecognition();
        if (!err.message.includes('already started')) {
          showError('🎤 Could not start voice recognition. Please try again.');
        }
      }
    }, 100);
    
  } catch (error) {
    console.error('Microphone permission error:', error);
    
    // Hide indicator and remove requesting state
    voiceIndicator.style.display = 'none';
    voiceBtn.classList.remove('requesting');
    
    if (error.message.includes('dismissed') || error.message.includes('denied')) {
      showError('🎤 Please click "Allow" when the permission popup appears to use voice input.');
    } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      showError('🎤 Microphone access denied. Please reload the extension and click "Allow" when prompted.');
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      showError('🎤 No microphone found. Please connect a microphone and try again.');
    } else if (error.name === 'NotReadableError') {
      showError('🎤 Microphone is already in use by another application.');
    } else {
      showError('🎤 Could not access microphone. Please try again.');
    }
  }
}

/**
 * Stop voice recognition
 */
function stopVoiceRecognition() {
  isListening = false;
  voiceBtn.classList.remove('listening');
  voiceBtn.title = 'Voice input (click to speak)';
  voiceIndicator.style.display = 'none';
  updateStatus('ready');
}

// ============================================
// MODE SWITCHING (Chat vs Command)
// ============================================

/**
 * Switch between Chat and Command modes
 */
function switchMode(mode) {
  currentMode = mode;
  
  if (mode === 'chat') {
    chatModeBtn.classList.add('active');
    commandModeBtn.classList.remove('active');
    userInput.placeholder = 'Ask VynceAI anything...';
    showInfo('💬 Chat Mode: Talk with VynceAI about this webpage');
  } else {
    commandModeBtn.classList.add('active');
    chatModeBtn.classList.remove('active');
    userInput.placeholder = 'Speak a command: scroll, open tab, go to...';
    showInfo('⚡ Command Mode: Control your browser with voice commands');
  }
}

/**
 * Show info message
 */
function showInfo(message) {
  const infoDiv = document.createElement('div');
  infoDiv.className = 'error-message';
  infoDiv.style.background = 'rgba(59, 130, 246, 0.2)';
  infoDiv.style.borderColor = 'rgba(59, 130, 246, 0.4)';
  infoDiv.style.color = '#3b82f6';
  infoDiv.innerHTML = `
    <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    <span>${message}</span>
  `;
  
  chatContainer.insertBefore(infoDiv, chatContainer.firstChild);
  setTimeout(() => infoDiv.remove(), 3000);
}

/**
 * Handle sending a message
 */
async function handleSendMessage() {
  const message = sanitizeInput(userInput.value.trim());
  
  if (!message || isProcessing) return;
  
  // Check if in command mode
  if (currentMode === 'command') {
    await handleCommand(message);
    return;
  }
  
  // Use fixed Gemini model
  const selectedModel = FIXED_MODEL;
  
  // Clear input and reset height
  userInput.value = '';
  userInput.style.height = 'auto';
  
  // Add user message to UI
  addMessage('user', message);
  
  // Show loading state
  setProcessingState(true);
  const loadingId = addLoadingMessage();
  
  try {
    // Get page context and recent memory
    const context = await getPageContext();
    const recentMemory = await getRecentMemory(3);
    
    console.log('Sending with memory:', recentMemory.length, 'items');
    
    // Send message to background script with memory
    const response = await chrome.runtime.sendMessage({
      type: 'SEND_PROMPT',
      payload: {
        model: selectedModel,
        prompt: message,
        context: context,
        memory: recentMemory
      }
    });
    
    // Remove loading message
    removeLoadingMessage(loadingId);
    
    if (response.success) {
      // Add AI response to UI
      const aiResponse = response.data?.response || response.text || response.response;
      addMessage('ai', aiResponse, response.data?.model || selectedModel);
      
      // Save to memory
      await saveToMemory(message, aiResponse, context, selectedModel);
      updateMemoryBadge();
      
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

// ============================================
// COMMAND MODE HANDLERS
// ============================================

/**
 * Handle browser automation commands
 */
async function handleCommand(command) {
  const lowerCommand = command.toLowerCase();
  
  // Clear input
  userInput.value = '';
  userInput.style.height = 'auto';
  
  // Add command to chat
  addMessage('user', command);
  
  try {
    // Send command to background script
    const response = await chrome.runtime.sendMessage({
      type: 'EXECUTE_COMMAND',
      payload: { command: lowerCommand }
    });
    
    if (response.success) {
      addMessage('ai', `✅ ${response.message}`, 'Command');
    } else {
      showError(response.error || 'Command failed');
    }
  } catch (error) {
    console.error('Error executing command:', error);
    showError('Failed to execute command');
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
  const senderName = sender === 'user' ? 'You' : 'VynceAI';
  
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
        <p>Your intelligent AI browser assistant. Ask me anything about this webpage or let me help you with web tasks!</p>
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
    listening: { text: 'Listening...', color: '#ef4444' },
    error: { text: 'Error', color: '#ef4444' }
  };
  
  const { text, color } = statusMap[status] || statusMap.ready;
  statusText.textContent = text;
  statusDot.style.background = color;
  
  // Add listening class to status indicator
  const statusIndicator = document.querySelector('.status-indicator');
  if (status === 'listening') {
    statusIndicator.classList.add('listening');
  } else {
    statusIndicator.classList.remove('listening');
  }
}

/**
 * Get current page context for AI
 */
async function getPageContext() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab?.id) return null;
    
    // Skip restricted pages where content scripts can't run
    const restrictedPrefixes = ['chrome://', 'chrome-extension://', 'about:', 'edge://'];
    if (restrictedPrefixes.some(prefix => tab.url?.startsWith(prefix))) {
      console.log('Skipping page context - restricted page:', tab.url);
      return null;
    }
    
    // Get page info from content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_PAGE_CONTEXT'
    });
    
    return response;
  } catch (error) {
    // Silently handle content script connection errors (expected on some pages)
    console.debug('Could not get page context (normal for restricted pages):', error.message);
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

// ============================================
// MEMORY MANAGEMENT FUNCTIONS
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
  successDiv.innerHTML = `
    <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
    </svg>
    <span>${message}</span>
  `;
  
  chatContainer.insertBefore(successDiv, chatContainer.firstChild);
  setTimeout(() => successDiv.remove(), 3000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
