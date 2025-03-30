// Import service
import { clothingService } from './aiService.js';

console.log('ReThread content script loaded');

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

// Helper function to safely get text content
function getTextContent(selector) {
  const element = document.querySelector(selector);
  return element ? element.textContent.trim() : null;
}

// Helper function to safely get attribute
function getAttribute(selector, attribute) {
  const element = document.querySelector(selector);
  return element ? element.getAttribute(attribute) : null;
}

// Product information extractor for different websites
const extractors = {
  'hm.com': () => {
    console.log('Extracting from H&M');
    const title = getTextContent('h1.product-name') || getTextContent('.product-name');
    const price = getTextContent('.price-value') || getTextContent('.product-price');
    const image = getAttribute('.product-image img', 'src') || getAttribute('.product-image', 'src');
    const description = getTextContent('.product-description') || getTextContent('.description');
    console.log('H&M extraction result:', { title, price, image, description });
    return { title, price, image, description };
  },
  'shein.com': () => {
    console.log('Extracting from Shein');
    const title = getTextContent('.product-title') || getTextContent('h1.product-title');
    const price = getTextContent('.price') || getTextContent('.product-price');
    const image = getAttribute('.product-image img', 'src') || getAttribute('.product-image', 'src');
    const description = getTextContent('.product-description') || getTextContent('.description');
    console.log('Shein extraction result:', { title, price, image, description });
    return { title, price, image, description };
  },
  'zara.com': () => {
    console.log('Extracting from Zara');
    const title = getTextContent('h1.product-name') || getTextContent('.product-name');
    const price = getTextContent('.price') || getTextContent('.product-price');
    const image = getAttribute('.product-image img', 'src') || getAttribute('.product-image', 'src');
    const description = getTextContent('.product-description') || getTextContent('.description');
    console.log('Zara extraction result:', { title, price, image, description });
    return { title, price, image, description };
  },
  'depop.com': () => {
    console.log('Extracting from Depop');
    const title = getTextContent('.product-title') || getTextContent('h1.product-title');
    const price = getTextContent('.product-price') || getTextContent('.price');
    const image = getAttribute('.product-image img', 'src') || getAttribute('.product-image', 'src');
    const description = getTextContent('.product-description') || getTextContent('.description');
    console.log('Depop extraction result:', { title, price, image, description });
    return { title, price, image, description };
  },
  'poshmark.com': () => {
    console.log('Extracting from Poshmark');
    const title = getTextContent('.product-title') || getTextContent('h1.product-title');
    const price = getTextContent('.price') || getTextContent('.product-price');
    const image = getAttribute('.product-image img', 'src') || getAttribute('.product-image', 'src');
    const description = getTextContent('.product-description') || getTextContent('.description');
    console.log('Poshmark extraction result:', { title, price, image, description });
    return { title, price, image, description };
  },
  'thredup.com': () => {
    console.log('Extracting from ThredUp');
    const title = getTextContent('.product-title') || getTextContent('h1.product-title');
    const price = getTextContent('.price') || getTextContent('.product-price');
    const image = getAttribute('.product-image img', 'src') || getAttribute('.product-image', 'src');
    const description = getTextContent('.product-description') || getTextContent('.description');
    console.log('ThredUp extraction result:', { title, price, image, description });
    return { title, price, image, description };
  }
};

// Function to get current website and check if it's a fast fashion site
function getCurrentWebsite() {
  const hostname = window.location.hostname;
  console.log('Current hostname:', hostname);
  const fastFashionSite = fastFashionSites.find(site => hostname.includes(site));
  const secondHandSite = secondHandSites.find(site => hostname.includes(site));
  
  if (fastFashionSite) {
    console.log('Detected fast fashion site:', fastFashionSite);
    return {
      site: fastFashionSite,
      isFastFashion: true,
      isSecondHand: false
    };
  } else if (secondHandSite) {
    console.log('Detected second-hand site:', secondHandSite);
    return {
      site: secondHandSite,
      isFastFashion: false,
      isSecondHand: true
    };
  }
  
  console.log('No matching site detected');
  return {
    site: null,
    isFastFashion: false,
    isSecondHand: false
  };
}

// Main function to extract product information and find similar items
async function extractProductInfo() {
  console.log('Starting product info extraction');
  const { site, isFastFashion, isSecondHand } = getCurrentWebsite();
  if (!site || !extractors[site]) {
    console.log('No extractor found for site:', site);
    return null;
  }

  const productInfo = extractors[site]();
  if (!productInfo.title) {
    console.log('No product title found');
    return null;
  }

  console.log('Found product info:', productInfo);

  // Use both title and description to find similar items
  let similarItems = [];
  try {
    console.log('Finding similar items...');
    const searchText = [productInfo.title, productInfo.description].filter(Boolean).join(' ');
    similarItems = await clothingService.findSimilarItems(searchText, secondHandSites);
    console.log('Found similar items:', similarItems);
  } catch (error) {
    console.error('Error finding similar items:', error);
  }

  return {
    ...productInfo,
    isFastFashion,
    isSecondHand,
    currentSite: site,
    similarItems
  };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  if (request.action === 'getProductInfo') {
    console.log('Processing getProductInfo request');
    extractProductInfo().then(productInfo => {
      console.log('Sending response:', productInfo);
      sendResponse(productInfo);
    });
    return true; // Required for async response
  }
});

// Initialize immediately
console.log('Initializing ReThread...');
extractProductInfo().then(productInfo => {
  if (productInfo) {
    console.log('Initial product info:', productInfo);
    chrome.runtime.sendMessage({
      action: 'productInfoUpdated',
      productInfo
    });
  }
});

// Observe DOM changes to detect when product information is loaded
const observer = new MutationObserver((mutations) => {
  const { site, isFastFashion, isSecondHand } = getCurrentWebsite();
  if (!site) return;

  console.log('DOM changed, checking for product info...');
  extractProductInfo().then(productInfo => {
    if (productInfo) {
      console.log('Product info updated:', productInfo);
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