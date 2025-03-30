// DOM Elements
const statusMessage = document.getElementById('statusMessage');
const resultsContainer = document.getElementById('results');
const debugLog = document.getElementById('debugLog');

console.log('ReThread popup initialized');

// Debug logging functionality
class DebugLogger {
  constructor() {
    this.debugContent = document.getElementById('debugLog');
    this.clearButton = document.getElementById('clearLog');
    this.toggleButton = document.getElementById('toggleLog');
    this.isVisible = true;
    
    if (this.clearButton && this.toggleButton) {
      // Set up event listeners
      this.clearButton.addEventListener('click', () => this.clear());
      this.toggleButton.addEventListener('click', () => this.toggle());
    }
  }

  log(message, type = 'info') {
    if (!this.isVisible || !this.debugContent) return;
    
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    this.debugContent.appendChild(entry);
    this.debugContent.scrollTop = this.debugContent.scrollHeight;
  }

  clear() {
    if (this.debugContent) {
      this.debugContent.innerHTML = '';
      this.log('Debug console cleared', 'info');
    }
  }

  toggle() {
    if (!this.debugContent || !this.toggleButton) return;
    
    this.isVisible = !this.isVisible;
    this.debugContent.style.display = this.isVisible ? 'block' : 'none';
    this.toggleButton.textContent = this.isVisible ? 'Hide' : 'Show';
  }
}

// Initialize debug logger
const debug = new DebugLogger();

// Helper function to extract text content
function extractText(element, selector) {
  const found = element.querySelector(selector);
  return found ? found.textContent.trim() : '';
}

// Helper function to extract attribute
function extractAttribute(element, selector, attribute) {
  const found = element.querySelector(selector);
  return found ? found.getAttribute(attribute) : '';
}

// Create result item element
function createResultElement(result) {
  debug.log(`Creating result element for: ${result.title}`, 'info');
  const div = document.createElement('div');
  div.className = 'result-item';
  
  // Create image element
  const img = document.createElement('img');
  img.src = result.image || 'icons/icon32.png';
  img.alt = result.title;
  
  // Create result info
  const info = document.createElement('div');
  info.className = 'result-info';
  
  // Create title
  const title = document.createElement('div');
  title.className = 'result-title';
  title.textContent = result.title;
  
  // Create price
  const price = document.createElement('div');
  price.className = 'result-price';
  price.textContent = result.price || 'Price not available';
  
  // Create platform
  const platform = document.createElement('div');
  platform.className = 'result-platform';
  platform.textContent = result.platform;
  
  // Create similarity score
  const score = document.createElement('div');
  score.className = 'result-score';
  score.textContent = `Similarity: ${Math.round(result.similarityScore * 100)}%`;
  
  // Assemble the result item
  info.appendChild(title);
  info.appendChild(price);
  info.appendChild(platform);
  info.appendChild(score);
  
  div.appendChild(img);
  div.appendChild(info);
  
  // Add click handler
  div.addEventListener('click', () => {
    debug.log(`Opening URL: ${result.url}`, 'info');
    chrome.tabs.create({ url: result.url });
  });
  
  return div;
}

// Update results display
function updateResults(productInfo) {
  debug.log('Updating results display', 'info');
  resultsContainer.innerHTML = '';
  
  if (!productInfo || !productInfo.similarItems || productInfo.similarItems.length === 0) {
    debug.log('No similar items to display', 'warn');
    statusMessage.textContent = 'No similar items found';
    return;
  }

  debug.log(`Displaying ${productInfo.similarItems.length} similar items`, 'info');
  
  // Update status message based on site type
  if (productInfo.isFastFashion) {
    statusMessage.textContent = 'Found sustainable alternatives on second-hand marketplaces';
  } else {
    statusMessage.textContent = 'Found similar items on other marketplaces';
  }
  
  // Display similar items
  productInfo.similarItems.forEach(result => {
    resultsContainer.appendChild(createResultElement(result));
  });
}

// Check if content scripts are already injected
async function checkContentScripts(tabId) {
  debug.log(`Checking content scripts for tab ${tabId}`, 'info');
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        return {
          hasAIService: typeof window.clothingService !== 'undefined',
          hasContentScript: typeof window.rethreadInitialized !== 'undefined'
        };
      }
    });
    debug.log(`Content script check result: ${JSON.stringify(result[0].result)}`, 'info');
    return result[0].result;
  } catch (error) {
    debug.log(`Error checking content scripts: ${error.message}`, 'error');
    return { hasAIService: false, hasContentScript: false };
  }
}

// Inject content scripts
async function injectContentScripts(tabId) {
  debug.log(`Attempting to inject content scripts for tab ${tabId}`, 'info');
  try {
    // Check if scripts are already injected
    const { hasAIService, hasContentScript } = await checkContentScripts(tabId);
    
    // Always inject aiService.js first if not present
    if (!hasAIService) {
      debug.log('Injecting aiService.js', 'info');
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['aiService.js']
      });
      // Wait for aiService to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Then inject content.js if not present
    if (!hasContentScript) {
      debug.log('Injecting content.js', 'info');
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
    }
    
    debug.log('Content scripts ready', 'info');
    return true;
  } catch (error) {
    debug.log(`Error injecting content scripts: ${error.message}`, 'error');
    return false;
  }
}

// Get product information from active tab
async function getProductInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error('No active tab found');
    }

    // Inject content scripts if not already injected
    await injectContentScripts(tab.id);
    
    // Wait for scripts to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send message to content script
    const response = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: 'getProductInfo' }, resolve);
    });

    debug.log('Received response:', response);

    if (!response) {
      throw new Error('No response received from content script');
    }

    if (!response.success) {
      throw new Error(response.error || 'Failed to get product information');
    }

    return response.productInfo;
  } catch (error) {
    debug.log(`Error getting product info: ${error.message}`, 'error');
    statusMessage.textContent = `Error: ${error.message}`;
    return null;
  }
}

// Main function to search for alternatives
async function searchAlternatives() {
  debug.log('Starting search for alternatives', 'info');
  statusMessage.textContent = 'Loading alternatives...';
  
  try {
    const productInfo = await getProductInfo();
    debug.log(`Received product info: ${JSON.stringify(productInfo)}`, 'info');
    
    if (!productInfo) {
      debug.log('No product info returned', 'error');
      statusMessage.textContent = 'No product information found on this page';
      return;
    }
    
    if (!productInfo.similarItems || productInfo.similarItems.length === 0) {
      debug.log('No similar items found', 'warn');
      statusMessage.textContent = 'No similar items found';
      return;
    }
    
    debug.log(`Found ${productInfo.similarItems.length} similar items`, 'info');
    updateResults(productInfo);
  } catch (error) {
    debug.log(`Error in searchAlternatives: ${error.message}`, 'error');
    statusMessage.textContent = `Error: ${error.message}`;
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debug.log(`Received message in popup: ${JSON.stringify(message)}`, 'info');
  if (message.action === 'productInfoUpdated') {
    debug.log('Product info updated, updating results', 'info');
    updateResults(message.productInfo);
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  debug.log('Popup DOM loaded, starting search', 'info');
  await searchAlternatives();
}); 