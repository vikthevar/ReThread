// Import service
import { clothingService } from './aiService.js';

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
    const description = document.querySelector('.product-description')?.textContent?.trim();
    return { title, price, image, description };
  },
  'shein.com': () => {
    const title = document.querySelector('.product-title')?.textContent?.trim();
    const price = document.querySelector('.price')?.textContent?.trim();
    const image = document.querySelector('.product-image img')?.src;
    const description = document.querySelector('.product-description')?.textContent?.trim();
    return { title, price, image, description };
  },
  'zara.com': () => {
    const title = document.querySelector('.product-name')?.textContent?.trim();
    const price = document.querySelector('.price')?.textContent?.trim();
    const image = document.querySelector('.product-image img')?.src;
    const description = document.querySelector('.product-description')?.textContent?.trim();
    return { title, price, image, description };
  },
  // Add extractors for second-hand sites
  'depop.com': () => {
    const title = document.querySelector('.product-title')?.textContent?.trim();
    const price = document.querySelector('.product-price')?.textContent?.trim();
    const image = document.querySelector('.product-image img')?.src;
    const description = document.querySelector('.product-description')?.textContent?.trim();
    return { title, price, image, description };
  },
  'poshmark.com': () => {
    const title = document.querySelector('.product-title')?.textContent?.trim();
    const price = document.querySelector('.price')?.textContent?.trim();
    const image = document.querySelector('.product-image img')?.src;
    const description = document.querySelector('.product-description')?.textContent?.trim();
    return { title, price, image, description };
  },
  'thredup.com': () => {
    const title = document.querySelector('.product-title')?.textContent?.trim();
    const price = document.querySelector('.price')?.textContent?.trim();
    const image = document.querySelector('.product-image img')?.src;
    const description = document.querySelector('.product-description')?.textContent?.trim();
    return { title, price, image, description };
  }
};

// Function to get current website and check if it's a fast fashion site
function getCurrentWebsite() {
  const hostname = window.location.hostname;
  const fastFashionSite = fastFashionSites.find(site => hostname.includes(site));
  const secondHandSite = secondHandSites.find(site => hostname.includes(site));
  
  if (fastFashionSite) {
    return {
      site: fastFashionSite,
      isFastFashion: true,
      isSecondHand: false
    };
  } else if (secondHandSite) {
    return {
      site: secondHandSite,
      isFastFashion: false,
      isSecondHand: true
    };
  }
  
  return {
    site: null,
    isFastFashion: false,
    isSecondHand: false
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

// Main function to extract product information and find similar items
async function extractProductInfo() {
  const { site, isFastFashion, isSecondHand } = getCurrentWebsite();
  if (!site || !extractors[site]) return null;

  const productInfo = extractors[site]();
  if (!productInfo.title) return null;

  // Use the description to find similar items
  let similarItems = [];
  if (productInfo.description) {
    try {
      similarItems = await clothingService.findSimilarItems(productInfo.description, secondHandSites);
    } catch (error) {
      console.error('Error finding similar items:', error);
    }
  }

  // Generate search URLs based on title and description
  const searchUrls = generateSearchUrls([productInfo.title, productInfo.description].filter(Boolean));

  return {
    ...productInfo,
    isFastFashion,
    isSecondHand,
    searchUrls,
    currentSite: site,
    similarItems
  };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getProductInfo') {
    extractProductInfo().then(productInfo => {
      sendResponse(productInfo);
    });
    return true; // Required for async response
  }
});

// Observe DOM changes to detect when product information is loaded
const observer = new MutationObserver((mutations) => {
  const { site, isFastFashion, isSecondHand } = getCurrentWebsite();
  if (!site) return;

  extractProductInfo().then(productInfo => {
    if (productInfo) {
      chrome.runtime.sendMessage({
        action: 'productInfoUpdated',
        productInfo
      });
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
}); 