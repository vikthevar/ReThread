// Get DOM elements
const resultsContainer = document.getElementById('results');
const statusMessage = document.getElementById('status');
const clearButton = document.getElementById('clearLogs');
const toggleButton = document.getElementById('toggleLogs');
const debugPanel = document.getElementById('debugPanel');
const debugLog = document.getElementById('debugLog');

// List of supported fast fashion websites
const supportedSites = [
  'hm.com',
  'shein.com',
  'zara.com',
  'fashionnova.com',
  'forever21.com',
  'uniqlo.com',
  'gap.com',
  'hollister.com',
  'abercrombie.com'
];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Check if we're on a supported site
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    return;
  }
  
  // Check if we're on a supported site
  const isSupportedSite = supportedSites.some(site => tab.url.includes(site));
  if (!isSupportedSite) {
    statusMessage.textContent = 'Please open a supported fast fashion website';
    return;
  }
  
  await searchAlternatives();
});

// Main function to search for alternatives
async function searchAlternatives() {
  statusMessage.textContent = 'Loading alternatives...';
  
  try {
    const productInfo = await getProductInfo();
    
    if (!productInfo) {
      statusMessage.textContent = 'No product information found on this page';
      return;
    }
    
    if (!productInfo.similarItems || productInfo.similarItems.length === 0) {
      statusMessage.textContent = 'No similar items found';
      return;
    }
    
    updateResults(productInfo);
  } catch (error) {
    statusMessage.textContent = `Error: ${error.message}`;
  }
}

// Get product information from active tab
async function getProductInfo() {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      return null;
    }
    
    // Inject content scripts if not already injected
    const scriptsInjected = await injectContentScripts();
    if (!scriptsInjected) {
      return null;
    }
    
    // Send message to content script
    const response = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: 'getProductInfo' }, (response) => {
        resolve(response);
      });
    });
    
    if (!response || !response.success) {
      return null;
    }
    
    return response.productInfo;
  } catch (error) {
    return null;
  }
}

// Inject content scripts
async function injectContentScripts() {
  // Check if scripts are already injected
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    return false;
  }
  
  try {
    // First inject aiService.js
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['aiService.js']
    });
    
    // Then inject content.js
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if scripts were initialized
    const [{ result: hasService }, { result: isInitialized }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        hasService: !!window.clothingService,
        isInitialized: !!window.rethreadInitialized
      })
    });
    
    if (!hasService || !isInitialized) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

// Update results in popup
function updateResults(productInfo) {
  resultsContainer.innerHTML = '';
  statusMessage.textContent = '';
  
  productInfo.similarItems.forEach(result => {
    const resultElement = document.createElement('div');
    resultElement.className = 'result-item';
    
    const img = document.createElement('img');
    img.src = result.image || 'icons/icon32.png';
    img.alt = result.title;
    
    const title = document.createElement('h3');
    title.textContent = result.title;
    
    const price = document.createElement('p');
    price.textContent = result.price;
    
    const platform = document.createElement('p');
    platform.textContent = result.platform;
    
    const link = document.createElement('a');
    link.href = result.url;
    link.target = '_blank';
    link.textContent = 'View on ' + result.platform;
    
    resultElement.appendChild(img);
    resultElement.appendChild(title);
    resultElement.appendChild(price);
    resultElement.appendChild(platform);
    resultElement.appendChild(link);
    
    resultsContainer.appendChild(resultElement);
  });
} 