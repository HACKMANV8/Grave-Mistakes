/**
 * VynceAI Extension - Page Reader Module
 * Specialized module for reading and extracting meaningful content from web pages
 * Filters out ads, navigation, scripts, and focuses on main article content
 */

console.log('VynceAI Page Reader Module loaded');

/**
 * Main function to extract readable content from the page
 * Intelligently filters out ads, navigation bars, scripts, and focuses on main content
 * 
 * @returns {Object} Extracted page content with text, structure, and metadata
 */
function extractPageContent() {
  try {
    // Get the main content area (article/main or fallback to body)
    const mainContent = findMainContent();
    
    // Extract clean text from main content
    const cleanText = extractCleanText(mainContent);
    
    // Extract structured content (headings, paragraphs, lists)
    const structuredContent = extractStructuredContent(mainContent);
    
    // Get metadata
    const metadata = extractMetadata();
    
    // Get reading time estimate
    const readingTime = estimateReadingTime(cleanText);
    
    return {
      success: true,
      content: {
        // Full text content
        fullText: cleanText,
        
        // Word and character counts
        wordCount: cleanText.split(/\s+/).filter(w => w.length > 0).length,
        charCount: cleanText.length,
        
        // Structured content
        structured: structuredContent,
        
        // Page metadata
        metadata: metadata,
        
        // Reading time
        readingTime: readingTime,
        
        // Page info
        url: window.location.href,
        title: document.title,
        domain: window.location.hostname,
        
        // Timestamp
        extractedAt: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Error extracting page content:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Find the main content area of the page
 * Looks for semantic HTML5 tags and common article containers
 * 
 * @returns {HTMLElement} Main content element
 */
function findMainContent() {
  // Priority order for finding main content
  const selectors = [
    'article',                           // HTML5 article tag
    'main',                              // HTML5 main tag
    '[role="main"]',                     // ARIA main role
    '.article',                          // Common article classes
    '.post',
    '.content',
    '.entry-content',
    '.post-content',
    '.article-content',
    '#article',                          // Common article IDs
    '#content',
    '#main-content',
    '#main'
  ];
  
  // Try each selector
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && hasSignificantText(element)) {
      console.log(`Main content found using selector: ${selector}`);
      return element;
    }
  }
  
  // Fallback: find the largest text block
  console.log('Using fallback: finding largest text block');
  return findLargestTextBlock();
}

/**
 * Check if an element has significant text content
 * 
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if element has significant text
 */
function hasSignificantText(element) {
  const text = element.innerText || '';
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  return wordCount > 50; // At least 50 words to be considered significant
}

/**
 * Find the largest text block on the page (fallback method)
 * 
 * @returns {HTMLElement} Element with most text content
 */
function findLargestTextBlock() {
  const candidates = document.querySelectorAll('div, section, article');
  let largestElement = document.body;
  let maxTextLength = 0;
  
  candidates.forEach(element => {
    // Skip navigation, header, footer, sidebar
    if (isNoiseElement(element)) return;
    
    const textLength = (element.innerText || '').length;
    if (textLength > maxTextLength) {
      maxTextLength = textLength;
      largestElement = element;
    }
  });
  
  return largestElement;
}

/**
 * Check if an element is likely navigation, ads, or other noise
 * 
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if element is likely noise
 */
function isNoiseElement(element) {
  const noisePatterns = [
    'nav', 'navbar', 'navigation', 'menu', 'sidebar', 'side-bar',
    'header', 'footer', 'advertisement', 'ad-', 'ads', 'banner',
    'cookie', 'popup', 'modal', 'overlay', 'social', 'share',
    'comment', 'related', 'recommended', 'promoted', 'sponsored'
  ];
  
  const elementClasses = element.className.toLowerCase();
  const elementId = element.id.toLowerCase();
  const elementRole = element.getAttribute('role') || '';
  
  // Check tag name
  const tagName = element.tagName.toLowerCase();
  if (['nav', 'header', 'footer', 'aside'].includes(tagName)) {
    return true;
  }
  
  // Check role attribute
  if (['navigation', 'banner', 'complementary'].includes(elementRole)) {
    return true;
  }
  
  // Check classes and IDs for noise patterns
  return noisePatterns.some(pattern => 
    elementClasses.includes(pattern) || elementId.includes(pattern)
  );
}

/**
 * Extract clean text from an element, filtering out scripts and noise
 * 
 * @param {HTMLElement} element - Element to extract text from
 * @returns {string} Clean text content
 */
function extractCleanText(element) {
  // Clone the element to avoid modifying the DOM
  const clone = element.cloneNode(true);
  
  // Remove script, style, and other non-content elements
  const removeSelectors = [
    'script', 'style', 'noscript', 'iframe', 'embed', 'object',
    'nav', 'aside', 'form', 'button',
    '.ad', '.ads', '.advertisement', '[class*="ad-"]', '[id*="ad-"]',
    '.social', '.share', '.comment-section', '.comments',
    '.cookie-notice', '.cookie-banner', '[class*="cookie"]',
    '.popup', '.modal', '[role="dialog"]'
  ];
  
  removeSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  // Get text content
  let text = clone.innerText || clone.textContent || '';
  
  // Clean up whitespace
  text = text
    .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n\n')    // Replace multiple newlines with double newline
    .trim();
  
  return text;
}

/**
 * Extract structured content (headings, paragraphs, lists)
 * 
 * @param {HTMLElement} element - Element to extract from
 * @returns {Object} Structured content
 */
function extractStructuredContent(element) {
  const structure = {
    headings: [],
    paragraphs: [],
    lists: [],
    images: [],
    links: []
  };
  
  // Extract headings (h1-h3 only for relevance)
  element.querySelectorAll('h1, h2, h3').forEach((heading, index) => {
    const text = heading.textContent.trim();
    if (text && text.length > 0 && text.length < 200) { // Reasonable heading length
      structure.headings.push({
        level: heading.tagName.toLowerCase(),
        text: text,
        position: index
      });
    }
  });
  
  // Extract meaningful paragraphs (at least 20 words)
  element.querySelectorAll('p').forEach((p, index) => {
    const text = p.textContent.trim();
    const wordCount = text.split(/\s+/).length;
    if (wordCount >= 20) {
      structure.paragraphs.push({
        text: text,
        wordCount: wordCount,
        position: index
      });
    }
  });
  
  // Limit paragraphs to first 20 for performance
  structure.paragraphs = structure.paragraphs.slice(0, 20);
  
  // Extract lists
  element.querySelectorAll('ul, ol').forEach((list, index) => {
    if (isNoiseElement(list)) return;
    
    const items = Array.from(list.querySelectorAll('li'))
      .map(li => li.textContent.trim())
      .filter(text => text.length > 0 && text.length < 200);
    
    if (items.length > 0 && items.length < 50) { // Reasonable list size
      structure.lists.push({
        type: list.tagName.toLowerCase(),
        items: items.slice(0, 10), // Limit to 10 items per list
        itemCount: items.length,
        position: index
      });
    }
  });
  
  // Extract images with alt text
  element.querySelectorAll('img[alt]').forEach((img, index) => {
    const alt = img.alt.trim();
    if (alt && alt.length > 0) {
      structure.images.push({
        alt: alt,
        src: img.src,
        position: index
      });
    }
  });
  
  // Limit images to first 5
  structure.images = structure.images.slice(0, 5);
  
  // Extract important links (exclude navigation)
  element.querySelectorAll('a[href]').forEach((link, index) => {
    if (isNoiseElement(link.closest('nav, header, footer, aside'))) return;
    
    const text = link.textContent.trim();
    const href = link.href;
    
    if (text && text.length > 0 && text.length < 100 && !href.includes('javascript:')) {
      structure.links.push({
        text: text,
        href: href,
        position: index
      });
    }
  });
  
  // Limit links to first 15
  structure.links = structure.links.slice(0, 15);
  
  return structure;
}

/**
 * Extract page metadata
 * 
 * @returns {Object} Page metadata
 */
function extractMetadata() {
  return {
    title: document.title,
    description: getMetaContent('description') || getMetaContent('og:description'),
    keywords: getMetaContent('keywords'),
    author: getMetaContent('author') || getMetaContent('article:author'),
    publishDate: getMetaContent('article:published_time') || getMetaContent('datePublished'),
    modifiedDate: getMetaContent('article:modified_time') || getMetaContent('dateModified'),
    siteName: getMetaContent('og:site_name'),
    type: getMetaContent('og:type'),
    image: getMetaContent('og:image'),
    language: document.documentElement.lang || 'en'
  };
}

/**
 * Get meta tag content by name or property
 * 
 * @param {string} name - Meta tag name or property
 * @returns {string|null} Meta content or null
 */
function getMetaContent(name) {
  const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  return meta ? meta.content : null;
}

/**
 * Estimate reading time in minutes
 * Based on average reading speed of 200-250 words per minute
 * 
 * @param {string} text - Text content
 * @returns {number} Estimated reading time in minutes
 */
function estimateReadingTime(text) {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const wordsPerMinute = 225; // Average reading speed
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, minutes); // At least 1 minute
}

/**
 * Generate a concise summary of the page content
 * Extracts key sentences and important information
 * 
 * @param {number} maxSentences - Maximum number of sentences to include
 * @returns {string} Summary text
 */
function generateQuickSummary(maxSentences = 5) {
  try {
    const content = extractPageContent();
    
    if (!content.success) {
      return 'Unable to extract page content.';
    }
    
    const { fullText, structured, metadata } = content.content;
    
    // Start with headings as they're often key points
    const summaryParts = [];
    
    // Add main title
    if (metadata.title) {
      summaryParts.push(`📄 **${metadata.title}**`);
    }
    
    // Add key headings (first 3)
    if (structured.headings.length > 0) {
      summaryParts.push('\n**Key Topics:**');
      structured.headings.slice(0, 3).forEach(h => {
        summaryParts.push(`• ${h.text}`);
      });
    }
    
    // Extract first few sentences from paragraphs
    const sentences = [];
    structured.paragraphs.slice(0, 3).forEach(p => {
      const firstSentence = p.text.match(/^[^.!?]+[.!?]/);
      if (firstSentence) {
        sentences.push(firstSentence[0].trim());
      }
    });
    
    if (sentences.length > 0) {
      summaryParts.push('\n**Content Preview:**');
      summaryParts.push(sentences.slice(0, maxSentences).join(' '));
    }
    
    // Add word count and reading time
    summaryParts.push(`\n📊 ${content.content.wordCount} words • ${content.content.readingTime} min read`);
    
    return summaryParts.join('\n');
    
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Error generating summary. Please try again.';
  }
}

// Export functions for use by other scripts
window.VyncePageReader = {
  extractPageContent,
  findMainContent,
  extractCleanText,
  extractStructuredContent,
  extractMetadata,
  generateQuickSummary,
  estimateReadingTime
};

console.log('VynceAI Page Reader Module ready');
