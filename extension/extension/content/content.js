/**
 * VynceAI Extension - Content Script
 * Runs on all web pages to interact with DOM and provide context to AI
 */

console.log('VynceAI Content Script loaded on:', window.location.href);

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request.type);
  
  switch (request.type) {
    case 'GET_PAGE_CONTEXT':
      handleGetPageContext(sendResponse);
      return true;
      
    case 'EXECUTE_ACTION':
      handleExecuteAction(request.action, request.params, sendResponse);
      return true;
      
    case 'HIGHLIGHT_ELEMENT':
      handleHighlightElement(request.selector, sendResponse);
      return true;
      
    case 'EXTRACT_TEXT':
      handleExtractText(request.selector, sendResponse);
      return true;
      
    default:
      console.warn('Unknown message type:', request.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

/**
 * Get context information from the current page
 */
function handleGetPageContext(sendResponse) {
  try {
    const context = {
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      
      // Page metadata
      description: getMetaContent('description'),
      keywords: getMetaContent('keywords'),
      
      // Selected text
      selectedText: window.getSelection().toString().trim(),
      
      // Page structure
      headings: getHeadings(),
      links: getLinks(),
      images: getImages(),
      
      // Page content summary
      textContent: getPageTextSummary(),
      
      // Forms on page
      forms: getForms(),
      
      // Timestamp
      timestamp: Date.now()
    };
    
    sendResponse({
      success: true,
      data: context
    });
    
  } catch (error) {
    console.error('Error getting page context:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Execute various actions on the page
 */
function handleExecuteAction(action, params, sendResponse) {
  try {
    let result;
    
    switch (action) {
      case 'click':
        result = clickElement(params.selector);
        break;
        
      case 'fill':
        result = fillInput(params.selector, params.value);
        break;
        
      case 'scroll':
        result = scrollToElement(params.selector || params.position);
        break;
        
      case 'extract':
        result = extractData(params.selector, params.attribute);
        break;
        
      case 'highlight':
        result = highlightText(params.text);
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    sendResponse({
      success: true,
      data: result
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
 * Highlight an element on the page
 */
function handleHighlightElement(selector, sendResponse) {
  try {
    const element = document.querySelector(selector);
    
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    
    // Add highlight
    element.style.outline = '3px solid #22c55e';
    element.style.outlineOffset = '2px';
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
      element.style.outline = '';
      element.style.outlineOffset = '';
    }, 3000);
    
    sendResponse({
      success: true,
      message: 'Element highlighted'
    });
    
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Extract text from an element
 */
function handleExtractText(selector, sendResponse) {
  try {
    const element = selector ? document.querySelector(selector) : document.body;
    
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    
    sendResponse({
      success: true,
      data: {
        text: element.innerText,
        html: element.innerHTML
      }
    });
    
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// ===== Helper Functions =====

/**
 * Get meta tag content
 */
function getMetaContent(name) {
  const meta = document.querySelector(`meta[name="${name}"]`);
  return meta ? meta.content : null;
}

/**
 * Get all headings from the page
 */
function getHeadings() {
  const headings = [];
  document.querySelectorAll('h1, h2, h3').forEach(h => {
    headings.push({
      level: h.tagName.toLowerCase(),
      text: h.textContent.trim()
    });
  });
  return headings.slice(0, 10); // Limit to first 10
}

/**
 * Get important links from the page
 */
function getLinks() {
  const links = [];
  document.querySelectorAll('a[href]').forEach(a => {
    if (a.textContent.trim() && a.href) {
      links.push({
        text: a.textContent.trim(),
        href: a.href
      });
    }
  });
  return links.slice(0, 20); // Limit to first 20
}

/**
 * Get images from the page
 */
function getImages() {
  const images = [];
  document.querySelectorAll('img[src]').forEach(img => {
    images.push({
      alt: img.alt,
      src: img.src
    });
  });
  return images.slice(0, 10); // Limit to first 10
}

/**
 * Get summary of page text content
 */
function getPageTextSummary() {
  const text = document.body.innerText;
  const words = text.trim().split(/\s+/);
  
  // Return first 500 words
  return words.slice(0, 500).join(' ');
}

/**
 * Get forms on the page
 */
function getForms() {
  const forms = [];
  document.querySelectorAll('form').forEach(form => {
    const inputs = [];
    form.querySelectorAll('input, textarea, select').forEach(input => {
      inputs.push({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder
      });
    });
    
    forms.push({
      action: form.action,
      method: form.method,
      inputs
    });
  });
  
  return forms;
}

/**
 * Click an element
 */
function clickElement(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  
  element.click();
  return { clicked: true, selector };
}

/**
 * Fill an input field
 */
function fillInput(selector, value) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  
  return { filled: true, selector, value };
}

/**
 * Scroll to an element or position
 */
function scrollToElement(target) {
  if (typeof target === 'string') {
    const element = document.querySelector(target);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return { scrolled: true, target };
    }
  } else if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: 'smooth' });
    return { scrolled: true, position: target };
  }
  
  throw new Error('Invalid scroll target');
}

/**
 * Extract data from element
 */
function extractData(selector, attribute = 'textContent') {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  
  const value = attribute === 'textContent' 
    ? element.textContent.trim()
    : element.getAttribute(attribute);
  
  return { selector, attribute, value };
}

/**
 * Highlight text on the page
 */
function highlightText(text) {
  // Simple text highlighting (can be enhanced)
  const selection = window.getSelection();
  const range = document.createRange();
  
  // This is a simplified version - full implementation would use TreeWalker
  const textNodes = getTextNodes(document.body);
  
  for (const node of textNodes) {
    if (node.textContent.includes(text)) {
      const span = document.createElement('span');
      span.style.backgroundColor = '#22c55e';
      span.style.color = '#000';
      span.style.padding = '2px 4px';
      span.style.borderRadius = '3px';
      span.textContent = text;
      
      const textContent = node.textContent;
      const index = textContent.indexOf(text);
      
      if (index !== -1) {
        const before = document.createTextNode(textContent.substring(0, index));
        const after = document.createTextNode(textContent.substring(index + text.length));
        
        node.parentNode.insertBefore(before, node);
        node.parentNode.insertBefore(span, node);
        node.parentNode.insertBefore(after, node);
        node.remove();
        
        break; // Highlight first occurrence only
      }
    }
  }
  
  return { highlighted: true, text };
}

/**
 * Get all text nodes in an element
 */
function getTextNodes(element) {
  const textNodes = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    if (node.textContent.trim()) {
      textNodes.push(node);
    }
  }
  
  return textNodes;
}
