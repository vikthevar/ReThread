// DOM Elements
const statusMessage = document.getElementById('status-message');
const resultsContainer = document.getElementById('results-container');

console.log('ReThread popup initialized');

// Create result item element
function createResultElement(result) {
  console.log('Creating result element:', result);
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
    console.log('Opening URL:', result.url);
    chrome.tabs.create({ url: result.url });
  });
  
  return div;
}

// Update results display
function updateResults(productInfo) {
  console.log('Updating results with:', productInfo);
  resultsContainer.innerHTML = '';
  
  if (!productInfo || !productInfo.similarItems || productInfo.similarItems.length === 0) {
    console.log('No similar items found');
    statusMessage.textContent = 'No similar items found';
    return;
  }

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
    return result[0].result;
  } catch (error) {
    console.error('Error checking content scripts:', error);
    return { hasAIService: false, hasContentScript: false };
  }
}

// Inject content scripts
async function injectContentScripts(tabId) {
  try {
    // Check if scripts are already injected
    const { hasAIService, hasContentScript } = await checkContentScripts(tabId);
    
    if (!hasAIService) {
      console.log('Injecting aiService.js');
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['aiService.js']
      });
    }
    
    if (!hasContentScript) {
      console.log('Injecting content.js');
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
    }
    
    console.log('Content scripts ready');
    return true;
  } catch (error) {
    console.error('Error injecting content scripts:', error);
    return false;
  }
}

// Get product information from active tab
async function getProductInfo() {
  console.log('Getting product info from active tab');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab) {
    console.log('No active tab found');
    statusMessage.textContent = 'No active tab found';
    return null;
  }
  
  console.log('Active tab:', tab);
  
  try {
    // First, try to inject the content scripts
    const injected = await injectContentScripts(tab.id);
    if (!injected) {
      throw new Error('Failed to inject content scripts');
    }
    
    // Wait a short moment for the scripts to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Sending message to content script');
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getProductInfo' });
    console.log('Received response:', response);
    
    if (response && response.similarItems) {
      return response;
    }
  } catch (error) {
    console.error('Error getting product info:', error);
    statusMessage.textContent = 'Error: Could not get product information. Please refresh the page and try again.';
  }
  
  //statusMessage.textContent = 'No product information found on this page';
  return null;
}

// Main function to search for alternatives
async function searchAlternatives() {
  console.log('Starting search for alternatives');
  statusMessage.textContent = 'Loading alternatives...';
  
  const productInfo = await getProductInfo();
  if (!productInfo) {
    console.log('No product info returned');
    return;
  }
  
  console.log('Updating results with product info');
  updateResults(productInfo);
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message in popup:', message);
  if (message.action === 'productInfoUpdated') {
    console.log('Product info updated:', message.productInfo);
    updateResults(message.productInfo);
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup DOM loaded, starting search');
  await searchAlternatives();
}); 