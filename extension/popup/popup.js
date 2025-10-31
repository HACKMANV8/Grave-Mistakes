/**
 * VynceAI Extension - Popup Script
 * Handles user interactions and communication with background service worker
 * Now includes memory management for context-aware conversations
 */

import { formatResponse, sanitizeInput, getCurrentTimestamp } from '../utils/helpers.js';

// DOM Elements - will be initialized after DOM loads
let chatContainer;
let userInput;
let sendBtn;
let voiceBtn;
let voiceIndicator;
let voiceStatusText;
let clearBtn;
let memoryBtn;
let settingsBtn;
let modelSelect;
let statusText;
let statusDot;

// Quick action buttons
let summarizeBtn;
let analyzeBtn;

// Q&A elements
let qaInput;
let qaBtn;
let qaResult;

// Mode Elements
let chatModeBtn;
let commandModeBtn;

// Memory Elements
let memorySection;
let memoryList;
let memoryStats;
let closeMemoryBtn;

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
  console.log('Initializing popup...');
  
  // Initialize all DOM elements after DOM is loaded
  chatContainer = document.getElementById('chat-container');
  userInput = document.getElementById('user-input');
  sendBtn = document.getElementById('send-btn');
  voiceBtn = document.getElementById('voice-btn');
  voiceIndicator = document.getElementById('voice-indicator');
  voiceStatusText = document.getElementById('voice-status-text');
  clearBtn = document.getElementById('clear-btn');
  memoryBtn = document.getElementById('memory-btn');
  settingsBtn = document.getElementById('settings-btn');
  modelSelect = document.getElementById('model-select');
  statusText = document.querySelector('.status-text');
  statusDot = document.querySelector('.status-dot');
  
  // Quick action buttons
  summarizeBtn = document.getElementById('summarize-btn');
  analyzeBtn = document.getElementById('analyze-btn');
  
  // Q&A elements
  qaInput = document.getElementById('qa-input');
  qaBtn = document.getElementById('qa-btn');
  qaResult = document.getElementById('qa-result');
  
  // Mode Elements
  chatModeBtn = document.getElementById('chat-mode-btn');
  commandModeBtn = document.getElementById('command-mode-btn');
  
  // Memory Elements
  memorySection = document.getElementById('memory-section');
  memoryList = document.getElementById('memory-list');
  memoryStats = document.getElementById('memory-stats');
  closeMemoryBtn = document.getElementById('close-memory-btn');
  
  console.log('summarizeBtn:', summarizeBtn);
  console.log('analyzeBtn:', analyzeBtn);
  
  loadConversationHistory();
  // Set fixed model
  if (modelSelect) {
    modelSelect.value = FIXED_MODEL;
  }
  setupEventListeners();
  initVoiceRecognition();
  updateStatus('ready');
  updateMemoryBadge();
  
  // Auto-focus input
  if (userInput) {
    userInput.focus();
  }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Send message on button click
  if (sendBtn) {
    sendBtn.addEventListener('click', handleSendMessage);
  }
  
  // Voice input
  if (voiceBtn) {
    voiceBtn.addEventListener('click', toggleVoiceRecognition);
  }
  
  // Quick actions
  if (summarizeBtn) {
    summarizeBtn.addEventListener('click', handleSummarizePage);
  }
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', handleAnalyzePage);
  }
  
  // Q&A functionality
  if (qaBtn) {
    qaBtn.addEventListener('click', handleQuestionOnPage);
  }
  if (qaInput) {
    qaInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleQuestionOnPage();
      }
    });
  }
  
  // Memory button
  if (memoryBtn) {
    memoryBtn.addEventListener('click', handleShowMemory);
  }
  
  // Close memory button
  if (closeMemoryBtn) {
    closeMemoryBtn.addEventListener('click', handleCloseMemory);
  }
  
  // Mode switching
  if (chatModeBtn) {
    chatModeBtn.addEventListener('click', () => switchMode('chat'));
  }
  if (commandModeBtn) {
    commandModeBtn.addEventListener('click', () => switchMode('command'));
  }
  
  // Send message on Enter (Shift+Enter for new line)
  if (userInput) {
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
  }
  
  // Clear conversation
  if (clearBtn) {
    clearBtn.addEventListener('click', handleClearConversation);
  }
  
  // Settings (placeholder for now)
  if (settingsBtn) {
    settingsBtn.addEventListener('click', handleSettings);
  }
  
  // Save selected model
  if (modelSelect) {
    modelSelect.addEventListener('change', () => {
      // Model is fixed, but keep listener for compatibility
      modelSelect.value = FIXED_MODEL;
    });
  }
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
  if (!chatContainer) {
    console.error('chatContainer is null, cannot add message');
    return;
  }
  
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
  
  // Re-query chatContainer in case it was lost
  const container = chatContainer || document.getElementById('chat-container');
  
  if (!container) {
    console.error('Cannot find chat container, skipping loading message');
    return loadingId;
  }
  
  try {
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
    
    container.appendChild(loadingDiv);
    container.scrollTop = container.scrollHeight;
    
    return loadingId;
  } catch (error) {
    console.error('Error adding loading message:', error);
    return loadingId;
  }
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
  if (!chatContainer) {
    console.error('chatContainer is null, cannot show error:', message);
    alert(message); // Fallback to alert if chatContainer is not available
    return;
  }
  
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
 * Safely set button state
 */
