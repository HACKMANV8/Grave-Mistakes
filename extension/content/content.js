/**
 * VynceAI Extension - Content Script
 * Runs on all web pages to interact with DOM and provide context to AI
 */

console.log('VynceAI Content Script loaded on:', window.location.href);

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request.type);
  
  switch (request.type) {
    case 'PING':
      // Health check to verify content script is active
      sendResponse({ success: true, message: 'Content script is active' });
      return true;
      
    case 'GET_PAGE_CONTEXT':
      handleGetPageContext(sendResponse);
      return true;
      
    case 'EXTRACT_PAGE_CONTENT':
      handleExtractPageContent(sendResponse);
      return true;
      
    case 'GENERATE_SUMMARY':
      handleGenerateSummary(sendResponse);
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
      // Handle new summarizePage action for backward compatibility
      if (request && request.action === "summarizePage") {
        try {
          const title = document.title || "";
          const url = location.href;
          const content = extractReadableText();
          const wordCount = content ? content.split(/\s+/).length : 0;
          sendResponse({ title, url, wordCount, content });
        } catch (err) {
          console.error("content.js error:", err);
          sendResponse({ error: err.message });
        }
        return true;
      }

      // Handle page navigation commands
      if (request && request.action === "NAVIGATE_PAGE") {
        try {
          const command = request.command.toLowerCase();
          console.log("🧭 Navigation command received:", command);

          // Smooth scrolling helper
          const smoothScroll = (y) => window.scrollTo({ top: y, behavior: "smooth" });

          if (command.includes("top")) {
            smoothScroll(0);
          } 
          else if (command.includes("bottom")) {
            smoothScroll(document.body.scrollHeight);
          } 
          else if (command.includes("footer")) {
            const footer = document.querySelector("footer");
            if (footer) {
              footer.scrollIntoView({ behavior: "smooth" });
            } else {
              smoothScroll(document.body.scrollHeight);
            }
          } 
          else if (command.includes("header") || command.includes("navigation") || command.includes("nav")) {
            const header = document.querySelector("header, nav, .header, .navigation, .navbar");
            if (header) {
              header.scrollIntoView({ behavior: "smooth" });
            } else {
              smoothScroll(0);
            }
          }
          else if (command.includes("contact")) {
            // Look for contact section
            const contactElements = [
              ...document.querySelectorAll("*[id*='contact' i]"),
              ...document.querySelectorAll("*[class*='contact' i]"),
              ...document.querySelectorAll("h1, h2, h3, h4, h5, h6")
                .filter(el => el.textContent.toLowerCase().includes("contact"))
            ];
            
            if (contactElements.length > 0) {
              contactElements[0].scrollIntoView({ behavior: "smooth", block: "center" });
            } else {
              // Fallback: search for any element containing "contact"
              const contact = [...document.querySelectorAll("*")].find(el => 
                el.textContent.toLowerCase().includes("contact") && el.offsetHeight > 0
              );
              if (contact) {
                contact.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }
          } 
          else if (command.includes("about")) {
            // Look for about section
            const aboutElements = [
              ...document.querySelectorAll("*[id*='about' i]"),
              ...document.querySelectorAll("*[class*='about' i]"),
              ...document.querySelectorAll("h1, h2, h3, h4, h5, h6")
                .filter(el => el.textContent.toLowerCase().includes("about"))
            ];
            
            if (aboutElements.length > 0) {
              aboutElements[0].scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }
          else if (command.includes("scroll down")) {
            window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
          } 
          else if (command.includes("scroll up")) {
            window.scrollBy({ top: -window.innerHeight, behavior: "smooth" });
          }
          else if (command.includes("scroll")) {
            // Generic scroll - assume down
            window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" });
          }

          sendResponse({ status: "ok" });
        } catch (err) {
          console.error("Navigation error:", err);
          sendResponse({ error: err.message });
        }
        return true;
      }

      // Handle smart section navigation
      if (request && request.action === "scrollToSection") {
        try {
          const success = scrollToSection(request.section);
          sendResponse({ success, message: success ? `Found and scrolled to ${request.section}` : `Section '${request.section}' not found` });
        } catch (err) {
          console.error("Section navigation error:", err);
          sendResponse({ success: false, error: err.message });
        }
        return true;
      }
      
      console.warn('Unknown message type:', request.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

/**
 * Get context information from the current page
 * Enhanced with snippet for memory system
 */
function handleGetPageContext(sendResponse) {
  try {
    const textContent = getPageTextSummary();
    const snippet = textContent ? textContent.slice(0, 500) : '';
    
    const context = {
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      
      // Page metadata
      description: getMetaContent('description'),
      keywords: getMetaContent('keywords'),
      
      // Selected text
      selectedText: window.getSelection().toString().trim(),
      
      // Snippet for memory context (first 500 chars)
      snippet: snippet,
      
      // Page structure
      headings: getHeadings(),
      links: getLinks(),
      images: getImages(),
      
      // Page content summary
      textContent: textContent,
      
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
 * Extract full page content using the page reader module
 */
function handleExtractPageContent(sendResponse) {
  try {
    // Use advanced page reader if available
    if (typeof window.VyncePageReader !== 'undefined') {
      const result = window.VyncePageReader.extractPageContent();
      
      // Transform to expected format
      if (result.success) {
        sendResponse({
          success: true,
          data: {
            fullText: result.content.fullText,
            wordCount: result.content.wordCount,
            readingTime: result.content.readingTime,
            url: result.content.url,
            title: result.content.title,
            metadata: result.content.metadata,
            structured: result.content.structured
          }
        });
      } else {
        throw new Error(result.error || 'Failed to extract content');
      }
      return;
    }
    
    // Fallback to basic extraction if page reader not loaded
    console.warn('Page reader not loaded, using fallback extraction');
    const textContent = getPageTextSummary();
    const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed
    
    sendResponse({
      success: true,
      data: {
        fullText: textContent,
        wordCount: wordCount,
        readingTime: readingTime,
        url: window.location.href,
        title: document.title
      }
    });
    
  } catch (error) {
    console.error('Error extracting page content:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Generate a quick summary of the page
 */
function handleGenerateSummary(sendResponse) {
  try {
    // Check if page reader module is available
    if (typeof window.VyncePageReader === 'undefined') {
      // Fallback to basic summary
      const textContent = getPageTextSummary();
      const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
      const summary = `📄 **${document.title}**\n\n${textContent.substring(0, 300)}...\n\n📊 ${wordCount} words`;
      
      sendResponse({
        success: true,
        data: { summary }
      });
      return;
    }
    
    // Use advanced summary generation
    const summary = window.VyncePageReader.generateQuickSummary();
    sendResponse({
      success: true,
      data: { summary }
    });
    
  } catch (error) {
    console.error('Error generating summary:', error);
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
 * Extract readable text (robust version)
 */
function extractReadableText() {
  // Prefer <article>, then main, then fallback to body
  const selectors = ["article", "main", "[role='main']"];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText && el.innerText.trim().length > 100) {
      return el.innerText.trim();
    }
  }
  // fallback: body text, but trim navigation and footer by heuristics
  let text = document.body ? document.body.innerText : "";
  if (!text) return "";
  text = text.replace(/\s{2,}/g, " ").trim();
  return text;
}

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

// === SMART SECTION NAVIGATION ===
function scrollToSection(sectionName) {
  const target = findSectionElement(sectionName);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    console.log(`🧭 Navigated to section: ${sectionName}`);
    
    // Add visual highlight for 2 seconds
    const originalOutline = target.style.outline;
    const originalOutlineOffset = target.style.outlineOffset;
    target.style.outline = '2px solid #22c55e';
    target.style.outlineOffset = '4px';
    
    setTimeout(() => {
      target.style.outline = originalOutline;
      target.style.outlineOffset = originalOutlineOffset;
    }, 2000);
    
    return true;
  } else {
    console.warn(`❌ Section '${sectionName}' not found.`);
    return false;
  }
}

function findSectionElement(sectionName) {
  const sectionKeywords = sectionName.toLowerCase();
  console.log(`🔍 Searching for section: "${sectionKeywords}"`);

  // Enhanced keyword matching - handle plural/singular forms
  const normalizedKeywords = normalizeKeywords(sectionKeywords);
  
  // Priority 1: Look for exact ID or class name matches
  for (const keyword of normalizedKeywords) {
    let selectorMatch = document.querySelector(
      `[id*="${keyword}"], [class*="${keyword}"]`
    );
    if (selectorMatch && selectorMatch.offsetHeight > 20) {
      console.log(`✅ Found by selector: ${keyword}`);
      return selectorMatch;
    }
  }

  // Priority 2: Look for headings with matching text
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  for (const heading of headings) {
    const headingText = heading.innerText?.toLowerCase() || '';
    for (const keyword of normalizedKeywords) {
      if (headingText.includes(keyword)) {
        console.log(`✅ Found heading: "${heading.innerText}"`);
        return heading;
      }
    }
  }

  // Priority 3: Look for semantic HTML elements
  const semanticElements = document.querySelectorAll('section, article, aside, nav, main, header, footer');
  for (const element of semanticElements) {
    const elementText = element.innerText?.toLowerCase() || '';
    const elementId = element.id?.toLowerCase() || '';
    const elementClass = element.className?.toLowerCase() || '';
    
    for (const keyword of normalizedKeywords) {
      if (elementText.includes(keyword) || elementId.includes(keyword) || elementClass.includes(keyword)) {
        if (element.offsetHeight > 50) {
          console.log(`✅ Found semantic element: ${element.tagName}`);
          return element;
        }
      }
    }
  }

  // Priority 4: Look for div containers with matching content
  const containers = document.querySelectorAll('div, span');
  for (const container of containers) {
    const containerText = container.innerText?.toLowerCase() || '';
    const containerId = container.id?.toLowerCase() || '';
    const containerClass = container.className?.toLowerCase() || '';
    
    for (const keyword of normalizedKeywords) {
      if ((containerText.includes(keyword) || containerId.includes(keyword) || containerClass.includes(keyword)) 
          && container.offsetHeight > 100) {
        console.log(`✅ Found container: ${container.tagName}`);
        return container;
      }
    }
  }

  // Priority 5: Look for links or buttons that might lead to sections
  const links = document.querySelectorAll('a, button');
  for (const link of links) {
    const linkText = link.innerText?.toLowerCase() || '';
    const linkHref = link.href?.toLowerCase() || '';
    
    for (const keyword of normalizedKeywords) {
      if (linkText.includes(keyword) || linkHref.includes(keyword)) {
        console.log(`✅ Found link: "${link.innerText}"`);
        return link;
      }
    }
  }

  return null;
}

function normalizeKeywords(sectionName) {
  const baseKeywords = [sectionName];
  
  // Add common variations
  const variations = {
    'pricing': ['price', 'plans', 'cost', 'subscription', 'billing'],
    'price': ['pricing', 'plans', 'cost', 'subscription', 'billing'],
    'plans': ['pricing', 'price', 'cost', 'subscription', 'billing'],
    'contact': ['contacts', 'reach', 'support', 'help', 'touch'],
    'about': ['about us', 'who we are', 'our story', 'company'],
    'services': ['service', 'what we do', 'offerings'],
    'products': ['product', 'solutions'],
    'team': ['our team', 'staff', 'people', 'members'],
    'testimonials': ['testimonial', 'reviews', 'feedback'],
    'faq': ['faqs', 'questions', 'help'],
    'blog': ['news', 'articles', 'posts'],
    'careers': ['jobs', 'hiring', 'employment'],
    'features': ['feature', 'capabilities', 'benefits']
  };
  
  if (variations[sectionName]) {
    baseKeywords.push(...variations[sectionName]);
  }
  
  // Add plural/singular forms
  if (sectionName.endsWith('s') && sectionName.length > 3) {
    baseKeywords.push(sectionName.slice(0, -1)); // Remove 's'
  } else if (!sectionName.endsWith('s')) {
    baseKeywords.push(sectionName + 's'); // Add 's'
  }
  
  return [...new Set(baseKeywords)]; // Remove duplicates
}
