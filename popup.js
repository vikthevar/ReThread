// DOM Elements
const statusMessage = document.getElementById('statusMessage');
const resultsContainer = document.getElementById('results');
const debugLog = document.getElementById('debugLog');

console.log('ReThread popup initialized');

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
  console.log(`Creating result element for: ${result.title}`, 'info');
  const div = document.createElement('div');
  div.className = 'result-item';
  
  // Create image element
  const img = document.createElement('img');
  img.src = result.image || 'icon.png';
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
 
  // Assemble the result item
  info.appendChild(title);
  info.appendChild(price);
  info.appendChild(platform);
  info.appendChild(score);
  
  div.appendChild(img);
  div.appendChild(info);
  
  // Add click handler
  div.addEventListener('click', () => {
    console.log(`Opening URL: ${result.url}`, 'info');
    chrome.tabs.create({ url: result.url });
  });
  
  return div;
}

// Update results display
function updateResults(productInfo) {
  console.log('Updating results display', 'info');
  resultsContainer.innerHTML = '';
  
  if (!productInfo || !productInfo.similarItems || productInfo.similarItems.length === 0) {
    console.log('No similar items to display', 'warn');
    statusMessage.textContent = 'No similar items found';
    return;
  }

  console.log(`Displaying ${productInfo.similarItems.length} similar items`, 'info');
  
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
  console.log(`Checking content scripts for tab ${tabId}`, 'info');
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
    console.log(`Content script check result: ${JSON.stringify(result[0].result)}`, 'info');
    return result[0].result;
  } catch (error) {
    console.log(`Error checking content scripts: ${error.message}`, 'error');
    return { hasAIService: false, hasContentScript: false };
  }
}

// Inject content scripts
async function injectContentScripts(tabId) {
  console.log(`Attempting to inject content scripts for tab ${tabId}`, 'info');
  try {
    // Check if scripts are already injected
    const { hasAIService, hasContentScript } = await checkContentScripts(tabId);
    
    // Always inject aiService.js first if not present
    if (!hasAIService) {
      console.log('Injecting aiService.js', 'info');
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['aiService.js']
      });
      // Wait for aiService to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Then inject content.js if not present
    if (!hasContentScript) {
      console.log('Injecting content.js', 'info');
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
    }
    
    console.log('Content scripts ready', 'info');
    return true;
  } catch (error) {
    console.log(`Error injecting content scripts: ${error.message}`, 'error');
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

    console.log('Received response:', response);

    if (!response) {
      throw new Error('No response received from content script');
    }

    if (!response.success) {
      throw new Error(response.error || 'Failed to get product information');
    }

    return response.productInfo;
  } catch (error) {
    console.log(`Error getting product info: ${error.message}`, 'error');
    statusMessage.textContent = `Error: ${error.message}`;
    return null;
  }
}

// Main function to search for alternatives
async function searchAlternatives() {
  console.log('Starting search for alternatives', 'info');
  statusMessage.textContent = 'Loading alternatives...';
  
  try {
    const productInfo = await getProductInfo();
    console.log(`Received product info: ${JSON.stringify(productInfo)}`, 'info');
    
    if (!productInfo) {
      console.log('No product info returned', 'error');
      statusMessage.textContent = 'No product information found on this page';
      return;
    }
    
    if (!productInfo.similarItems || productInfo.similarItems.length === 0) {
      console.log('No similar items found', 'warn');
      statusMessage.textContent = 'No similar items found';
      return;
    }
    
    console.log(`Found ${productInfo.similarItems.length} similar items`, 'info');
    updateResults(productInfo);
  } catch (error) {
    console.log(`Error in searchAlternatives: ${error.message}`, 'error');
    statusMessage.textContent = `Error: ${error.message}`;
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(`Received message in popup: ${JSON.stringify(message)}`, 'info');
  if (message.action === 'productInfoUpdated') {
    console.log('Product info updated, updating results', 'info');
    updateResults(message.productInfo);
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup DOM loaded, starting search', 'info');
  await searchAlternatives();
}); 