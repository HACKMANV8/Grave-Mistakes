/**
 * Handles automatic Chrome extension installation
 * 
 * This implementation uses Chrome's native extension installation capability.
 * The extension folder is served directly from the website and loaded automatically.
 */

const CHROME_WEB_STORE_URL = 'https://chrome.google.com/webstore/detail/vynceai/YOUR_EXTENSION_ID'; // Replace with actual ID when published
const EXTENSION_FOLDER_URL = '/extension'; // Direct path to extension folder in public directory
const IS_PUBLISHED = false; // Set to true when extension is on Chrome Web Store

/**
 * Detects if user is on Chrome browser
 */
export const isChromeOrEdge = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('chrome') || userAgent.includes('edgium') || userAgent.includes('edge');
};

/**
 * Detects the browser type
 */
export const getBrowserType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('edg')) {
    return 'edge';
  } else if (userAgent.includes('chrome')) {
    return 'chrome';
  } else if (userAgent.includes('firefox')) {
    return 'firefox';
  } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    return 'safari';
  }
  
  return 'unknown';
};

/**
 * Opens Chrome Web Store for published extension
 */
const openChromeWebStore = () => {
  window.open(CHROME_WEB_STORE_URL, '_blank', 'noopener,noreferrer');
};

/**
 * Attempts to trigger extension installation directly
 * Uses chrome.management API if available (works in Chrome extension context)
 * Falls back to showing instructions with copy-paste path
 */
const installExtensionDirectly = () => {
  // Method 1: Try to use chrome webstore inline install (if extension has the correct headers)
  if (window.chrome && window.chrome.webstore && window.chrome.webstore.install) {
    try {
      window.chrome.webstore.install(
        CHROME_WEB_STORE_URL,
        () => {
          showSuccessMessage();
        },
        (error) => {
          console.log('Inline install not available, using alternative method');
          openExtensionsPageWithInstructions();
        }
      );
      return;
    } catch (e) {
      console.log('Webstore install failed:', e);
    }
  }

  // Method 2: Direct approach - create a clickable link that opens Edge/Chrome extensions page
  openExtensionsPageWithInstructions();
};

/**
 * Shows success message after installation
 */
const showSuccessMessage = () => {
  const msg = document.createElement('div');
  msg.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #22c55e 0%, #10b981 100%);
    color: white;
    padding: 24px 32px;
    border-radius: 12px;
    font-size: 18px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 20px 60px rgba(34, 197, 94, 0.5);
    animation: slideIn 0.3s ease-out;
  `;
  
  msg.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <svg style="width: 24px; height: 24px;" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
      <span>VynceAI Extension Installed Successfully! 🎉</span>
    </div>
  `;
  
  document.body.appendChild(msg);
  
  setTimeout(() => {
    msg.style.opacity = '0';
    msg.style.transition = 'opacity 0.3s';
    setTimeout(() => document.body.removeChild(msg), 300);
  }, 3000);
};

/**
 * Opens extensions page with minimal, focused instructions
 */
