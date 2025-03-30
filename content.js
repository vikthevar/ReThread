// List of fast fashion websites
const fastFashionSites = [
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

// List of second-hand marketplaces
const secondHandSites = [
  'depop.com',
  'grailed.com',
  'poshmark.com',
  'thredup.com',
  'mercari.com',
  'vinted.com',
  'etsy.com',
  'ebay.com'
];

// Product information extractor for different websites
const extractors = {
  'hm.com': () => {
    const title = document.querySelector('.product-name')?.textContent?.trim();
    const price = document.querySelector('.price-value')?.textContent?.trim();
    const image = document.querySelector('.product-image img')?.src;
    return { title, price, image };
  },
  'shein.com': () => {
    const title = document.querySelector('.product-title')?.textContent?.trim();
    const price = document.querySelector('.price')?.textContent?.trim();
    const image = document.querySelector('.product-image img')?.src;
    return { title, price, image };
  },
  'zara.com': () => {
    const title = document.querySelector('.product-name')?.textContent?.trim();
    const price = document.querySelector('.price')?.textContent?.trim();
    const image = document.querySelector('.product-image img')?.src;
    return { title, price, image };
  }
};

// Function to extract keywords from product title
function extractKeywords(title) {
  if (!title) return [];
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

// Function to get current website and check if it's a fast fashion site
function getCurrentWebsite() {
  const hostname = window.location.hostname;
  const site = fastFashionSites.find(site => hostname.includes(site));
  if (site) {
    return {
      site,
      isFastFashion: true
    };
  }
  return {
    site: null,
    isFastFashion: false
  };
}

// Function to generate search URLs for second-hand marketplaces
function generateSearchUrls(keywords) {
  const searchQuery = keywords.join(' ');
  return secondHandSites.map(site => {
    const baseUrl = `https://www.${site}`;
    let searchUrl;
    
    switch(site) {
      case 'depop.com':
        searchUrl = `${baseUrl}/search?q=${encodeURIComponent(searchQuery)}`;
        break;
      case 'grailed.com':
        searchUrl = `${baseUrl}/search?q=${encodeURIComponent(searchQuery)}`;
        break;
      case 'poshmark.com':
        searchUrl = `${baseUrl}/search?query=${encodeURIComponent(searchQuery)}`;
        break;
      case 'thredup.com':
        searchUrl = `${baseUrl}/search?search_term=${encodeURIComponent(searchQuery)}`;
        break;
      case 'mercari.com':
        searchUrl = `${baseUrl}/search?keyword=${encodeURIComponent(searchQuery)}`;
        break;
      case 'vinted.com':
        searchUrl = `${baseUrl}/catalog?search_text=${encodeURIComponent(searchQuery)}`;
        break;
      case 'etsy.com':
        searchUrl = `${baseUrl}/search?q=${encodeURIComponent(searchQuery)}`;
        break;
      case 'ebay.com':
        searchUrl = `${baseUrl}/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}`;
        break;
    }
    
    return {
      platform: site,
      url: searchUrl
    };
  });
}

// Main function to extract product information
function extractProductInfo() {
  const { site, isFastFashion } = getCurrentWebsite();
  if (!site || !extractors[site]) return null;

  const productInfo = extractors[site]();
  if (!productInfo.title) return null;

  const keywords = extractKeywords(productInfo.title);
  const searchUrls = isFastFashion ? generateSearchUrls(keywords) : [];

  return {
    ...productInfo,
    keywords,
    isFastFashion,
    searchUrls
  };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getProductInfo') {
    const productInfo = extractProductInfo();
    sendResponse(productInfo);
  }
});

// Observe DOM changes to detect when product information is loaded
const observer = new MutationObserver((mutations) => {
  const { site, isFastFashion } = getCurrentWebsite();
  if (!site) return;

  const productInfo = extractProductInfo();
  if (productInfo) {
    chrome.runtime.sendMessage({
      action: 'productInfoUpdated',
      productInfo
    });
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
}); 