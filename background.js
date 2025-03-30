// API endpoints for different second-hand websites
const API_ENDPOINTS = {
  depop: 'https://api.depop.com/api/v2/search',
  grailed: 'https://www.grailed.com/api/search',
  poshmark: 'https://poshmark.com/api/search'
};

// Function to search Depop
async function searchDepop(keywords) {
  try {
    const query = keywords.join(' ');
    const response = await fetch(`${API_ENDPOINTS.depop}?q=${encodeURIComponent(query)}&limit=5`);
    const data = await response.json();
    return data.items.map(item => ({
      title: item.title,
      price: item.price,
      image: item.images[0],
      url: `https://www.depop.com/products/${item.id}`,
      platform: 'Depop'
    }));
  } catch (error) {
    console.error('Error searching Depop:', error);
    return [];
  }
}

// Function to search Grailed
async function searchGrailed(keywords) {
  try {
    const query = keywords.join(' ');
    const response = await fetch(`${API_ENDPOINTS.grailed}?q=${encodeURIComponent(query)}&limit=5`);
    const data = await response.json();
    return data.items.map(item => ({
      title: item.title,
      price: item.price,
      image: item.images[0],
      url: `https://www.grailed.com/listings/${item.id}`,
      platform: 'Grailed'
    }));
  } catch (error) {
    console.error('Error searching Grailed:', error);
    return [];
  }
}

// Function to search Poshmark
async function searchPoshmark(keywords) {
  try {
    const query = keywords.join(' ');
    const response = await fetch(`${API_ENDPOINTS.poshmark}?q=${encodeURIComponent(query)}&limit=5`);
    const data = await response.json();
    return data.items.map(item => ({
      title: item.title,
      price: item.price,
      image: item.images[0],
      url: `https://poshmark.com/listing/${item.id}`,
      platform: 'Poshmark'
    }));
  } catch (error) {
    console.error('Error searching Poshmark:', error);
    return [];
  }
}

// Function to get settings from storage
async function getSettings() {
  const settings = await chrome.storage.sync.get(['depop', 'grailed', 'poshmark']);
  return {
    depop: settings.depop !== false,
    grailed: settings.grailed !== false,
    poshmark: settings.poshmark !== false
  };
}

// Main function to search all enabled platforms
async function searchAllPlatforms(keywords) {
  const settings = await getSettings();
  const results = [];

  if (settings.depop) {
    const depopResults = await searchDepop(keywords);
    results.push(...depopResults);
  }

  if (settings.grailed) {
    const grailedResults = await searchGrailed(keywords);
    results.push(...grailedResults);
  }

  if (settings.poshmark) {
    const poshmarkResults = await searchPoshmark(keywords);
    results.push(...poshmarkResults);
  }

  return results;
}

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'searchAlternatives') {
    searchAllPlatforms(request.keywords)
      .then(results => sendResponse(results))
      .catch(error => {
        console.error('Error searching alternatives:', error);
        sendResponse([]);
      });
    return true; // Will respond asynchronously
  }
}); 