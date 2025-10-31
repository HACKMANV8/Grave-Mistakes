/**
 * VynceAI Extension - Test & Demo Script
 * Run in browser console to test extension functionality
 */

console.log('🚀 VynceAI Extension Test Suite');
console.log('================================\n');

// Test 1: Check if extension is loaded
console.log('✅ Test 1: Extension Loaded');
console.log('Manifest:', chrome.runtime.getManifest());

// Test 2: Check storage
chrome.storage.local.get(null, (items) => {
  console.log('\n✅ Test 2: Storage Contents');
  console.log(items);
});

// Test 3: Send a test message to background
console.log('\n✅ Test 3: Sending Test Message to Background');
chrome.runtime.sendMessage({
  type: 'SEND_PROMPT',
  payload: {
    model: 'gpt-4',
    prompt: 'Hello, this is a test!',
    context: null
  }
}, (response) => {
  console.log('Response from background:', response);
});

// Test 4: Get page context (from content script)
setTimeout(() => {
  console.log('\n✅ Test 4: Getting Page Context');
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'GET_PAGE_CONTEXT'
      }, (response) => {
        console.log('Page context:', response);
      });
    }
  });
}, 1000);

// Test 5: Mock API call
setTimeout(async () => {
  console.log('\n✅ Test 5: Direct API Call Test');
  
  // Import the API module (if in module context)
  try {
    const { callBackend } = await import(chrome.runtime.getURL('scripts/api.js'));
    
    const result = await callBackend('gpt-4', 'Test prompt', null);
    console.log('API Result:', result);
  } catch (error) {
    console.log('Note: Direct import test requires module context');
    console.log('This is expected in popup context');
  }
}, 2000);

// Test 6: Helper functions
setTimeout(async () => {
  console.log('\n✅ Test 6: Helper Functions Test');
  
  try {
    const { formatResponse, sanitizeInput, getCurrentTimestamp } = 
      await import(chrome.runtime.getURL('utils/helpers.js'));
    
    console.log('Timestamp:', getCurrentTimestamp());
    console.log('Sanitized:', sanitizeInput('<script>alert("xss")</script>Hello'));
    console.log('Formatted:', formatResponse('**Bold** and *italic* text\nNew line'));
  } catch (error) {
    console.log('Note: Helper test requires module context');
  }
}, 3000);

// Performance check
setTimeout(() => {
  console.log('\n📊 Performance Check');
  console.log('Memory:', performance.memory);
  console.log('Navigation:', performance.navigation);
}, 4000);

console.log('\n⏳ Running all tests... (check results above)');
console.log('💡 Open the popup to see the UI in action!');