function setSafeButtonState(button, disabled, className = null) {
  if (!button) {
    console.warn('Button element is null/undefined in setSafeButtonState');
    return;
  }
  
  try {
    // Ensure the button has the disabled property
    if (typeof button.disabled !== 'undefined') {
      button.disabled = disabled;
    }
    
    // Safely handle className/classList operations
    if (className && button.classList) {
      if (disabled) {
        button.classList.add(className);
      } else {
        button.classList.remove(className);
      }
    } else if (className && typeof button.className === 'string') {
      // Fallback to className property
      const classNames = button.className.split(' ');
      if (disabled && !classNames.includes(className)) {
        button.className = button.className + ' ' + className;
      } else if (!disabled) {
        button.className = classNames.filter(c => c !== className).join(' ');
      }
    }
  } catch (error) {
    console.error('Error setting button state:', error, {
      button,
      disabled,
      className,
      hasClassList: !!button?.classList,
      hasClassName: typeof button?.className
    });
  }
}

/**
 * Set processing state
 */
function setProcessingState(processing) {
  isProcessing = processing;
  setSafeButtonState(sendBtn, processing);
  setSafeButtonState(userInput, processing);
  updateStatus(processing ? 'processing' : 'ready');
}

// Helper: wrap chrome.scripting.executeScript with Promise
function executeScriptAsync(tabId, files) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({ target: { tabId }, files }, (results) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      resolve(results);
    });
  });
}

// Helper: send message to content script and wait for response
function sendMessageToTabAsync(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      resolve(response);
    });
  });
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
    
    // Try to ensure content script is injected (but don't fail if it's not)
    try {
      await ensureContentScriptInjected(tab.id);
    } catch (error) {
      console.debug('Could not inject content script:', error.message);
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

/**
 * Add generic item to memory (simplified version)
 */
async function addToMemory(item) {
  try {
    const memory = await getMemory();
    
    const memoryItem = {
      id: Date.now(),
      timestamp: item.timestamp || new Date().toISOString(),
      type: item.type || 'generic',
      title: item.title || 'Memory Item',
      content: item.content || '',
      url: item.url || null
    };
    
    memory.unshift(memoryItem);
    const trimmedMemory = memory.slice(0, MAX_MEMORY_ITEMS);
    
    await chrome.storage.local.set({ [MEMORY_KEY]: trimmedMemory });
    console.log('Item added to memory:', memoryItem.id);
    
  } catch (error) {
    console.error('Error adding to memory:', error);
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
    if (!memoryBtn) {
      console.debug('Memory button not found, skipping badge update');
      return;
    }
    
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

// ============================================
// PAGE SUMMARIZATION & ANALYSIS
// ============================================

/**
 * Ensure content script is injected before sending messages
 * This fixes "Could not establish connection" errors
 */
async function ensureContentScriptInjected(tabId) {
  try {
    // First, try to ping the existing content script
    const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    if (response && response.success) {
      return true; // Content script is already active
    }
  } catch (error) {
    // Content script not responding, need to inject it
    console.log('Content script not found, injecting...');
  }
  
  try {
    // Inject the content scripts
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content/page-reader.js']
    });
    
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content/content.js']
    });
    
    // Wait a bit for scripts to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Content scripts injected successfully');
    return true;
  } catch (error) {
    console.error('Error injecting content script:', error);
    throw new Error('Failed to inject content script. This page may not support extensions.');
  }
}