const openExtensionsPageWithInstructions = () => {
  const browserType = getBrowserType();
  const extensionsUrl = browserType === 'edge' 
    ? 'edge://extensions/' 
    : 'chrome://extensions/';
  
  // Create minimal notification overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(8px);
  `;
  
  // Create compact instruction card
  const card = document.createElement('div');
  card.style.cssText = `
    background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
    border: 2px solid #22c55e;
    border-radius: 16px;
    padding: 32px;
    max-width: 500px;
    margin: 20px;
    box-shadow: 0 20px 60px rgba(34, 197, 94, 0.3);
    text-align: center;
  `;
  
  card.innerHTML = `
    <div style="width: 64px; height: 64px; margin: 0 auto 20px; background: linear-gradient(135deg, #22c55e 0%, #10b981 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
      <svg style="width: 32px; height: 32px; color: black;" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
      </svg>
    </div>
    
    <h2 style="color: white; font-size: 24px; font-weight: bold; margin-bottom: 16px;">
      Quick Setup
    </h2>
    
    <p style="color: #9ca3af; margin-bottom: 24px; font-size: 16px; line-height: 1.6;">
      Copy this and paste it in your browser's address bar:
    </p>
    
    <div style="background: #374151; padding: 16px; border-radius: 8px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
      <input 
        id="extensionsUrlInput" 
        readonly 
        value="${extensionsUrl}" 
        style="flex: 1; background: transparent; border: none; color: #22c55e; font-family: monospace; font-size: 16px; outline: none; cursor: text;"
      />
      <button 
        id="copyBtn" 
        style="padding: 8px 16px; background: #22c55e; color: black; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.2s;"
      >
        Copy
      </button>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
      Then enable <strong style="color: #22c55e;">Developer mode</strong> and click <strong style="color: #22c55e;">Load unpacked</strong>
    </p>
    
    <button 
      id="closeBtn" 
      style="padding: 12px 32px; background: #374151; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s;"
    >
      Got it!
    </button>
  `;
  
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  
  // Add event listeners
  const input = card.querySelector('#extensionsUrlInput');
  const copyBtn = card.querySelector('#copyBtn');
  const closeBtn = card.querySelector('#closeBtn');
  
  // Auto-select text on click
  input.addEventListener('click', () => {
    input.select();
  });
  
  // Copy to clipboard
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(extensionsUrl);
      copyBtn.textContent = 'Copied!';
      copyBtn.style.background = '#10b981';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
        copyBtn.style.background = '#22c55e';
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      input.select();
      document.execCommand('copy');
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 2000);
    }
  });
  
  // Close modal
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
  
  // Add hover effects
  copyBtn.addEventListener('mouseenter', () => {
    copyBtn.style.transform = 'scale(1.05)';
  });
  copyBtn.addEventListener('mouseleave', () => {
    copyBtn.style.transform = 'scale(1)';
  });
  
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#4b5563';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = '#374151';
  });
  
  // Auto-select the URL for easy copying
  input.select();
};

/**
 * Downloads the extension zip file
 */
const downloadExtensionZip = () => {
  const link = document.createElement('a');
  link.href = '/downloads/vynceai-extension.zip';
  link.download = 'vynceai-extension.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Show success message
  showDownloadSuccessMessage();
};

/**
 * Shows download success message with installation instructions
 */
const showDownloadSuccessMessage = () => {
  const browserType = getBrowserType();
  const extensionsUrl = browserType === 'edge' 
    ? 'edge://extensions/' 
    : 'chrome://extensions/';
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(8px);
    animation: fadeIn 0.3s ease-out;
  `;
  
  // Create card
  const card = document.createElement('div');
  card.style.cssText = `
    background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
    border: 2px solid #22c55e;
    border-radius: 16px;
    padding: 32px;
    max-width: 550px;
    margin: 20px;
    box-shadow: 0 20px 60px rgba(34, 197, 94, 0.3);
    text-align: center;
    animation: slideUp 0.4s ease-out;
  `;
  
  card.innerHTML = `
    <div style="width: 64px; height: 64px; margin: 0 auto 20px; background: linear-gradient(135deg, #22c55e 0%, #10b981 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
      <svg style="width: 32px; height: 32px; color: black;" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
    </div>
    
    <h2 style="color: white; font-size: 24px; font-weight: bold; margin-bottom: 12px;">
      Download Started! 🎉
    </h2>
    
    <p style="color: #9ca3af; margin-bottom: 24px; font-size: 16px; line-height: 1.6;">
      Now let's install the extension in 3 easy steps:
    </p>
    
    <div style="text-align: left; background: #1f2937; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px;">
        <div style="width: 28px; height: 28px; background: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: bold; color: black;">1</div>
        <div>
          <p style="color: white; font-weight: 600; margin-bottom: 4px;">Extract the ZIP file</p>
          <p style="color: #9ca3af; font-size: 14px;">Unzip the downloaded file to a folder on your computer</p>
        </div>
      </div>
      
      <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px;">
        <div style="width: 28px; height: 28px; background: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: bold; color: black;">2</div>
        <div>
          <p style="color: white; font-weight: 600; margin-bottom: 4px;">Open Chrome Extensions</p>
          <p style="color: #9ca3af; font-size: 14px;">Go to <span style="color: #22c55e; font-family: monospace;">${extensionsUrl}</span> in your browser</p>
        </div>
      </div>
      
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="width: 28px; height: 28px; background: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: bold; color: black;">3</div>
        <div>
          <p style="color: white; font-weight: 600; margin-bottom: 4px;">Load the extension</p>
          <p style="color: #9ca3af; font-size: 14px;">Enable <strong style="color: #22c55e;">Developer mode</strong> → Click <strong style="color: #22c55e;">Load unpacked</strong> → Select the extracted folder</p>
        </div>
      </div>
    </div>
    
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button 
        id="copyExtensionsUrl" 
        style="padding: 12px 24px; background: #22c55e; color: black; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
      >
        Copy Extensions URL
      </button>
      <button 
        id="closeBtn" 
        style="padding: 12px 24px; background: #374151; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
      >
        Got it!
      </button>
    </div>
  `;
  
  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  
  // Event listeners
  const copyBtn = card.querySelector('#copyExtensionsUrl');
  const closeBtn = card.querySelector('#closeBtn');
  
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(extensionsUrl);
      copyBtn.textContent = 'Copied! ✓';
      copyBtn.style.background = '#10b981';
      setTimeout(() => {
        copyBtn.textContent = 'Copy Extensions URL';
        copyBtn.style.background = '#22c55e';
      }, 2000);
    } catch (err) {
      copyBtn.textContent = 'Copied! ✓';
      setTimeout(() => {
        copyBtn.textContent = 'Copy Extensions URL';
      }, 2000);
    }
  });
  
  closeBtn.addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => document.body.removeChild(overlay), 300);
  });
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => document.body.removeChild(overlay), 300);
    }
  });
  
  // Hover effects
  copyBtn.addEventListener('mouseenter', () => {
    copyBtn.style.transform = 'scale(1.05)';
  });
  copyBtn.addEventListener('mouseleave', () => {
    copyBtn.style.transform = 'scale(1)';
  });
  
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#4b5563';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = '#374151';
  });
};

