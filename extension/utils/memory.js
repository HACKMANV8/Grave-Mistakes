/**
 * VynceAI Memory Management System
 * Handles conversation history storage and retrieval using Chrome Storage API
 */

const MEMORY_KEY = 'vynceai_memory';
const MAX_MEMORY_ITEMS = 20; // Store last 20 interactions
const SETTINGS_KEY = 'vynceai_settings';

/**
 * Get memory from Chrome storage
 * @returns {Promise<Array>} Array of conversation history
 */
async function getMemory() {
  try {
    const result = await chrome.storage.local.get([MEMORY_KEY]);
    return result[MEMORY_KEY] || [];
  } catch (error) {
    console.error('Error getting memory:', error);
    return [];
  }
}

/**
 * Save a new interaction to memory
 * @param {string} userMessage - User's message
 * @param {string} botResponse - AI's response
 * @param {Object} context - Page context (url, title, snippet)
 * @param {string} model - Model used
 * @returns {Promise<void>}
 */
async function saveMemory(userMessage, botResponse, context = null, model = null) {
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
    
    // Add new interaction at the beginning
    memory.unshift(interaction);
    
    // Keep only the last MAX_MEMORY_ITEMS
    const trimmedMemory = memory.slice(0, MAX_MEMORY_ITEMS);
    
    await chrome.storage.local.set({ [MEMORY_KEY]: trimmedMemory });
    console.log('Memory saved:', interaction.id);
    
    return interaction;
  } catch (error) {
    console.error('Error saving memory:', error);
    throw error;
  }
}

/**
 * Get recent memory for context (last N items)
 * @param {number} count - Number of recent items to retrieve
 * @returns {Promise<Array>} Array of recent interactions
 */
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

/**
 * Clear all memory
 * @returns {Promise<void>}
 */
async function clearMemory() {
  try {
    await chrome.storage.local.remove(MEMORY_KEY);
    console.log('Memory cleared successfully');
  } catch (error) {
    console.error('Error clearing memory:', error);
    throw error;
  }
}

/**
 * Get memory stats
 * @returns {Promise<Object>} Memory statistics
 */
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
    return { count: 0, oldestTimestamp: null, newestTimestamp: null, totalSize: 0 };
  }
}

/**
 * Search memory by keyword
 * @param {string} keyword - Keyword to search for
 * @returns {Promise<Array>} Matching interactions
 */
async function searchMemory(keyword) {
  try {
    const memory = await getMemory();
    const lowerKeyword = keyword.toLowerCase();
    
    return memory.filter(item => 
      item.user.toLowerCase().includes(lowerKeyword) ||
      item.bot.toLowerCase().includes(lowerKeyword)
    );
  } catch (error) {
    console.error('Error searching memory:', error);
    return [];
  }
}

/**
 * Delete a specific memory item by ID
 * @param {number} id - Memory item ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteMemoryItem(id) {
  try {
    const memory = await getMemory();
    const filtered = memory.filter(item => item.id !== id);
    
    if (filtered.length === memory.length) {
      return false; // ID not found
    }
    
    await chrome.storage.local.set({ [MEMORY_KEY]: filtered });
    console.log('Memory item deleted:', id);
    return true;
  } catch (error) {
    console.error('Error deleting memory item:', error);
    throw error;
  }
}

/**
 * Export memory as JSON
 * @returns {Promise<string>} JSON string of all memory
 */
async function exportMemory() {
  try {
    const memory = await getMemory();
    return JSON.stringify(memory, null, 2);
  } catch (error) {
    console.error('Error exporting memory:', error);
    throw error;
  }
}

/**
 * Import memory from JSON
 * @param {string} jsonString - JSON string to import
 * @returns {Promise<void>}
 */
async function importMemory(jsonString) {
  try {
    const memory = JSON.parse(jsonString);
    
    if (!Array.isArray(memory)) {
      throw new Error('Invalid memory format');
    }
    
    await chrome.storage.local.set({ [MEMORY_KEY]: memory });
    console.log('Memory imported successfully');
  } catch (error) {
    console.error('Error importing memory:', error);
    throw error;
  }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getMemory,
    saveMemory,
    getRecentMemory,
    clearMemory,
    getMemoryStats,
    searchMemory,
    deleteMemoryItem,
    exportMemory,
    importMemory
  };
}
