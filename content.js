console.log('ReThread content script starting...');

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

// List of second-hand marketplaces and sustainable retailers
const secondHandSites = [
  // Second-hand marketplaces
  'depop.com',
  'grailed.com',
  'poshmark.com',
  'thredup.com',
  'mercari.com',
  'vinted.com',
  'etsy.com',
  'ebay.com',
  'shopgoodwill.com',
  'therealreal.com',
  'vestiairecollective.com',
  'tradesy.com',
  'rebag.com',
  'fashionphile.com',
  'luxurygaragesale.com',
  
  // Sustainable fashion retailers
  'reformation.com',
  'everlane.com',
  'patagonia.com',
  'peopletree.com',
  'thoughtclothing.com',
  'amourvert.com',
  'mata-traders.com',
  'pactapparel.com',
  'tentree.com',
  'outerknown.com',
  'kotn.com',
  'girlfriend.com',
  'maggiesorganics.com',
  'organicbasics.com',
  'ableclothing.com',
  'christydawn.com',
  'tamga.com',
  'sustainableclothing.com',
  'sustainablefashion.com',
  'ethicalfashion.com',
  'consciousclothing.com',
  'ecofashion.com',
  'sustainablemarketplace.com'
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

// Helper function to get current website info
function getCurrentWebsite() {
  const hostname = window.location.hostname;
  return {
    site: hostname,
    isFastFashion: fastFashionSites.some(site => hostname.includes(site)),
    isSecondHand: secondHandSites.some(site => hostname.includes(site))
  };
}

// Main function to extract product information
async function extractProductInfo() {
  console.log('Extracting product information...');
  
  // Determine current website and whether it's fast fashion
  const { site, isFastFashion, isSecondHand } = getCurrentWebsite();
  
  console.log('Current site:', site);
  console.log('Is fast fashion:', isFastFashion);
  console.log('Is second hand:', isSecondHand);
  
  // Get the appropriate extractor
  const extractor = extractors[site] || (() => ({
    title: () => getTextContent('h1') || getTextContent('.product-title'),
    price: () => getTextContent('.price') || getTextContent('.product-price'),
    image: () => getAttribute('img', 'src'),
    description: () => getTextContent('.description') || getTextContent('.product-description')
  }));
  
  // Extract product information
  const productInfo = {
    title: extractor().title(),
    price: extractor().price(),
    image: extractor().image(),
    description: extractor().description(),
    isFastFashion: isFastFashion
  };
  
  console.log('Extracted product info:', productInfo);
  
  // If we have product information, find similar items
  if (productInfo.title && productInfo.description) {
    console.log('Finding similar items...');
    const searchText = `${productInfo.title} ${productInfo.description}`;
    
    try {
      const similarItems = await window.clothingService.findSimilarItems(searchText, productInfo.image, secondHandSites);
      console.log('Found similar items:', similarItems);
      
      if (similarItems && similarItems.length > 0) {
        return {
          ...productInfo,
          similarItems: similarItems
        };
      } else {
        console.log('No similar items found');
        return {
          ...productInfo,
          similarItems: []
        };
      }
    } catch (error) {
      console.error('Error finding similar items:', error);
      return {
        ...productInfo,
        similarItems: []
      };
    }
  }
  
  console.log('No product information found');
  return null;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  
  if (request.action === 'getProductInfo') {
    console.log('Processing getProductInfo request');
    extractProductInfo()
      .then(productInfo => {
        console.log('Sending response:', productInfo);
        sendResponse({
          success: true,
          productInfo: productInfo || { similarItems: [] }
        });
      })
      .catch(error => {
        console.error('Error extracting product info:', error);
        sendResponse({
          success: false,
          error: error.message,
          productInfo: { similarItems: [] }
        });
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

// Mark content script as initialized
window.rethreadInitialized = true; 