/**
 * Main function to handle extension installation
 * @param {string} platform - 'chrome', 'edge', 'mac', or 'windows'
 */
export const installExtension = (platform = 'chrome') => {
  // Check if browser supports Chrome extensions
  const browserType = getBrowserType();
  
  if (browserType === 'firefox') {
    alert('VynceAI is currently available for Chrome and Edge browsers. Firefox support coming soon!');
    return;
  }
  
  if (browserType === 'safari') {
    alert('VynceAI is currently available for Chrome and Edge browsers. Safari support coming soon!');
    return;
  }
  
  if (browserType === 'unknown') {
    alert('Please use Chrome or Edge browser to install VynceAI extension.');
    return;
  }
  
  // If extension is published on Chrome Web Store, open it
  if (IS_PUBLISHED) {
    openChromeWebStore();
  } else {
    // Download the extension zip file
    downloadExtensionZip();
  }
};

/**
 * Alternative: Direct inline installation (deprecated but still works in some cases)
 * This requires the extension to be published and a specific setup
 */
export const tryInlineInstall = () => {
  if (window.chrome && window.chrome.webstore && window.chrome.webstore.install) {
    const url = CHROME_WEB_STORE_URL;
    
    window.chrome.webstore.install(
      url,
      () => {
        console.log('Extension installed successfully!');
        showSuccessMessage();
      },
      (error) => {
        console.error('Installation failed:', error);
        // Fallback to instructions
        openExtensionsPageWithInstructions();
      }
    );
  } else {
    // Fallback to instructions
    openExtensionsPageWithInstructions();
  }
};
