// DOM Elements
const statusMessage = document.getElementById('status-message');
const resultsContainer = document.getElementById('results-container');
const depopToggle = document.getElementById('depop-toggle');
const grailedToggle = document.getElementById('grailed-toggle');
const poshmarkToggle = document.getElementById('poshmark-toggle');

// Load settings from storage
async function loadSettings() {
  const settings = await chrome.storage.sync.get(['depop', 'grailed', 'poshmark']);
  depopToggle.checked = settings.depop !== false;
  grailedToggle.checked = settings.grailed !== false;
  poshmarkToggle.checked = settings.poshmark !== false;
}

// Save settings to storage
async function saveSettings() {
  await chrome.storage.sync.set({
    depop: depopToggle.checked,
    grailed: grailedToggle.checked,
    poshmark: poshmarkToggle.checked
  });
}

// Create result item element
function createResultElement(result) {
  const div = document.createElement('div');
  div.className = 'result-item';
  div.innerHTML = `
    <div class="result-info">
      <div class="result-title">Search on ${result.platform}</div>
      <div class="result-platform">Click to search for similar items</div>
    </div>
  `;
  
  div.addEventListener('click', () => {
    chrome.tabs.create({ url: result.url });
  });
  
  return div;
}

// Update results display
function updateResults(productInfo) {
  resultsContainer.innerHTML = '';
  
  if (!productInfo || !productInfo.searchUrls || productInfo.searchUrls.length === 0) {
    statusMessage.textContent = 'No product information found on this page';
    return;
  }
  
  // Filter search URLs based on user preferences
  const settings = {
    depop: depopToggle.checked,
    grailed: grailedToggle.checked,
    poshmark: poshmarkToggle.checked
  };

  const filteredUrls = productInfo.searchUrls.filter(result => {
    const platform = result.platform.split('.')[0];
    return settings[platform] !== false;
  });

  if (filteredUrls.length === 0) {
    statusMessage.textContent = 'Please enable at least one marketplace in settings';
    return;
  }

  statusMessage.textContent = productInfo.isFastFashion 
    ? 'Found sustainable alternatives on second-hand marketplaces'
    : 'Found similar items on other marketplaces';
    
  filteredUrls.forEach(result => {
    resultsContainer.appendChild(createResultElement(result));
  });
}

// Get product information from active tab
async function getProductInfo() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab) {
    statusMessage.textContent = 'No active tab found';
    return;
  }
  
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getProductInfo' });
    if (response && response.searchUrls) {
      return response;
    }
  } catch (error) {
    console.error('Error getting product info:', error);
  }
  
  statusMessage.textContent = 'No product information found on this page';
  return null;
}

// Main function to search for alternatives
async function searchAlternatives() {
  const productInfo = await getProductInfo();
  if (!productInfo) return;
  
  statusMessage.textContent = 'Loading alternatives...';
  updateResults(productInfo);
}

// Event listeners
depopToggle.addEventListener('change', saveSettings);
grailedToggle.addEventListener('change', saveSettings);
poshmarkToggle.addEventListener('change', saveSettings);

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await searchAlternatives();
}); 