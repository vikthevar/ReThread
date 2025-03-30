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
    <img class="result-image" src="${result.image}" alt="${result.title}">
    <div class="result-info">
      <div class="result-title">${result.title}</div>
      <div class="result-price">${result.price}</div>
      <div class="result-platform">${result.platform}</div>
    </div>
  `;
  
  div.addEventListener('click', () => {
    chrome.tabs.create({ url: result.url });
  });
  
  return div;
}

// Update results display
function updateResults(results) {
  resultsContainer.innerHTML = '';
  
  if (results.length === 0) {
    statusMessage.textContent = 'No alternatives found. Try different keywords.';
    return;
  }
  
  statusMessage.textContent = `Found ${results.length} alternatives`;
  results.forEach(result => {
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
    if (response && response.keywords) {
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
  if (!productInfo || !productInfo.keywords) return;
  
  statusMessage.textContent = 'Searching for alternatives...';
  
  try {
    const results = await chrome.runtime.sendMessage({
      action: 'searchAlternatives',
      keywords: productInfo.keywords
    });
    
    updateResults(results);
  } catch (error) {
    console.error('Error searching alternatives:', error);
    statusMessage.textContent = 'Error searching for alternatives';
  }
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