/**
 * Handle summarize page button click
 * Extracts page content and asks AI to summarize it
 */
async function handleSummarizePage(event) {
  // query button every time (don't use stale references)
  const summarizeBtn = document.getElementById("summarize-btn");

  // Defensive guard
  if (!summarizeBtn) {
    console.error("summarizeBtn missing in popup DOM");
    return;
  }

  try {
    console.log("handleSummarizePage called");
    // UI -> set loading state safely
    summarizeBtn.disabled = true;
    if (summarizeBtn.classList) summarizeBtn.classList.add("loading");
    setProcessingState(true);

    // Remove welcome message if exists
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      const welcomeMsg = chatContainer.querySelector('.welcome-message');
      if (welcomeMsg) {
        welcomeMsg.remove();
      }
    }

    // Add system message
    addSystemMessage('📄 Analyzing page content...');

    // get active tab
    const tabs = await new Promise(resolve => chrome.tabs.query({ active: true, currentWindow: true }, resolve));
    if (!tabs || !tabs[0]) throw new Error("No active tab found");
    const tab = tabs[0];

    // detect pages you cannot inject into
    const forbiddenPrefixes = ["chrome://", "chrome-extension://", "edge://", "about:"];
    if (forbiddenPrefixes.some(p => tab.url && tab.url.startsWith(p))) {
      console.warn("Cannot inject into this page:", tab.url);
      showError("❌ This page cannot be summarized due to browser restrictions.");
      return;
    }

    // inject content script (safe: re-inject if not present)
    try {
      await executeScriptAsync(tab.id, ["content/content.js", "content/page-reader.js"]);
      console.log("Content script injected successfully");
    } catch (injectErr) {
      console.error("Injection failed:", injectErr.message);
      showError("❌ Failed to inject content script: " + injectErr.message);
      return;
    }

    // ask content script to extract page text
    let pageData;
    try {
      pageData = await sendMessageToTabAsync(tab.id, { action: "summarizePage" });
      // pageData expected shape: { title, url, wordCount, content }
    } catch (msgErr) {
      console.error("Messaging error:", msgErr.message);
      showError("❌ Could not get page content: " + msgErr.message);
      return;
    }

    if (!pageData || !pageData.content) {
      console.warn("No content returned from content script", pageData);
      showError("❌ No readable content found on this page.");
      return;
    }

    // Show loading message
    const loadingId = addLoadingMessage();

    // Create prompt for summarization
    const prompt = `Please provide a comprehensive summary of the following web page content:

Title: ${pageData.title}
URL: ${pageData.url}
Words: ${pageData.wordCount}

Content:
${pageData.content}

Please summarize the main points, key information, and overall theme of this content in a clear and organized manner.`;

    // Send to AI backend
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SEND_PROMPT',
        payload: {
          model: FIXED_MODEL,
          prompt: prompt,
          context: {
            url: pageData.url,
            title: pageData.title,
            pageContent: pageData.content
          }
        }
      });

      // Remove loading message
      removeLoadingMessage(loadingId);

      if (response.success) {
        const summary = response.data?.response || response.text || response.response;
        addMessage('ai', `📄 **Page Summary**\n\n${summary}`, FIXED_MODEL);
        
        // Store in memory with page info
        try {
          await addToMemory({
            title: `Summary: ${pageData.title}`,
            content: summary,
            url: pageData.url,
            timestamp: new Date().toISOString(),
            type: 'summary'
          });
          updateMemoryBadge();
        } catch (memoryError) {
          console.warn('Failed to save to memory:', memoryError);
        }
        
        // Save conversation
        saveConversation();
      } else {
        throw new Error(response.error || 'Invalid response from AI service');
      }
    } catch (aiError) {
      console.error('AI request failed:', aiError);
      showError(`❌ AI service error: ${aiError.message}`);
      removeLoadingMessage(loadingId);
    }

  } catch (err) {
    console.error("Error summarizing page:", err);
    showError("❌ Error summarizing: " + err.message);
  } finally {
    // Always restore UI state safely
    const btn = document.getElementById("summarize-btn");
    if (btn) {
      btn.disabled = false;
      if (btn.classList) btn.classList.remove("loading");
    }
    setProcessingState(false);
  }
}

