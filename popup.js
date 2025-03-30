// DOM Elements
const statusMessage = document.getElementById('statusMessage');
const resultsContainer = document.getElementById('resultsContainer');

console.log('ReThread popup initialized');

// Debug logging functionality
class DebugLogger {
  constructor() {
    this.debugContent = document.getElementById('debugContent');
    this.clearButton = document.getElementById('clearDebug');
    this.toggleButton = document.getElementById('toggleDebug');
    this.isVisible = true;
    
    // Set up event listeners
    this.clearButton.addEventListener('click', () => this.clear());
    this.toggleButton.addEventListener('click', () => this.toggle());
  }

  log(message, type = 'info') {
    if (!this.isVisible) return;
    
    const entry = document.createElement('div');
    entry.className = `debug-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    this.debugContent.appendChild(entry);
    this.debugContent.scrollTop = this.debugContent.scrollHeight;
  }

  clear() {
    this.debugContent.innerHTML = '';
    this.log('Debug console cleared', 'info');
  }

  toggle() {
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
  
  // Create platform icon
  const platformIcon = document.createElement('img');
  platformIcon.className = 'platform-icon';
  platformIcon.src = `icons/${result.platform.split('.')[0]}.png`;
  platformIcon.alt = result.platform;
  
  // Create result content
  const content = document.createElement('div');
  content.className = 'result-content';
  
  // Create title with platform
  const title = document.createElement('div');
  title.className = 'result-title';
  title.textContent = `Similar items on ${result.platform}`;
  
  // Create similarity score
  const score = document.createElement('div');
  score.className = 'similarity-score';
  score.textContent = `Match: ${Math.round(result.similarityScore * 100)}%`;
  
  // Create price
  const price = document.createElement('div');
  price.className = 'result-price';
  price.textContent = result.price;
  
  // Assemble the result item
  content.appendChild(title);
  content.appendChild(score);
  content.appendChild(price);
  
  div.appendChild(platformIcon);
  div.appendChild(content);
  
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
    statusMessage.className = 'status-message fast-fashion';
  } else {
    statusMessage.textContent = 'Found similar items on other marketplaces';
    statusMessage.className = 'status-message second-hand';
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
    
    if (!hasAIService) {
      debug.log('Injecting aiService.js', 'info');
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['aiService.js']
      });
    }
    
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
  debug.log('Getting product info from active tab', 'info');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab) {
    debug.log('No active tab found', 'error');
    statusMessage.textContent = 'No active tab found';
    return null;
  }
  
  debug.log(`Active tab URL: ${tab.url}`, 'info');
  
  try {
    // First, try to inject the content scripts
    const injected = await injectContentScripts(tab.id);
    if (!injected) {
      debug.log('Failed to inject content scripts', 'error');
      throw new Error('Failed to inject content scripts');
    }
    
    // Wait a short moment for the scripts to initialize
    debug.log('Waiting for scripts to initialize...', 'info');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    debug.log('Sending message to content script', 'info');
    const response = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: 'getProductInfo' }, response => {
        if (chrome.runtime.lastError) {
          debug.log(`Chrome runtime error: ${chrome.runtime.lastError.message}`, 'error');
          resolve(null);
        } else {
          debug.log(`Received response from content script: ${JSON.stringify(response)}`, 'info');
          resolve(response);
        }
      });
    });
    
    if (!response) {
      debug.log('No response received from content script', 'error');
      throw new Error('No response received from content script');
    }
    
    if (!response.similarItems || response.similarItems.length === 0) {
      debug.log('No similar items in response', 'warn');
      statusMessage.textContent = 'No similar items found';
      return null;
    }
    
    debug.log(`Found ${response.similarItems.length} similar items`, 'info');
    return response;
  } catch (error) {
    debug.log(`Error getting product info: ${error.message}`, 'error');
    statusMessage.textContent = 'Error: Could not get product information. Please refresh the page and try again.';
    return null;
  }
}

// Main function to search for alternatives
async function searchAlternatives() {
  debug.log('Starting search for alternatives', 'info');
  statusMessage.textContent = 'Loading alternatives...';
  
  const productInfo = await getProductInfo();
  if (!productInfo) {
    debug.log('No product info returned', 'error');
    return;
  }
  
  debug.log('Updating results with product info', 'info');
  updateResults(productInfo);
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