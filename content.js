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
  console.log('Extracting product info...');
  const currentUrl = window.location.href;
  
  try {
    // Get the product mappings
    const response = await fetch(chrome.runtime.getURL('product-mappings.json'));
    const mappings = await response.json();
    
    // Find matching product by URL
    const product = Object.values(mappings.products).find(p => p.hm_url === currentUrl);
    
    if (product) {
      console.log('Found matching product:', product);
      return {
        title: product.alternatives[0].title,
        price: product.alternatives[0].price,
        description: `Sustainable alternative from ${product.alternatives[0].platform}`,
        image: product.alternatives[0].image,
        similarItems: product.alternatives.map(alt => ({
          title: alt.title,
          price: alt.price,
          platform: alt.platform,
          url: alt.url,
          image: alt.image
        }))
      };
    }
    
    console.log('No matching product found');
    return null;
  } catch (error) {
    console.error('Error extracting product info:', error);
    return null;
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getProductInfo') {
    console.log('Received getProductInfo request');
    extractProductInfo().then(productInfo => {
      console.log('Sending product info:', productInfo);
      sendResponse({
        success: true,
        productInfo: productInfo
      });
    }).catch(error => {
      console.error('Error:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    });
    return true; // Will respond asynchronously
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