/**
 * Handle analyze page button click
 * Provides detailed analysis of page content
 */
async function handleAnalyzePage() {
  // Re-query button if null (defensive programming)
  if (!analyzeBtn) {
    analyzeBtn = document.getElementById('analyze-btn');
  }
  
  // Check if button exists and prevent multiple simultaneous calls
  if (!analyzeBtn || analyzeBtn.disabled) {
    console.warn('Analyze button not available or disabled');
    return;
  }
  
  try {
    // Show loading state
    setProcessingState(true);
    setSafeButtonState(analyzeBtn, true, 'loading');
    
    // Remove welcome message if exists
    if (chatContainer) {
      const welcomeMsg = chatContainer.querySelector('.welcome-message');
      if (welcomeMsg) {
        welcomeMsg.remove();
      }
    }
    
    // Add system message
    addSystemMessage('🔍 Performing deep content analysis...');
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab?.id) {
      throw new Error('No active tab found');
    }
    
    // Check if it's a restricted page
    const restrictedPrefixes = ['chrome://', 'chrome-extension://', 'about:', 'edge://'];
    if (restrictedPrefixes.some(prefix => tab.url?.startsWith(prefix))) {
      showError('❌ Cannot read content from browser internal pages');
      setProcessingState(false);
      setSafeButtonState(analyzeBtn, false, 'loading');
      return;
    }
    
    // Ensure content script is injected first
    try {
      await ensureContentScriptInjected(tab.id);
    } catch (error) {
      throw new Error('Cannot access this page. Try reloading the page first.');
    }
    
    // Extract page content using content script
    const contentResponse = await chrome.tabs.sendMessage(tab.id, {
      type: 'EXTRACT_PAGE_CONTENT'
    });
    
    if (!contentResponse.success) {
      throw new Error(contentResponse.error || 'Failed to extract page content');
    }
    
    const pageData = contentResponse.data || contentResponse.content;
    
    // Show loading message
    const loadingId = addLoadingMessage();
    
    // Create analysis prompt
    const prompt = `Please provide a detailed analysis of this webpage. Include:

1. **Content Quality**: Assess the quality, depth, and credibility of the content
2. **Structure & Organization**: How well is the content organized?
3. **Key Information**: What are the most valuable insights or data?
4. **Sentiment & Tone**: What's the overall tone (professional, casual, persuasive, etc.)?
5. **Readability**: Is the content easy to understand? Reading level?
6. **Action Items**: Are there any calls-to-action or things the reader should do?

Provide insights that help understand the content better.

Page Details:
- Title: ${pageData.title || 'Unknown'}
- URL: ${pageData.url || tab.url}
- Word Count: ${pageData.wordCount || 'Unknown'}
- Reading Time: ${pageData.readingTime || 'Unknown'} minutes

Content Preview:
${pageData.fullText ? pageData.fullText.substring(0, 3000) : 'No text content found'}`;
    
    // Send to AI for analysis
    const response = await chrome.runtime.sendMessage({
      type: 'SEND_PROMPT',
      payload: {
        model: FIXED_MODEL,
        prompt: prompt,
        context: {
          url: pageData.url || tab.url,
          title: pageData.title || tab.title,
          pageContent: pageData.fullText
        }
      }
    });
    
    // Remove loading message
    removeLoadingMessage(loadingId);
    
    if (response.success) {
      const analysis = response.data?.response || response.text || response.response;
      addMessage('ai', `🔍 **Content Analysis**\n\n${analysis}`, FIXED_MODEL);
      
      // Save to conversation
      saveConversation();
    } else {
      throw new Error(response.error || 'Failed to generate analysis');
    }
    
  } catch (error) {
    console.error('Error analyzing page:', error);
    showError(`Failed to analyze page: ${error.message}`);
  } finally {
    setProcessingState(false);
    setSafeButtonState(analyzeBtn, false, 'loading');
  }
}

/**
 * Handle Q&A about current page
 */
async function handleQuestionOnPage() {
  // Get elements fresh each time
  const input = document.getElementById("qa-input");
  const button = document.getElementById("qa-btn");
  const resultDiv = document.getElementById("qa-result");
  
  if (!input || !resultDiv) {
    console.error("Q&A elements not found");
    return;
  }

  const question = input.value.trim();
  const questionLower = question.toLowerCase();
  
  if (!question) {
    resultDiv.textContent = "❗ Please enter a command or question.";
    resultDiv.style.display = "block";
    return;
  }

  // ✅ Detect "open" commands for new sites
  if (questionLower.startsWith("open ") || (questionLower.startsWith("go to ") && !questionLower.includes("scroll") && !questionLower.includes("section") && !questionLower.includes("footer") && !questionLower.includes("top"))) {
    let site = questionLower.replace(/^(open |go to )/, "").trim();

    // Site alias map for common sites
    const knownSites = {
      youtube: "https://www.youtube.com",
      linkedin: "https://www.linkedin.com",
      wikipedia: "https://en.wikipedia.org",
      twitter: "https://x.com",
      github: "https://github.com",
      google: "https://google.com",
      facebook: "https://facebook.com",
      instagram: "https://instagram.com",
      reddit: "https://reddit.com",
      stackoverflow: "https://stackoverflow.com",
      amazon: "https://amazon.com",
      netflix: "https://netflix.com"
    };

    // Check if it's a known site alias
    if (knownSites[site]) {
      site = knownSites[site];
    } else {
      // Add https:// if missing
      if (!site.startsWith("http")) {
        // If user types "youtube.com" or "linkedin", normalize it
        if (!site.includes(".")) {
          site = `${site}.com`;
        }
        site = `https://${site}`;
      }
    }

    resultDiv.textContent = `🌐 Opening ${site}...`;
    resultDiv.style.display = "block";
    
    // Send message to background to open the site
    chrome.runtime.sendMessage({ type: "OPEN_SITE", url: site }, (response) => {
      if (chrome.runtime.lastError) {
        resultDiv.textContent = "❌ Failed to open site: " + chrome.runtime.lastError.message;
      } else {
        resultDiv.textContent = `✅ Opened ${site} in new tab`;
        // Clear input after successful command
        input.value = '';
        
        // Add to conversation history
        addMessage('user', question);
        addMessage('ai', `🌐 Opened ${site} in a new tab`, FIXED_MODEL);
      }
    });
    return;
  }

  // ✅ Detect navigation commands within current page
  if (
    questionLower.includes("scroll") ||
    questionLower.includes("footer") ||
    questionLower.includes("top") ||
    questionLower.includes("bottom") ||
    questionLower.includes("section") ||
    (questionLower.startsWith("go to ") && (questionLower.includes("footer") || questionLower.includes("top") || questionLower.includes("section"))) ||
    (questionLower.startsWith("jump to ")) ||
    (questionLower.includes("find ") && questionLower.includes("section"))
  ) {
    try {
      const tabs = await new Promise(resolve => chrome.tabs.query({ active: true, currentWindow: true }, resolve));
      if (!tabs || !tabs[0]) throw new Error("No active tab found");
      const tab = tabs[0];

      // Check for restricted pages
      const forbiddenPrefixes = ["chrome://", "chrome-extension://", "edge://", "about:"];
      if (forbiddenPrefixes.some(p => tab.url && tab.url.startsWith(p))) {
        resultDiv.textContent = "❌ Cannot navigate browser internal pages.";
        resultDiv.style.display = "block";
        return;
      }

      // Inject content script if needed
      try {
        await executeScriptAsync(tab.id, ["content/content.js", "content/page-reader.js"]);
      } catch (injectErr) {
        console.warn("Content script injection failed:", injectErr.message);
      }

      resultDiv.textContent = "🧭 Searching page...";
      resultDiv.style.display = "block";

      // Check if this is a semantic section navigation command
      const sectionMatch = questionLower.match(/(?:go to|jump to|find|scroll to)\s+(?:the\s+)?(.+?)\s*(?:section)?$/i);
      if (sectionMatch && !questionLower.includes("scroll down") && !questionLower.includes("scroll up")) {
        const sectionName = sectionMatch[1].trim();
        
        // Skip if it's a basic navigation command
        if (!['top', 'bottom', 'footer', 'header', 'up', 'down'].includes(sectionName)) {
          console.log(`🎯 Semantic navigation to: "${sectionName}"`);
          
          // Send semantic navigation command to content script
          chrome.tabs.sendMessage(tab.id, { action: "scrollToSection", section: sectionName }, (response) => {
            if (chrome.runtime.lastError) {
              resultDiv.textContent = "❌ Navigation failed: " + chrome.runtime.lastError.message;
            } else if (response && response.success) {
              resultDiv.textContent = `✅ Found and scrolled to ${sectionName} section`;
              // Clear input after successful command
              input.value = '';
              
              // Add to conversation history
              addMessage('user', question);
              addMessage('ai', `🎯 Found and navigated to the ${sectionName} section`, FIXED_MODEL);
            } else {
              resultDiv.textContent = `❌ Could not find "${sectionName}" section on this page`;
              
              // Add to conversation history
              addMessage('user', question);
              addMessage('ai', `🔍 I searched but couldn't find a "${sectionName}" section on this page. Try "scroll down" to explore more content.`, FIXED_MODEL);
            }
          });
          return;
        }
      }
      
      // Fall back to basic navigation
      chrome.tabs.sendMessage(tab.id, { action: "NAVIGATE_PAGE", command: question }, (response) => {
        if (chrome.runtime.lastError) {
          resultDiv.textContent = "❌ Navigation failed: " + chrome.runtime.lastError.message;
        } else {
          resultDiv.textContent = `✅ ${question}`;
          // Clear input after successful command
          input.value = '';
          
          // Add to conversation history
          addMessage('user', question);
          addMessage('ai', `🧭 Navigated: ${question}`, FIXED_MODEL);
        }
      });
      
    } catch (error) {
      console.error("Navigation error:", error);
      resultDiv.textContent = "❌ Navigation failed: " + error.message;
    }
    return;
  }

  // Set loading state
  if (button) {
    button.disabled = true;
    if (button.classList) button.classList.add("loading");
  }
  
  resultDiv.textContent = "⏳ Analyzing page...";
  resultDiv.style.display = "block";

  try {
    // Get active tab
    const tabs = await new Promise(resolve => chrome.tabs.query({ active: true, currentWindow: true }, resolve));
    if (!tabs || !tabs[0]) throw new Error("No active tab found");
    const tab = tabs[0];

    // Check for restricted pages
    const forbiddenPrefixes = ["chrome://", "chrome-extension://", "edge://", "about:"];
    if (forbiddenPrefixes.some(p => tab.url && tab.url.startsWith(p))) {
      resultDiv.textContent = "❌ Cannot analyze browser internal pages.";
      return;
    }

    // Inject content script if needed
    try {
      await executeScriptAsync(tab.id, ["content/content.js", "content/page-reader.js"]);
    } catch (injectErr) {
      console.warn("Content script injection failed:", injectErr.message);
    }

    // Extract page content
    let pageData;
    try {
      pageData = await sendMessageToTabAsync(tab.id, { action: "summarizePage" });
    } catch (msgErr) {
      console.error("Messaging error:", msgErr.message);
      resultDiv.textContent = "❌ Could not extract page content: " + msgErr.message;
      return;
    }

    if (!pageData || !pageData.content) {
      resultDiv.textContent = "⚠️ Couldn't extract readable content from this page.";
      return;
    }

    // Prepare the prompt
    const prompt = `You are a helpful assistant. Answer the following question ONLY based on the provided webpage content. If the answer cannot be found in the content, say so clearly.

Webpage Content:
Title: ${pageData.title || 'Unknown'}
URL: ${pageData.url || tab.url}
Content: ${pageData.content.slice(0, 8000)}

Question: ${question}

Instructions:
- Answer based only on the webpage content provided
- Be concise but informative
- If the information isn't in the content, say "I cannot find that information in the current page content"
- Quote relevant parts of the content when helpful`;

    // Send to backend for processing
    const response = await chrome.runtime.sendMessage({
      type: 'SEND_PROMPT',
      payload: {
        model: FIXED_MODEL,
        prompt: prompt,
        context: {
          url: pageData.url || tab.url,
          title: pageData.title || tab.title,
          pageContent: pageData.content
        }
      }
    });

    if (response && response.success) {
      const answer = response.data?.response || response.text || response.response || "No response from AI.";
      resultDiv.textContent = answer;
      
      // Add to conversation history for context
      addMessage('user', question);
      addMessage('ai', `🔍 **Page Q&A**\n\n${answer}`, FIXED_MODEL);
      
      // Clear input
      input.value = '';
    } else {
      resultDiv.textContent = "❌ Error getting response from AI service.";
    }

  } catch (err) {
    console.error("Error in Q&A:", err);
    resultDiv.textContent = "❌ Failed to process question: " + err.message;
  } finally {
    // Restore button state
    if (button) {
      button.disabled = false;
      if (button.classList) button.classList.remove("loading");
    }
  }
}

/**
 * Add a system message to the chat (for status updates)
 */
function addSystemMessage(message) {
  // Re-query chatContainer in case it was lost
  const container = chatContainer || document.getElementById('chat-container');
  
  if (!container) {
    console.error('Cannot find chat container, skipping system message:', message);
    return;
  }
  
  try {
    const systemDiv = document.createElement('div');
    systemDiv.className = 'message system-message';
    systemDiv.style.textAlign = 'center';
    systemDiv.style.padding = '8px';
    systemDiv.style.margin = '8px 0';
    systemDiv.style.background = 'rgba(34, 197, 94, 0.1)';
    systemDiv.style.border = '1px solid rgba(34, 197, 94, 0.3)';
    systemDiv.style.borderRadius = '8px';
    systemDiv.style.fontSize = '13px';
    systemDiv.style.color = 'var(--green-primary)';
    systemDiv.textContent = message;
    
    container.appendChild(systemDiv);
    container.scrollTop = container.scrollHeight;
    
    // Remove after 3 seconds
    setTimeout(() => systemDiv.remove(), 3000);
  } catch (error) {
    console.error('Error adding system message:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
